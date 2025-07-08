# Advanced Arabic Chat System Backend

FastAPI backend for the advanced Arabic chat system with real-time messaging, user management, and admin controls.

## Features

- Real-time WebSocket chat
- User authentication and authorization
- Admin panel with comprehensive controls
- Ban and mute functionality
- Announcement system
- Badge system
- Maintenance mode
- SQLite database with persistent storage

## Installation

```bash
pip install -e .
```

## Running

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
