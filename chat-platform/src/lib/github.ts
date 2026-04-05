import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from './prisma';

// ==================== Types ====================
interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  installationId: string;
  webhookSecret: string;
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
}

interface InstallationToken {
  token: string;
  expiresAt: Date;
}

// Cache installation token in memory
let cachedToken: InstallationToken | null = null;

// ==================== JWT Generation ====================
function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iat: now - 60,
    exp: now + (10 * 60), // 10 minutes max
    iss: appId,
  };

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = base64url(sign.sign(privateKey));

  return `${signingInput}.${signature}`;
}

// ==================== Config Management ====================
export async function getGitHubConfig(): Promise<GitHubAppConfig | null> {
  const config = await prisma.gitHubAppConfig.findFirst({
    where: { isActive: true },
  });
  if (!config) return null;
  return {
    appId: config.appId,
    privateKey: config.privateKey,
    installationId: config.installationId,
    webhookSecret: config.webhookSecret,
    repoOwner: config.repoOwner,
    repoName: config.repoName,
    defaultBranch: config.defaultBranch,
  };
}

// ==================== Installation Token ====================
async function getInstallationToken(config: GitHubAppConfig): Promise<string> {
  // Return cached token if still valid (5 min buffer)
  if (cachedToken && cachedToken.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const jwt = generateJWT(config.appId, config.privateKey);
  const res = await fetch(
    `https://api.github.com/app/installations/${config.installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get installation token: ${res.status} ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expires_at),
  };
  return cachedToken.token;
}

// ==================== GitHub API Helper ====================
async function ghFetch(path: string, config: GitHubAppConfig, options: RequestInit = {}): Promise<any> {
  const token = await getInstallationToken(config);
  const url = path.startsWith('https://') ? path : `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${err}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

// ==================== Webhook Verification ====================
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ==================== Repository Operations ====================
export async function getRepoInfo(config: GitHubAppConfig) {
  return ghFetch(`/repos/${config.repoOwner}/${config.repoName}`, config);
}

export async function getRecentCommits(config: GitHubAppConfig, count = 10) {
  return ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/commits?per_page=${count}`,
    config
  );
}

export async function getRecentPRs(config: GitHubAppConfig, state = 'all', count = 10) {
  return ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/pulls?state=${state}&per_page=${count}&sort=updated&direction=desc`,
    config
  );
}

export async function getCheckRuns(config: GitHubAppConfig, ref: string) {
  return ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/commits/${ref}/check-runs`,
    config
  );
}

// ==================== Security Alerts ====================
export async function getCodeScanningAlerts(config: GitHubAppConfig) {
  try {
    return await ghFetch(
      `/repos/${config.repoOwner}/${config.repoName}/code-scanning/alerts?state=open&per_page=30`,
      config
    );
  } catch {
    return []; // May not be enabled
  }
}

export async function getSecretScanningAlerts(config: GitHubAppConfig) {
  try {
    return await ghFetch(
      `/repos/${config.repoOwner}/${config.repoName}/secret-scanning/alerts?state=open&per_page=30`,
      config
    );
  } catch {
    return [];
  }
}

export async function getDependabotAlerts(config: GitHubAppConfig) {
  try {
    return await ghFetch(
      `/repos/${config.repoOwner}/${config.repoName}/dependabot/alerts?state=open&per_page=30`,
      config
    );
  } catch {
    return [];
  }
}

// ==================== File Operations ====================
export async function getFileContent(config: GitHubAppConfig, path: string, ref?: string) {
  const query = ref ? `?ref=${ref}` : '';
  const data = await ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/contents/${path}${query}`,
    config
  );
  if (data.content) {
    data.decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
  }
  return data;
}

export async function getRepoTree(config: GitHubAppConfig, path = '', ref?: string) {
  const branch = ref || config.defaultBranch;
  const treePath = path ? `/${path}` : '';
  return ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/contents${treePath}?ref=${branch}`,
    config
  );
}

export async function createOrUpdateFile(
  config: GitHubAppConfig,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
) {
  const body: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;

  return ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/contents/${path}`,
    config,
    { method: 'PUT', body: JSON.stringify(body) }
  );
}

// ==================== Branch & PR Operations ====================
export async function createBranch(config: GitHubAppConfig, branchName: string, fromRef?: string) {
  const ref = fromRef || config.defaultBranch;
  // Get the SHA of the base ref
  const refData = await ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/git/ref/heads/${ref}`,
    config
  );
  // Create the new branch
  return ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/git/refs`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      }),
    }
  );
}

export async function createPullRequest(
  config: GitHubAppConfig,
  title: string,
  head: string,
  base: string,
  body: string
) {
  return ghFetch(
    `/repos/${config.repoOwner}/${config.repoName}/pulls`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({ title, head, base, body }),
    }
  );
}

export async function getCommitDiff(config: GitHubAppConfig, commitSha: string) {
  const token = await getInstallationToken(config);
  const res = await fetch(
    `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/commits/${commitSha}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.diff',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );
  if (!res.ok) throw new Error(`Failed to get diff: ${res.status}`);
  return res.text();
}

// ==================== Sync Operations ====================
export async function syncRepository(config: GitHubAppConfig) {
  const results = {
    commits: 0,
    alerts: 0,
    checks: 0,
    errors: [] as string[],
  };

  try {
    // 1. Sync recent commits
    const commits = await getRecentCommits(config, 20);
    for (const commit of commits) {
      const existing = await prisma.gitHubEvent.findFirst({
        where: { commitSha: commit.sha, eventType: 'PUSH' },
      });
      if (existing) continue; // Already tracked

      const event = await prisma.gitHubEvent.create({
        data: {
          eventType: 'PUSH',
          title: `Commit: ${commit.commit.message.split('\n')[0]}`,
          description: commit.commit.message,
          actor: commit.commit.author?.name || commit.author?.login || 'Unknown',
          branch: config.defaultBranch,
          commitSha: commit.sha,
          severity: 'INFO',
          metadata: {
            url: commit.html_url,
            authorEmail: commit.commit.author?.email,
            date: commit.commit.author?.date,
          },
        },
      });

      // Get file changes for this commit
      try {
        const commitDetails = await ghFetch(
          `/repos/${config.repoOwner}/${config.repoName}/commits/${commit.sha}`,
          config
        );
        if (commitDetails.files) {
          for (const file of commitDetails.files) {
            await prisma.gitHubFileChange.create({
              data: {
                eventId: event.id,
                filePath: file.filename,
                changeType: file.status === 'added' ? 'ADDED' :
                           file.status === 'removed' ? 'DELETED' :
                           file.status === 'renamed' ? 'RENAMED' : 'MODIFIED',
                oldPath: file.previous_filename || null,
                additions: file.additions || 0,
                deletions: file.deletions || 0,
                commitSha: commit.sha,
                author: commit.commit.author?.name || commit.author?.login,
              },
            });
          }
        }
      } catch (e: any) {
        results.errors.push(`File changes for ${commit.sha}: ${e.message}`);
      }

      results.commits++;
    }

    // 2. Sync security alerts
    const [codeAlerts, secretAlerts, depAlerts] = await Promise.all([
      getCodeScanningAlerts(config),
      getSecretScanningAlerts(config),
      getDependabotAlerts(config),
    ]);

    for (const alert of (codeAlerts || [])) {
      const existing = await prisma.gitHubAlert.findFirst({
        where: { githubAlertNumber: alert.number, alertType: 'CODE_SCAN' },
      });
      if (!existing) {
        await prisma.gitHubAlert.create({
          data: {
            alertType: 'CODE_SCAN',
            title: alert.rule?.description || alert.rule?.id || 'Code scanning alert',
            description: alert.most_recent_instance?.message?.text || '',
            severity: mapSeverity(alert.rule?.security_severity_level),
            filePath: alert.most_recent_instance?.location?.path || null,
            lineNumber: alert.most_recent_instance?.location?.start_line || null,
            state: alert.state === 'open' ? 'OPEN' : alert.state === 'fixed' ? 'FIXED' : 'DISMISSED',
            githubAlertNumber: alert.number,
            ruleId: alert.rule?.id,
            metadata: { url: alert.html_url },
          },
        });
        results.alerts++;
      }
    }

    for (const alert of (secretAlerts || [])) {
      const existing = await prisma.gitHubAlert.findFirst({
        where: { githubAlertNumber: alert.number, alertType: 'SECRET_SCAN' },
      });
      if (!existing) {
        await prisma.gitHubAlert.create({
          data: {
            alertType: 'SECRET_SCAN',
            title: `Secret detected: ${alert.secret_type_display_name || alert.secret_type}`,
            description: `Secret ${alert.secret_type} found`,
            severity: 'CRITICAL',
            state: alert.state === 'open' ? 'OPEN' : alert.state === 'resolved' ? 'FIXED' : 'DISMISSED',
            githubAlertNumber: alert.number,
            metadata: { url: alert.html_url, secretType: alert.secret_type },
          },
        });
        results.alerts++;
      }
    }

    for (const alert of (depAlerts || [])) {
      const existing = await prisma.gitHubAlert.findFirst({
        where: { githubAlertNumber: alert.number, alertType: 'DEPENDABOT' },
      });
      if (!existing) {
        await prisma.gitHubAlert.create({
          data: {
            alertType: 'DEPENDABOT',
            title: alert.security_advisory?.summary || 'Dependabot alert',
            description: alert.security_advisory?.description || '',
            severity: mapSeverity(alert.security_advisory?.severity),
            filePath: alert.dependency?.manifest_path || null,
            state: alert.state === 'open' ? 'OPEN' : alert.state === 'fixed' ? 'FIXED' : 'DISMISSED',
            githubAlertNumber: alert.number,
            ruleId: alert.security_advisory?.cve_id,
            metadata: {
              url: alert.html_url,
              packageName: alert.dependency?.package?.name,
              ecosystem: alert.dependency?.package?.ecosystem,
            },
          },
        });
        results.alerts++;
      }
    }

    // 3. Sync check runs for latest commit
    try {
      const latestCommits = await getRecentCommits(config, 1);
      if (latestCommits.length > 0) {
        const checkData = await getCheckRuns(config, latestCommits[0].sha);
        for (const check of (checkData.check_runs || [])) {
          const existing = await prisma.gitHubCheck.findFirst({
            where: { commitSha: check.head_sha, name: check.name },
          });
          const checkRecord = {
            name: check.name,
            status: check.status === 'queued' ? 'QUEUED' as const :
                    check.status === 'in_progress' ? 'IN_PROGRESS' as const : 'COMPLETED' as const,
            conclusion: mapConclusion(check.conclusion),
            branch: config.defaultBranch,
            commitSha: check.head_sha,
            startedAt: check.started_at ? new Date(check.started_at) : null,
            completedAt: check.completed_at ? new Date(check.completed_at) : null,
            detailsUrl: check.details_url || check.html_url,
            output: check.output ? { title: check.output.title, summary: check.output.summary } : Prisma.JsonNull,
          };
          if (existing) {
            await prisma.gitHubCheck.update({ where: { id: existing.id }, data: checkRecord });
          } else {
            await prisma.gitHubCheck.create({ data: checkRecord });
          }
          results.checks++;
        }
      }
    } catch (e: any) {
      results.errors.push(`Checks sync: ${e.message}`);
    }

    // Update last sync time
    await prisma.gitHubAppConfig.updateMany({
      where: { isActive: true },
      data: { lastSyncAt: new Date() },
    });

  } catch (e: any) {
    results.errors.push(`Sync error: ${e.message}`);
  }

  return results;
}

// ==================== Helpers ====================
function mapSeverity(level?: string): 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' {
  switch (level?.toLowerCase()) {
    case 'critical': case 'high': return 'CRITICAL';
    case 'medium': case 'warning': return 'WARNING';
    case 'error': return 'ERROR';
    default: return 'INFO';
  }
}

function mapConclusion(conclusion?: string | null): 'SUCCESS' | 'FAILURE' | 'NEUTRAL' | 'CANCELLED' | 'TIMED_OUT' | 'ACTION_REQUIRED' | 'SKIPPED' | 'STALE' | null {
  if (!conclusion) return null;
  const map: Record<string, any> = {
    success: 'SUCCESS', failure: 'FAILURE', neutral: 'NEUTRAL',
    cancelled: 'CANCELLED', timed_out: 'TIMED_OUT',
    action_required: 'ACTION_REQUIRED', skipped: 'SKIPPED', stale: 'STALE',
  };
  return map[conclusion.toLowerCase()] || null;
}
