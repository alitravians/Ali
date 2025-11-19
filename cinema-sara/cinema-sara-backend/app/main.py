from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import random
import string

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

movies_db = []
bookings_db = []
access_codes_db = []
active_sessions_db = []
app_settings_db = {
    "is_app_open": True,
    "closed_message_ar": "التطبيق مغلق حالياً. يرجى المحاولة لاحقاً."
}

class Movie(BaseModel):
    id: Optional[int] = None
    title_ar: str
    description_ar: str
    video_url: str
    thumbnail_url: str
    duration: int
    genre: str
    created_at: Optional[datetime] = None

class BookingRequest(BaseModel):
    user_name: str
    user_email: Optional[str] = None
    user_discord: Optional[str] = None
    user_instagram: Optional[str] = None
    movie_id: int
    requested_time: str

class Booking(BaseModel):
    id: Optional[int] = None
    user_name: str
    user_email: Optional[str] = None
    user_discord: Optional[str] = None
    user_instagram: Optional[str] = None
    movie_id: int
    requested_time: str
    status: str
    access_code: Optional[str] = None
    created_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

class AccessCode(BaseModel):
    id: Optional[int] = None
    code: str
    booking_id: int
    max_users: int = 5
    current_users: int = 0
    expires_at: datetime
    created_at: Optional[datetime] = None

class ActiveSession(BaseModel):
    id: Optional[int] = None
    code: str
    user_identifier: str
    joined_at: Optional[datetime] = None
    is_active: bool = True

class AppSettings(BaseModel):
    is_app_open: bool
    closed_message_ar: str

class AdminLogin(BaseModel):
    code: str

class BookingApproval(BaseModel):
    booking_id: int
    approved: bool

class CodeLogin(BaseModel):
    code: str

def generate_access_code(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def get_next_id(db_list):
    if not db_list:
        return 1
    return max(item.get('id', 0) for item in db_list) + 1

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/app-settings")
async def get_app_settings():
    return app_settings_db

@app.get("/api/movies")
async def get_movies():
    return movies_db

@app.get("/api/movies/{movie_id}")
async def get_movie(movie_id: int):
    movie = next((m for m in movies_db if m['id'] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@app.post("/api/bookings")
async def create_booking(booking: BookingRequest):
    if not app_settings_db["is_app_open"]:
        raise HTTPException(status_code=403, detail=app_settings_db["closed_message_ar"])
    
    movie = next((m for m in movies_db if m['id'] == booking.movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    new_booking = {
        "id": get_next_id(bookings_db),
        "user_name": booking.user_name,
        "user_email": booking.user_email,
        "user_discord": booking.user_discord,
        "user_instagram": booking.user_instagram,
        "movie_id": booking.movie_id,
        "requested_time": booking.requested_time,
        "status": "pending",
        "access_code": None,
        "created_at": datetime.now().isoformat(),
        "approved_at": None
    }
    bookings_db.append(new_booking)
    return new_booking

@app.get("/api/bookings/check/{user_email}")
async def check_booking_status(user_email: str):
    user_bookings = [b for b in bookings_db if b.get('user_email') == user_email]
    return user_bookings

@app.post("/api/code-login")
async def code_login(login: CodeLogin):
    code_entry = next((c for c in access_codes_db if c['code'] == login.code), None)
    if not code_entry:
        raise HTTPException(status_code=404, detail="كود غير صالح")
    
    if datetime.fromisoformat(code_entry['expires_at']) < datetime.now():
        raise HTTPException(status_code=403, detail="انتهت صلاحية الكود")
    
    if code_entry['current_users'] >= code_entry['max_users']:
        raise HTTPException(status_code=403, detail="تم الوصول للحد الأقصى من المستخدمين")
    
    booking = next((b for b in bookings_db if b['id'] == code_entry['booking_id']), None)
    if not booking:
        raise HTTPException(status_code=404, detail="الحجز غير موجود")
    
    movie = next((m for m in movies_db if m['id'] == booking['movie_id']), None)
    if not movie:
        raise HTTPException(status_code=404, detail="الفيلم غير موجود")
    
    session = {
        "id": get_next_id(active_sessions_db),
        "code": login.code,
        "user_identifier": f"user_{get_next_id(active_sessions_db)}",
        "joined_at": datetime.now().isoformat(),
        "is_active": True
    }
    active_sessions_db.append(session)
    
    code_entry['current_users'] += 1
    
    return {
        "session": session,
        "booking": booking,
        "movie": movie,
        "code_info": code_entry
    }

@app.post("/api/admin/login")
async def admin_login(login: AdminLogin):
    if login.code != "3131":
        raise HTTPException(status_code=401, detail="كود الإدارة غير صحيح")
    return {"success": True, "message": "تم تسجيل الدخول بنجاح"}

@app.get("/api/admin/movies")
async def admin_get_movies():
    return movies_db

@app.post("/api/admin/movies")
async def admin_create_movie(movie: Movie):
    new_movie = {
        "id": get_next_id(movies_db),
        "title_ar": movie.title_ar,
        "description_ar": movie.description_ar,
        "video_url": movie.video_url,
        "thumbnail_url": movie.thumbnail_url,
        "duration": movie.duration,
        "genre": movie.genre,
        "created_at": datetime.now().isoformat()
    }
    movies_db.append(new_movie)
    return new_movie

@app.put("/api/admin/movies/{movie_id}")
async def admin_update_movie(movie_id: int, movie: Movie):
    existing_movie = next((m for m in movies_db if m['id'] == movie_id), None)
    if not existing_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    existing_movie.update({
        "title_ar": movie.title_ar,
        "description_ar": movie.description_ar,
        "video_url": movie.video_url,
        "thumbnail_url": movie.thumbnail_url,
        "duration": movie.duration,
        "genre": movie.genre
    })
    return existing_movie

@app.delete("/api/admin/movies/{movie_id}")
async def admin_delete_movie(movie_id: int):
    global movies_db
    movies_db = [m for m in movies_db if m['id'] != movie_id]
    return {"success": True}

@app.get("/api/admin/bookings")
async def admin_get_bookings():
    return bookings_db

@app.post("/api/admin/bookings/approve")
async def admin_approve_booking(approval: BookingApproval):
    booking = next((b for b in bookings_db if b['id'] == approval.booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if approval.approved:
        code = generate_access_code()
        booking['status'] = "approved"
        booking['access_code'] = code
        booking['approved_at'] = datetime.now().isoformat()
        
        access_code = {
            "id": get_next_id(access_codes_db),
            "code": code,
            "booking_id": booking['id'],
            "max_users": 5,
            "current_users": 0,
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat(),
            "created_at": datetime.now().isoformat()
        }
        access_codes_db.append(access_code)
    else:
        booking['status'] = "rejected"
    
    return booking

@app.get("/api/admin/app-settings")
async def admin_get_app_settings():
    return app_settings_db

@app.put("/api/admin/app-settings")
async def admin_update_app_settings(settings: AppSettings):
    app_settings_db["is_app_open"] = settings.is_app_open
    app_settings_db["closed_message_ar"] = settings.closed_message_ar
    return app_settings_db

@app.get("/api/admin/active-sessions")
async def admin_get_active_sessions():
    return active_sessions_db

@app.get("/api/admin/access-codes")
async def admin_get_access_codes():
    return access_codes_db
