# backend/my_sdu_scraper_app.py
from flask import Flask, request, Response, send_file

from sdu_client import SDUClient
import pdfkit
import io

app = Flask(__name__)


@app.route("/", methods=["GET"])
def home():
    return "<h2>Backend is running. Use /check-sdu or /download-transcript.</h2>"


@app.route("/check-sdu", methods=["POST"])
def check_sdu():
    student_id = request.form.get("student_id")
    password = request.form.get("password")

    if not student_id or not password:
        return Response("Missing student_id or password", status=400)

    client = SDUClient()

    try:
        ok = client.login(student_id, password)
    except Exception as e:
        print("Error talking to my.sdu.edu.kz:", repr(e))
        return Response("Error contacting SDU portal", status=502)

    if ok:
        return Response("Correct", status=200)
    else:
        return Response("Incorrect", status=401)


@app.route("/get-transcript", methods=["POST"])
def download_transcript():
    """
    Expects form POST with:
      - student_id
      - password

    Logs into SDU, fetches the PRINT transcript HTML
    (index.php?mod=transkript&ajx=1&action=PrintTranskript),
    injects our own CSS (borders), converts to PDF, returns transcript.pdf.
    """
    student_id = request.form.get("student_id")
    password = request.form.get("password")

    if not student_id or not password:
        return Response("Missing student_id or password", status=400)

    client = SDUClient()

    try:
        html_fragment = client.get_print_transcript_html(student_id, password)
    except Exception as e:
        print("Error while getting print transcript HTML:", repr(e))
        return Response("Error contacting SDU portal", status=502)

    if html_fragment is None:
        return Response("Invalid SDU credentials", status=401)

    # ---- Вставляем наш CSS с границами ----
    full_html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Transcript</title>
        <style>

          /* Главные таблицы на странице */
          table.clsTbl {{
            font-family: arial, sans-serif;
            border-collapse: collapse;
            width: 100%;
          }}

          

          /* На всякий случай – класс ячейки */
          .clsTd {{
            border: 1px solid #ddd;
            padding: 2px 4px;
          }}

          /* Таблица шкалы оценок (внизу) тоже clsTd, подстроится автоматически */

          /* Немного отступов между блоками */
          h1, h2, h3, h4 {{
            margin: 4px 0;
          }}
        </style>
      </head>
      <body>
        {html_fragment}
      </body>
    </html>
    """

    return { "Transcript html" : full_html }


@app.route("/get-profile", methods=["POST"])
def get_profile():
    student_id = request.form.get("student_id")
    password = request.form.get("password")

    client = SDUClient()
    data = client.get_profile_data(student_id, password)

    if data is None:
        return Response("Invalid credentials", status=401)

    return data


@app.route("/get-grand-gpa", methods=["POST"])
def get_gpa():
    student_id = request.form.get("student_id")
    password = request.form.get("password")

    client = SDUClient()
    gpa = client.get_grand_gpa(student_id, password)

    if gpa is None:
        return Response("Invalid credentials or GPA not found", status=404)

    return {"grand_gpa": gpa}


@app.route("/get-schedule", methods=["POST"])
def get_schedule():
    student_id = request.form.get("student_id")
    password = request.form.get("password")

    year = request.form.get("year", "2025")
    term = request.form.get("term", "1")

    client = SDUClient()
    html = client.get_schedule_html(student_id, password, year, term)

    if html is None:
        return Response("Invalid credentials or schedule not found", status=404)

    return {"schedule_json": html}


@app.route("/get-contact", methods=["POST"])
def get_contact():
    student_id  = request.form.get("student_id")
    password = request.form.get("password")

    client = SDUClient()
    contact_number = client.get_contact_number(student_id, password, normalize=True)

    return contact_number


@app.route("/get-user-data", methods=["POST"])
def get_user_data():
    student_id = request.form.get("student_id")
    password = request.form.get("password")

    client = SDUClient()
    user_data = client.gather_profile_payload(student_id, password, normalize_phone=True)

    return user_data


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
