import { Router } from "express";
import Database from "better-sqlite3";
import path from "path";
import url from "url";
import fs from "fs";

const router = Router();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Resolve DB path:
// 1) HH_SQLITE_PATH env
// 2) ../python-backend/hhData/vacancies.db relative to cwd (when running from unitalent-backend-full)
// 3) ../../python-backend/hhData/vacancies.db relative to this file (fallback)
const candidates = [
  process.env.HH_SQLITE_PATH,
  path.resolve(process.cwd(), "../python-backend/hhData/vacancies.db"),
  path.resolve(__dirname, "../../../python-backend/hhData/vacancies.db"),
].filter(Boolean);

const dbPath = candidates.find((p) => fs.existsSync(p));

if (!dbPath) {
  throw new Error(
    "HH SQLite DB not found. Set HH_SQLITE_PATH or ensure python-backend/hhData/vacancies.db exists (run hh_pipeline_sqlite.py)."
  );
}

// Single shared connection (read-only workload)
const db = new Database(dbPath, { readonly: true, fileMustExist: true });

router.get("/hh-jobs", (req, res) => {
  try {
    const { q, city } = req.query;
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));
    const page = Math.max(1, Number(req.query.page) || 1);
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    // Only student-friendly rows
    where.push("student_friendly = 1");

    if (q) {
      where.push("(lower(title) LIKE ? OR lower(requirements) LIKE ?)");
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    }
    if (city) {
      where.push("lower(city) LIKE ?");
      params.push(`%${city.toLowerCase()}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const baseSelect = `
      SELECT id, url, title, employer, city, publish_date, salary, requirements, responsibilities, job_keyword
      FROM vacancies
      ${whereSql}
      ORDER BY datetime(publish_date) DESC
      LIMIT ? OFFSET ?
    `;

    const list = db.prepare(baseSelect).all(...params, limit, offset);

    const totalRow = db
      .prepare(`SELECT COUNT(*) as cnt FROM vacancies ${whereSql}`)
      .get(...params);
    const total = totalRow?.cnt || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      items: list,
      total,
      page,
      totalPages,
      limit,
    });
  } catch (e) {
    console.error("GET /api/hh-jobs error", e);
    res.status(500).json({ message: "Failed to load HH jobs" });
  }
});

export default router;