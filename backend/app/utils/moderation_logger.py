from datetime import datetime
from typing import Optional
from ..utils.logging import log_admin_action

def log_moderation_event(
    action_taken: str,
    reason: str,
    moderator_id: Optional[str] = None
) -> None:
    if moderator_id:
        log_admin_action(
            admin_username=moderator_id,
            action="content_moderation",
            details=f"Action: {action_taken}, Reason: {reason}"
        )
