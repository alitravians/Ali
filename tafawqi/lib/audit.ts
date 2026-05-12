// Admin audit log helper. Records every state-changing admin action so we have
// a clean trail of who did what and when.
import { prisma } from "./prisma";
import { getClientIp } from "./rate-limit";

export type AuditAction =
  | "block_user"
  | "unblock_user"
  | "change_role"
  | "reset_points"
  | "create_question"
  | "update_question"
  | "delete_question"
  | "create_quiz"
  | "update_quiz"
  | "delete_quiz"
  | "update_setting"
  | "delete_reset_token"
  | "seed_data"
  | "create_department"
  | "update_department"
  | "delete_department"
  | "add_team_member"
  | "update_team_member"
  | "remove_team_member"
  | "resolve_report"
  | "dismiss_report";

export type AuditTargetType =
  | "user"
  | "question"
  | "quiz"
  | "setting"
  | "department"
  | "team_member"
  | "question_report"
  | "other";

export async function recordAudit(opts: {
  adminId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  req?: Request;
}): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: opts.adminId,
        action: opts.action,
        targetType: opts.targetType,
        targetId: opts.targetId ?? null,
        details: opts.details ? JSON.stringify(opts.details).slice(0, 4000) : null,
        ip: opts.req ? getClientIp(opts.req) : null,
      },
    });
  } catch {
    // Never let audit-log failure block the user action.
  }
}
