# ChatZone Platform Testing

## Overview
ChatZone is a real-time Arabic chat platform built with Next.js 14, Socket.IO, PostgreSQL/Prisma, and deployed on Fly.io.

## Devin Secrets Needed
- No additional secrets needed — credentials are seeded in the database

## Live Environment
- **URL**: https://chatzone-platform.fly.dev/
- **Admin Login**: admin@chatzone.com / admin123
- **Admin Panel Code**: 3131 (enter via gear icon on homepage or navigate directly to /admin)
- **Moderator Panel Code**: 2121 (navigate to /moderator)

## Key Pages & Navigation
| Page | URL | Notes |
|------|-----|-------|
| Homepage | / | Shows online count badge when users are on chat |
| Chat | /chat | Main chat interface with rooms, presence panel |
| Admin Panel | /admin | Requires admin login, 8 tabs + team link |
| Team Management | /admin/team | CRUD for departments and members |
| Public Team Page | /team | Shows visible departments and members |
| Profile | /profile | Avatar upload/delete, user info |
| Welcome | /welcome | Static info page |
| Instructions | /instructions | Static info page |
| Chat Guide | /chat-guide | Static info page |
| Rules | /rules | Static info page |

## Feature Testing Checklist

### 1. Presence System (Socket.IO)
- Login → go to /chat → verify header shows "X متواجد" with X ≥ 1
- Click the presence button (users icon, top-left) to open side panel
- Panel should show "المتواجدون الآن" with user list
- Each user shows: name, role badge, status ("في الغرفة" / "متصل")
- **If presence shows 0**: This might indicate a race condition regression in server.ts connection handler

### 2. Chat Page
- Switch rooms by clicking room names in right sidebar
- Send messages via text input + Enter key
- Own messages should have cyan/teal gradient bubbles
- Other users' messages have gray bubbles
- Frozen rooms (like إعلانات الإدارة) show "مجمدة" badge and disable input

### 3. Admin Panel
- Navigate to /admin (must be logged in as admin)
- 8 sidebar tabs: لوحة القيادة, إدارة الغرف, المستخدمين, الإعلانات, البلاغات, العقوبات, السجل الإداري, الإعدادات
- Plus a link: "إدارة فريق العمل" (navigates to /admin/team)
- Settings tab has toggles that should persist after save + reload

### 4. Team Management (/admin/team)
- Create/edit/delete departments with colored headers
- Add/remove/edit members within departments
- Visibility toggles (show/hide departments and members)
- Changes should reflect immediately on /team public page

### 5. Avatar/Profile (/profile)
- Hover over avatar → shows "تغيير الصورة" overlay
- Click to upload new image (max 5MB, JPG/PNG/WEBP)
- Server processes with Sharp: 150x150 WebP
- Red ✕ button to delete avatar
- Avatar appears in chat presence panel and team page

### 6. Homepage (/) 
- Badge shows "X متواجد الآن" when users are on chat page
- Falls back to "منصة الدردشة الاحترافية" when 0 online
- Gear icon (⚙) opens admin code entry
- Nav links: الترحيب, التعليمات, دليل الدردشة, القوانين, فريق العمل

## Technical Notes
- Socket.IO connection requires being on /chat page; navigating away disconnects
- Homepage online count fetches from /api/presence/count (server-side count)
- Admin codes are verified server-side via /api/admin/verify-code POST endpoint
- Role levels: Owner(100), Admin(90), HeadMod(80), Mod(70), Helper(50), Member(10), Muted(5), Banned(0)
- Bold text formatting: prefix message with $ (requires role level ≥ 70)

## Common Issues
- **Presence shows 0 users**: Check server.ts — the auto-send of presence:full after connection setup might have regressed
- **Admin panel gear icon not opening**: The button triggers a modal for code entry; might need JavaScript to load
- **Avatar not displaying**: Check /api/profile/avatar endpoint and Sharp dependency
