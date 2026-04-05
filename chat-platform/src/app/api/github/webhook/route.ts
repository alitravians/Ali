import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/github';

export const dynamic = 'force-dynamic';

// POST /api/github/webhook — Receive GitHub webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';
    const eventType = req.headers.get('x-github-event') || '';

    // Get webhook secret from config
    const config = await prisma.gitHubAppConfig.findFirst({ where: { isActive: true } });
    if (!config) {
      return NextResponse.json({ error: 'GitHub App not configured' }, { status: 404 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, config.webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    switch (eventType) {
      case 'push':
        await handlePush(payload);
        break;
      case 'pull_request':
        await handlePullRequest(payload);
        break;
      case 'check_run':
        await handleCheckRun(payload);
        break;
      case 'check_suite':
        await handleCheckSuite(payload);
        break;
      case 'code_scanning_alert':
        await handleCodeScanAlert(payload);
        break;
      case 'secret_scanning_alert':
        await handleSecretScanAlert(payload);
        break;
      case 'dependabot_alert':
        await handleDependabotAlert(payload);
        break;
      case 'workflow_run':
        await handleWorkflowRun(payload);
        break;
      default:
        // Log unknown events
        console.log(`Unhandled GitHub event: ${eventType}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ==================== Event Handlers ====================

async function handlePush(payload: any) {
  const branch = payload.ref?.replace('refs/heads/', '') || '';
  const pusher = payload.pusher?.name || payload.sender?.login || 'Unknown';

  for (const commit of (payload.commits || [])) {
    const event = await prisma.gitHubEvent.create({
      data: {
        eventType: 'PUSH',
        title: `Push: ${commit.message?.split('\n')[0] || 'No message'}`,
        description: commit.message || '',
        actor: commit.author?.name || pusher,
        branch,
        commitSha: commit.id,
        severity: 'INFO',
        metadata: {
          url: commit.url,
          timestamp: commit.timestamp,
          pusher,
          added: commit.added?.length || 0,
          modified: commit.modified?.length || 0,
          removed: commit.removed?.length || 0,
        },
      },
    });

    // Track file changes
    const fileChanges = [
      ...(commit.added || []).map((f: string) => ({ path: f, type: 'ADDED' as const })),
      ...(commit.modified || []).map((f: string) => ({ path: f, type: 'MODIFIED' as const })),
      ...(commit.removed || []).map((f: string) => ({ path: f, type: 'DELETED' as const })),
    ];

    for (const fc of fileChanges) {
      await prisma.gitHubFileChange.create({
        data: {
          eventId: event.id,
          filePath: fc.path,
          changeType: fc.type,
          commitSha: commit.id,
          author: commit.author?.name || pusher,
        },
      });
    }
  }
}

async function handlePullRequest(payload: any) {
  const pr = payload.pull_request;
  const action = payload.action; // opened, closed, merged, etc.

  const severityMap: Record<string, 'INFO' | 'WARNING'> = {
    opened: 'INFO', closed: 'INFO', merged: 'INFO',
    review_requested: 'WARNING',
  };

  await prisma.gitHubEvent.create({
    data: {
      eventType: 'PULL_REQUEST',
      title: `PR ${action}: ${pr.title}`,
      description: pr.body || '',
      actor: pr.user?.login || payload.sender?.login || 'Unknown',
      branch: pr.head?.ref || '',
      commitSha: pr.head?.sha || null,
      severity: severityMap[action] || 'INFO',
      metadata: {
        url: pr.html_url,
        number: pr.number,
        action,
        state: pr.state,
        merged: pr.merged,
        base: pr.base?.ref,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
      },
    },
  });
}

async function handleCheckRun(payload: any) {
  const check = payload.check_run;
  const conclusionMap: Record<string, any> = {
    success: 'SUCCESS', failure: 'FAILURE', neutral: 'NEUTRAL',
    cancelled: 'CANCELLED', timed_out: 'TIMED_OUT',
    action_required: 'ACTION_REQUIRED', skipped: 'SKIPPED', stale: 'STALE',
  };

  const statusMap: Record<string, any> = {
    queued: 'QUEUED', in_progress: 'IN_PROGRESS', completed: 'COMPLETED',
  };

  // Upsert check record
  const existing = await prisma.gitHubCheck.findFirst({
    where: { commitSha: check.head_sha, name: check.name },
  });

  const data = {
    name: check.name,
    status: statusMap[check.status] || 'QUEUED',
    conclusion: conclusionMap[check.conclusion] || null,
    branch: check.check_suite?.head_branch || null,
    commitSha: check.head_sha,
    startedAt: check.started_at ? new Date(check.started_at) : null,
    completedAt: check.completed_at ? new Date(check.completed_at) : null,
    detailsUrl: check.details_url || check.html_url,
    output: check.output ? { title: check.output.title, summary: check.output.summary } : Prisma.JsonNull,
  };

  if (existing) {
    await prisma.gitHubCheck.update({ where: { id: existing.id }, data });
  } else {
    await prisma.gitHubCheck.create({ data });
  }

  // Also create an event if check failed
  if (check.conclusion === 'failure') {
    await prisma.gitHubEvent.create({
      data: {
        eventType: 'CHECK_RUN',
        title: `❌ Check failed: ${check.name}`,
        description: check.output?.summary || '',
        actor: check.app?.name || 'CI',
        branch: check.check_suite?.head_branch,
        commitSha: check.head_sha,
        severity: 'ERROR',
        metadata: { url: check.html_url, conclusion: check.conclusion },
      },
    });
  }
}

async function handleCheckSuite(payload: any) {
  const suite = payload.check_suite;
  if (suite.conclusion === 'failure') {
    await prisma.gitHubEvent.create({
      data: {
        eventType: 'CHECK_SUITE',
        title: `❌ Check suite failed on ${suite.head_branch}`,
        description: `${suite.check_runs_count || 0} check runs`,
        actor: suite.app?.name || 'CI',
        branch: suite.head_branch,
        commitSha: suite.head_sha,
        severity: 'ERROR',
        metadata: {
          url: suite.url,
          conclusion: suite.conclusion,
          status: suite.status,
        },
      },
    });
  }
}

async function handleCodeScanAlert(payload: any) {
  const alert = payload.alert;
  const action = payload.action; // created, fixed, dismissed, etc.

  if (action === 'created' || action === 'reopened') {
    const existing = await prisma.gitHubAlert.findFirst({
      where: { githubAlertNumber: alert.number, alertType: 'CODE_SCAN' },
    });
    if (!existing) {
      await prisma.gitHubAlert.create({
        data: {
          alertType: 'CODE_SCAN',
          title: alert.rule?.description || 'Code scanning alert',
          description: alert.most_recent_instance?.message?.text || '',
          severity: mapWebhookSeverity(alert.rule?.security_severity_level),
          filePath: alert.most_recent_instance?.location?.path,
          lineNumber: alert.most_recent_instance?.location?.start_line,
          state: 'OPEN',
          githubAlertNumber: alert.number,
          ruleId: alert.rule?.id,
          metadata: { url: alert.html_url },
        },
      });
    }
  } else if (action === 'fixed' || action === 'dismissed') {
    await prisma.gitHubAlert.updateMany({
      where: { githubAlertNumber: alert.number, alertType: 'CODE_SCAN' },
      data: { state: action === 'fixed' ? 'FIXED' : 'DISMISSED' },
    });
  }

  await prisma.gitHubEvent.create({
    data: {
      eventType: 'CODE_SCAN_ALERT',
      title: `🔍 Code scan: ${alert.rule?.description || 'Alert'} (${action})`,
      severity: action === 'created' ? 'WARNING' : 'INFO',
      metadata: { url: alert.html_url, action, number: alert.number },
    },
  });
}

async function handleSecretScanAlert(payload: any) {
  const alert = payload.alert;
  const action = payload.action;

  if (action === 'created') {
    await prisma.gitHubAlert.create({
      data: {
        alertType: 'SECRET_SCAN',
        title: `🔑 Secret detected: ${alert.secret_type_display_name || alert.secret_type}`,
        severity: 'CRITICAL',
        state: 'OPEN',
        githubAlertNumber: alert.number,
        metadata: { url: alert.html_url, secretType: alert.secret_type },
      },
    });
  } else if (action === 'resolved') {
    await prisma.gitHubAlert.updateMany({
      where: { githubAlertNumber: alert.number, alertType: 'SECRET_SCAN' },
      data: { state: 'FIXED' },
    });
  }

  await prisma.gitHubEvent.create({
    data: {
      eventType: 'SECRET_SCAN_ALERT',
      title: `🔑 Secret scan: ${alert.secret_type_display_name || 'Secret'} (${action})`,
      severity: action === 'created' ? 'CRITICAL' : 'INFO',
      metadata: { url: alert.html_url, action, number: alert.number },
    },
  });
}

async function handleDependabotAlert(payload: any) {
  const alert = payload.alert;
  const action = payload.action;

  if (action === 'created') {
    await prisma.gitHubAlert.create({
      data: {
        alertType: 'DEPENDABOT',
        title: alert.security_advisory?.summary || 'Dependabot alert',
        description: alert.security_advisory?.description || '',
        severity: mapWebhookSeverity(alert.security_advisory?.severity),
        filePath: alert.dependency?.manifest_path,
        state: 'OPEN',
        githubAlertNumber: alert.number,
        ruleId: alert.security_advisory?.cve_id,
        metadata: {
          url: alert.html_url,
          packageName: alert.dependency?.package?.name,
          ecosystem: alert.dependency?.package?.ecosystem,
        },
      },
    });
  } else if (action === 'fixed' || action === 'dismissed') {
    await prisma.gitHubAlert.updateMany({
      where: { githubAlertNumber: alert.number, alertType: 'DEPENDABOT' },
      data: { state: action === 'fixed' ? 'FIXED' : 'DISMISSED' },
    });
  }

  await prisma.gitHubEvent.create({
    data: {
      eventType: 'DEPENDABOT_ALERT',
      title: `📦 Dependabot: ${alert.security_advisory?.summary || 'Alert'} (${action})`,
      severity: action === 'created' ? 'WARNING' : 'INFO',
      metadata: { url: alert.html_url, action, number: alert.number },
    },
  });
}

async function handleWorkflowRun(payload: any) {
  const run = payload.workflow_run;
  const action = payload.action;

  if (action === 'completed' && run.conclusion === 'failure') {
    await prisma.gitHubEvent.create({
      data: {
        eventType: 'WORKFLOW_RUN',
        title: `⚙️ Workflow failed: ${run.name}`,
        description: `Run #${run.run_number} on ${run.head_branch}`,
        actor: run.actor?.login || 'GitHub Actions',
        branch: run.head_branch,
        commitSha: run.head_sha,
        severity: 'ERROR',
        metadata: {
          url: run.html_url,
          conclusion: run.conclusion,
          workflowId: run.workflow_id,
          runNumber: run.run_number,
        },
      },
    });
  }
}

function mapWebhookSeverity(level?: string): 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' {
  switch (level?.toLowerCase()) {
    case 'critical': case 'high': return 'CRITICAL';
    case 'medium': return 'WARNING';
    case 'low': return 'INFO';
    default: return 'WARNING';
  }
}
