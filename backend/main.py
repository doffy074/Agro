from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from enum import Enum
import jwt
import bcrypt
import uuid
import os
import io
import secrets
import hashlib
from contextlib import asynccontextmanager
from fpdf import FPDF

# Import AI model and database modules
from database import Database, init_db
from ai_model import PlantDiseaseModel
from groq_treatments import generate_treatments
from groq_chatbot import chat as chatbot_reply

# Initialize model
model = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, db
    # Load AI model and database on startup
    model = PlantDiseaseModel()
    db = Database()
    await init_db()
    yield
    # Cleanup on shutdown

app = FastAPI(
    title="PlantWise AI API",
    description="AI-based Plant Disease Prediction System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    farmer = "farmer"
    officer = "officer"
    admin = "admin"

class DiseaseStatus(str, Enum):
    healthy = "healthy"
    diseased = "diseased"

# Pydantic Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    isActive: bool
    createdAt: str
    updatedAt: str

class TokenResponse(BaseModel):
    user: UserResponse
    token: str

class RoleUpdate(BaseModel):
    role: UserRole

class StatusUpdate(BaseModel):
    isActive: bool

class Treatment(BaseModel):
    organic: List[str]
    chemical: List[str]
    preventive: List[str]

class PredictionResponse(BaseModel):
    id: str
    userId: str
    imageUrl: str
    cropName: str
    diseaseName: str
    confidence: float
    status: DiseaseStatus
    treatments: Treatment
    createdAt: str
    isVerified: bool
    verifiedBy: Optional[str] = None
    officerComments: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str

class FeedbackData(BaseModel):
    correct: bool

class VerifyPrediction(BaseModel):
    isCorrect: bool
    comments: str
    correctedDisease: Optional[str] = None

class FlagPrediction(BaseModel):
    reason: str

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    newPassword: str

class EmailVerifyRequest(BaseModel):
    token: str

class TreatmentSuggestion(BaseModel):
    organic: Optional[List[str]] = None
    chemical: Optional[List[str]] = None
    preventive: Optional[List[str]] = None

class SystemMetrics(BaseModel):
    totalUsers: int
    totalFarmers: int
    totalOfficers: int
    totalAdmins: int
    totalPredictions: int
    accuracyRate: float
    verifiedPredictions: int
    pendingReviews: int

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = await db.get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user["isActive"]:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user

def require_role(allowed_roles: List[UserRole]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in [r.value for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ============================================================
# Health Check
# ============================================================
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_active": model.is_active if model else False
    }

# Auth Endpoints
@app.post("/api/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user with default role: farmer
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    now = datetime.utcnow().isoformat()
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "role": UserRole.farmer.value,  # Default role is FARMER
        "isActive": True,
        "createdAt": now,
        "updatedAt": now
    }
    
    await db.create_user(user)
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "userName": user_data.name,
        "action": "user_register",
        "details": f"New user registered with email {user_data.email}. Default role: farmer",
        "timestamp": now
    })
    
    # Welcome notification
    await db.create_notification({
        "id": str(uuid.uuid4()),
        "userId": user_id,
        "type": "system_alert",
        "title": "Welcome to PlantWise AI!",
        "message": "Start by uploading a plant image for disease detection. Our AI will analyze your plant and provide detailed results.",
        "createdAt": now,
        "link": "/upload"
    })
    
    token = create_token(user_id, user["role"])
    
    return {
        "success": True,
        "data": {
            "user": {
                "id": user_id,
                "email": user_data.email,
                "name": user_data.name,
                "role": user["role"],
                "isActive": True,
                "createdAt": now,
                "updatedAt": now
            },
            "token": token
        }
    }

@app.post("/api/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user["isActive"]:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    token = create_token(user["id"], user["role"])
    
    now = datetime.utcnow().isoformat()
    
    # Seed welcome notification for users who have none
    existing_notifs, _, _ = await db.get_user_notifications(user["id"], 1, 1)
    if len(existing_notifs) == 0:
        await db.create_notification({
            "id": str(uuid.uuid4()),
            "userId": user["id"],
            "type": "system_alert",
            "title": "Welcome to PlantWise AI!",
            "message": "Start by uploading a plant image for disease detection. Our AI will analyze your plant and provide detailed results.",
            "createdAt": now,
            "link": "/upload"
        })
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "user_login",
        "details": f"User logged in",
        "timestamp": now
    })
    
    return {
        "success": True,
        "data": {
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "isActive": user["isActive"],
                "createdAt": user["createdAt"],
                "updatedAt": user["updatedAt"]
            },
            "token": token
        }
    }

@app.post("/api/auth/logout", response_model=dict)
async def logout(user: dict = Depends(get_current_user)):
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "user_logout",
        "details": "User logged out",
        "timestamp": datetime.utcnow().isoformat()
    })
    return {"success": True, "message": "Logged out successfully"}

@app.get("/api/auth/me", response_model=dict)
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "isActive": user["isActive"],
            "phone": user.get("phone", ""),
            "location": user.get("location", ""),
            "createdAt": user["createdAt"],
            "updatedAt": user["updatedAt"]
        }
    }

@app.put("/api/auth/profile", response_model=dict)
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {"updatedAt": datetime.utcnow().isoformat()}
    if data.name is not None:
        updates["name"] = data.name
    if data.phone is not None:
        updates["phone"] = data.phone
    if data.location is not None:
        updates["location"] = data.location
    
    await db.update_user(user["id"], updates)
    updated_user = await db.get_user_by_id(user["id"])
    
    return {
        "success": True,
        "data": {
            "id": updated_user["id"],
            "email": updated_user["email"],
            "name": updated_user["name"],
            "role": updated_user["role"],
            "isActive": updated_user["isActive"],
            "phone": updated_user.get("phone", ""),
            "location": updated_user.get("location", ""),
            "createdAt": updated_user["createdAt"],
            "updatedAt": updated_user["updatedAt"]
        }
    }

@app.put("/api/auth/password", response_model=dict)
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    if not verify_password(data.currentPassword, user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(data.newPassword) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    
    new_hashed = hash_password(data.newPassword)
    await db.update_user(user["id"], {
        "password": new_hashed,
        "updatedAt": datetime.utcnow().isoformat()
    })
    
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "password_change",
        "details": "User changed their password",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": "Password changed successfully"}

# ============================================================
# Password Reset Endpoints
# ============================================================
@app.post("/api/auth/forgot-password", response_model=dict)
async def forgot_password(data: PasswordResetRequest):
    """Request a password reset. Generates a reset token."""
    user = await db.get_user_by_email(data.email)
    if not user:
        # Don't reveal whether email exists
        return {"success": True, "message": "If that email is registered, a reset link has been generated."}

    # Generate a reset token
    reset_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    await db.store_reset_token(user["id"], token_hash, expires)

    # In production you'd email this – for dev we return it directly
    return {
        "success": True,
        "message": "If that email is registered, a reset link has been generated.",
        "data": {"resetToken": reset_token, "expiresAt": expires}
    }

@app.post("/api/auth/reset-password", response_model=dict)
async def reset_password(data: PasswordResetConfirm):
    """Reset password using token from forgot-password."""
    if len(data.newPassword) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    token_hash = hashlib.sha256(data.token.encode()).hexdigest()
    record = await db.get_reset_token(token_hash)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Check expiry
    expires = datetime.fromisoformat(record["expiresAt"])
    aware_expires = expires.replace(tzinfo=timezone.utc) if expires.tzinfo is None else expires
    if datetime.now(timezone.utc) > aware_expires:
        await db.delete_reset_token(token_hash)
        raise HTTPException(status_code=400, detail="Reset token has expired")

    # Update password
    new_hashed = hash_password(data.newPassword)
    await db.update_user(record["userId"], {
        "password": new_hashed,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    })
    await db.delete_reset_token(token_hash)

    return {"success": True, "message": "Password has been reset successfully"}

# ============================================================
# Email Verification Endpoints
# ============================================================
@app.post("/api/auth/send-verification", response_model=dict)
async def send_verification_email(user: dict = Depends(get_current_user)):
    """Generate an email verification token."""
    if user.get("emailVerified"):
        return {"success": True, "message": "Email already verified"}

    verify_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(verify_token.encode()).hexdigest()
    expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    await db.store_verification_token(user["id"], token_hash, expires)

    # In production: send email. For dev: return token.
    return {
        "success": True,
        "message": "Verification email sent",
        "data": {"verificationToken": verify_token}
    }

@app.post("/api/auth/verify-email", response_model=dict)
async def verify_email(data: EmailVerifyRequest):
    """Verify email using the token."""
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()
    record = await db.get_verification_token(token_hash)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    expires = datetime.fromisoformat(record["expiresAt"])
    if datetime.now(timezone.utc) > expires.replace(tzinfo=timezone.utc) if expires.tzinfo is None else expires:
        await db.delete_verification_token(token_hash)
        raise HTTPException(status_code=400, detail="Verification token has expired")

    await db.update_user(record["userId"], {
        "emailVerified": True,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    })
    await db.delete_verification_token(token_hash)

    return {"success": True, "message": "Email verified successfully"}

# Prediction Endpoints
@app.post("/api/predictions/upload", response_model=dict)
async def upload_prediction(
    image: UploadFile = File(...),
    cropType: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    # Validate file type
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save image
    image_id = str(uuid.uuid4())
    image_path = f"uploads/{image_id}_{image.filename}"
    os.makedirs("uploads", exist_ok=True)
    
    with open(image_path, "wb") as f:
        content = await image.read()
        f.write(content)
    
    # Run AI prediction (both models in parallel, best confidence wins)
    prediction_result = await model.predict(image_path, cropType)
    
    # Generate treatments via Groq AI
    treatments = await generate_treatments(
        crop_name=prediction_result["crop_name"],
        disease_name=prediction_result["disease_name"],
        status=prediction_result["status"],
        confidence=prediction_result["confidence"],
    )
    
    now = datetime.utcnow().isoformat()
    prediction = {
        "id": image_id,
        "userId": user["id"],
        "imageUrl": f"/uploads/{image_id}_{image.filename}",
        "cropName": prediction_result["crop_name"],
        "diseaseName": prediction_result["disease_name"],
        "confidence": prediction_result["confidence"],
        "status": prediction_result["status"],
        "treatments": treatments,
        "createdAt": now,
        "isVerified": False,
        "verifiedBy": None,
        "officerComments": None
    }
    
    await db.create_prediction(prediction)
    
    # Notification: prediction ready
    await db.create_notification({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "type": "prediction_ready",
        "title": "Prediction Complete",
        "message": f"Your {prediction_result['crop_name']} analysis is ready. {'Disease detected: ' + prediction_result['disease_name'] if prediction_result['status'] == 'diseased' else 'Your plant looks healthy!'}" ,
        "createdAt": now,
        "link": f"/predictions/{image_id}"
    })
    
    return {
        "success": True,
        "data": prediction
    }

@app.get("/api/predictions", response_model=dict)
async def get_predictions(
    page: int = 1,
    limit: int = 10,
    crop: Optional[str] = None,
    disease: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    predictions, total = await db.get_user_predictions(
        user["id"], page, limit,
        crop=crop, disease=disease, status=status,
        date_from=date_from, date_to=date_to, search=search
    )
    return {
        "success": True,
        "data": {
            "predictions": predictions,
            "total": total
        }
    }

@app.get("/api/farmer/stats", response_model=dict)
async def get_farmer_stats(user: dict = Depends(get_current_user)):
    """Get statistics for the current farmer"""
    stats = await db.get_farmer_statistics(user["id"])
    return {
        "success": True,
        "data": stats
    }

@app.get("/api/predictions/{id}", response_model=dict)
async def get_prediction(id: str, user: dict = Depends(get_current_user)):
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Allow access if user owns it or is officer/admin
    if prediction["userId"] != user["id"] and user["role"] == "farmer":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "success": True,
        "data": prediction
    }

@app.get("/api/predictions/{id}/feedback", response_model=dict)
async def get_feedback(
    id: str,
    user: dict = Depends(get_current_user)
):
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    feedback = await db.get_feedback(id, user["id"])
    return {
        "success": True,
        "data": feedback
    }

@app.post("/api/predictions/{id}/feedback", response_model=dict)
async def submit_feedback(
    id: str,
    data: FeedbackData,
    user: dict = Depends(get_current_user)
):
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    if prediction["userId"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Store feedback
    await db.save_feedback(id, user["id"], data.correct)
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "prediction_feedback",
        "details": f"Feedback for prediction {id}: {'correct' if data.correct else 'incorrect'}",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": "Feedback submitted successfully"}

@app.delete("/api/predictions/{id}", response_model=dict)
async def delete_prediction(
    id: str,
    user: dict = Depends(get_current_user)
):
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Only owner or admin can delete
    if prediction["userId"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete image file if exists
    image_path = prediction["imageUrl"].lstrip("/")
    if os.path.exists(image_path):
        os.remove(image_path)
    
    await db.delete_prediction(id)
    
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "prediction_deleted",
        "details": f"Prediction {id} deleted",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": "Prediction deleted successfully"}

@app.get("/api/predictions/{id}/pdf")
async def download_prediction_pdf(
    id: str,
    user: dict = Depends(get_current_user)
):
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    if prediction["userId"] != user["id"] and user["role"] == "farmer":
        raise HTTPException(status_code=403, detail="Access denied")

    treatments = prediction["treatments"]

    # --- Generate real PDF with fpdf2 ---
    # Helper to sanitize text for latin-1 compatible Helvetica font
    def _safe(text: str) -> str:
        """Replace non-latin-1 characters so fpdf2 core fonts don't crash."""
        replacements = {
            '\u2013': '-', '\u2014': '-', '\u2018': "'", '\u2019': "'",
            '\u201c': '"', '\u201d': '"', '\u2026': '...', '\u2022': '-',
            '\u00b7': '-', '\u2010': '-', '\u2011': '-', '\u2012': '-',
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        # Drop any remaining non-latin-1 chars
        return text.encode('latin-1', errors='replace').decode('latin-1')

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pw = pdf.w - 2 * pdf.l_margin  # effective page width

    # Title
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(pw, 12, "PlantWise AI", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(pw, 6, "AI-based Plant Disease Detection System", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(6)

    # Separator
    pdf.set_draw_color(60, 120, 60)
    pdf.set_line_width(0.5)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(6)

    # Report info
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(pw, 8, "Disease Prediction Report", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(45, 7, "Report ID:")
    pdf.cell(pw - 45, 7, _safe(prediction["id"]), new_x="LMARGIN", new_y="NEXT")
    pdf.cell(45, 7, "Date:")
    pdf.cell(pw - 45, 7, _safe(prediction["createdAt"]), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Crop information
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(pw, 8, "Crop Information", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    for label, value in [
        ("Crop Name:", prediction["cropName"]),
        ("Disease:", prediction["diseaseName"]),
        ("Status:", prediction["status"].upper()),
        ("Confidence:", f"{prediction['confidence']:.1f}%"),
        ("Verified:", "Yes" if prediction["isVerified"] else "Pending"),
    ]:
        pdf.cell(45, 7, label)
        pdf.cell(pw - 45, 7, _safe(str(value)), new_x="LMARGIN", new_y="NEXT")

    if prediction.get("officerComments"):
        pdf.cell(45, 7, "Officer Comments:")
        pdf.multi_cell(pw - 45, 7, _safe(prediction["officerComments"]), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Treatment sections
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(pw, 8, "Treatment Recommendations", new_x="LMARGIN", new_y="NEXT")

    for section_title, items in [
        ("Organic Treatments", treatments.get("organic", [])),
        ("Chemical Treatments", treatments.get("chemical", [])),
        ("Preventive Measures", treatments.get("preventive", [])),
    ]:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(pw, 7, section_title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        if items:
            for item in items:
                pdf.set_x(pdf.l_margin)
                pdf.multi_cell(pw, 6, _safe(f"  - {item}"), new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.cell(pw, 6, "  N/A", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    # Footer line
    pdf.ln(4)
    pdf.set_draw_color(60, 120, 60)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(pw, 5, "Generated by PlantWise AI", new_x="LMARGIN", new_y="NEXT", align="C")

    pdf_bytes = pdf.output()

    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="prediction-report-{id}.pdf"'
        }
    )

# Officer Endpoints
@app.get("/api/officer/reviews", response_model=dict)
async def get_pending_reviews(
    page: int = 1,
    limit: int = 10,
    user: dict = Depends(require_role([UserRole.officer, UserRole.admin]))
):
    predictions, total = await db.get_pending_reviews(page, limit)
    return {
        "success": True,
        "data": {
            "predictions": predictions,
            "total": total
        }
    }

@app.get("/api/officer/reviewed", response_model=dict)
async def get_reviewed_predictions(
    page: int = 1,
    limit: int = 10,
    user: dict = Depends(require_role([UserRole.officer, UserRole.admin]))
):
    predictions, total = await db.get_reviewed_predictions(page, limit)
    return {
        "success": True,
        "data": {
            "predictions": predictions,
            "total": total
        }
    }

@app.post("/api/officer/verify/{id}", response_model=dict)
async def verify_prediction(
    id: str,
    data: VerifyPrediction,
    user: dict = Depends(require_role([UserRole.officer, UserRole.admin]))
):
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    updates = {
        "isVerified": True,
        "verifiedBy": user["id"],
        "officerComments": data.comments,
        "verifiedAt": datetime.utcnow().isoformat()
    }
    
    if not data.isCorrect and data.correctedDisease:
        updates["diseaseName"] = data.correctedDisease
    
    await db.update_prediction(id, updates)
    
    now = datetime.utcnow().isoformat()
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "prediction_verified",
        "details": f"Prediction {id} verified. Correct: {data.isCorrect}",
        "timestamp": now
    })
    
    # Notify the farmer that their prediction was reviewed
    await db.create_notification({
        "id": str(uuid.uuid4()),
        "userId": prediction["userId"],
        "type": "review_request",
        "title": "Expert Review Available",
        "message": f"An agricultural officer has reviewed your {prediction['cropName']} prediction and provided feedback.",
        "createdAt": now,
        "link": f"/predictions/{id}"
    })
    
    updated = await db.get_prediction(id)
    return {
        "success": True,
        "data": updated
    }

@app.post("/api/officer/flag/{id}", response_model=dict)
async def flag_prediction(
    id: str,
    data: FlagPrediction,
    user: dict = Depends(require_role([UserRole.officer, UserRole.admin]))
):
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    await db.flag_prediction(id, data.reason, user["id"])
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "prediction_flagged",
        "details": f"Prediction {id} flagged. Reason: {data.reason}",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": "Prediction flagged successfully"}

@app.post("/api/officer/treatments/{id}", response_model=dict)
async def add_treatment_suggestion(
    id: str,
    data: TreatmentSuggestion,
    user: dict = Depends(require_role([UserRole.officer, UserRole.admin]))
):
    """Officer can add additional treatment suggestions to a prediction."""
    prediction = await db.get_prediction(id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    import json
    current = prediction["treatments"]
    if data.organic:
        current.setdefault("organic", []).extend(data.organic)
    if data.chemical:
        current.setdefault("chemical", []).extend(data.chemical)
    if data.preventive:
        current.setdefault("preventive", []).extend(data.preventive)

    await db.update_prediction(id, {"treatments": json.dumps(current)})

    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "treatment_added",
        "details": f"Officer added treatment suggestions to prediction {id}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    updated = await db.get_prediction(id)
    return {"success": True, "data": updated}

@app.get("/api/officer/statistics", response_model=dict)
async def get_officer_statistics(
    user: dict = Depends(require_role([UserRole.officer, UserRole.admin]))
):
    stats = await db.get_officer_statistics()
    return {
        "success": True,
        "data": stats
    }

# Admin Endpoints
@app.get("/api/admin/metrics", response_model=dict)
async def get_metrics(user: dict = Depends(require_role([UserRole.admin]))):
    metrics = await db.get_system_metrics()
    return {
        "success": True,
        "data": metrics
    }

@app.get("/api/admin/users", response_model=dict)
async def get_users(
    page: int = 1,
    limit: int = 10,
    role: Optional[str] = None,
    user: dict = Depends(require_role([UserRole.admin]))
):
    users, total = await db.get_all_users(page, limit, role)
    return {
        "success": True,
        "data": {
            "users": users,
            "total": total
        }
    }

@app.get("/api/admin/users/{id}", response_model=dict)
async def get_user_detail(
    id: str,
    user: dict = Depends(require_role([UserRole.admin]))
):
    """Get a single user by ID."""
    target_user = await db.get_user_by_id(id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "data": {
            "id": target_user["id"],
            "email": target_user["email"],
            "name": target_user["name"],
            "role": target_user["role"],
            "isActive": target_user["isActive"],
            "phone": target_user.get("phone", ""),
            "location": target_user.get("location", ""),
            "createdAt": target_user["createdAt"],
            "updatedAt": target_user["updatedAt"]
        }
    }

@app.put("/api/admin/users/{id}/role", response_model=dict)
async def update_user_role(
    id: str,
    data: RoleUpdate,
    user: dict = Depends(require_role([UserRole.admin]))
):
    target_user = await db.get_user_by_id(id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_role = target_user["role"]
    now = datetime.utcnow().isoformat()
    await db.update_user(id, {"role": data.role.value, "updatedAt": now})
    
    # Log audit - role changes are important!
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "role_change",
        "details": f"Changed role for {target_user['name']} from {old_role} to {data.role.value}",
        "timestamp": now
    })
    
    # Notify the affected user about role change
    await db.create_notification({
        "id": str(uuid.uuid4()),
        "userId": id,
        "type": "role_change",
        "title": "Role Updated",
        "message": f"Your role has been changed from {old_role} to {data.role.value} by an administrator.",
        "createdAt": now,
        "link": "/dashboard"
    })
    
    updated_user = await db.get_user_by_id(id)
    return {
        "success": True,
        "data": {
            "id": updated_user["id"],
            "email": updated_user["email"],
            "name": updated_user["name"],
            "role": updated_user["role"],
            "isActive": updated_user["isActive"],
            "createdAt": updated_user["createdAt"],
            "updatedAt": updated_user["updatedAt"]
        }
    }

@app.put("/api/admin/users/{id}/status", response_model=dict)
async def toggle_user_status(
    id: str,
    data: StatusUpdate,
    user: dict = Depends(require_role([UserRole.admin]))
):
    target_user = await db.get_user_by_id(id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.update_user(id, {"isActive": data.isActive, "updatedAt": datetime.utcnow().isoformat()})
    
    # Log audit
    action = "user_activated" if data.isActive else "user_deactivated"
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": action,
        "details": f"User {target_user['name']} {'activated' if data.isActive else 'deactivated'}",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    updated_user = await db.get_user_by_id(id)
    return {
        "success": True,
        "data": {
            "id": updated_user["id"],
            "email": updated_user["email"],
            "name": updated_user["name"],
            "role": updated_user["role"],
            "isActive": updated_user["isActive"],
            "createdAt": updated_user["createdAt"],
            "updatedAt": updated_user["updatedAt"]
        }
    }

@app.delete("/api/admin/users/{id}", response_model=dict)
async def delete_user(
    id: str,
    user: dict = Depends(require_role([UserRole.admin]))
):
    target_user = await db.get_user_by_id(id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    await db.delete_user(id)
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "user_deleted",
        "details": f"User {target_user['name']} ({target_user['email']}) deleted",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": "User deleted successfully"}

@app.get("/api/admin/audit-logs", response_model=dict)
async def get_audit_logs(
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(require_role([UserRole.admin]))
):
    logs, total = await db.get_audit_logs(page, limit)
    return {
        "success": True,
        "data": {
            "logs": logs,
            "total": total
        }
    }

@app.get("/api/admin/model", response_model=dict)
async def get_model_info(user: dict = Depends(require_role([UserRole.admin]))):
    models = []
    if model:
        models.append({
            "name": "plant_disease_model.pt",
            "displayName": "PyTorch ResNet-50 Model",
            "type": "PyTorch",
            "version": "v1.0.0",
            "accuracy": 95.2,
            "lastTrained": "2024-01-15T00:00:00Z",
            "isActive": model.is_active and model.pt_model is not None,
            "isLoaded": model.pt_model is not None
        })
        models.append({
            "name": "plant_disease_model.h5",
            "displayName": "TensorFlow CNN Model",
            "type": "TensorFlow / Keras",
            "version": "v1.0.0",
            "accuracy": 93.8,
            "lastTrained": "2024-01-10T00:00:00Z",
            "isActive": model.is_active and model.tf_model is not None,
            "isLoaded": model.tf_model is not None
        })
    return {
        "success": True,
        "data": {
            "models": models,
            "isActive": model.is_active if model else False
        }
    }

@app.post("/api/admin/model/toggle", response_model=dict)
async def toggle_model(
    data: StatusUpdate,
    user: dict = Depends(require_role([UserRole.admin]))
):
    global model
    if model:
        model.is_active = data.isActive
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "model_toggled",
        "details": f"AI model {'activated' if data.isActive else 'deactivated'}",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    return {"success": True, "message": f"Model {'activated' if data.isActive else 'deactivated'}"}

# ============================================================
# Avatar Upload Endpoint
# ============================================================
@app.post("/api/auth/avatar", response_model=dict)
async def upload_avatar(
    avatar: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload a user avatar image."""
    if not avatar.content_type or not avatar.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Limit to 2MB
    content = await avatar.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar must be under 2MB")

    avatar_id = str(uuid.uuid4())
    ext = os.path.splitext(avatar.filename or "img.png")[1] or ".png"
    avatar_path = f"uploads/avatars/{avatar_id}{ext}"
    os.makedirs("uploads/avatars", exist_ok=True)

    with open(avatar_path, "wb") as f:
        f.write(content)

    avatar_url = f"/{avatar_path}"
    await db.update_user(user["id"], {"avatar": avatar_url, "updatedAt": datetime.now(timezone.utc).isoformat()})

    return {"success": True, "data": {"avatar": avatar_url}}

# Crops Endpoints
CROPS_DATA = {
    "tomato": {
        "id": "tomato", "name": "Tomato",
        "diseases": [
            {"id": "tomato_bacterial_spot", "name": "Bacterial Spot"},
            {"id": "tomato_early_blight", "name": "Early Blight"},
            {"id": "tomato_late_blight", "name": "Late Blight"},
            {"id": "tomato_leaf_mold", "name": "Leaf Mold"},
            {"id": "tomato_septoria_leaf_spot", "name": "Septoria Leaf Spot"},
            {"id": "tomato_spider_mites", "name": "Spider Mites"},
            {"id": "tomato_target_spot", "name": "Target Spot"},
            {"id": "tomato_yellow_leaf_curl", "name": "Yellow Leaf Curl Virus"},
            {"id": "tomato_mosaic_virus", "name": "Mosaic Virus"},
            {"id": "tomato_healthy", "name": "Healthy"},
        ]
    },
    "potato": {
        "id": "potato", "name": "Potato",
        "diseases": [
            {"id": "potato_early_blight", "name": "Early Blight"},
            {"id": "potato_late_blight", "name": "Late Blight"},
            {"id": "potato_healthy", "name": "Healthy"},
        ]
    },
    "corn": {
        "id": "corn", "name": "Corn / Maize",
        "diseases": [
            {"id": "corn_cercospora", "name": "Cercospora Leaf Spot / Gray Leaf Spot"},
            {"id": "corn_common_rust", "name": "Common Rust"},
            {"id": "corn_northern_leaf_blight", "name": "Northern Leaf Blight"},
            {"id": "corn_healthy", "name": "Healthy"},
        ]
    },
    "apple": {
        "id": "apple", "name": "Apple",
        "diseases": [
            {"id": "apple_scab", "name": "Apple Scab"},
            {"id": "apple_black_rot", "name": "Black Rot"},
            {"id": "apple_cedar_rust", "name": "Cedar Apple Rust"},
            {"id": "apple_healthy", "name": "Healthy"},
        ]
    },
    "grape": {
        "id": "grape", "name": "Grape",
        "diseases": [
            {"id": "grape_black_rot", "name": "Black Rot"},
            {"id": "grape_esca", "name": "Esca (Black Measles)"},
            {"id": "grape_leaf_blight", "name": "Leaf Blight (Isariopsis)"},
            {"id": "grape_healthy", "name": "Healthy"},
        ]
    },
    "pepper": {
        "id": "pepper", "name": "Pepper",
        "diseases": [
            {"id": "pepper_bacterial_spot", "name": "Bacterial Spot"},
            {"id": "pepper_healthy", "name": "Healthy"},
        ]
    },
    "strawberry": {
        "id": "strawberry", "name": "Strawberry",
        "diseases": [
            {"id": "strawberry_leaf_scorch", "name": "Leaf Scorch"},
            {"id": "strawberry_healthy", "name": "Healthy"},
        ]
    },
    "cherry": {
        "id": "cherry", "name": "Cherry",
        "diseases": [
            {"id": "cherry_powdery_mildew", "name": "Powdery Mildew"},
            {"id": "cherry_healthy", "name": "Healthy"},
        ]
    },
    "peach": {
        "id": "peach", "name": "Peach",
        "diseases": [
            {"id": "peach_bacterial_spot", "name": "Bacterial Spot"},
            {"id": "peach_healthy", "name": "Healthy"},
        ]
    },
}

@app.get("/api/crops", response_model=dict)
async def get_crops():
    crops = [{"id": c["id"], "name": c["name"]} for c in CROPS_DATA.values()]
    return {"success": True, "data": {"crops": crops}}

@app.get("/api/crops/{crop_id}", response_model=dict)
async def get_crop(crop_id: str):
    """Get a single crop with its known diseases."""
    crop = CROPS_DATA.get(crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return {"success": True, "data": crop}

# Notification Endpoints
@app.get("/api/notifications", response_model=dict)
async def get_notifications(
    page: int = 1,
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    notifications, total, unread_count = await db.get_user_notifications(user["id"], page, limit)
    return {
        "success": True,
        "data": {
            "notifications": notifications,
            "total": total,
            "unreadCount": unread_count
        }
    }

@app.put("/api/notifications/{id}/read", response_model=dict)
async def mark_notification_read(
    id: str,
    user: dict = Depends(get_current_user)
):
    await db.mark_notification_read(id, user["id"])
    return {"success": True, "message": "Notification marked as read"}

@app.put("/api/notifications/read-all", response_model=dict)
async def mark_all_notifications_read(
    user: dict = Depends(get_current_user)
):
    await db.mark_all_notifications_read(user["id"])
    return {"success": True, "message": "All notifications marked as read"}

@app.delete("/api/notifications/{id}", response_model=dict)
async def delete_notification(
    id: str,
    user: dict = Depends(get_current_user)
):
    await db.delete_notification(id, user["id"])
    return {"success": True, "message": "Notification deleted"}

# Chatbot Endpoint
@app.post("/api/chatbot", response_model=dict)
async def chatbot_endpoint(
    body: ChatRequest,
    user: dict = Depends(get_current_user)
):
    """AI-powered agricultural chatbot available to all authenticated users."""
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    result = await chatbot_reply(messages, user_name=user.get("name"))
    return {
        "success": result["success"],
        "data": {
            "reply": result["reply"]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
