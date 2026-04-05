import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getGitHubConfig, getRepoInfo, getFileContent, getRepoTree,
  createOrUpdateFile, createBranch, createPullRequest,
  syncRepository, getCommitDiff,
} from '@/lib/github';

export const dynamic = 'force-dynamic';

// Helper: check admin
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });
  const roleLevel = user?.userRoles?.reduce((max: number, ur: any) => Math.max(max, ur.role.level), 0) || 0;
  if (roleLevel < 90) return null;
  return { userId, user };
}

// ==================== GET — Multi-purpose endpoint ====================
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const action = req.nextUrl.searchParams.get('action') || 'summary';

  try {
    switch (action) {
      case 'config': {
        const config = await prisma.gitHubAppConfig.findFirst({ where: { isActive: true } });
        if (!config) return NextResponse.json({ configured: false });
        return NextResponse.json({
          configured: true,
          appId: config.appId,
          installationId: config.installationId,
          repoOwner: config.repoOwner,
          repoName: config.repoName,
          defaultBranch: config.defaultBranch,
          isActive: config.isActive,
          lastSyncAt: config.lastSyncAt,
        });
      }

      case 'summary': {
        const [
          openAlerts,
          criticalAlerts,
          failedChecks,
          recentEvents,
          todayChanges,
          config,
        ] = await Promise.all([
          prisma.gitHubAlert.count({ where: { state: 'OPEN' } }),
          prisma.gitHubAlert.count({ where: { state: 'OPEN', severity: { in: ['CRITICAL', 'ERROR'] } } }),
          prisma.gitHubCheck.count({ where: { conclusion: 'FAILURE' } }),
          prisma.gitHubEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
          prisma.gitHubFileChange.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          }),
          prisma.gitHubAppConfig.findFirst({ where: { isActive: true } }),
        ]);

        // Try to get repo info from GitHub
        let repoInfo = null;
        if (config) {
          try {
            const ghConfig = {
              appId: config.appId, privateKey: config.privateKey,
              installationId: config.installationId, webhookSecret: config.webhookSecret,
              repoOwner: config.repoOwner, repoName: config.repoName,
              defaultBranch: config.defaultBranch,
            };
            repoInfo = await getRepoInfo(ghConfig);
          } catch { /* ignore */ }
        }

        return NextResponse.json({
          configured: !!config,
          lastSyncAt: config?.lastSyncAt || null,
          openAlerts,
          criticalAlerts,
          failedChecks,
          todayChanges,
          recentEvents,
          repoInfo: repoInfo ? {
            fullName: repoInfo.full_name,
            defaultBranch: repoInfo.default_branch,
            language: repoInfo.language,
            visibility: repoInfo.visibility,
            updatedAt: repoInfo.updated_at,
            pushedAt: repoInfo.pushed_at,
          } : null,
        });
      }

      case 'events': {
        const type = req.nextUrl.searchParams.get('type');
        const severity = req.nextUrl.searchParams.get('severity');
        const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 200);

        const where: any = {};
        if (type) where.eventType = type;
        if (severity) where.severity = severity;

        const events = await prisma.gitHubEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { fileChanges: true },
        });
        return NextResponse.json(events);
      }

      case 'files': {
        const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 200);
        const files = await prisma.gitHubFileChange.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: { event: { select: { title: true, actor: true, branch: true } } },
        });
        return NextResponse.json(files);
      }

      case 'alerts': {
        const alertType = req.nextUrl.searchParams.get('type');
        const state = req.nextUrl.searchParams.get('state');
        const where: any = {};
        if (alertType) where.alertType = alertType;
        if (state) where.state = state;

        const alerts = await prisma.gitHubAlert.findMany({
          where,
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
          take: 50,
        });
        return NextResponse.json(alerts);
      }

      case 'checks': {
        const checks = await prisma.gitHubCheck.findMany({
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
        return NextResponse.json(checks);
      }

      case 'fixes': {
        const fixes = await prisma.gitHubFix.findMany({
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { performer: { select: { username: true, displayName: true } } },
        });
        return NextResponse.json(fixes);
      }

      case 'file_content': {
        const path = req.nextUrl.searchParams.get('path');
        if (!path) return NextResponse.json({ error: 'Path required' }, { status: 400 });

        const config = await getGitHubConfig();
        if (!config) return NextResponse.json({ error: 'GitHub not configured' }, { status: 400 });

        const content = await getFileContent(config, path);
        return NextResponse.json(content);
      }

      case 'tree': {
        const path = req.nextUrl.searchParams.get('path') || '';
        const config = await getGitHubConfig();
        if (!config) return NextResponse.json({ error: 'GitHub not configured' }, { status: 400 });

        const tree = await getRepoTree(config, path);
        return NextResponse.json(tree);
      }

      case 'diff': {
        const sha = req.nextUrl.searchParams.get('sha');
        if (!sha) return NextResponse.json({ error: 'SHA required' }, { status: 400 });

        const config = await getGitHubConfig();
        if (!config) return NextResponse.json({ error: 'GitHub not configured' }, { status: 400 });

        const diff = await getCommitDiff(config, sha);
        return NextResponse.json({ diff });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('GitHub admin API error:', error);
    return NextResponse.json({ error: error.message || 'خطأ' }, { status: 500 });
  }
}

// ==================== POST — Config, Sync, Fix ====================
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const body = await req.json();
  const action = body.action;

  try {
    switch (action) {
      case 'save_config': {
        const { appId, privateKey, installationId, webhookSecret, repoOwner, repoName, defaultBranch } = body;
        if (!appId || !privateKey || !installationId || !repoOwner || !repoName) {
          return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
        }

        // Deactivate existing configs
        await prisma.gitHubAppConfig.updateMany({ data: { isActive: false } });

        // Create new config
        const config = await prisma.gitHubAppConfig.create({
          data: {
            appId, privateKey, installationId,
            webhookSecret: webhookSecret || '',
            repoOwner, repoName,
            defaultBranch: defaultBranch || 'main',
            isActive: true,
          },
        });

        // Log in audit
        await prisma.auditLog.create({
          data: {
            action: 'GITHUB_APP_CONFIGURED',
            performedBy: admin.userId,
            details: { repoOwner, repoName, appId },
          },
        });

        // Try initial sync
        try {
          const ghConfig = {
            appId, privateKey, installationId,
            webhookSecret: webhookSecret || '',
            repoOwner, repoName, defaultBranch: defaultBranch || 'main',
          };
          await getRepoInfo(ghConfig);
          await syncRepository(ghConfig);
        } catch (syncErr: any) {
          return NextResponse.json({
            success: true,
            warning: `تم الحفظ لكن فشلت المزامنة الأولية: ${syncErr.message}`,
            configId: config.id,
          });
        }

        return NextResponse.json({ success: true, configId: config.id });
      }

      case 'sync': {
        const config = await getGitHubConfig();
        if (!config) return NextResponse.json({ error: 'GitHub غير مربوط' }, { status: 400 });

        const results = await syncRepository(config);

        await prisma.auditLog.create({
          data: {
            action: 'GITHUB_MANUAL_SYNC',
            performedBy: admin.userId,
            details: results,
          },
        });

        return NextResponse.json({ success: true, results });
      }

      case 'fix_pr': {
        // Create a fix via PR (safe path)
        const { filePath, newContent, commitMessage, prTitle, prBody } = body;
        if (!filePath || !newContent || !commitMessage) {
          return NextResponse.json({ error: 'الحقول المطلوبة ناقصة' }, { status: 400 });
        }

        // Security: block sensitive files
        const blocked = ['.env', 'secrets', 'credentials', 'private_key', '.pem'];
        if (blocked.some(b => filePath.toLowerCase().includes(b))) {
          return NextResponse.json({ error: 'لا يمكن تعديل ملفات حساسة' }, { status: 403 });
        }

        const config = await getGitHubConfig();
        if (!config) return NextResponse.json({ error: 'GitHub غير مربوط' }, { status: 400 });

        // 1. Get current file SHA
        const currentFile = await getFileContent(config, filePath);

        // 2. Create branch
        const branchName = `fix/${Date.now()}-${filePath.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '-')}`;
        await createBranch(config, branchName);

        // 3. Update file on new branch
        await createOrUpdateFile(config, filePath, newContent, commitMessage, branchName, currentFile.sha);

        // 4. Create PR
        const pr = await createPullRequest(
          config,
          prTitle || `Fix: ${filePath}`,
          branchName,
          config.defaultBranch,
          prBody || `تعديل من لوحة الإدارة\n\nالملف: ${filePath}\n${commitMessage}`
        );

        // 5. Record fix
        const fix = await prisma.gitHubFix.create({
          data: {
            filePath,
            oldContent: currentFile.decodedContent || null,
            newContent,
            commitMessage,
            fixType: 'PR',
            branch: branchName,
            prNumber: pr.number,
            prUrl: pr.html_url,
            performedBy: admin.userId,
            status: 'COMMITTED',
          },
        });

        await prisma.auditLog.create({
          data: {
            action: 'GITHUB_FIX_PR',
            performedBy: admin.userId,
            details: { filePath, branch: branchName, prNumber: pr.number, prUrl: pr.html_url },
          },
        });

        return NextResponse.json({ success: true, fix, prUrl: pr.html_url, prNumber: pr.number });
      }

      case 'fix_direct': {
        // Direct commit (restricted)
        const { filePath, newContent, commitMessage } = body;
        if (!filePath || !newContent || !commitMessage) {
          return NextResponse.json({ error: 'الحقول المطلوبة ناقصة' }, { status: 400 });
        }

        const blocked = ['.env', 'secrets', 'credentials', 'private_key', '.pem', 'server.ts', 'schema.prisma'];
        if (blocked.some(b => filePath.toLowerCase().includes(b))) {
          return NextResponse.json({ error: 'لا يمكن تعديل هذا الملف مباشرة — استخدم PR' }, { status: 403 });
        }

        const config = await getGitHubConfig();
        if (!config) return NextResponse.json({ error: 'GitHub غير مربوط' }, { status: 400 });

        const currentFile = await getFileContent(config, filePath);

        await createOrUpdateFile(
          config, filePath, newContent, commitMessage,
          config.defaultBranch, currentFile.sha
        );

        const fix = await prisma.gitHubFix.create({
          data: {
            filePath,
            oldContent: currentFile.decodedContent || null,
            newContent,
            commitMessage,
            fixType: 'DIRECT',
            branch: config.defaultBranch,
            performedBy: admin.userId,
            status: 'COMMITTED',
          },
        });

        await prisma.auditLog.create({
          data: {
            action: 'GITHUB_FIX_DIRECT',
            performedBy: admin.userId,
            details: { filePath, branch: config.defaultBranch },
          },
        });

        return NextResponse.json({ success: true, fix });
      }

      case 'mark_read': {
        const { eventIds } = body;
        if (eventIds && eventIds.length > 0) {
          await prisma.gitHubEvent.updateMany({
            where: { id: { in: eventIds } },
            data: { isRead: true },
          });
        } else {
          await prisma.gitHubEvent.updateMany({
            where: { isRead: false },
            data: { isRead: true },
          });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('GitHub admin POST error:', error);
    return NextResponse.json({ error: error.message || 'خطأ' }, { status: 500 });
  }
}

// ==================== DELETE — Remove config ====================
export async function DELETE() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  await prisma.gitHubAppConfig.updateMany({ data: { isActive: false } });

  await prisma.auditLog.create({
    data: {
      action: 'GITHUB_APP_DISCONNECTED',
      performedBy: admin.userId,
    },
  });

  return NextResponse.json({ success: true });
}
