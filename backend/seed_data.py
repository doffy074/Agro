"""
Seed script: populates all tables with sample data.
Feedback table will have 20 entries → 19 correct + 1 incorrect = 95% accuracy.
"""
import sqlite3
import uuid
import bcrypt
from datetime import datetime, timedelta
import json
import random
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "plantwise.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

now = datetime.utcnow()


def ts(days_ago=0, hours_ago=0):
    return (now - timedelta(days=days_ago, hours=hours_ago)).isoformat()


def uid():
    return str(uuid.uuid4())


# ─── Existing user IDs ───
ADMIN_ID = "1103a6ef-f22e-42a7-b893-d5d1192ff5dc"
OFFICER_ID = "7a70d45c-8167-493c-a7e4-9af4c4e30d89"
FARMER1_ID = "29287a60-3043-441f-801c-e335d2ae5bb2"

# ─── New users ───
FARMER2_ID = uid()
FARMER3_ID = uid()
OFFICER2_ID = uid()

new_users = [
    (FARMER2_ID, "john@farm.com", "John Mwangi", bcrypt.hashpw("farmer123".encode(), bcrypt.gensalt()).decode(), "farmer", "0712345678", "Nakuru", 1, ts(30), ts(2)),
    (FARMER3_ID, "amina@farm.com", "Amina Osei", bcrypt.hashpw("farmer123".encode(), bcrypt.gensalt()).decode(), "farmer", "0723456789", "Kisumu", 1, ts(25), ts(1)),
    (OFFICER2_ID, "grace@gov.ke", "Grace Wanjiku", bcrypt.hashpw("officer123".encode(), bcrypt.gensalt()).decode(), "officer", "0734567890", "Nairobi", 1, ts(20), ts(0)),
]

for u in new_users:
    try:
        c.execute(
            "INSERT INTO users (id, email, name, password, role, phone, location, isActive, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
            u,
        )
    except sqlite3.IntegrityError:
        print(f"  User {u[1]} already exists, skipping.")

print(f"✅ Added {len(new_users)} new users")

# ─── New predictions (15 more to give us 20 total) ───
CROPS = [
    ("Tomato", "Early Blight", "diseased"),
    ("Tomato", "Late Blight", "diseased"),
    ("Tomato", "Healthy", "healthy"),
    ("Potato", "Early Blight", "diseased"),
    ("Potato", "Late Blight", "diseased"),
    ("Corn", "Common Rust", "diseased"),
    ("Corn", "Northern Leaf Blight", "diseased"),
    ("Corn", "Healthy", "healthy"),
    ("Apple", "Cedar Apple Rust", "diseased"),
    ("Apple", "Healthy", "healthy"),
    ("Grape", "Black Rot", "diseased"),
    ("Grape", "Healthy", "healthy"),
    ("Rice", "Brown Spot", "diseased"),
    ("Rice", "Leaf Blast", "diseased"),
    ("Rice", "Healthy", "healthy"),
]

TREATMENTS = {
    "diseased": {
        "organic": [
            "Apply neem oil spray (2-3ml per liter of water)",
            "Use compost tea as foliar spray weekly",
            "Introduce beneficial insects like ladybugs",
            "Apply baking soda solution (1 tbsp per gallon)",
        ],
        "chemical": [
            "Apply Mancozeb fungicide as per label instructions",
            "Use Chlorothalonil-based spray every 7-10 days",
            "Apply copper-based fungicide during early stages",
        ],
        "preventive": [
            "Ensure proper spacing between plants for air circulation",
            "Water at the base of plants to keep foliage dry",
            "Remove and destroy affected plant debris",
            "Rotate crops annually to prevent soil-borne diseases",
            "Monitor plants regularly for early signs of infection",
        ],
    },
    "healthy": {
        "organic": [
            "Continue regular composting and mulching",
            "Apply organic fertilizer monthly",
            "Use neem oil as preventive spray bi-weekly",
        ],
        "chemical": [
            "No chemical treatment needed for healthy plants",
        ],
        "preventive": [
            "Maintain regular watering schedule",
            "Monitor for early signs of disease",
            "Ensure adequate sunlight exposure",
            "Practice crop rotation each season",
        ],
    },
}

farmer_ids = [FARMER1_ID, FARMER2_ID, FARMER3_ID]
new_prediction_ids = []

for i, (crop, disease, status) in enumerate(CROPS):
    pid = uid()
    new_prediction_ids.append(pid)
    farmer = farmer_ids[i % len(farmer_ids)]
    confidence = round(random.uniform(75.0, 99.5), 2)
    is_verified = 1 if i < 10 else 0  # first 10 are verified
    verified_by = OFFICER_ID if is_verified else None
    comments = "Verified by agricultural officer." if is_verified else None

    c.execute(
        """INSERT INTO predictions
        (id, userId, imageUrl, cropName, diseaseName, confidence, status, treatments, createdAt, isVerified, verifiedBy, officerComments, isFlagged, flagReason)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            pid,
            farmer,
            f"/uploads/sample_{crop.lower()}_{i+1}.jpg",
            crop,
            disease,
            confidence,
            status,
            json.dumps(TREATMENTS[status]),
            ts(days_ago=15 - i, hours_ago=random.randint(0, 12)),
            is_verified,
            verified_by,
            comments,
            0,
            None,
        ),
    )

print(f"✅ Added {len(CROPS)} new predictions")

# ─── Feedback: 20 entries → 19 correct + 1 incorrect = 95% ───
# Use the 5 existing prediction IDs + 15 new ones = 20
existing_prediction_ids = [
    "047f9ad9-2dd7-402a-9e1f-95a6686ed905",
    "135e6adf-4fbd-4f0f-9bb5-ee7befb25e6e",
    "9fc483ae-ca62-428b-9493-b8b765d52f3a",
    "e7512285-cf02-461d-953e-02128502e4a1",
    "33e495b8-18f4-4c7b-b88a-f842dcf63f93",
]

all_pred_ids = existing_prediction_ids + new_prediction_ids  # 5 + 15 = 20

# 19 correct, 1 incorrect (the last one)
for i, pred_id in enumerate(all_pred_ids):
    correct = 1 if i < 19 else 0
    # feedback is from the farmer who owns the prediction
    if pred_id in existing_prediction_ids:
        if pred_id == "33e495b8-18f4-4c7b-b88a-f842dcf63f93":
            fb_user = FARMER1_ID
        else:
            fb_user = OFFICER_ID  # existing predictions belong to the officer
    else:
        fb_user = farmer_ids[(i - 5) % len(farmer_ids)]

    c.execute(
        "INSERT INTO feedback (id, predictionId, userId, correct, createdAt) VALUES (?,?,?,?,?)",
        (uid(), pred_id, fb_user, correct, ts(days_ago=14 - i if i < 14 else 0, hours_ago=random.randint(0, 8))),
    )

print("✅ Added 20 feedback entries (19 correct + 1 incorrect = 95.0%)")

# ─── Additional audit logs ───
actions = [
    ("user_login", "User logged in"),
    ("prediction_created", "New prediction submitted for Tomato"),
    ("prediction_feedback", "Feedback for prediction: correct"),
    ("prediction_verified", "Officer verified prediction"),
    ("role_change", "Changed user role from farmer to officer"),
    ("user_registered", "New user registered"),
    ("prediction_created", "New prediction submitted for Rice"),
    ("prediction_feedback", "Feedback for prediction: correct"),
    ("user_login", "Admin logged in"),
    ("prediction_created", "New prediction submitted for Corn"),
]

log_users = [
    (FARMER2_ID, "John Mwangi"),
    (FARMER3_ID, "Amina Osei"),
    (OFFICER2_ID, "Grace Wanjiku"),
    (OFFICER_ID, "Max"),
    (ADMIN_ID, "System Admin"),
]

for i, (action, details) in enumerate(actions):
    lu = log_users[i % len(log_users)]
    c.execute(
        "INSERT INTO audit_logs (id, userId, userName, action, details, timestamp, ipAddress) VALUES (?,?,?,?,?,?,?)",
        (uid(), lu[0], lu[1], action, details, ts(days_ago=10 - i if i < 10 else 0, hours_ago=random.randint(0, 6)), "127.0.0.1"),
    )

print(f"✅ Added {len(actions)} audit log entries")

# ─── Additional notifications ───
notif_data = [
    (FARMER2_ID, "prediction_ready", "Prediction Ready", "Your Tomato prediction is ready for review.", "/predictions/result/"),
    (FARMER3_ID, "prediction_ready", "Prediction Ready", "Your Rice prediction is ready for review.", "/predictions/result/"),
    (FARMER1_ID, "review_request", "Review Complete", "An officer has reviewed your Grape prediction.", "/predictions/result/"),
    (OFFICER_ID, "system_alert", "New Predictions", "5 new predictions are awaiting your review.", "/officer/reviews"),
    (OFFICER2_ID, "system_alert", "Welcome", "Welcome to PlantWise AI. You have been assigned as an agricultural officer.", "/officer"),
    (ADMIN_ID, "system_alert", "System Update", "System metrics have been updated.", "/admin/metrics"),
    (FARMER2_ID, "role_change", "Account Updated", "Your profile has been updated successfully.", "/profile"),
    (FARMER3_ID, "prediction_ready", "Prediction Ready", "Your Corn prediction is ready for review.", "/predictions/result/"),
]

for n in notif_data:
    c.execute(
        "INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt, link) VALUES (?,?,?,?,?,?,?,?)",
        (uid(), n[0], n[1], n[2], n[3], 0, ts(days_ago=random.randint(0, 7)), n[4]),
    )

print(f"✅ Added {len(notif_data)} notifications")

conn.commit()
conn.close()

# Verify
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
print("\n📊 Final table counts:")
for table in ["users", "predictions", "feedback", "audit_logs", "notifications"]:
    count = c.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    print(f"   {table}: {count}")

total_fb = c.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
correct_fb = c.execute("SELECT COUNT(*) FROM feedback WHERE correct = 1").fetchone()[0]
print(f"\n🎯 Accuracy: {correct_fb}/{total_fb} = {(correct_fb/total_fb)*100:.1f}%")
conn.close()
