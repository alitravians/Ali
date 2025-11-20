import os
import bcrypt
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db_models import (
    ServiceCategory, Service, Settings,
    ServiceStatusEnum
)


async def seed_initial_data(db: AsyncSession):
    """Seed initial data for the status page"""
    
    result = await db.execute(select(Settings))
    existing_settings = result.scalar_one_or_none()
    
    if existing_settings:
        print("Database already seeded, skipping...")
        return
    
    admin_code = os.getenv("ADMIN_CODE", "3131")
    admin_code_hash = bcrypt.hashpw(admin_code.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    settings = Settings(
        id="global",
        admin_code_hash=admin_code_hash,
        default_language="ar",
        maintenance_mode=False,
        maintenance_message_ar="الموقع قيد الصيانة حالياً. سنعود قريباً...",
        maintenance_message_en="Site is under maintenance. We'll be back soon...",
        allow_public_rss=True,
        site_name_ar="حالة النظام",
        site_name_en="System Status"
    )
    db.add(settings)
    
    categories = [
        ServiceCategory(
            id="user-services",
            name_ar="خدمات المستخدم",
            name_en="User Services",
            description_ar="الخدمات المتعلقة بحسابات المستخدمين",
            description_en="Services related to user accounts",
            order=1,
            visible=True
        ),
        ServiceCategory(
            id="player-services",
            name_ar="خدمات اللاعب",
            name_en="Player Services",
            description_ar="الخدمات المتعلقة بتجربة اللعب",
            description_en="Services related to gameplay experience",
            order=2,
            visible=True
        ),
        ServiceCategory(
            id="creator-services",
            name_ar="خدمات المنشئ",
            name_en="Creator Services",
            description_ar="الخدمات المتعلقة بإنشاء المحتوى",
            description_en="Services related to content creation",
            order=3,
            visible=True
        ),
    ]
    
    for category in categories:
        db.add(category)
    
    services = [
        Service(
            id="user-authentication",
            category_id="user-services",
            name_ar="المصادقة",
            name_en="Authentication",
            description_ar="تسجيل الدخول والخروج",
            description_en="Login and logout functionality",
            status=ServiceStatusEnum.OPERATIONAL,
            order=1,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="user-profile",
            category_id="user-services",
            name_ar="الملف الشخصي",
            name_en="User Profile",
            description_ar="إدارة الملف الشخصي للمستخدم",
            description_en="User profile management",
            status=ServiceStatusEnum.OPERATIONAL,
            order=2,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="user-settings",
            category_id="user-services",
            name_ar="الإعدادات",
            name_en="Settings",
            description_ar="إعدادات الحساب",
            description_en="Account settings",
            status=ServiceStatusEnum.OPERATIONAL,
            order=3,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="game-servers",
            category_id="player-services",
            name_ar="خوادم اللعبة",
            name_en="Game Servers",
            description_ar="خوادم اللعبة الرئيسية",
            description_en="Main game servers",
            status=ServiceStatusEnum.OPERATIONAL,
            order=1,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="matchmaking",
            category_id="player-services",
            name_ar="المطابقة",
            name_en="Matchmaking",
            description_ar="نظام مطابقة اللاعبين",
            description_en="Player matchmaking system",
            status=ServiceStatusEnum.OPERATIONAL,
            order=2,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="leaderboards",
            category_id="player-services",
            name_ar="لوحة المتصدرين",
            name_en="Leaderboards",
            description_ar="لوحة المتصدرين والإحصائيات",
            description_en="Leaderboards and statistics",
            status=ServiceStatusEnum.OPERATIONAL,
            order=3,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="asset-upload",
            category_id="creator-services",
            name_ar="رفع الأصول",
            name_en="Asset Upload",
            description_ar="رفع الأصول والمحتوى",
            description_en="Asset and content upload",
            status=ServiceStatusEnum.OPERATIONAL,
            order=1,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="studio-tools",
            category_id="creator-services",
            name_ar="أدوات الاستوديو",
            name_en="Studio Tools",
            description_ar="أدوات إنشاء المحتوى",
            description_en="Content creation tools",
            status=ServiceStatusEnum.OPERATIONAL,
            order=2,
            visible=True,
            last_updated=datetime.utcnow()
        ),
        Service(
            id="publishing",
            category_id="creator-services",
            name_ar="النشر",
            name_en="Publishing",
            description_ar="نشر المحتوى",
            description_en="Content publishing",
            status=ServiceStatusEnum.OPERATIONAL,
            order=3,
            visible=True,
            last_updated=datetime.utcnow()
        ),
    ]
    
    for service in services:
        db.add(service)
    
    await db.commit()
    print("Database seeded successfully!")
    print(f"Admin code: {admin_code}")
