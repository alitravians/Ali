from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import random
from datetime import datetime

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# In-memory database for fake bot accounts
fake_accounts = []
for i in range(1, 201):
    fake_accounts.append({
        "id": i,
        "username": f"user_{random.randint(1000, 9999)}_{i}",
        "avatar": f"https://i.pravatar.cc/150?img={i % 70}",
        "is_active": True
    })

# In-memory storage for bot sending history
bot_history = []

class BotSendRequest(BaseModel):
    stream_url: str
    bot_count: int
    messages: List[str]
    delay_seconds: int = 4

class BotSendResponse(BaseModel):
    success: bool
    message: str
    total_bots_sent: int
    stream_url: str
    task_id: str

class BotStatus(BaseModel):
    task_id: str
    status: str
    bots_sent: int
    total_bots: int
    messages_sent: List[dict]

# Store active tasks
active_tasks = {}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/accounts")
async def get_accounts():
    """Get all fake bot accounts"""
    return {
        "total": len(fake_accounts),
        "accounts": fake_accounts[:10]  # Return first 10 as sample
    }

@app.post("/api/send-bots", response_model=BotSendResponse)
async def send_bots(request: BotSendRequest):
    """Send bots to BIGO LIVE stream"""
    
    # Validate bot count
    if request.bot_count > len(fake_accounts):
        raise HTTPException(
            status_code=400, 
            detail=f"عدد البوتات المطلوب ({request.bot_count}) أكبر من الحسابات المتاحة ({len(fake_accounts)})"
        )
    
    if request.bot_count <= 0:
        raise HTTPException(status_code=400, detail="عدد البوتات يجب أن يكون أكبر من صفر")
    
    if not request.messages:
        raise HTTPException(status_code=400, detail="يجب تحديد رسائل للإرسال")
    
    # Create task ID
    task_id = f"task_{datetime.now().timestamp()}_{random.randint(1000, 9999)}"
    
    # Initialize task status
    active_tasks[task_id] = {
        "status": "running",
        "bots_sent": 0,
        "total_bots": request.bot_count,
        "messages_sent": [],
        "stream_url": request.stream_url
    }
    
    # Start background task to simulate bot sending
    asyncio.create_task(simulate_bot_sending(
        task_id, 
        request.stream_url, 
        request.bot_count, 
        request.messages,
        request.delay_seconds
    ))
    
    return BotSendResponse(
        success=True,
        message=f"بدأ إرسال {request.bot_count} بوت إلى البث",
        total_bots_sent=0,
        stream_url=request.stream_url,
        task_id=task_id
    )

async def simulate_bot_sending(task_id: str, stream_url: str, bot_count: int, messages: List[str], delay: int):
    """Simulate sending bots to stream"""
    
    # Select random bots
    selected_bots = random.sample(fake_accounts, bot_count)
    
    for i, bot in enumerate(selected_bots):
        # Random message from the list
        message = random.choice(messages)
        
        # Simulate sending
        await asyncio.sleep(delay)
        
        # Record the sent message
        message_record = {
            "bot_username": bot["username"],
            "bot_id": bot["id"],
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "bot_number": i + 1
        }
        
        active_tasks[task_id]["messages_sent"].append(message_record)
        active_tasks[task_id]["bots_sent"] = i + 1
        
        # Add to history
        bot_history.append({
            "stream_url": stream_url,
            "bot": bot,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
    
    # Mark as completed
    active_tasks[task_id]["status"] = "completed"

@app.get("/api/task-status/{task_id}", response_model=BotStatus)
async def get_task_status(task_id: str):
    """Get status of bot sending task"""
    
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    
    task = active_tasks[task_id]
    
    return BotStatus(
        task_id=task_id,
        status=task["status"],
        bots_sent=task["bots_sent"],
        total_bots=task["total_bots"],
        messages_sent=task["messages_sent"]
    )

@app.get("/api/history")
async def get_history(limit: int = 50):
    """Get bot sending history"""
    return {
        "total": len(bot_history),
        "history": bot_history[-limit:][::-1]  # Return last N items, reversed
    }

@app.get("/api/stats")
async def get_stats():
    """Get statistics"""
    return {
        "total_accounts": len(fake_accounts),
        "active_accounts": len([a for a in fake_accounts if a["is_active"]]),
        "total_messages_sent": len(bot_history),
        "active_tasks": len([t for t in active_tasks.values() if t["status"] == "running"])
    }
