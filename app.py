

import json
import os
from datetime import datetime

from flask import Flask, render_template, request, jsonify

import database as db
import image_model

app = Flask(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploaded_xrays")

# Try loading the model at startup just to warn early in the console —
# actual inference still lazy-loads/retries per-request via image_model,
# so the rest of the app (history/dashboard) stays usable even if the
# checkpoint hasn't been placed yet.
try:
    image_model.load_model()
    print("OA image model loaded successfully.")
except FileNotFoundError as e:
    print("WARNING — image model not ready yet:\n", e)

db.init_db()

# First run only: if the database is empty, add a batch of demo
# screenings so History/Dashboard aren't blank. Once real screenings
# exist, this is a no-op.
if not db.get_all_screenings():
    try:
        import seed_demo_data
        seed_demo_data.seed()
    except Exception:
        import traceback
        print("Demo seeding FAILED — dashboard/history will stay empty until this is fixed:")
        traceback.print_exc()

RISK_ORDER = ["Normal", "Mild", "Moderate", "Severe"]

# Rule-based preventive guidance shown alongside the model's prediction.
GUIDANCE = {
    "Normal": {
        "headline": "No significant OA risk markers detected.",
        "advice": [
            "Continue regular low-impact activity such as walking or cycling.",
            "Maintain a healthy body weight to protect the joints long-term.",
            "Re-screen once a year, or sooner if pain or stiffness appears.",
        ],
    },
    "Mild": {
        "headline": "Early risk markers present — preventive action is recommended.",
        "advice": [
            "Introduce gentle joint-strengthening exercises (e.g. seated leg raises).",
            "Reduce prolonged squatting or kneeling where the occupation allows.",
            "Recheck in 3 months; refer to a PHC doctor if pain increases.",
        ],
    },
    "Moderate": {
        "headline": "Noticeable OA risk markers — clinical review advised.",
        "advice": [
            "Refer to the nearest Primary Health Centre for a physical exam.",
            "Advise rest from heavy manual work until reviewed by a clinician.",
            "Start supervised physiotherapy-style joint mobility exercises.",
        ],
    },
    "Severe": {
        "headline": "High risk markers detected — prompt referral recommended.",
        "advice": [
            "Refer urgently to an orthopaedic specialist or district hospital.",
            "Avoid weight-bearing strain (heavy lifting, prolonged standing).",
            "Consider imaging (X-ray) if not already available on record.",
        ],
    },
}


@app.route("/")
def screening_page():
    return render_template("screening.html", active="screen")


@app.route("/history")
def history_page():
    return render_template("history.html", active="history")


@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html", active="dashboard")



@app.route("/api/screen", methods=["POST"])
def api_screen():
    # multipart/form-data now (text fields + an image file), not JSON —
    # request.form holds the text fields, request.files holds the image.
    payload = request.form.to_dict()

    required = [
        "patient_name", "age", "sex", "bmi", "occupation_intensity",
        "family_history", "previous_injury", "symptom_duration_months",
        "squat_difficulty", "pain_score", "stiffness", "knee_rom",
        "walking_speed", "step_duration", "gait_asymmetry", "crepitus",
        "swelling", "affected_side", "mobility_score",
    ]
    missing = [f for f in required if payload.get(f) in (None, "")]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    image_file = request.files.get("image")
    if image_file is None or image_file.filename == "":
        return jsonify({"error": "Missing knee X-ray image."}), 400

    image_bytes = image_file.read()

    try:
        result = image_model.predict(image_bytes)
    except FileNotFoundError as e:
        # model checkpoint hasn't been placed in models/ yet
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Could not process the image: {e}"}), 400

    risk_percent = result["risk_percent"]          # 0-100, P(Osteoarthritis)
    risk_category = image_model.risk_percent_to_category(risk_percent)
    confidence = risk_percent                       # the single number that matters most here

    # Probabilities dict feeds the existing "risk probability" bar chart.
    # Values must be fractions (0-1) — the frontend multiplies by 100 itself.
    prob_map = {
        "Osteoarthritis": round(risk_percent / 100.0, 4),
        "Normal": round((100 - risk_percent) / 100.0, 4),
    }

    # Save the uploaded image for later review in History (best-effort —
    # screening still proceeds even if saving the file fails).
    image_filename = None
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        safe_name = image_file.filename.replace("/", "_").replace("\\", "_")
        image_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_name}"
        with open(os.path.join(UPLOAD_DIR, image_filename), "wb") as f:
            f.write(image_bytes)
    except Exception:
        pass

    record = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "patient_name": payload["patient_name"],
        "age": payload["age"], "sex": payload["sex"], "bmi": payload["bmi"],
        "occupation_intensity": payload["occupation_intensity"],
        "family_history": payload["family_history"],
        "previous_injury": payload["previous_injury"],
        "symptom_duration_months": payload["symptom_duration_months"],
        "squat_difficulty": payload["squat_difficulty"],
        "pain_score": payload["pain_score"],
        "stiffness": payload["stiffness"],
        "knee_rom": payload["knee_rom"],
        "walking_speed": payload["walking_speed"],
        "step_duration": payload["step_duration"],
        "gait_asymmetry": payload["gait_asymmetry"],
        "crepitus": payload["crepitus"],
        "swelling": payload["swelling"],
        "affected_side": payload["affected_side"],
        "mobility_score": payload["mobility_score"],
        "facility": payload.get("facility", ""),
        "worker_name": payload.get("worker_name", ""),
        "risk_category": risk_category,
        "confidence": confidence / 100.0,  # stored as a fraction, like the old RF confidence was
        "probabilities": json.dumps(prob_map),
        "image_path": image_filename,
    }
    new_id = db.insert_screening(record)

    return jsonify({
        "id": new_id,
        "risk_category": risk_category,
        "risk_rank": RISK_ORDER.index(risk_category),
        "confidence": round(confidence, 1),
        "probabilities": prob_map,
        "guidance": GUIDANCE[risk_category],
        "model_prediction": result["predicted_class"],  # raw binary output, for transparency
        "model_risk_percent": risk_percent,
    })


@app.route("/api/screenings", methods=["GET"])
def api_list_screenings():
    search = request.args.get("search")
    risk = request.args.get("risk")
    rows = db.get_all_screenings(search=search, risk_filter=risk)
    for r in rows:
        r["probabilities"] = json.loads(r["probabilities"]) if r["probabilities"] else {}
    return jsonify(rows)


@app.route("/api/screenings/<int:screening_id>", methods=["GET"])
def api_get_screening(screening_id):
    row = db.get_screening(screening_id)
    if not row:
        return jsonify({"error": "Not found"}), 404
    row["probabilities"] = json.loads(row["probabilities"]) if row["probabilities"] else {}
    row["guidance"] = GUIDANCE.get(row["risk_category"], {})
    return jsonify(row)


@app.route("/api/screenings/<int:screening_id>", methods=["DELETE"])
def api_delete_screening(screening_id):
    db.delete_screening(screening_id)
    return jsonify({"ok": True})


@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    return jsonify(db.get_dashboard_stats())


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
