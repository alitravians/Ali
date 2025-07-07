from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
import json
from typing import List

from .models import *
from .database import db
from .auth import *
from .websocket_manager import manager

app = FastAPI(title="Advanced Chat System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    if len(request.username.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="اسم المستخدم يجب أن يكون 3 أحرف على الأقل"
        )
    
    existing_user = db.get_user_by_username(request.username.strip())
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="اسم المستخدم موجود بالفعل"
        )
    
    password_hash = get_password_hash("default_password")
    user = db.create_user(request.username.strip(), password_hash)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_id, "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        user_id=user.user_id,
        username=user.username,
        role=user.role.value,
        status=user.status.value,
        ban_reason=user.ban_reason,
        banned_until=user.banned_until.isoformat() if user.banned_until else None
    )

@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    user = authenticate_user(request.username)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="اسم المستخدم غير صحيح"
        )
    
    if user.status == UserStatus.BANNED:
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.user_id, "username": user.username, "role": user.role},
            expires_delta=access_token_expires
        )
        
        return AuthResponse(
            access_token=access_token,
            user_id=user.user_id,
            username=user.username,
            role=user.role.value,
            status=user.status.value,
            ban_reason=user.ban_reason,
            banned_until=user.banned_until.isoformat() if user.banned_until else None
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_id, "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        user_id=user.user_id,
        username=user.username,
        role=user.role.value,
        status=user.status.value,
        ban_reason=user.ban_reason,
        banned_until=user.banned_until.isoformat() if user.banned_until else None
    )

@app.post("/auth/admin-login", response_model=AuthResponse)
async def admin_login(request: AdminLoginRequest):
    user = authenticate_admin(request.username, request.access_code)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="بيانات الإدارة غير صحيحة"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_id, "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return AuthResponse(
        access_token=access_token,
        user_id=user.user_id,
        username=user.username,
        role=user.role.value,
        status=user.status.value,
        ban_reason=user.ban_reason,
        banned_until=user.banned_until.isoformat() if user.banned_until else None
    )

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "message":
                user = db.get_user_by_id(user_id)
                if user and user.status == UserStatus.ACTIVE:
                    message = db.add_message(
                        user_id=user_id,
                        username=user.username,
                        content=message_data["content"]
                    )
                    await manager.broadcast_message(message)
            
            elif message_data["type"] == "ping":
                db.set_user_online(user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast_user_list()

@app.get("/messages", response_model=List[Message])
async def get_messages(current_user: User = Depends(get_current_user)):
    return db.get_messages()

@app.get("/users/online", response_model=List[UserInfo])
async def get_online_users(current_user: User = Depends(get_current_user)):
    return db.get_online_users()

@app.get("/announcements", response_model=List[Announcement])
async def get_announcements(current_user: User = Depends(get_current_user)):
    return db.get_active_announcements()

@app.post("/reports")
async def create_report(
    request: ReportRequest,
    current_user: User = Depends(get_current_user)
):
    message_found = False
    reported_user_id = None
    
    for message in db.messages:
        if message.message_id == request.message_id:
            message_found = True
            reported_user_id = message.user_id
            break
    
    if not message_found:
        raise HTTPException(status_code=404, detail="الرسالة غير موجودة")
    
    report = db.create_report(
        reporter_id=current_user.user_id,
        message_id=request.message_id,
        reported_user_id=reported_user_id,
        category=request.category,
        reason=request.reason
    )
    
    return {"message": "تم إرسال البلاغ بنجاح", "report_id": report.report_id}

@app.post("/appeals")
async def create_appeal(
    request: AppealRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.status != UserStatus.BANNED:
        raise HTTPException(status_code=400, detail="لا يمكن تقديم اعتراض إلا للمستخدمين المحظورين")
    
    try:
        appeal = db.create_appeal(current_user.user_id, request.reason)
        return {"message": "تم تقديم الاعتراض بنجاح", "appeal_id": appeal.appeal_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/statistics")
async def get_statistics(admin_user: User = Depends(get_admin_user)):
    return db.get_statistics()

@app.get("/admin/users", response_model=List[UserInfo])
async def get_all_users(admin_user: User = Depends(get_admin_user)):
    return db.get_all_users()

@app.post("/admin/users/ban")
async def ban_user(
    request: BanUserRequest,
    admin_user: User = Depends(get_admin_user)
):
    user = db.get_user_by_id(request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    ban_record = db.ban_user(
        user_id=request.user_id,
        banned_by=admin_user.user_id,
        reason=request.reason,
        duration_hours=request.duration_hours
    )
    
    duration_text = f"{request.duration_hours} ساعة" if request.duration_hours else "دائم"
    await manager.notify_ban_status(request.user_id, True, request.reason, duration_text)
    
    return {"message": "تم حظر المستخدم بنجاح", "ban_id": ban_record.ban_id}

@app.post("/admin/users/mute")
async def mute_user(
    request: MuteUserRequest,
    admin_user: User = Depends(get_admin_user)
):
    user = db.get_user_by_id(request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    db.mute_user(request.user_id, request.duration_minutes)
    return {"message": "تم كتم المستخدم بنجاح"}

@app.post("/admin/users/unban")
async def unban_user(
    request: UnbanUserRequest,
    admin_user: User = Depends(get_admin_user)
):
    user = db.get_user_by_id(request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    db.unban_user(request.user_id)
    
    await manager.notify_status_change(request.user_id, "unbanned")
    await manager.notify_ban_status(request.user_id, False)
    
    return {"message": "تم إلغاء حظر المستخدم بنجاح"}

@app.delete("/admin/messages/{message_id}")
async def delete_message(
    message_id: str,
    admin_user: User = Depends(get_admin_user)
):
    success = db.delete_message(message_id, admin_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="الرسالة غير موجودة")
    
    await manager.notify_message_deleted(message_id)
    return {"message": "تم حذف الرسالة بنجاح"}

@app.get("/admin/reports", response_model=List[Report])
async def get_reports(admin_user: User = Depends(get_admin_user)):
    return db.get_reports()

@app.get("/admin/appeals", response_model=List[BanAppeal])
async def get_appeals(admin_user: User = Depends(get_admin_user)):
    return db.get_appeals()

@app.post("/admin/appeals/respond")
async def respond_to_appeal(
    request: AppealResponse,
    admin_user: User = Depends(get_admin_user)
):
    appeal = db.appeals.get(request.appeal_id)
    if not appeal:
        raise HTTPException(status_code=404, detail="الاعتراض غير موجود")
    
    db.respond_to_appeal(
        appeal_id=request.appeal_id,
        admin_id=admin_user.user_id,
        action=request.action,
        response=request.response
    )
    
    await manager.notify_appeal_response(
        appeal.user_id, 
        request.action, 
        request.response
    )
    
    if request.action == "approve":
        await manager.notify_status_change(appeal.user_id, "unbanned")
        await manager.notify_ban_status(appeal.user_id, False)
    
    action_text = "قبول" if request.action == "approve" else "رفض"
    return {"message": f"تم {action_text} الاعتراض بنجاح"}

@app.post("/admin/announcements")
async def create_announcement(
    request: AnnouncementRequest,
    admin_user: User = Depends(get_admin_user)
):
    announcement = db.create_announcement(
        title=request.title,
        content=request.content,
        created_by=admin_user.user_id
    )
    
    await manager.broadcast_announcement(announcement)
    return {"message": "تم إنشاء الإعلان بنجاح", "announcement_id": announcement.announcement_id}

@app.get("/admin/announcements", response_model=List[Announcement])
async def get_all_announcements(admin_user: User = Depends(get_admin_user)):
    return list(db.announcements.values())

@app.post("/admin/users/change-id")
async def change_user_id(
    request: ChangeUserIdRequest,
    admin_user: User = Depends(get_admin_user)
):
    if request.new_user_id in db.users:
        raise HTTPException(status_code=400, detail="المعرف الجديد موجود بالفعل")
    
    success = db.change_user_id(request.old_user_id, request.new_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    return {"message": "تم تغيير المعرف بنجاح"}

@app.post("/moderator/users/ban")
async def moderator_ban_user(
    request: ModeratorBanRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذا الإجراء")
    
    user = db.get_user_by_id(request.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    duration_hours = request.duration_minutes / 60
    ban_record = db.ban_user(
        user_id=request.user_id,
        banned_by=current_user.user_id,
        reason=request.reason,
        duration_hours=duration_hours
    )
    
    duration_text = f"{request.duration_minutes} دقيقة"
    await manager.notify_ban_status(request.user_id, True, request.reason, duration_text)
    
    return {"message": "تم حظر المستخدم بنجاح", "ban_id": ban_record.ban_id}

@app.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.user_id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="غير مصرح لك بعرض هذه الإشعارات")
    
    notifications = db.get_user_notifications(user_id)
    return notifications

@app.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    success = db.mark_notification_read(notification_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    
    return {"message": "تم تحديد الإشعار كمقروء"}
