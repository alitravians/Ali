from pydantic import BaseSettings

class ModerationSettings(BaseSettings):
    MAX_APPEALS_PER_USER: int = 3
    APPEAL_COOLDOWN_HOURS: int = 24
    MAX_REPORTS_PER_USER: int = 10
    REPORT_COOLDOWN_MINUTES: int = 5

    class Config:
        env_file = ".env"
        env_prefix = "MODERATION_"

moderation_settings = ModerationSettings()
