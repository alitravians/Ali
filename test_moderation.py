import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from moderation import content_moderator, ViolationType

async def test_moderation_system():
    """Test the AI moderation system with various content types"""
    
    print("🤖 Testing AI Content Moderation System")
    print("=" * 50)
    
    test_cases = [
        ("اقتل جميع اليهود", "hate_speech_arabic"),
        ("kill all muslims", "hate_speech_english"),
        ("hitler was right", "hate_speech_historical"),
        
        ("CLICK HERE NOW!!!! WIN $1000000", "spam_english"),
        ("اضغط هنا الآن!!! اربح مال مجاني", "spam_arabic"),
        ("aaaaaaaaaaaaaaaaaaa", "spam_repeated_chars"),
        ("buy buy buy buy", "spam_repeated_words"),
        
        ("sex porn nude xxx", "inappropriate_sexual"),
        ("جنس إباحي عاري", "inappropriate_sexual_arabic"),
        ("cocaine heroin drugs", "inappropriate_drugs"),
        ("مخدرات كوكايين", "inappropriate_drugs_arabic"),
        
        ("fuck shit damn", "profanity_english"),
        ("كس زب خرا", "profanity_arabic"),
        
        ("Hello, how are you today?", "clean_english"),
        ("مرحبا، كيف حالك اليوم؟", "clean_arabic"),
        ("I love programming and technology", "clean_tech"),
        ("أحب البرمجة والتكنولوجيا", "clean_tech_arabic"),
    ]
    
    results = []
    
    for content, test_type in test_cases:
        print(f"\n📝 Testing: {test_type}")
        print(f"Content: '{content}'")
        
        result = await content_moderator.moderate_content(content, "test_user_123")
        
        if result.is_violation:
            print(f"❌ VIOLATION DETECTED")
            print(f"   Type: {result.violation_type.value}")
            print(f"   Reason: {result.reason}")
            print(f"   Confidence: {result.confidence}")
            
            should_ban, ban_minutes = content_moderator.should_auto_ban("test_user_123", result.violation_type)
            if should_ban:
                print(f"🚫 AUTO-BAN TRIGGERED: {ban_minutes} minutes")
            else:
                print(f"⚠️  Warning issued (no ban yet)")
        else:
            print(f"✅ CONTENT APPROVED")
        
        results.append({
            "content": content,
            "test_type": test_type,
            "is_violation": result.is_violation,
            "violation_type": result.violation_type.value if result.violation_type else None,
            "reason": result.reason if result.is_violation else "Clean content"
        })
    
    print("\n" + "=" * 50)
    print("📊 MODERATION TEST SUMMARY")
    print("=" * 50)
    
    violations = [r for r in results if r["is_violation"]]
    clean_content = [r for r in results if not r["is_violation"]]
    
    print(f"Total tests: {len(results)}")
    print(f"Violations detected: {len(violations)}")
    print(f"Clean content approved: {len(clean_content)}")
    
    print(f"\n👤 User violation summary:")
    summary = content_moderator.get_user_violation_summary("test_user_123")
    print(f"Total violations: {summary['total_violations']}")
    print(f"Violations by type: {summary['violations_by_type']}")
    
    print(f"\n🚫 Testing auto-ban thresholds:")
    for violation_type in ViolationType:
        should_ban, ban_minutes = content_moderator.should_auto_ban("test_user_123", violation_type)
        print(f"{violation_type.value}: {'BAN' if should_ban else 'WARNING'} ({ban_minutes} min)")
    
    print(f"\n✅ Moderation system test completed successfully!")
    return results

if __name__ == "__main__":
    asyncio.run(test_moderation_system())
