#!/usr/bin/env python3
"""
hh_pipeline_sqlite.py

Single-script pipeline:
 - read keywords (hhData/keywords.txt OR filenames in hhData/)
 - fetch vacancies from HH for each keyword
 - clean highlight tags and insert/upsert into SQLite DB at hhData/vacancies.db
 - dedupe by 'url' using UNIQUE constraint and UPSERT
 - OPTIONAL: mark & prune vacancies to keep only student-friendly ones (--student-only)
"""

import argparse
import csv
import datetime as dt
import json
import time
from pathlib import Path
import sys
import sqlite3
import requests

# Try to import ZoneInfo (Python 3.9+), fallback to backports or fixed offset
try:
    from zoneinfo import ZoneInfo  # type: ignore
    _ZONEINFO_AVAILABLE = True
except Exception:
    try:
        from backports.zoneinfo import ZoneInfo  # type: ignore
        _ZONEINFO_AVAILABLE = True
    except Exception:
        ZoneInfo = None  # type: ignore
        _ZONEINFO_AVAILABLE = False

def get_almaty_tz():
    if _ZONEINFO_AVAILABLE and ZoneInfo is not None:
        try:
            return ZoneInfo("Asia/Almaty")
        except Exception:
            pass
    return dt.timezone(dt.timedelta(hours=6))

ALMATY_TZ = get_almaty_tz()

# HH area codes mapping for the API (KZ => 40)
COUNTRY_CODES = {
    "UA": 5, "AZ": 9, "BY": 16, "GE": 28, "KZ": 40,
    "KG": 48, "UZ": 97, "RU": 113, "Other": 1001
}

DB_PATH = Path("hhData") / "vacancies.db"

# -------- DB helpers --------
def init_db(db_path: Path):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    # Create table with UNIQUE constraint on url for dedupe
    cur.execute("""
    CREATE TABLE IF NOT EXISTS vacancies (
        id INTEGER PRIMARY KEY,
        url TEXT UNIQUE,
        title TEXT,
        employer TEXT,
        city TEXT,
        publish_date TEXT,
        salary TEXT,
        requirements TEXT,
        responsibilities TEXT,
        job_keyword TEXT,
        raw_json TEXT,
        inserted_at TEXT
    );
    """)
    # Indexes for common query fields
    cur.execute("CREATE INDEX IF NOT EXISTS idx_job_keyword ON vacancies(job_keyword);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_publish_date ON vacancies(publish_date);")
    cur.execute("PRAGMA journal_mode=WAL;")      # better concurrency
    cur.execute("PRAGMA synchronous=NORMAL;")   # performance tradeoff
    con.commit()
    return con

def upsert_rows(conn: sqlite3.Connection, rows):
    """
    rows: iterable of tuples matching the insert columns:
    (url,title,employer,city,publish_date,salary,requirements,responsibilities,job_keyword,raw_json,inserted_at)
    Uses UPSERT (ON CONFLICT DO UPDATE). This requires SQLite >= 3.24.
    """
    cur = conn.cursor()
    # We'll try UPSERT; if SQLite version is old and raises an OperationalError, fallback to insert-ignore + update
    try:
        cur.executemany("""
        INSERT INTO vacancies (url,title,employer,city,publish_date,salary,requirements,responsibilities,job_keyword,raw_json,inserted_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(url) DO UPDATE SET
            title=excluded.title,
            employer=excluded.employer,
            city=excluded.city,
            publish_date=excluded.publish_date,
            salary=excluded.salary,
            requirements=excluded.requirements,
            responsibilities=excluded.responsibilities,
            job_keyword = CASE
                WHEN vacancies.job_keyword IS NULL OR vacancies.job_keyword = '' THEN excluded.job_keyword
                WHEN excluded.job_keyword IS NULL OR excluded.job_keyword = '' THEN vacancies.job_keyword
                ELSE vacancies.job_keyword || ';' || excluded.job_keyword
            END,
            raw_json=excluded.raw_json,
            inserted_at=excluded.inserted_at
        """, rows)
    except sqlite3.OperationalError as e:
        # Fallback path for older SQLite: INSERT OR IGNORE then UPDATE existing rows
        # We'll do this per-row (slower) but compatible.
        conn.rollback()
        for r in rows:
            try:
                cur.execute("""
                    INSERT OR IGNORE INTO vacancies (url,title,employer,city,publish_date,salary,requirements,responsibilities,job_keyword,raw_json,inserted_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)
                """, r)
                # Update existing row with new hhData (could be redundant)
                cur.execute("""
                    UPDATE vacancies SET
                        title = ?,
                        employer = ?,
                        city = ?,
                        publish_date = ?,
                        salary = ?,
                        requirements = ?,
                        responsibilities = ?,
                        job_keyword = CASE
                            WHEN job_keyword IS NULL OR job_keyword = '' THEN ?
                            WHEN ? IS NULL OR ? = '' THEN job_keyword
                            ELSE job_keyword || ';' || ?
                        END,
                        raw_json = ?,
                        inserted_at = ?
                    WHERE url = ?
                """, (r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[8], r[8], r[9], r[10], r[0]))
            except Exception as ex:
                print(f"[WARN] fallback upsert failed for {r[0]}: {ex}", file=sys.stderr)
    conn.commit()

# -------- Student-friendly functions (NEW) --------
def ensure_student_column(conn: sqlite3.Connection):
    """
    Add student_friendly INTEGER column if it doesn't exist (0/1).
    """
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(vacancies);")
    cols = [row[1] for row in cur.fetchall()]
    if 'student_friendly' not in cols:
        cur.execute("ALTER TABLE vacancies ADD COLUMN student_friendly INTEGER DEFAULT 0;")
        conn.commit()
        print("[DB] Added student_friendly column.")
    else:
        print("[DB] student_friendly column already exists.")

def mark_student_friendly(conn: sqlite3.Connection):
    """
    Mark student_friendly = 1 for rows that match student-friendly rules,
    otherwise mark 0. This uses several heuristics:
      - keep if requirements/title/job_keyword/employer mention: no experience, for students, internship, intern, trainee, junior, startup
      - exclude if title contains senior/middle/lead/principal/manager/sr
    """
    ensure_student_column(conn)
    cur = conn.cursor()

    # Patterns to keep (case-insensitive)
    keep_phrases = [
        'no experience', 'no experience required', 'no experience needed',
        'for students', 'для студентов', 'intern', 'internship', 'trainee',
        'junior', 'junior developer', 'junior engineer', 'студент', 'стажировка',
        'стажер', 'без опыта', 'стартап', 'startup', 'startups'
    ]

    # Phrases to exclude (senior, middle, lead etc.)
    exclude_phrases = [
        'senior', 'sr ', ' sr.', 'middle', 'mid-level', 'lead', 'principal',
        'manager', 'head of', 'experienced', 'senior-level', 'сеньор', 'мидл'
    ]

    # Build SQL conditions
    def build_like_clause(column_name, phrases):
        # returns a SQL snippet like "(lower(column) LIKE ? OR lower(column) LIKE ? ...)"
        parts = []
        for _ in phrases:
            parts.append(f"lower({column_name}) LIKE ?")
        if not parts:
            return "1=0", []   # impossible
        clause = "(" + " OR ".join(parts) + ")"
        params = [f"%{p.lower()}%" for p in phrases]
        return clause, params

    # We'll set student_friendly=1 when ANY keep phrase is present in any of these columns
    keep_clauses = []
    keep_params = []
    for col in ('requirements','title','job_keyword','employer'):
        clause, params = build_like_clause(col, keep_phrases)
        keep_clauses.append(clause)
        keep_params.extend(params)
    keep_sql = "(" + " OR ".join(keep_clauses) + ")"

    # And ensure we don't mark as friendly when exclude phrases are present in title (strong signal)
    exclude_clause, exclude_params = build_like_clause('title', exclude_phrases)

    # First: set all to 0
    cur.execute("UPDATE vacancies SET student_friendly = 0;")
    conn.commit()

    # Now: mark those that match keep_sql AND NOT match exclude_clause
    update_sql = f"""
        UPDATE vacancies
        SET student_friendly = 1
        WHERE {keep_sql} AND NOT {exclude_clause};
    """
    params = tuple(keep_params + exclude_params)
    cur.execute(update_sql, params)
    conn.commit()

    # For safety: also mark as friendly any rows where title/job_keyword includes 'junior' even if requirements empty
    cur.execute("UPDATE vacancies SET student_friendly = 1 WHERE (lower(title) LIKE ? OR lower(job_keyword) LIKE ?) ;", ('%junior%','%junior%'))
    conn.commit()

    # Print counts for diagnostics
    cur.execute("SELECT COUNT(*) FROM vacancies;")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM vacancies WHERE student_friendly = 1;")
    friendly = cur.fetchone()[0]
    print(f"[DB] Marked student_friendly: {friendly}/{total} rows.")

def prune_non_student_vacancies(conn: sqlite3.Connection):
    """
    Delete rows where student_friendly = 0. Use carefully.
    """
    ensure_student_column(conn)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM vacancies WHERE student_friendly = 0;")
    to_delete = cur.fetchone()[0]
    if to_delete == 0:
        print("[DB] No non-student vacancies to delete.")
        return
    print(f"[DB] Deleting {to_delete} non-student vacancies... (this operation is irreversible)")
    cur.execute("DELETE FROM vacancies WHERE student_friendly = 0;")
    conn.commit()
    cur.execute("SELECT COUNT(*) FROM vacancies;")
    remaining = cur.fetchone()[0]
    print(f"[DB] Deleted. Remaining rows: {remaining}")

# -------- HH API helpers --------
def get_page_json(keyword, page, country_code, per_page=100, timeout=10):
    params = {
        'text': f'NAME:{keyword}',
        'area': country_code,
        'page': page,
        'per_page': per_page
    }
    try:
        r = requests.get('https://api.hh.ru/vacancies', params=params, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print(f"[ERROR] Request failed for '{keyword}' page {page}: {e}", file=sys.stderr)
        return None

def format_salary(salary):
    if not salary:
        return None
    try:
        if salary.get('from') and salary.get('to'):
            return f"{salary['from']} - {salary['to']} {salary.get('currency','')}"
        if salary.get('from'):
            return f"{salary['from']} {salary.get('currency','')}"
        if salary.get('to'):
            return f"{salary['to']} {salary.get('currency','')}"
    except Exception:
        return str(salary)
    return None

def clean_highlight_tags(text):
    if text is None:
        return None
    # remove <highlighttext> and </highlighttext>
    return text.replace('<highlighttext>', '').replace('</highlighttext>', '')

def item_to_row(item, job_keyword):
    """
    Build DB row tuple from HH vacancy item.
    Returns: (url,title,employer,city,publish_date,salary,requirements,responsibilities,job_keyword,raw_json,inserted_at)
    """
    url = item.get('alternate_url')
    title = clean_highlight_tags(item.get('name'))
    employer = clean_highlight_tags((item.get('employer') or {}).get('name'))
    city = clean_highlight_tags((item.get('area') or {}).get('name'))
    publish_date = item.get('published_at')
    salary = format_salary(item.get('salary'))
    requirements = clean_highlight_tags((item.get('snippet') or {}).get('requirement'))
    responsibilities = clean_highlight_tags((item.get('snippet') or {}).get('responsibility'))
    raw_json = json.dumps(item, ensure_ascii=False)
    inserted_at = dt.datetime.now(ALMATY_TZ).isoformat()
    return (url, title, employer, city, publish_date, salary, requirements, responsibilities, job_keyword, raw_json, inserted_at)

# -------- Keywords discovery --------
def keywords_from_data_dir(data_dir: Path):
    kws = []
    master_txt = data_dir / "keywords.txt"
    if master_txt.exists():
        with master_txt.open(encoding='utf-8') as f:
            for line in f:
                s = line.strip()
                if s:
                    kws.append(s)
    else:
        for f in data_dir.iterdir():
            if f.is_file() and f.suffix.lower() == '.csv':
                # skip combined result files
                if f.stem.lower().startswith("results_"):
                    continue
                kws.append(f.stem)
    return sorted(set(kws))

# -------- Main pipeline --------
def fetch_and_store_all(data_dir: Path, country, per_page=100, sleep_sec=0.5, student_only=False):
    if country not in COUNTRY_CODES:
        raise ValueError(f"Unknown country code {country}")
    country_code = COUNTRY_CODES[country]

    # init DB
    con = init_db(DB_PATH)

    keywords = keywords_from_data_dir(data_dir)
    if not keywords:
        print("[ERROR] No keywords found. Put filenames like 'Data Analyst.csv' in hhData/ or create hhData/keywords.txt", file=sys.stderr)
        return

    print(f"[INFO] Found {len(keywords)} keywords. Inserting into DB at {DB_PATH}")
    for kw in keywords:
        print(f"[INFO] Fetching for keyword: '{kw}'")
        all_rows = []
        page = 0
        while True:
            data = get_page_json(kw, page, country_code, per_page=per_page)
            if data is None:
                # failed to get page after retries — break this keyword
                break
            items = data.get('items', [])
            if not items:
                break
            for it in items:
                try:
                    row = item_to_row(it, kw)
                    # skip if no url
                    if row[0]:
                        all_rows.append(row)
                except Exception as e:
                    print(f"[WARN] Failed to process item for '{kw}': {e}", file=sys.stderr)
            # pagination handling
            total_pages = data.get('pages')
            page += 1
            time.sleep(sleep_sec)
            if total_pages is not None and page >= total_pages:
                break
            if len(items) < per_page:
                break

        if all_rows:
            try:
                # batch insert/upsert in one transaction for speed
                upsert_rows(con, all_rows)
                print(f"[OK] Inserted/updated {len(all_rows)} rows for '{kw}'")
            except Exception as e:
                print(f"[ERROR] DB upsert failed for '{kw}': {e}", file=sys.stderr)

    # After inserting all keywords: mark student-friendly rows
    try:
        mark_student_friendly(con)
        if student_only:
            # prune (delete) non-student rows
            prune_non_student_vacancies(con)
    except Exception as e:
        print(f"[WARN] Could not mark/prune student-friendly rows: {e}", file=sys.stderr)

    con.close()
    print("[DONE] All keywords processed. DB closed.")

# -------- CLI --------
def main():
    parser = argparse.ArgumentParser(description="HH parser -> SQLite pipeline")
    parser.add_argument('--hhData-dir', default='hhData', help='Directory with keywords or CSV filenames (default hhData)')
    parser.add_argument('--country', default='KZ', help='Country code for HH API (default KZ)')
    parser.add_argument('--per-page', type=int, default=100, help='Results per page (max 100)')
    parser.add_argument('--sleep', type=float, default=0.5, help='Seconds to sleep between page requests')
    parser.add_argument('--student-only', action='store_true', help='After parsing mark and prune non-student vacancies (keep only student-friendly)')
    args = parser.parse_args()

    data_dir = Path(args.hhData_dir)
    fetch_and_store_all(data_dir, args.country, per_page=args.per_page, sleep_sec=args.sleep, student_only=args.student_only)

if __name__ == "__main__":
    main()
