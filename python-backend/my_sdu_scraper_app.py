from flask import Flask, request, Response
from sdu_client import SDUClient

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


@app.route("/get-user-data", methods=["POST"])
def get_user_data():
    student_id = request.form.get("student_id")
    password = request.form.get("password")

    client = SDUClient()
    user_data = client.gather_profile_payload(student_id, password, normalize_phone=True)

    return user_data


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
