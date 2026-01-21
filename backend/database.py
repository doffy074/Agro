import aiosqlite
import os
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "plantwise.db")


async def init_db():
    """Initialize the database with required tables"""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        # Users table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'farmer',
                isActive INTEGER DEFAULT 1,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        """)
        
        # Predictions table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                imageUrl TEXT NOT NULL,
                cropName TEXT NOT NULL,
                diseaseName TEXT NOT NULL,
                confidence REAL NOT NULL,
                status TEXT NOT NULL,
                treatments TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                isVerified INTEGER DEFAULT 0,
                verifiedBy TEXT,
                officerComments TEXT,
                isFlagged INTEGER DEFAULT 0,
                flagReason TEXT,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        """)
        
        # Audit logs table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                userName TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT,
                timestamp TEXT NOT NULL,
                ipAddress TEXT
            )
        """)
        
        # Notifications table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                isRead INTEGER DEFAULT 0,
                createdAt TEXT NOT NULL,
                link TEXT,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        """)
        
        await db.commit()
        
        # Create default admin if not exists
        cursor = await db.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        admin_count = (await cursor.fetchone())[0]
        
        if admin_count == 0:
            import bcrypt
            import uuid
            
            admin_password = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
            now = datetime.utcnow().isoformat()
            
            await db.execute("""
                INSERT INTO users (id, email, name, password, role, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()),
                "admin@plantwise.ai",
                "System Admin",
                admin_password,
                "admin",
                1,
                now,
                now
            ))
            await db.commit()
            print("✅ Default admin user created: admin@plantwise.ai / admin123")


class Database:
    def __init__(self):
        self.db_path = DATABASE_PATH
    
    async def _get_connection(self):
        return await aiosqlite.connect(self.db_path)
    
    # User methods
    async def create_user(self, user: Dict[str, Any]) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO users (id, email, name, password, role, isActive, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user["id"],
                user["email"],
                user["name"],
                user["password"],
                user["role"],
                1 if user["isActive"] else 0,
                user["createdAt"],
                user["updatedAt"]
            ))
            await db.commit()
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = await cursor.fetchone()
            if row:
                return {
                    "id": row["id"],
                    "email": row["email"],
                    "name": row["name"],
                    "password": row["password"],
                    "role": row["role"],
                    "isActive": bool(row["isActive"]),
                    "createdAt": row["createdAt"],
                    "updatedAt": row["updatedAt"]
                }
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = await cursor.fetchone()
            if row:
                return {
                    "id": row["id"],
                    "email": row["email"],
                    "name": row["name"],
                    "password": row["password"],
                    "role": row["role"],
                    "isActive": bool(row["isActive"]),
                    "createdAt": row["createdAt"],
                    "updatedAt": row["updatedAt"]
                }
            return None
    
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            set_clauses = []
            values = []
            for key, value in updates.items():
                set_clauses.append(f"{key} = ?")
                if key == "isActive":
                    values.append(1 if value else 0)
                else:
                    values.append(value)
            values.append(user_id)
            
            query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = ?"
            await db.execute(query, values)
            await db.commit()
    
    async def delete_user(self, user_id: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM users WHERE id = ?", (user_id,))
            await db.commit()
    
    async def get_all_users(self, page: int, limit: int, role: Optional[str] = None) -> Tuple[List[Dict], int]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            offset = (page - 1) * limit
            
            if role:
                cursor = await db.execute(
                    "SELECT * FROM users WHERE role = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
                    (role, limit, offset)
                )
                count_cursor = await db.execute("SELECT COUNT(*) FROM users WHERE role = ?", (role,))
            else:
                cursor = await db.execute(
                    "SELECT * FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?",
                    (limit, offset)
                )
                count_cursor = await db.execute("SELECT COUNT(*) FROM users")
            
            rows = await cursor.fetchall()
            total = (await count_cursor.fetchone())[0]
            
            users = []
            for row in rows:
                users.append({
                    "id": row["id"],
                    "email": row["email"],
                    "name": row["name"],
                    "role": row["role"],
                    "isActive": bool(row["isActive"]),
                    "createdAt": row["createdAt"],
                    "updatedAt": row["updatedAt"]
                })
            
            return users, total
    
    # Prediction methods
    async def create_prediction(self, prediction: Dict[str, Any]) -> None:
        import json
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO predictions 
                (id, userId, imageUrl, cropName, diseaseName, confidence, status, treatments, createdAt, isVerified, verifiedBy, officerComments)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                prediction["id"],
                prediction["userId"],
                prediction["imageUrl"],
                prediction["cropName"],
                prediction["diseaseName"],
                prediction["confidence"],
                prediction["status"],
                json.dumps(prediction["treatments"]),
                prediction["createdAt"],
                1 if prediction["isVerified"] else 0,
                prediction["verifiedBy"],
                prediction["officerComments"]
            ))
            await db.commit()
    
    async def get_prediction(self, prediction_id: str) -> Optional[Dict[str, Any]]:
        import json
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM predictions WHERE id = ?", (prediction_id,))
            row = await cursor.fetchone()
            if row:
                return {
                    "id": row["id"],
                    "userId": row["userId"],
                    "imageUrl": row["imageUrl"],
                    "cropName": row["cropName"],
                    "diseaseName": row["diseaseName"],
                    "confidence": row["confidence"],
                    "status": row["status"],
                    "treatments": json.loads(row["treatments"]),
                    "createdAt": row["createdAt"],
                    "isVerified": bool(row["isVerified"]),
                    "verifiedBy": row["verifiedBy"],
                    "officerComments": row["officerComments"]
                }
            return None
    
    async def get_user_predictions(self, user_id: str, page: int, limit: int) -> Tuple[List[Dict], int]:
        import json
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            offset = (page - 1) * limit
            
            cursor = await db.execute(
                "SELECT * FROM predictions WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
                (user_id, limit, offset)
            )
            count_cursor = await db.execute("SELECT COUNT(*) FROM predictions WHERE userId = ?", (user_id,))
            
            rows = await cursor.fetchall()
            total = (await count_cursor.fetchone())[0]
            
            predictions = []
            for row in rows:
                predictions.append({
                    "id": row["id"],
                    "userId": row["userId"],
                    "imageUrl": row["imageUrl"],
                    "cropName": row["cropName"],
                    "diseaseName": row["diseaseName"],
                    "confidence": row["confidence"],
                    "status": row["status"],
                    "treatments": json.loads(row["treatments"]),
                    "createdAt": row["createdAt"],
                    "isVerified": bool(row["isVerified"]),
                    "verifiedBy": row["verifiedBy"],
                    "officerComments": row["officerComments"]
                })
            
            return predictions, total
    
    async def get_pending_reviews(self, page: int, limit: int) -> Tuple[List[Dict], int]:
        import json
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            offset = (page - 1) * limit
            
            cursor = await db.execute(
                "SELECT * FROM predictions WHERE isVerified = 0 AND isFlagged = 0 ORDER BY createdAt DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            count_cursor = await db.execute("SELECT COUNT(*) FROM predictions WHERE isVerified = 0 AND isFlagged = 0")
            
            rows = await cursor.fetchall()
            total = (await count_cursor.fetchone())[0]
            
            predictions = []
            for row in rows:
                predictions.append({
                    "id": row["id"],
                    "userId": row["userId"],
                    "imageUrl": row["imageUrl"],
                    "cropName": row["cropName"],
                    "diseaseName": row["diseaseName"],
                    "confidence": row["confidence"],
                    "status": row["status"],
                    "treatments": json.loads(row["treatments"]),
                    "createdAt": row["createdAt"],
                    "isVerified": bool(row["isVerified"]),
                    "verifiedBy": row["verifiedBy"],
                    "officerComments": row["officerComments"]
                })
            
            return predictions, total
    
    async def get_reviewed_predictions(self, page: int, limit: int) -> Tuple[List[Dict], int]:
        import json
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            offset = (page - 1) * limit
            
            cursor = await db.execute(
                "SELECT * FROM predictions WHERE isVerified = 1 ORDER BY createdAt DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            count_cursor = await db.execute("SELECT COUNT(*) FROM predictions WHERE isVerified = 1")
            
            rows = await cursor.fetchall()
            total = (await count_cursor.fetchone())[0]
            
            predictions = []
            for row in rows:
                predictions.append({
                    "id": row["id"],
                    "userId": row["userId"],
                    "imageUrl": row["imageUrl"],
                    "cropName": row["cropName"],
                    "diseaseName": row["diseaseName"],
                    "confidence": row["confidence"],
                    "status": row["status"],
                    "treatments": json.loads(row["treatments"]),
                    "createdAt": row["createdAt"],
                    "isVerified": bool(row["isVerified"]),
                    "verifiedBy": row["verifiedBy"],
                    "officerComments": row["officerComments"]
                })
            
            return predictions, total
    
    async def update_prediction(self, prediction_id: str, updates: Dict[str, Any]) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            set_clauses = []
            values = []
            for key, value in updates.items():
                set_clauses.append(f"{key} = ?")
                if key == "isVerified":
                    values.append(1 if value else 0)
                else:
                    values.append(value)
            values.append(prediction_id)
            
            query = f"UPDATE predictions SET {', '.join(set_clauses)} WHERE id = ?"
            await db.execute(query, values)
            await db.commit()
    
    async def flag_prediction(self, prediction_id: str, reason: str, flagged_by: str) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE predictions SET isFlagged = 1, flagReason = ? WHERE id = ?",
                (reason, prediction_id)
            )
            await db.commit()
    
    # Audit log methods
    async def create_audit_log(self, log: Dict[str, Any]) -> None:
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO audit_logs (id, userId, userName, action, details, timestamp, ipAddress)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                log["id"],
                log["userId"],
                log["userName"],
                log["action"],
                log.get("details"),
                log["timestamp"],
                log.get("ipAddress")
            ))
            await db.commit()
    
    async def get_audit_logs(self, page: int, limit: int) -> Tuple[List[Dict], int]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            offset = (page - 1) * limit
            
            cursor = await db.execute(
                "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?",
                (limit, offset)
            )
            count_cursor = await db.execute("SELECT COUNT(*) FROM audit_logs")
            
            rows = await cursor.fetchall()
            total = (await count_cursor.fetchone())[0]
            
            logs = []
            for row in rows:
                logs.append({
                    "id": row["id"],
                    "userId": row["userId"],
                    "userName": row["userName"],
                    "action": row["action"],
                    "details": row["details"],
                    "timestamp": row["timestamp"],
                    "ipAddress": row["ipAddress"]
                })
            
            return logs, total
    
    # Statistics methods
    async def get_system_metrics(self) -> Dict[str, Any]:
        async with aiosqlite.connect(self.db_path) as db:
            # User counts
            cursor = await db.execute("SELECT COUNT(*) FROM users")
            total_users = (await cursor.fetchone())[0]
            
            cursor = await db.execute("SELECT COUNT(*) FROM users WHERE role = 'farmer'")
            total_farmers = (await cursor.fetchone())[0]
            
            cursor = await db.execute("SELECT COUNT(*) FROM users WHERE role = 'officer'")
            total_officers = (await cursor.fetchone())[0]
            
            cursor = await db.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
            total_admins = (await cursor.fetchone())[0]
            
            # Prediction counts
            cursor = await db.execute("SELECT COUNT(*) FROM predictions")
            total_predictions = (await cursor.fetchone())[0]
            
            cursor = await db.execute("SELECT COUNT(*) FROM predictions WHERE isVerified = 1")
            verified_predictions = (await cursor.fetchone())[0]
            
            cursor = await db.execute("SELECT COUNT(*) FROM predictions WHERE isVerified = 0 AND isFlagged = 0")
            pending_reviews = (await cursor.fetchone())[0]
            
            # Calculate accuracy (mock for now)
            accuracy_rate = 95.2 if total_predictions > 0 else 0
            
            return {
                "totalUsers": total_users,
                "totalFarmers": total_farmers,
                "totalOfficers": total_officers,
                "totalAdmins": total_admins,
                "totalPredictions": total_predictions,
                "accuracyRate": accuracy_rate,
                "verifiedPredictions": verified_predictions,
                "pendingReviews": pending_reviews
            }
    
    async def get_officer_statistics(self) -> Dict[str, Any]:
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT COUNT(*) FROM predictions WHERE isVerified = 1")
            total_reviewed = (await cursor.fetchone())[0]
            
            # Get stats by crop
            cursor = await db.execute("""
                SELECT cropName, COUNT(*) as count
                FROM predictions
                GROUP BY cropName
            """)
            rows = await cursor.fetchall()
            
            by_crop = []
            for row in rows:
                by_crop.append({
                    "crop": row[0],
                    "count": row[1],
                    "accuracy": 92.5  # Mock accuracy
                })
            
            return {
                "totalReviewed": total_reviewed,
                "accuracyRate": 95.2,
                "byCrop": by_crop
            }
