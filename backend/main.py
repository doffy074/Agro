from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum
import jwt
import bcrypt
import uuid
import os
from contextlib import asynccontextmanager

# Import AI model and database modules
from database import Database, init_db
from ai_model import PlantDiseaseModel

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
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
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

class VerifyPrediction(BaseModel):
    isCorrect: bool
    comments: str
    correctedDisease: Optional[str] = None

class FlagPrediction(BaseModel):
    reason: str

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
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "user_login",
        "details": f"User logged in",
        "timestamp": datetime.utcnow().isoformat()
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
            "createdAt": user["createdAt"],
            "updatedAt": user["updatedAt"]
        }
    }

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
    
    # Run AI prediction
    prediction_result = model.predict(image_path, cropType)
    
    now = datetime.utcnow().isoformat()
    prediction = {
        "id": image_id,
        "userId": user["id"],
        "imageUrl": f"/uploads/{image_id}_{image.filename}",
        "cropName": prediction_result["crop_name"],
        "diseaseName": prediction_result["disease_name"],
        "confidence": prediction_result["confidence"],
        "status": prediction_result["status"],
        "treatments": prediction_result["treatments"],
        "createdAt": now,
        "isVerified": False,
        "verifiedBy": None,
        "officerComments": None
    }
    
    await db.create_prediction(prediction)
    
    return {
        "success": True,
        "data": prediction
    }

@app.get("/api/predictions", response_model=dict)
async def get_predictions(
    page: int = 1,
    limit: int = 10,
    user: dict = Depends(get_current_user)
):
    predictions, total = await db.get_user_predictions(user["id"], page, limit)
    return {
        "success": True,
        "data": {
            "predictions": predictions,
            "total": total
        }
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
        "officerComments": data.comments
    }
    
    if not data.isCorrect and data.correctedDisease:
        updates["diseaseName"] = data.correctedDisease
    
    await db.update_prediction(id, updates)
    
    # Log audit
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "prediction_verified",
        "details": f"Prediction {id} verified. Correct: {data.isCorrect}",
        "timestamp": datetime.utcnow().isoformat()
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
    await db.update_user(id, {"role": data.role.value, "updatedAt": datetime.utcnow().isoformat()})
    
    # Log audit - role changes are important!
    await db.create_audit_log({
        "id": str(uuid.uuid4()),
        "userId": user["id"],
        "userName": user["name"],
        "action": "role_change",
        "details": f"Changed role for {target_user['name']} from {old_role} to {data.role.value}",
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
    return {
        "success": True,
        "data": {
            "name": "plant_disease_model",
            "version": "v1.0.0",
            "accuracy": model.accuracy if model else 0,
            "lastTrained": "2024-01-15T00:00:00Z",
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

# Crops Endpoints
@app.get("/api/crops", response_model=dict)
async def get_crops():
    crops = [
        {"id": "tomato", "name": "Tomato"},
        {"id": "potato", "name": "Potato"},
        {"id": "corn", "name": "Corn / Maize"},
        {"id": "apple", "name": "Apple"},
        {"id": "grape", "name": "Grape"},
        {"id": "pepper", "name": "Pepper"},
        {"id": "strawberry", "name": "Strawberry"},
        {"id": "cherry", "name": "Cherry"},
        {"id": "peach", "name": "Peach"},
    ]
    return {
        "success": True,
        "data": {"crops": crops}
    }

# Static files for uploads
from fastapi.staticfiles import StaticFiles
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
