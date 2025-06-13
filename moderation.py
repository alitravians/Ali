import re
import asyncio
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from enum import Enum

class ViolationType(Enum):
    HATE_SPEECH = "hate_speech"
    SPAM = "spam"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    PROFANITY = "profanity"

class ModerationResult:
    def __init__(self, is_violation: bool, violation_type: Optional[ViolationType] = None, 
                 confidence: float = 0.0, reason: str = ""):
        self.is_violation = is_violation
        self.violation_type = violation_type
        self.confidence = confidence
        self.reason = reason

class AIContentModerator:
    def __init__(self):
        self.hate_speech_patterns = [
            r'(كافر|كفار|مرتد|خائن|حقير|وسخ|قذر)',
            r'(اقتل|اذبح|امحو|دمر|احرق)',
            r'(يهودي|صهيوني|نصراني).*?(خنزير|كلب|حمار)',
            r'(عرب|مسلم|مسيحي).*?(إرهابي|متخلف|جاهل)',
            
            r'\b(kill|murder|die|death)\s+(all\s+)?(jews|muslims|christians|arabs)\b',
            r'\b(terrorist|savage|barbarian)\b.*\b(muslim|arab|jew)\b',
            r'\b(hitler|nazi|genocide)\s+(was\s+right|good|correct)\b',
            r'\b(go\s+back|get\s+out).*\b(country|homeland)\b'
        ]
        
        self.spam_patterns = [
            r'(.)\1{10,}',  # Same character repeated 10+ times
            r'\b(\w+)\s+\1\s+\1\s+\1\b',  # Same word repeated 4+ times
            
            r'(click\s+here|visit\s+now|buy\s+now|free\s+money)',
            r'(win\s+\$|earn\s+\$|make\s+money\s+fast)',
            r'(viagra|casino|lottery|prize)',
            
            r'(اضغط\s+هنا|زر\s+الآن|اشتري\s+الآن|مال\s+مجاني)',
            r'(اربح\s+\$|احصل\s+على\s+المال|ثروة\s+سريعة)',
        ]
        
        self.inappropriate_patterns = [
            r'\b(sex|porn|nude|naked|xxx)\b',
            r'\b(penis|vagina|breast|ass|dick)\b',
            
            r'(جنس|إباحي|عاري|عارية)',
            r'(قضيب|مهبل|ثدي|مؤخرة)',
            
            r'\b(cocaine|heroin|marijuana|weed|drugs)\b',
            r'(كوكايين|هيروين|مخدرات|حشيش)',
            
            r'\b(bomb|explosion|weapon|gun|knife)\b',
            r'(قنبلة|انفجار|سلاح|مسدس|سكين)'
        ]
        
        self.profanity_patterns = [
            r'\b(fuck|shit|damn|bitch|asshole|bastard)\b',
            r'\b(crap|piss|hell|bloody)\b',
            
            r'(كس|زب|عرص|خرا|لعنة)',
            r'(حمار|كلب|خنزير|قحبة|شرموطة)',
            r'(يلعن|تبا|جحش|حقير)'
        ]
        
        self.user_violations: Dict[str, List[Dict]] = {}
        
        self.violation_thresholds = {
            ViolationType.HATE_SPEECH: {"threshold": 1, "ban_minutes": 1440},  # 24 hours
            ViolationType.SPAM: {"threshold": 3, "ban_minutes": 60},  # 1 hour
            ViolationType.INAPPROPRIATE_CONTENT: {"threshold": 2, "ban_minutes": 480},  # 8 hours
            ViolationType.PROFANITY: {"threshold": 5, "ban_minutes": 30}  # 30 minutes
        }

    async def moderate_content(self, content: str, user_id: str) -> ModerationResult:
        """Main moderation function that checks content against all filters"""
        content_lower = content.lower()
        
        hate_result = self._check_hate_speech(content_lower)
        if hate_result.is_violation:
            await self._record_violation(user_id, hate_result)
            return hate_result
        
        inappropriate_result = self._check_inappropriate_content(content_lower)
        if inappropriate_result.is_violation:
            await self._record_violation(user_id, inappropriate_result)
            return inappropriate_result
        
        spam_result = self._check_spam(content_lower)
        if spam_result.is_violation:
            await self._record_violation(user_id, spam_result)
            return spam_result
        
        profanity_result = self._check_profanity(content_lower)
        if profanity_result.is_violation:
            await self._record_violation(user_id, profanity_result)
            return profanity_result
        
        return ModerationResult(is_violation=False)

    def _check_hate_speech(self, content: str) -> ModerationResult:
        """Check for hate speech patterns"""
        for pattern in self.hate_speech_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.UNICODE):
                return ModerationResult(
                    is_violation=True,
                    violation_type=ViolationType.HATE_SPEECH,
                    confidence=0.9,
                    reason="محتوى يحتوي على خطاب كراهية"
                )
        return ModerationResult(is_violation=False)

    def _check_spam(self, content: str) -> ModerationResult:
        """Check for spam patterns"""
        for pattern in self.spam_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.UNICODE):
                return ModerationResult(
                    is_violation=True,
                    violation_type=ViolationType.SPAM,
                    confidence=0.8,
                    reason="محتوى مشبوه كرسائل مزعجة"
                )
        return ModerationResult(is_violation=False)

    def _check_inappropriate_content(self, content: str) -> ModerationResult:
        """Check for inappropriate content patterns"""
        for pattern in self.inappropriate_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.UNICODE):
                return ModerationResult(
                    is_violation=True,
                    violation_type=ViolationType.INAPPROPRIATE_CONTENT,
                    confidence=0.85,
                    reason="محتوى غير مناسب"
                )
        return ModerationResult(is_violation=False)

    def _check_profanity(self, content: str) -> ModerationResult:
        """Check for profanity patterns"""
        for pattern in self.profanity_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.UNICODE):
                return ModerationResult(
                    is_violation=True,
                    violation_type=ViolationType.PROFANITY,
                    confidence=0.7,
                    reason="محتوى يحتوي على ألفاظ نابية"
                )
        return ModerationResult(is_violation=False)

    async def _record_violation(self, user_id: str, result: ModerationResult):
        """Record user violation for tracking repeat offenses"""
        if user_id not in self.user_violations:
            self.user_violations[user_id] = []
        
        violation_record = {
            "type": result.violation_type,
            "timestamp": datetime.now(),
            "reason": result.reason,
            "confidence": result.confidence
        }
        
        self.user_violations[user_id].append(violation_record)
        
        cutoff_time = datetime.now() - timedelta(hours=24)
        self.user_violations[user_id] = [
            v for v in self.user_violations[user_id] 
            if v["timestamp"] > cutoff_time
        ]

    def should_auto_ban(self, user_id: str, violation_type: ViolationType) -> Tuple[bool, int]:
        """Check if user should be automatically banned based on violation history"""
        if user_id not in self.user_violations:
            return False, 0
        
        recent_violations = [
            v for v in self.user_violations[user_id]
            if v["type"] == violation_type
        ]
        
        threshold_config = self.violation_thresholds[violation_type]
        violation_count = len(recent_violations)
        
        if violation_count >= threshold_config["threshold"]:
            return True, threshold_config["ban_minutes"]
        
        return False, 0

    def get_user_violation_summary(self, user_id: str) -> Dict:
        """Get summary of user's recent violations"""
        if user_id not in self.user_violations:
            return {"total_violations": 0, "violations_by_type": {}}
        
        violations = self.user_violations[user_id]
        violations_by_type = {}
        
        for violation in violations:
            vtype = violation["type"].value
            if vtype not in violations_by_type:
                violations_by_type[vtype] = 0
            violations_by_type[vtype] += 1
        
        return {
            "total_violations": len(violations),
            "violations_by_type": violations_by_type,
            "last_violation": violations[-1]["timestamp"] if violations else None
        }

content_moderator = AIContentModerator()
