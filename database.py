"""
database.py
------------
Tiny SQLite wrapper — no ORM needed for a prototype like this.
Stores every screening a health worker submits, so the History and
Dashboard pages have real data to show.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "oa_screening.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS screenings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            age INTEGER,
            sex TEXT,
            bmi REAL,
            occupation_intensity TEXT,
            family_history INTEGER,
            previous_injury INTEGER,
            symptom_duration_months REAL,
            squat_difficulty INTEGER,
            pain_score REAL,
            stiffness INTEGER,
            knee_rom REAL,
            walking_speed REAL,
            step_duration REAL,
            gait_asymmetry REAL,
            crepitus INTEGER,
            swelling INTEGER,
            affected_side INTEGER,
            mobility_score REAL,
            facility TEXT,
            worker_name TEXT,
            risk_category TEXT,
            confidence REAL,
            probabilities TEXT
        )
    """)

    # Migration: add image_path if upgrading from an older DB file that
    # doesn't have it yet (safe no-op if the column already exists).
    existing_cols = [
        row["name"] for row in
        conn.execute("PRAGMA table_info(screenings)").fetchall()
    ]
    if "image_path" not in existing_cols:
        conn.execute("ALTER TABLE screenings ADD COLUMN image_path TEXT")

    conn.commit()
    conn.close()


def insert_screening(record: dict) -> int:
    conn = get_connection()
    cur = conn.execute("""
        INSERT INTO screenings (
            created_at, patient_name, age, sex, bmi, occupation_intensity,
            family_history, previous_injury, symptom_duration_months,
            squat_difficulty, pain_score, stiffness, knee_rom, walking_speed,
            step_duration, gait_asymmetry, crepitus, swelling, affected_side,
            mobility_score, facility, worker_name, risk_category, confidence,
            probabilities, image_path
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        record["created_at"], record["patient_name"], record["age"],
        record["sex"], record["bmi"], record["occupation_intensity"],
        record["family_history"], record["previous_injury"],
        record["symptom_duration_months"], record["squat_difficulty"],
        record["pain_score"], record["stiffness"], record["knee_rom"],
        record["walking_speed"], record["step_duration"],
        record["gait_asymmetry"], record["crepitus"], record["swelling"],
        record["affected_side"], record["mobility_score"],
        record["facility"], record["worker_name"], record["risk_category"],
        record["confidence"], record["probabilities"], record.get("image_path"),
    ))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def get_all_screenings(search=None, risk_filter=None):
    conn = get_connection()
    query = "SELECT * FROM screenings WHERE 1=1"
    params = []
    if search:
        query += " AND (patient_name LIKE ? OR facility LIKE ?)"
        params += [f"%{search}%", f"%{search}%"]
    if risk_filter and risk_filter != "All":
        query += " AND risk_category = ?"
        params.append(risk_filter)
    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_screening(screening_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM screenings WHERE id = ?", (screening_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_screening(screening_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM screenings WHERE id = ?", (screening_id,))
    conn.commit()
    conn.close()


def get_dashboard_stats():
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) c FROM screenings").fetchone()["c"]

    by_risk = conn.execute("""
        SELECT risk_category, COUNT(*) c FROM screenings
        GROUP BY risk_category
    """).fetchall()

    by_day = conn.execute("""
        SELECT substr(created_at,1,10) day, COUNT(*) c
        FROM screenings GROUP BY day ORDER BY day ASC LIMIT 30
    """).fetchall()

    by_occupation = conn.execute("""
        SELECT occupation_intensity, COUNT(*) c FROM screenings
        GROUP BY occupation_intensity
    """).fetchall()

    by_sex = conn.execute("""
        SELECT sex, COUNT(*) c FROM screenings GROUP BY sex
    """).fetchall()

    avg_row = conn.execute("""
        SELECT AVG(age) avg_age, AVG(pain_score) avg_pain,
               AVG(mobility_score) avg_mobility, AVG(bmi) avg_bmi
        FROM screenings
    """).fetchone()

    recent = conn.execute("""
        SELECT id, created_at, patient_name, risk_category, facility
        FROM screenings ORDER BY created_at DESC LIMIT 6
    """).fetchall()

    conn.close()
    return {
        "total": total,
        "by_risk": {r["risk_category"]: r["c"] for r in by_risk},
        "by_day": [{"day": r["day"], "count": r["c"]} for r in by_day],
        "by_occupation": {r["occupation_intensity"]: r["c"] for r in by_occupation},
        "by_sex": {r["sex"]: r["c"] for r in by_sex},
        "averages": dict(avg_row) if total else {},
        "recent": [dict(r) for r in recent],
    }
