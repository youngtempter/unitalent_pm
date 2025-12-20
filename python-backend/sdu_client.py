import requests
import re
import time
import json
from bs4 import BeautifulSoup
from requests.exceptions import RequestException

BASE_URL = "https://my.sdu.edu.kz"
LOGIN_URL = f"{BASE_URL}/loginAuth.php"
TRANSCRIPT_URL = f"{BASE_URL}/index.php?mod=transkript"
TRANSCRIPT_PRINT_URL = f"{BASE_URL}/index.php?mod=transkript&ajx=1&action=PrintTranskript"


class SDUClient:
    def __init__(self):
        self.session = requests.Session()

    def login(self, username: str, password: str) -> bool:
        payload = {
            "username": username,
            "password": password,
            "modstring": "",
            "LogIn": "Log in",
        }

        headers = {
            "User-Agent": "Mozilla/5.0 (SDUProjectBot)",
            "Referer": BASE_URL + "/",
        }

        resp = self.session.post(LOGIN_URL, data=payload, headers=headers)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        user_input = soup.find("input", {"name": "username"})
        pass_input = soup.find("input", {"name": "password"})

        if user_input and pass_input:
            print("Login failed: still on login page")
            return False

        print("Login successful")
        return True


    def get_print_transcript_html(self, username: str, password: str) -> str | None:
        """
        Logs in and returns the HTML of the PRINT version of the transcript:
        index.php?mod=transkript&ajx=1&action=PrintTranskript
        """
        if not self.login(username, password):
            return None

        resp = self.session.get(TRANSCRIPT_PRINT_URL)
        resp.raise_for_status()
        html = resp.text

        return html


    def get_profile_data(self, username: str, password: str):
        """
        Logs in and parses:
        - Fullname
        - Program / Class

        from https://my.sdu.edu.kz/index.php
        """
        if not self.login(username, password):
            return None

        resp = self.session.get(f"{BASE_URL}/index.php")
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        fullname = ""
        program_class = ""

        # Fullname
        node = soup.find("td", string=lambda s: s and "Fullname" in s)
        if node:
            td = node.find_next("td")
            if td:
                fullname = td.get_text(strip=True)

        # Program / Class
        node = soup.find("td", string=lambda s: s and "Program / Class" in s)
        if node:
            td = node.find_next("td")
            if td:
                program_class = td.get_text(strip=True) + " course"

        return {
            "fullname": fullname,
            "program_class": program_class
        }

    def get_contact_number(self, username: str, password: str, normalize: bool = False) -> str | None:
        """
        Logs in and fetches contact info via AJAX:
        POST https://my.sdu.edu.kz/index.php
        Payload:
            ajx=1
            mod=profile
            action=ContactInfo

        Returns the first found contact number as a string, or None if not found.

        If normalize=True, returns digits-only phone (keeps leading '+' if present).
        """
        import time

        if not self.login(username, password):
            return None

        url = f"{BASE_URL}/index.php"
        payload = {
            "ajx": "1",
            "mod": "profile",
            "action": "ContactInfo",
            # harmless cache-buster seen in the browser requests:
            str(int(time.time() * 1000)): ""
        }

        headers = {
            "User-Agent": "Mozilla/5.0 (SDUProjectBot)",
            "Referer": f"{BASE_URL}/index.php?mod=profile",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }

        resp = self.session.post(url, data=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        html = resp.text.strip()

        soup = BeautifulSoup(html, "html.parser")

        # 1) Direct approach: find "Mobile phone" label and read next <td>
        mobile_td = soup.find("td", string=lambda s: s and "Mobile phone" in s)
        if mobile_td:
            num_td = mobile_td.find_next_sibling("td")
            if num_td:
                phone = num_td.get_text(" ", strip=True)
                if phone:
                    return _normalize_phone(phone) if normalize else phone

        # 2) General table rows scan (label in first <td>, value in second <td>)
        table = soup.find("table")
        if table:
            for row in table.find_all("tr"):
                tds = row.find_all("td")
                if len(tds) >= 2:
                    label = tds[0].get_text(" ", strip=True).lower()
                    value = tds[1].get_text(" ", strip=True)
                    if not value:
                        continue
                    # common labels that might indicate phone
                    if any(k in label for k in ("mobile", "mobile phone", "phone", "telephone", "tel")):
                        return _normalize_phone(value) if normalize else value

        # 3) Final fallback: run permissive phone regex on the whole returned text
        whole_text = soup.get_text(" ", strip=True)
        phone_match = re.search(r'(\+?\d[\d\-\s()]{6,}\d)', whole_text)
        if phone_match:
            phone = phone_match.group(0).strip()
            return _normalize_phone(phone) if normalize else phone

        return None

    def get_birth_city(self, username: str, password: str, debug: bool = False) -> str | None:
        """
        Fetches AJAX Addresses and returns Place of Birth:
        - City if present
        - otherwise Province
        """
        import time, json
        from bs4 import BeautifulSoup

        if not self.login(username, password):
            return None

        url = f"{BASE_URL}/index.php"
        payload = {
            "ajx": "1",
            "mod": "profile",
            "action": "Addresses",
            str(int(time.time() * 1000)): ""
        }

        headers = {
            "User-Agent": "Mozilla/5.0 (SDUProjectBot)",
            "Referer": f"{BASE_URL}/index.php?mod=profile",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "application/json, text/plain, */*",
            "Origin": BASE_URL,
        }

        resp = self.session.post(url, data=payload, headers=headers, timeout=15)
        resp.raise_for_status()

        raw = (resp.text or "").strip()

        html = raw
        if raw.startswith("{") and '"DATA"' in raw:
            try:
                obj = json.loads(raw)
                html = obj.get("DATA", "") or ""
            except Exception:
                pass

        if debug:
            print("STATUS:", resp.status_code)
            print("FINAL URL:", resp.url)
            print("RAW starts with:", raw[:20])
            print("HTML has Place of Birth:", "Place of Birth" in html)
            print("HTML has addr_type=4:", 'name="addr_type" value="4"' in html)

            with open("addresses_debug.html", "w", encoding="utf-8") as f:
                f.write(html)
            print("Saved parsed HTML to addresses_debug.html")

        soup = BeautifulSoup(html, "html.parser")

        def _t(s: str) -> str:
            return (s or "").replace("\xa0", " ").strip()

        pob_form = None
        for form in soup.find_all("form"):
            inp = form.find("input", attrs={"name": "addr_type"})
            if inp and _t(inp.get("value", "")) == "4":
                pob_form = form
                break

        if not pob_form:
            heading = soup.find(lambda tag: tag and "Place of Birth" in tag.get_text(" ", strip=True))
            if heading:
                pob_form = heading.find_next("form")

        if not pob_form:
            return None

        pob_table = pob_form.find("table")
        if not pob_table:
            return None

        fields: dict[str, str] = {}
        for row in pob_table.find_all("tr"):
            tds = row.find_all("td")
            i = 0
            while i < len(tds) - 1:
                label = _t(tds[i].get_text(" ", strip=True)).rstrip(":").lower()
                value = _t(tds[i + 1].get_text(" ", strip=True))
                if label:
                    fields[label] = value
                i += 2

        city = fields.get("city", "")
        if city:
            return city

        province = fields.get("province", "")
        return province if province else None



    def get_grand_gpa(self, username: str, password: str):
        """
        Logs in and extracts Grand GPA from transcript page.
        Example cell:
        <td colspan="2" align="center">Grand GPA : 3.73</td>
        """
        if not self.login(username, password):
            return None

        resp = self.session.get(f"{BASE_URL}/index.php?mod=transkript")
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        gpa_node = soup.find(string=lambda s: s and "Grand GPA" in s)
        if not gpa_node:
            gpa_node = soup.find(string=lambda s: s and "Жалпы орталама балл" in s)

        if not gpa_node:
            return None

        td = gpa_node.find_parent("td")
        if not td:
            return None

        text = td.get_text(" ", strip=True)
        gpa = text.split(":")[-1].strip()

        return gpa
    

    def _translate_day_to_english(self, day_name: str) -> str:
        """
        Translates day names from Russian or Kazakh to English.
        Returns English day name or original if not found in mapping.
        """
        day_lower = day_name.lower().strip()
        
        day_translations = {
            "понедельник": "Monday",
            "вторник": "Tuesday",
            "среда": "Wednesday",
            "четверг": "Thursday",
            "пятница": "Friday",
            "суббота": "Saturday",
            "воскресенье": "Sunday",
            "дүйсенбі": "Monday",
            "сейсенбі": "Tuesday",
            "сәрсенбі": "Wednesday",
            "бейсенбі": "Thursday",
            "жұма": "Friday",
            "сенбі": "Saturday",
            "жексенбі": "Sunday",
            "monday": "Monday",
            "tuesday": "Tuesday",
            "wednesday": "Wednesday",
            "thursday": "Thursday",
            "friday": "Friday",
            "saturday": "Saturday",
            "sunday": "Sunday",
        }
        
        translated = day_translations.get(day_lower)
        if translated:
            return translated
        
        for eng_day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
            if eng_day.lower() == day_lower:
                return eng_day
        
        return day_name

    def get_schedule_json(self, username: str, password: str, year="2025", term="1"):
        """
        Logs in and fetches the real schedule via AJAX POST:
        POST https://my.sdu.edu.kz/index.php
        Payload:
            mod=schedule
            ajx=1
            action=showSchedule
            year=2025
            term=1
            type=I
            details=0

        Returns HTML fragment from the server.
        """
        if not self.login(username, password):
            return None

        url = f"{BASE_URL}/index.php"

        payload = {
            "mod": "schedule",
            "ajx": "1",
            "action": "showSchedule",
            "year": year,
            "term": term,
            "type": "I",
            "details": "0",
        }

        headers = {
            "User-Agent": "Mozilla/5.0 (SDUProjectBot)",
            "Referer": f"{BASE_URL}/index.php?mod=schedule",
            "X-Requested-With": "XMLHttpRequest"
        }

        resp = self.session.post(url, data=payload, headers=headers)
        resp.raise_for_status()

        html = resp.text.strip()
        soup = BeautifulSoup(html, "html.parser")

        table = soup.find("table", class_="clTbl")
        if not table:
            return {}
        
        rows = table.find_all("tr")
        if not rows:
            return {}

        header_tds = rows[0].find_all("td")[1:]
        days = []
        for td in header_tds:
            span = td.find("span")
            if span and span.has_attr("title"):
                day_name = span["title"]  # e.g. Monday, Понедельник, Дүйсенбі
            else:
                day_name = td.get_text(strip=True)
            
            english_day = self._translate_day_to_english(day_name)
            days.append(english_day)

        schedule = {day: [] for day in days}

        for row in rows[1:]:
            tds = row.find_all("td")
            if not tds:
                continue

            time_spans = tds[0].find_all("span")
            if len(time_spans) < 2:
                continue

            start_time = time_spans[0].get_text(strip=True)
            end_time = time_spans[1].get_text(strip=True)
            time_range = f"{start_time}-{end_time}"

            for day_idx, cell in enumerate(tds[1:]):
                a = cell.find("a")
                if not a:
                    continue

                course_code = a.get_text(strip=True)

                details_span = cell.find("span", attrs={"name": "details"})
                course_title = details_span.get_text(" ", strip=True) if details_span else ""
                
                credit = ""
                if course_title:
                    credit_match = re.search(r'\[([^\]]+)\]', course_title)
                    if credit_match:
                        credit = credit_match.group(0)
                    
                    course_title = re.sub(r'\([^)]+\)', '', course_title)
                    course_title = re.sub(r'\[[^\]]+\]', '', course_title)
                    course_title = course_title.strip()

                type_span = cell.find("span", title=re.compile(r"(Theory|Practice|Лекция|Практика|Дәріс)"))
                lesson_type = ""
                if type_span:
                    if type_span["title"] == "Theory" or type_span["title"] == "Лекция" or type_span["title"] == "Дәріс":
                        lesson_type = "Lecture"
                    elif type_span["title"] == "Practice" or type_span["title"] == "Практика":
                        lesson_type = "Practice"

                room = ""
                for span in cell.find_all("span"):
                    if span.get("name") == "details":
                        continue
                    text = span.get_text(strip=True)
                    if re.match(r"[A-Z]{1,3}\s?\d{1,3}", text):
                        room = text

                if room.startswith("VR"):
                    lesson_type = "Online"

                schedule[days[day_idx]].append({
                    "time": time_range,
                    "course_code": course_code,
                    "course_title": course_title,
                    "credit": credit,
                    "type": lesson_type
                })

        return schedule


    def gather_profile_payload(self, username: str, password: str, normalize_phone: bool = True) -> dict:
        """
        Collect all parsed data into a single JSON-serializable dict.
        """
        profile = self.get_profile_data(username, password) or {}
        contact = self.get_contact_number(username, password, normalize=normalize_phone)
        gpa = self.get_grand_gpa(username, password)
        transcript_html = self.get_print_transcript_html(username, password)
        schedule = self.get_schedule_json(username, password) or {}
        birth_city = self.get_birth_city(username, password)

        payload = {
            "source": "sdu.my",
            "source_user": username,
            "fullname": profile.get("fullname"),
            "program_class": profile.get("program_class"),
            "contact_number": contact,
            "grand_gpa": gpa,
            "transcript_print_html": transcript_html,
            "schedule": schedule,
            "birth_city": birth_city,
            "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        return payload

    def send_to_java(self, payload: dict, java_url: str, bearer_token: str | None = None,
                     max_retries: int = 3, backoff_factor: float = 1.0, timeout: int = 15) -> dict | None:
        """
        POST payload (JSON) to the Java backend. Returns parsed JSON response or None on final failure.
        """
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if bearer_token:
            headers["Authorization"] = f"Bearer {bearer_token}"

        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

        for attempt in range(1, max_retries + 1):
            try:
                resp = requests.post(java_url, data=body, headers=headers, timeout=timeout)
                resp.raise_for_status()
                return resp.json()
            except RequestException as exc:
                if attempt == max_retries:
                    print(f"[send_to_java] final failure after {attempt} attempts: {exc}")
                    return None
                wait = backoff_factor * (2 ** (attempt - 1))
                print(f"[send_to_java] attempt {attempt} failed: {exc}. retrying in {wait}s...")
                time.sleep(wait)


def _normalize_phone(raw: str) -> str:
    """
    Return digits-only phone, preserving leading '+' if present.
    Example: '+7 701 123 45 67' -> '+77011234567'
             '8 (701) 123-45-67' -> '87011234567'
    """
    raw = raw.strip()
    leading_plus = raw.startswith("+")
    digits = re.sub(r'\D', '', raw)
    if leading_plus:
        return f"+{digits}"
    return digits

