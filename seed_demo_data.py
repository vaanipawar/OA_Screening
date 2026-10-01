"""
seed_demo_data.py
-------------------
Inserts a batch of realistic sample screenings spread over the last
2 weeks, so the History and Dashboard pages have something to show
right after setup instead of being blank.

This runs automatically once, the first time app.py starts and the
database is empty (see seed_if_empty() below, called from app.py).
You can also run it manually:

    python train_model.py      # (only needed once, already done)
    python seed_demo_data.py   # force re-seed
"""

import json
import random
from datetime import datetime, timedelta

import joblib
import pandas as pd

import database as db

MODEL = joblib.load("models/rf_model.joblib")
SEX_ENCODER = joblib.load("models/sex_encoder.joblib")
OCC_ENCODER = joblib.load("models/occupation_encoder.joblib")
TARGET_ENCODER = joblib.load("models/target_encoder.joblib")
FEATURE_COLUMNS = joblib.load("models/feature_columns.joblib")

FACILITIES = ["Diphu PHC", "Kohima Health Camp", "Imphal Community Centre", "Along CHC"]
WORKERS = ["S. Terang", "L. Ao", "R. Marak", "P. Lego"]

# Hand-crafted patients spanning the full risk spectrum, on purpose.
DEMO_PATIENTS = [
    dict(patient_name="Rina Bora", age=58, sex="Female", bmi=27.4, occupation_intensity="Heavy",
         family_history=1, previous_injury=0, symptom_duration_months=14, squat_difficulty=1,
         pain_score=6, stiffness=2, knee_rom=110, walking_speed=0.85, step_duration=0.9,
         gait_asymmetry=0.09, crepitus=1, swelling=1, affected_side=2, mobility_score=55),
    dict(patient_name="Bipul Das", age=34, sex="Male", bmi=23.1, occupation_intensity="Moderate",
         family_history=0, previous_injury=0, symptom_duration_months=0, squat_difficulty=0,
         pain_score=1, stiffness=0, knee_rom=135, walking_speed=1.3, step_duration=0.65,
         gait_asymmetry=0.01, crepitus=0, swelling=0, affected_side=0, mobility_score=95),
    dict(patient_name="Manoj Rabha", age=67, sex="Male", bmi=31.2, occupation_intensity="Heavy",
         family_history=1, previous_injury=1, symptom_duration_months=30, squat_difficulty=1,
         pain_score=8, stiffness=3, knee_rom=95, walking_speed=0.6, step_duration=1.1,
         gait_asymmetry=0.18, crepitus=1, swelling=1, affected_side=3, mobility_score=30),
    dict(patient_name="Priya Sharma", age=45, sex="Female", bmi=25.0, occupation_intensity="Sedentary",
         family_history=0, previous_injury=0, symptom_duration_months=3, squat_difficulty=0,
         pain_score=3, stiffness=1, knee_rom=125, walking_speed=1.1, step_duration=0.75,
         gait_asymmetry=0.03, crepitus=0, swelling=0, affected_side=1, mobility_score=80),
    dict(patient_name="Tenzin Lhamo", age=61, sex="Female", bmi=29.0, occupation_intensity="Heavy",
         family_history=1, previous_injury=0, symptom_duration_months=20, squat_difficulty=1,
         pain_score=7, stiffness=3, knee_rom=100, walking_speed=0.7, step_duration=1.0,
         gait_asymmetry=0.14, crepitus=1, swelling=1, affected_side=3, mobility_score=40),
    dict(patient_name="Ngangom Singh", age=29, sex="Male", bmi=22.4, occupation_intensity="Sedentary",
         family_history=0, previous_injury=0, symptom_duration_months=0, squat_difficulty=0,
         pain_score=0, stiffness=0, knee_rom=138, walking_speed=1.4, step_duration=0.6,
         gait_asymmetry=0.01, crepitus=0, swelling=0, affected_side=0, mobility_score=98),
    dict(patient_name="Ao Kikon", age=52, sex="Male", bmi=26.1, occupation_intensity="Heavy",
         family_history=0, previous_injury=1, symptom_duration_months=8, squat_difficulty=1,
         pain_score=5, stiffness=2, knee_rom=115, walking_speed=0.95, step_duration=0.85,
         gait_asymmetry=0.07, crepitus=1, swelling=0, affected_side=2, mobility_score=62),
    dict(patient_name="Momi Basumatary", age=71, sex="Female", bmi=30.5, occupation_intensity="Moderate",
         family_history=1, previous_injury=1, symptom_duration_months=36, squat_difficulty=1,
         pain_score=9, stiffness=3, knee_rom=88, walking_speed=0.55, step_duration=1.15,
         gait_asymmetry=0.2, crepitus=1, swelling=1, affected_side=3, mobility_score=25),
    dict(patient_name="Deepika Rai", age=39, sex="Female", bmi=24.3, occupation_intensity="Moderate",
         family_history=0, previous_injury=0, symptom_duration_months=2, squat_difficulty=0,
         pain_score=2, stiffness=1, knee_rom=128, walking_speed=1.15, step_duration=0.72,
         gait_asymmetry=0.03, crepitus=0, swelling=0, affected_side=0, mobility_score=85),
    dict(patient_name="Lalrinliana", age=48, sex="Male", bmi=27.8, occupation_intensity="Heavy",
         family_history=1, previous_injury=0, symptom_duration_months=11, squat_difficulty=1,
         pain_score=5, stiffness=2, knee_rom=112, walking_speed=0.92, step_duration=0.88,
         gait_asymmetry=0.08, crepitus=1, swelling=0, affected_side=1, mobility_score=60),
    dict(patient_name="Yaipha Devi", age=55, sex="Female", bmi=28.6, occupation_intensity="Sedentary",
         family_history=1, previous_injury=0, symptom_duration_months=5, squat_difficulty=0,
         pain_score=3, stiffness=1, knee_rom=122, walking_speed=1.05, step_duration=0.78,
         gait_asymmetry=0.04, crepitus=0, swelling=0, affected_side=1, mobility_score=78),
    dict(patient_name="Hemanta Boro", age=63, sex="Male", bmi=25.9, occupation_intensity="Heavy",
         family_history=0, previous_injury=1, symptom_duration_months=18, squat_difficulty=1,
         pain_score=6, stiffness=2, knee_rom=108, walking_speed=0.8, step_duration=0.93,
         gait_asymmetry=0.1, crepitus=1, swelling=1, affected_side=2, mobility_score=50),
    dict(patient_name="Aiti Marak", age=24, sex="Female", bmi=21.5, occupation_intensity="Sedentary",
         family_history=0, previous_injury=0, symptom_duration_months=0, squat_difficulty=0,
         pain_score=0, stiffness=0, knee_rom=140, walking_speed=1.45, step_duration=0.58,
         gait_asymmetry=0.01, crepitus=0, swelling=0, affected_side=0, mobility_score=99),
    dict(patient_name="Chubaienla Ao", age=59, sex="Female", bmi=29.8, occupation_intensity="Heavy",
         family_history=1, previous_injury=1, symptom_duration_months=26, squat_difficulty=1,
         pain_score=8, stiffness=3, knee_rom=97, walking_speed=0.65, step_duration=1.05,
         gait_asymmetry=0.16, crepitus=1, swelling=1, affected_side=3, mobility_score=35),
    dict(patient_name="Sentila Jamir", age=37, sex="Female", bmi=20.9, occupation_intensity="Moderate",
         family_history=1, previous_injury=0, symptom_duration_months=11, squat_difficulty=0,
         pain_score=4, stiffness=0, knee_rom=96, walking_speed=0.88, step_duration=0.91,
         gait_asymmetry=0.13, crepitus=0, swelling=0, affected_side=1, mobility_score=82),
    dict(patient_name="Robin Konyak", age=34, sex="Male", bmi=32.0, occupation_intensity="Heavy",
         family_history=1, previous_injury=0, symptom_duration_months=21, squat_difficulty=0,
         pain_score=2, stiffness=2, knee_rom=97, walking_speed=0.88, step_duration=0.61,
         gait_asymmetry=0.13, crepitus=1, swelling=1, affected_side=2, mobility_score=72),
]


def build_row(p):
    row = {
        "Age": p["age"], "Sex": p["sex"], "BMI": p["bmi"],
        "Occupation_Intensity": p["occupation_intensity"],
        "Family_History": p["family_history"], "Previous_Injury": p["previous_injury"],
        "Symptom_Duration_Months": p["symptom_duration_months"],
        "Squat_Difficulty": p["squat_difficulty"], "Pain_Score": p["pain_score"],
        "Stiffness": p["stiffness"], "Knee_ROM": p["knee_rom"],
        "Walking_Speed": p["walking_speed"], "Step_Duration": p["step_duration"],
        "Gait_Asymmetry": p["gait_asymmetry"], "Crepitus": p["crepitus"],
        "Swelling": p["swelling"], "Affected_Side": p["affected_side"],
        "Mobility_Score": p["mobility_score"],
    }
    df = pd.DataFrame([row])
    df["Sex"] = SEX_ENCODER.transform(df["Sex"])
    df["Occupation_Intensity"] = OCC_ENCODER.transform(df["Occupation_Intensity"])
    return df[FEATURE_COLUMNS]


def seed(force=False):
    existing = db.get_all_screenings()
    if existing and not force:
        print(f"Database already has {len(existing)} records — skipping seed.")
        return

    rng = random.Random(7)
    now = datetime.now()

    for i, p in enumerate(DEMO_PATIENTS):
        X = build_row(p)
        proba = MODEL.predict_proba(X)[0]
        pred_idx = proba.argmax()
        risk_category = TARGET_ENCODER.inverse_transform([pred_idx])[0]
        confidence = float(proba[pred_idx])
        prob_map = {cls: float(pr) for cls, pr in zip(TARGET_ENCODER.classes_, proba)}

        days_ago = rng.randint(0, 13)
        created_at = (now - timedelta(days=days_ago, hours=rng.randint(0, 8))).isoformat(timespec="seconds")

        record = {
            "created_at": created_at,
            "patient_name": p["patient_name"], "age": p["age"], "sex": p["sex"], "bmi": p["bmi"],
            "occupation_intensity": p["occupation_intensity"],
            "family_history": p["family_history"], "previous_injury": p["previous_injury"],
            "symptom_duration_months": p["symptom_duration_months"],
            "squat_difficulty": p["squat_difficulty"], "pain_score": p["pain_score"],
            "stiffness": p["stiffness"], "knee_rom": p["knee_rom"],
            "walking_speed": p["walking_speed"], "step_duration": p["step_duration"],
            "gait_asymmetry": p["gait_asymmetry"], "crepitus": p["crepitus"],
            "swelling": p["swelling"], "affected_side": p["affected_side"],
            "mobility_score": p["mobility_score"],
            "facility": FACILITIES[i % len(FACILITIES)],
            "worker_name": WORKERS[i % len(WORKERS)],
            "risk_category": risk_category, "confidence": confidence,
            "probabilities": json.dumps(prob_map),
        }
        db.insert_screening(record)

    print(f"Seeded {len(DEMO_PATIENTS)} demo screenings.")


if __name__ == "__main__":
    db.init_db()
    seed(force=True)
