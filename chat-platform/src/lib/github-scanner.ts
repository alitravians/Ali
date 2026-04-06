import {
  getGitHubConfig,
  getRepoTreeRecursive,
  getFileContent,
} from './github';

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

interface TreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
}

export interface ScanIssue {
  id: string;
  category: 'security' | 'quality' | 'dependencies' | 'structure' | 'performance';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  filePath?: string;
  line?: number;
  suggestion?: string;
}

export interface CategoryScore {
  score: number;
  maxScore: number;
  label: string;
  labelAr: string;
  icon: string;
  issues: ScanIssue[];
}

export interface ScanResult {
  healthScore: number;
  totalFiles: number;
  totalSize: number;
  languages: Record<string, number>;
  categories: {
    security: CategoryScore;
    quality: CategoryScore;
    dependencies: CategoryScore;
    structure: CategoryScore;
    performance: CategoryScore;
  };
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  scannedFiles: number;
  scannedAt: string;
  duration: number;
}

// ==================== Helpers ====================
let issueId = 0;
function nextId(): string {
  return `scan-${Date.now()}-${++issueId}`;
}

const EXT_LANG: Record<string, string> = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
  '.css': 'CSS', '.scss': 'SCSS', '.html': 'HTML', '.json': 'JSON',
  '.md': 'Markdown', '.py': 'Python', '.prisma': 'Prisma', '.sql': 'SQL',
  '.yml': 'YAML', '.yaml': 'YAML', '.sh': 'Shell', '.svg': 'SVG',
};

function getExt(path: string): string {
  const m = path.match(/\.[^.]+$/);
  return m ? m[0].toLowerCase() : '';
}

function isSourceFile(path: string): boolean {
  const ext = getExt(path);
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
}

function isApiRoute(path: string): boolean {
  return path.includes('/api/') && (path.endsWith('route.ts') || path.endsWith('route.js'));
}

// ==================== Security Scanner ====================
function scanSecurity(
  tree: TreeItem[],
  fileContents: Map<string, string>
): ScanIssue[] {
  const issues: ScanIssue[] = [];

  // 1. Check for committed secret/env files
  const sensitiveFiles = ['.env', '.env.local', '.env.production'];
  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const name = item.path.split('/').pop() || '';
    if (sensitiveFiles.includes(name) || name.endsWith('.pem') || name.endsWith('.key')) {
      issues.push({
        id: nextId(),
        category: 'security',
        severity: 'critical',
        title: 'ملف حساس في الريبو',
        description: `الملف "${item.path}" قد يحتوي على بيانات سرية ويجب عدم تتبعه في Git`,
        filePath: item.path,
        suggestion: 'أضف هذا الملف إلى .gitignore وأزله من تاريخ Git',
      });
    }
  }

  // 2. Check for hardcoded secrets in source files
  const secretPatterns = [
    { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/gi, name: 'API Key' },
    { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi, name: 'كلمة مرور/سر' },
    { pattern: /(?:token)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{20,}['"]/gi, name: 'Token' },
    { pattern: /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g, name: 'AWS Access Key' },
    { pattern: /ghp_[A-Za-z0-9_]{36}/g, name: 'GitHub Token' },
    { pattern: /sk-[A-Za-z0-9]{48}/g, name: 'OpenAI Key' },
    { pattern: /xox[baprs]-[A-Za-z0-9\-]{10,}/g, name: 'Slack Token' },
  ];

  for (const [filePath, content] of fileContents) {
    if (!isSourceFile(filePath)) continue;
    // Skip .env.example files
    if (filePath.includes('.example') || filePath.includes('.sample')) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('#')) continue;
      // Skip env variable references
      if (line.includes('process.env') || line.includes('env(')) continue;

      for (const { pattern, name } of secretPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          issues.push({
            id: nextId(),
            category: 'security',
            severity: 'critical',
            title: `مفتاح مكشوف: ${name}`,
            description: `تم اكتشاف ${name} مكتوب مباشرة في الكود`,
            filePath,
            line: i + 1,
            suggestion: 'انقل القيمة إلى متغيرات البيئة (.env) واستخدم process.env',
          });
          break;
        }
      }
    }
  }

  // 3. Check API routes for authentication
  for (const [filePath, content] of fileContents) {
    if (!isApiRoute(filePath)) continue;

    // Skip auth/register/login routes — they are designed to be public
    const isAuthRoute = filePath.includes('/auth/') ||
      filePath.includes('/login') ||
      filePath.includes('/register') ||
      filePath.includes('/signup') ||
      filePath.includes('nextauth');

    const hasAuthCheck = content.includes('getServerSession') ||
      content.includes('requireAdmin') ||
      content.includes('getSession') ||
      content.includes('auth(') ||
      content.includes('authenticated') ||
      content.includes('authorize') ||
      content.includes('NextAuth');

    if (!hasAuthCheck && !isAuthRoute) {
      issues.push({
        id: nextId(),
        category: 'security',
        severity: 'warning',
        title: 'API بدون تحقق من الهوية',
        description: `المسار "${filePath}" لا يحتوي على تحقق من هوية المستخدم`,
        filePath,
        suggestion: 'أضف تحقق من الجلسة (getServerSession) أو middleware للمصادقة',
      });
    }
  }

  // 4. Check for unsafe patterns
  for (const [filePath, content] of fileContents) {
    if (!isSourceFile(filePath)) continue;
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // dangerouslySetInnerHTML
      if (line.includes('dangerouslySetInnerHTML')) {
        issues.push({
          id: nextId(),
          category: 'security',
          severity: 'warning',
          title: 'استخدام dangerouslySetInnerHTML',
          description: 'هذا قد يعرض التطبيق لهجمات XSS',
          filePath,
          line: i + 1,
          suggestion: 'استخدم مكتبة تنظيف HTML مثل DOMPurify',
        });
      }

      // eval
      if (/\beval\s*\(/.test(line) && !line.trim().startsWith('//')) {
        issues.push({
          id: nextId(),
          category: 'security',
          severity: 'critical',
          title: 'استخدام eval()',
          description: 'دالة eval خطيرة وقد تسمح بتنفيذ كود ضار',
          filePath,
          line: i + 1,
          suggestion: 'استبدل eval بطريقة آمنة مثل JSON.parse أو Function constructor',
        });
      }
    }
  }

  // 5. Check for HTTP (non-HTTPS) URLs
  for (const [filePath, content] of fileContents) {
    if (!isSourceFile(filePath)) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
      if (/http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(line)) {
        issues.push({
          id: nextId(),
          category: 'security',
          severity: 'info',
          title: 'رابط HTTP غير آمن',
          description: 'استخدام HTTP بدل HTTPS قد يعرض البيانات للاعتراض',
          filePath,
          line: i + 1,
          suggestion: 'استبدل http:// بـ https://',
        });
        break; // One per file
      }
    }
  }

  return issues;
}

// ==================== Code Quality Scanner ====================
function scanQuality(
  tree: TreeItem[],
  fileContents: Map<string, string>
): ScanIssue[] {
  const issues: ScanIssue[] = [];

  // 1. Check for large files
  for (const item of tree) {
    if (item.type !== 'blob' || !isSourceFile(item.path)) continue;
    if (item.size && item.size > 50000) { // ~1000+ lines
      issues.push({
        id: nextId(),
        category: 'quality',
        severity: 'warning',
        title: 'ملف كبير جداً',
        description: `الملف "${item.path}" حجمه ${Math.round(item.size / 1024)}KB — يُنصح بتقسيمه`,
        filePath: item.path,
        suggestion: 'قسّم الملف إلى ملفات أصغر (مكونات منفصلة، دوال مساعدة، أنواع)',
      });
    }
  }

  // 2. Check for TypeScript 'any' usage
  for (const [filePath, content] of fileContents) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;

    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 5) {
      issues.push({
        id: nextId(),
        category: 'quality',
        severity: 'warning',
        title: 'استخدام مفرط لـ any',
        description: `الملف يحتوي على ${anyMatches.length} استخدام لنوع "any" — يقلل من أمان النوع`,
        filePath,
        suggestion: 'حدد أنواع البيانات بدقة بدلاً من any لتحسين أمان النوع',
      });
    }
  }

  // 3. Check for console.log in production code
  for (const [filePath, content] of fileContents) {
    if (!isSourceFile(filePath)) continue;
    if (filePath.includes('test') || filePath.includes('spec') || filePath.includes('.config')) continue;

    const consoleMatches = content.match(/console\.(log|debug|info)\(/g);
    if (consoleMatches && consoleMatches.length > 3) {
      issues.push({
        id: nextId(),
        category: 'quality',
        severity: 'info',
        title: 'عبارات console.log كثيرة',
        description: `${consoleMatches.length} عبارات console في "${filePath.split('/').pop()}"`,
        filePath,
        suggestion: 'استخدم نظام تسجيل (logger) بدلاً من console.log في الإنتاج',
      });
    }
  }

  // 4. Check for TODO/FIXME/HACK comments
  const todoFiles: string[] = [];
  let totalTodos = 0;
  for (const [filePath, content] of fileContents) {
    if (!isSourceFile(filePath)) continue;
    const matches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)\b/gi);
    if (matches && matches.length > 0) {
      totalTodos += matches.length;
      todoFiles.push(filePath);
    }
  }
  if (totalTodos > 0) {
    issues.push({
      id: nextId(),
      category: 'quality',
      severity: 'info',
      title: `${totalTodos} تعليق TODO/FIXME`,
      description: `يوجد ${totalTodos} تعليق يحتاج متابعة في ${todoFiles.length} ملف`,
      suggestion: 'راجع هذه التعليقات وأصلح المشاكل المعلقة',
    });
  }

  // 5. Check for missing error handling in async functions
  for (const [filePath, content] of fileContents) {
    if (!isApiRoute(filePath)) continue;
    const hasAsync = content.includes('async');
    const hasTryCatch = content.includes('try {') || content.includes('try{');
    if (hasAsync && !hasTryCatch) {
      issues.push({
        id: nextId(),
        category: 'quality',
        severity: 'warning',
        title: 'دوال async بدون معالجة أخطاء',
        description: `المسار "${filePath}" يحتوي على دوال async بدون try/catch`,
        filePath,
        suggestion: 'أضف try/catch حول العمليات غير المتزامنة لمنع الأخطاء الصامتة',
      });
    }
  }

  // 6. Check for deeply nested code
  for (const [filePath, content] of fileContents) {
    if (!isSourceFile(filePath)) continue;
    const lines = content.split('\n');
    let maxIndent = 0;
    for (const line of lines) {
      if (line.trim() === '') continue;
      const indent = line.match(/^\s*/)?.[0].length || 0;
      if (indent > maxIndent) maxIndent = indent;
    }
    if (maxIndent > 32) { // 8+ levels of nesting (4 spaces each)
      issues.push({
        id: nextId(),
        category: 'quality',
        severity: 'info',
        title: 'كود متداخل بشكل عميق',
        description: `مستوى تداخل عالي في "${filePath.split('/').pop()}" — يصعّب القراءة`,
        filePath,
        suggestion: 'استخدم Early Returns أو قسّم الدوال لتقليل التداخل',
      });
    }
  }

  return issues;
}

// ==================== Dependency Scanner ====================
function scanDependencies(
  tree: TreeItem[],
  fileContents: Map<string, string>
): ScanIssue[] {
  const issues: ScanIssue[] = [];

  // Find package.json
  const pkgContent = fileContents.get('package.json') || fileContents.get('chat-platform/package.json');
  if (!pkgContent) {
    issues.push({
      id: nextId(),
      category: 'dependencies',
      severity: 'warning',
      title: 'لم يُعثر على package.json',
      description: 'لم يتم العثور على ملف إدارة الحزم',
      suggestion: 'تأكد من وجود package.json في جذر المشروع',
    });
    return issues;
  }

  let pkg: any;
  try {
    pkg = JSON.parse(pkgContent);
  } catch {
    issues.push({
      id: nextId(),
      category: 'dependencies',
      severity: 'critical',
      title: 'package.json غير صالح',
      description: 'لا يمكن قراءة ملف package.json — الصيغة غير صحيحة',
      filePath: 'package.json',
      suggestion: 'تحقق من صيغة JSON في package.json',
    });
    return issues;
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const depCount = Object.keys(pkg.dependencies || {}).length;
  const devDepCount = Object.keys(pkg.devDependencies || {}).length;

  // 1. Check total dependency count
  if (depCount > 40) {
    issues.push({
      id: nextId(),
      category: 'dependencies',
      severity: 'warning',
      title: 'عدد كبير من التبعيات',
      description: `${depCount} تبعية إنتاج — قد يؤثر على حجم التطبيق وسرعته`,
      filePath: 'package.json',
      suggestion: 'راجع التبعيات وأزل غير المستخدمة',
    });
  }

  // 2. Check for known vulnerable/problematic packages
  const riskyPackages: Record<string, string> = {
    'event-stream': 'حزمة معروفة بثغرة أمنية (supply chain attack)',
    'ua-parser-js': 'تعرضت لاختراق سابق — تأكد من التحديث',
    'colors': 'تعرضت لمشكلة sabotage — تأكد من الإصدار',
    'faker': 'تم إيقافها — استخدم @faker-js/faker بدلاً منها',
    'request': 'مهملة (deprecated) — استخدم node-fetch أو axios',
    'moment': 'كبيرة الحجم — فكر في استخدام date-fns أو dayjs',
  };

  for (const [pkg, reason] of Object.entries(riskyPackages)) {
    if (deps[pkg]) {
      issues.push({
        id: nextId(),
        category: 'dependencies',
        severity: pkg === 'event-stream' ? 'critical' : 'warning',
        title: `حزمة خطرة: ${pkg}`,
        description: reason,
        filePath: 'package.json',
        suggestion: `راجع استخدام ${pkg} وفكر في بديل أحدث`,
      });
    }
  }

  // 3. Check for missing security-related packages
  const securityPackages: Record<string, string> = {
    'helmet': 'حماية HTTP headers',
    'rate-limiter-flexible': 'حماية من هجمات DDoS',
    'cors': 'إدارة CORS',
  };

  // Only check if it's a Node.js server project (not just frontend)
  const hasServerCode = tree.some(t => t.path.includes('server') || t.path.includes('/api/'));
  if (hasServerCode) {
    for (const [pkg, purpose] of Object.entries(securityPackages)) {
      if (!deps[pkg] && !deps['@types/' + pkg]) {
        // Check for alternatives
        const hasAlternative = (pkg === 'cors' && deps['next']) || // Next.js has built-in CORS
          (pkg === 'helmet' && deps['next']); // Next.js has security headers config
        if (!hasAlternative) {
          issues.push({
            id: nextId(),
            category: 'dependencies',
            severity: 'info',
            title: `حزمة أمان ناقصة: ${pkg}`,
            description: `${purpose} — يُنصح بإضافتها`,
            filePath: 'package.json',
            suggestion: `أضف ${pkg} لتعزيز الأمان: npm install ${pkg}`,
          });
        }
      }
    }
  }

  // 4. Check for missing scripts
  const requiredScripts = ['build', 'start'];
  const recommendedScripts = ['lint', 'test'];

  for (const script of requiredScripts) {
    if (!pkg.scripts?.[script]) {
      issues.push({
        id: nextId(),
        category: 'dependencies',
        severity: 'warning',
        title: `سكريبت مفقود: ${script}`,
        description: `لا يوجد أمر "${script}" في scripts — ضروري للنشر`,
        filePath: 'package.json',
        suggestion: `أضف "${script}" إلى scripts في package.json`,
      });
    }
  }

  for (const script of recommendedScripts) {
    if (!pkg.scripts?.[script]) {
      issues.push({
        id: nextId(),
        category: 'dependencies',
        severity: 'info',
        title: `سكريبت مُوصى به مفقود: ${script}`,
        description: `لا يوجد أمر "${script}" — يُنصح بإضافته لجودة أفضل`,
        filePath: 'package.json',
        suggestion: `أضف "${script}" إلى scripts في package.json`,
      });
    }
  }

  // 5. Check for lockfile
  const hasLockfile = tree.some(t =>
    t.path === 'package-lock.json' || t.path === 'yarn.lock' || t.path === 'pnpm-lock.yaml'
  );
  if (!hasLockfile) {
    issues.push({
      id: nextId(),
      category: 'dependencies',
      severity: 'warning',
      title: 'ملف قفل التبعيات مفقود',
      description: 'لا يوجد package-lock.json أو yarn.lock — قد تختلف الإصدارات بين البيئات',
      suggestion: 'شغّل npm install لإنشاء package-lock.json وأضفه للريبو',
    });
  }

  return issues;
}

// ==================== Structure Scanner ====================
function scanStructure(tree: TreeItem[]): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const files = tree.filter(t => t.type === 'blob');
  const dirs = tree.filter(t => t.type === 'tree');

  // 1. Check for README
  const hasReadme = files.some(f =>
    f.path.toLowerCase() === 'readme.md' || f.path.toLowerCase() === 'readme'
  );
  if (!hasReadme) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'warning',
      title: 'README.md مفقود',
      description: 'لا يوجد ملف README — مهم لتوثيق المشروع',
      suggestion: 'أنشئ README.md يحتوي على وصف المشروع وطريقة التثبيت والاستخدام',
    });
  }

  // 2. Check for .gitignore
  const hasGitignore = files.some(f => f.path === '.gitignore');
  if (!hasGitignore) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'warning',
      title: '.gitignore مفقود',
      description: 'لا يوجد ملف .gitignore — قد يتم تتبع ملفات غير مرغوبة',
      suggestion: 'أنشئ .gitignore لاستبعاد node_modules و .env والملفات المؤقتة',
    });
  }

  // 3. Check for tests
  const hasTests = files.some(f =>
    f.path.includes('test') || f.path.includes('spec') || f.path.includes('__tests__')
  );
  if (!hasTests) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'warning',
      title: 'اختبارات مفقودة',
      description: 'لا توجد ملفات اختبار في المشروع',
      suggestion: 'أضف اختبارات باستخدام Jest أو Vitest لضمان جودة الكود',
    });
  }

  // 4. Check for TypeScript config
  const hasTsConfig = files.some(f => f.path === 'tsconfig.json' || f.path.includes('tsconfig'));
  const hasTsFiles = files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
  if (hasTsFiles && !hasTsConfig) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'warning',
      title: 'tsconfig.json مفقود',
      description: 'المشروع يستخدم TypeScript لكن لا يوجد ملف إعدادات',
      suggestion: 'أنشئ tsconfig.json لضبط إعدادات TypeScript',
    });
  }

  // 5. Check for ESLint
  const hasEslint = files.some(f =>
    f.path.includes('.eslint') || f.path.includes('eslint.config')
  );
  if (!hasEslint) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'info',
      title: 'ESLint غير مهيأ',
      description: 'لا يوجد ملف إعدادات ESLint للتحقق من جودة الكود',
      suggestion: 'أضف ESLint لاكتشاف الأخطاء تلقائياً: npx eslint --init',
    });
  }

  // 6. Check for env example
  const hasEnvExample = files.some(f =>
    f.path.includes('.env.example') || f.path.includes('.env.sample')
  );
  const hasEnvFiles = files.some(f => f.path.includes('.env'));
  if (hasEnvFiles && !hasEnvExample) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'info',
      title: '.env.example مفقود',
      description: 'المشروع يستخدم متغيرات بيئة لكن لا يوجد مثال للمتغيرات المطلوبة',
      suggestion: 'أنشئ .env.example يحتوي على أسماء المتغيرات المطلوبة بدون قيم حقيقية',
    });
  }

  // 7. Check for too many files in root
  const rootFiles = files.filter(f => !f.path.includes('/'));
  if (rootFiles.length > 15) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'info',
      title: 'ملفات كثيرة في الجذر',
      description: `${rootFiles.length} ملف في المجلد الرئيسي — قد يصعّب التنقل`,
      suggestion: 'نظّم الملفات في مجلدات فرعية (config/, scripts/, docs/)',
    });
  }

  // 8. Check for Dockerfile / deployment config
  const hasDockerfile = files.some(f => f.path.toLowerCase().includes('dockerfile'));
  const hasDeployConfig = files.some(f =>
    f.path.includes('fly.toml') || f.path.includes('vercel.json') ||
    f.path.includes('netlify.toml') || f.path.includes('render.yaml')
  );
  if (!hasDockerfile && !hasDeployConfig) {
    issues.push({
      id: nextId(),
      category: 'structure',
      severity: 'info',
      title: 'إعدادات النشر مفقودة',
      description: 'لا يوجد Dockerfile أو ملف إعدادات نشر',
      suggestion: 'أضف Dockerfile أو ملف إعدادات (fly.toml, vercel.json) لتسهيل النشر',
    });
  }

  return issues;
}

// ==================== Performance Scanner ====================
function scanPerformance(
  tree: TreeItem[],
  fileContents: Map<string, string>
): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const files = tree.filter(t => t.type === 'blob');

  // 1. Check for large assets
  const largeAssets = files.filter(f => {
    const ext = getExt(f.path);
    const isAsset = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.mp4', '.mp3', '.wav', '.zip', '.tar'].includes(ext);
    return isAsset && f.size && f.size > 1024 * 1024; // > 1MB
  });

  for (const asset of largeAssets) {
    issues.push({
      id: nextId(),
      category: 'performance',
      severity: 'warning',
      title: 'ملف كبير الحجم',
      description: `"${asset.path}" حجمه ${(asset.size! / (1024 * 1024)).toFixed(1)}MB — يبطئ التحميل`,
      filePath: asset.path,
      suggestion: 'اضغط الصورة أو استخدم CDN لتقديم الملفات الثقيلة',
    });
  }

  // 2. Check for unoptimized images in source
  const imageFiles = files.filter(f => {
    const ext = getExt(f.path);
    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'].includes(ext);
  });
  if (imageFiles.length > 50) {
    issues.push({
      id: nextId(),
      category: 'performance',
      severity: 'info',
      title: 'عدد كبير من الصور',
      description: `${imageFiles.length} ملف صورة في الريبو — فكر في استخدام CDN`,
      suggestion: 'استخدم خدمة CDN لتقديم الصور بدلاً من تخزينها في الريبو',
    });
  }

  // 3. Check for barrel imports (index.ts re-exports)
  for (const [filePath, content] of fileContents) {
    if (!isSourceFile(filePath)) continue;
    const barrelImports = content.match(/from\s+['"][^'"]*\/index['"]/g);
    if (barrelImports && barrelImports.length > 5) {
      issues.push({
        id: nextId(),
        category: 'performance',
        severity: 'info',
        title: 'استيرادات Barrel كثيرة',
        description: `${barrelImports.length} استيراد من index files — قد يبطئ البناء`,
        filePath,
        suggestion: 'استورد مباشرة من الملف المصدر بدلاً من index files',
      });
    }
  }

  // 4. Check for missing Next.js Image component (only in Next.js projects)
  for (const [filePath, content] of fileContents) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx')) continue;
    // Only flag <img> in Next.js projects (check if file is under a folder with next.config)
    const isNextProject = filePath.startsWith('chat-platform/') ||
      files.some(f => {
        const dir = filePath.substring(0, filePath.lastIndexOf('/'));
        return f.path?.startsWith(dir.split('/')[0] + '/') &&
          (f.path?.includes('next.config') || f.path?.includes('next.config.mjs') || f.path?.includes('next.config.js'));
      });
    if (!isNextProject) continue;
    if (content.includes('<img ') && !content.includes('next/image')) {
      const imgCount = (content.match(/<img\s/g) || []).length;
      if (imgCount > 0) {
        issues.push({
          id: nextId(),
          category: 'performance',
          severity: 'info',
          title: 'استخدام <img> بدل Image من Next.js',
          description: `${imgCount} عنصر <img> في "${filePath.split('/').pop()}" — Next.js Image أسرع`,
          filePath,
          suggestion: 'استخدم مكون Image من next/image للتحسين التلقائي للصور',
        });
      }
    }
  }

  // 5. Check total repo size
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  if (totalSize > 100 * 1024 * 1024) { // > 100MB
    issues.push({
      id: nextId(),
      category: 'performance',
      severity: 'warning',
      title: 'حجم الريبو كبير',
      description: `حجم الريبو الإجمالي ${(totalSize / (1024 * 1024)).toFixed(0)}MB — قد يبطئ الاستنساخ`,
      suggestion: 'استخدم Git LFS للملفات الكبيرة أو أزل الملفات غير الضرورية',
    });
  }

  return issues;
}

// ==================== Score Calculator ====================
function calculateScores(
  issues: ScanIssue[],
  tree: TreeItem[],
  duration: number
): ScanResult {
  const files = tree.filter(t => t.type === 'blob');
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

  // Count languages
  const languages: Record<string, number> = {};
  for (const file of files) {
    const ext = getExt(file.path);
    const lang = EXT_LANG[ext];
    if (lang) {
      languages[lang] = (languages[lang] || 0) + 1;
    }
  }

  // Group issues by category
  const securityIssues = issues.filter(i => i.category === 'security');
  const qualityIssues = issues.filter(i => i.category === 'quality');
  const depIssues = issues.filter(i => i.category === 'dependencies');
  const structureIssues = issues.filter(i => i.category === 'structure');
  const perfIssues = issues.filter(i => i.category === 'performance');

  // Calculate category scores
  // Each category starts at max and loses points per issue
  function calcScore(issues: ScanIssue[], maxScore: number): number {
    let score = maxScore;
    for (const issue of issues) {
      if (issue.severity === 'critical') score -= Math.ceil(maxScore * 0.2);
      else if (issue.severity === 'warning') score -= Math.ceil(maxScore * 0.08);
      else score -= Math.ceil(maxScore * 0.03);
    }
    return Math.max(0, score);
  }

  const security: CategoryScore = {
    score: calcScore(securityIssues, 30),
    maxScore: 30,
    label: 'Security',
    labelAr: 'الأمان',
    icon: '🔒',
    issues: securityIssues,
  };

  const quality: CategoryScore = {
    score: calcScore(qualityIssues, 25),
    maxScore: 25,
    label: 'Code Quality',
    labelAr: 'جودة الكود',
    icon: '📝',
    issues: qualityIssues,
  };

  const dependencies: CategoryScore = {
    score: calcScore(depIssues, 20),
    maxScore: 20,
    label: 'Dependencies',
    labelAr: 'التبعيات',
    icon: '📦',
    issues: depIssues,
  };

  const structure: CategoryScore = {
    score: calcScore(structureIssues, 15),
    maxScore: 15,
    label: 'Structure',
    labelAr: 'بنية المشروع',
    icon: '📁',
    issues: structureIssues,
  };

  const performance: CategoryScore = {
    score: calcScore(perfIssues, 10),
    maxScore: 10,
    label: 'Performance',
    labelAr: 'الأداء',
    icon: '⚡',
    issues: perfIssues,
  };

  const healthScore = security.score + quality.score + dependencies.score + structure.score + performance.score;

  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
    total: issues.length,
  };

  return {
    healthScore,
    totalFiles: files.length,
    totalSize,
    languages,
    categories: { security, quality, dependencies, structure, performance },
    summary,
    scannedFiles: 0, // Set by caller
    scannedAt: new Date().toISOString(),
    duration,
  };
}

// ==================== Main Scan Function ====================
export async function runFullScan(config: GitHubAppConfig): Promise<ScanResult> {
  const startTime = Date.now();
  issueId = 0;

  // 1. Get full recursive tree
  const treeData = await getRepoTreeRecursive(config);
  const tree: TreeItem[] = treeData.tree || [];

  // 2. Select files to analyze deeply (max 18 files)
  const filesToFetch: string[] = [];
  const sourceFiles = tree.filter(t => t.type === 'blob' && isSourceFile(t.path));

  // Always fetch package.json and tsconfig.json
  if (tree.some(t => t.path === 'package.json')) filesToFetch.push('package.json');
  if (tree.some(t => t.path === 'tsconfig.json')) filesToFetch.push('tsconfig.json');

  // Fetch all API routes (security critical)
  const apiRoutes = sourceFiles
    .filter(f => isApiRoute(f.path))
    .slice(0, 6);
  filesToFetch.push(...apiRoutes.map(f => f.path));

  // Fetch auth/config related files
  const authFiles = sourceFiles
    .filter(f =>
      f.path.includes('auth') || f.path.includes('config') ||
      f.path.includes('middleware') || f.path.includes('prisma')
    )
    .slice(0, 3);
  filesToFetch.push(...authFiles.map(f => f.path));

  // Fetch largest source files (most likely to have issues)
  const largestFiles = sourceFiles
    .filter(f => f.size && f.size > 5000 && !filesToFetch.includes(f.path))
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 5);
  filesToFetch.push(...largestFiles.map(f => f.path));

  // Fetch lib/util files
  const utilFiles = sourceFiles
    .filter(f =>
      (f.path.includes('/lib/') || f.path.includes('/utils/') || f.path.includes('/helpers/')) &&
      !filesToFetch.includes(f.path)
    )
    .slice(0, 2);
  filesToFetch.push(...utilFiles.map(f => f.path));

  // Deduplicate
  const uniqueFiles = [...new Set(filesToFetch)].slice(0, 18);

  // 3. Fetch file contents in batches of 5 (to avoid rate limits)
  const fileContents = new Map<string, string>();

  for (let i = 0; i < uniqueFiles.length; i += 5) {
    const batch = uniqueFiles.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async (path) => {
        try {
          const data = await getFileContent(config, path);
          return { path, content: data.decodedContent || '' };
        } catch {
          return { path, content: '' };
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.content) {
        fileContents.set(result.value.path, result.value.content);
      }
    }
  }

  // 4. Run all scanners
  const allIssues: ScanIssue[] = [
    ...scanSecurity(tree, fileContents),
    ...scanQuality(tree, fileContents),
    ...scanDependencies(tree, fileContents),
    ...scanStructure(tree),
    ...scanPerformance(tree, fileContents),
  ];

  // 5. Calculate scores
  const result = calculateScores(allIssues, tree, Date.now() - startTime);
  result.scannedFiles = fileContents.size;

  return result;
}

// ==================== Export Report ====================
export function generateTextReport(result: ScanResult, repoName: string): string {
  const lines: string[] = [];
  const divider = '═'.repeat(50);

  lines.push(divider);
  lines.push(`  تقرير صحة المشروع — ${repoName}`);
  lines.push(divider);
  lines.push(`  التاريخ: ${new Date(result.scannedAt).toLocaleString('ar-SA')}`);
  lines.push(`  الملفات: ${result.totalFiles} | الحجم: ${(result.totalSize / (1024 * 1024)).toFixed(1)}MB`);
  lines.push(`  الملفات المفحوصة: ${result.scannedFiles}`);
  lines.push(`  مدة الفحص: ${(result.duration / 1000).toFixed(1)} ثانية`);
  lines.push('');

  // Health Score
  const scoreLabel = result.healthScore >= 90 ? 'ممتاز' :
    result.healthScore >= 70 ? 'جيد' :
    result.healthScore >= 50 ? 'متوسط' : 'ضعيف';
  lines.push(`  📊 نسبة الصحة: ${result.healthScore}% (${scoreLabel})`);
  lines.push('');

  // Category scores
  lines.push('─'.repeat(50));
  lines.push('  التصنيفات:');
  lines.push('─'.repeat(50));
  const cats = result.categories;
  lines.push(`  ${cats.security.icon} ${cats.security.labelAr}: ${cats.security.score}/${cats.security.maxScore}`);
  lines.push(`  ${cats.quality.icon} ${cats.quality.labelAr}: ${cats.quality.score}/${cats.quality.maxScore}`);
  lines.push(`  ${cats.dependencies.icon} ${cats.dependencies.labelAr}: ${cats.dependencies.score}/${cats.dependencies.maxScore}`);
  lines.push(`  ${cats.structure.icon} ${cats.structure.labelAr}: ${cats.structure.score}/${cats.structure.maxScore}`);
  lines.push(`  ${cats.performance.icon} ${cats.performance.labelAr}: ${cats.performance.score}/${cats.performance.maxScore}`);
  lines.push('');

  // Summary
  lines.push('─'.repeat(50));
  lines.push(`  الملخص: ${result.summary.total} مشكلة`);
  lines.push(`  🔴 حرج: ${result.summary.critical} | ⚠️ تحذير: ${result.summary.warning} | ℹ️ معلومة: ${result.summary.info}`);
  lines.push('─'.repeat(50));
  lines.push('');

  // Issues by severity
  const allIssues = [
    ...cats.security.issues,
    ...cats.quality.issues,
    ...cats.dependencies.issues,
    ...cats.structure.issues,
    ...cats.performance.issues,
  ];

  const criticalIssues = allIssues.filter(i => i.severity === 'critical');
  const warningIssues = allIssues.filter(i => i.severity === 'warning');
  const infoIssues = allIssues.filter(i => i.severity === 'info');

  if (criticalIssues.length > 0) {
    lines.push('  🔴 مشاكل حرجة:');
    criticalIssues.forEach((issue, idx) => {
      lines.push(`  ${idx + 1}. [${issue.category}] ${issue.title}`);
      if (issue.filePath) lines.push(`     📄 ${issue.filePath}${issue.line ? `:${issue.line}` : ''}`);
      lines.push(`     ${issue.description}`);
      if (issue.suggestion) lines.push(`     → ${issue.suggestion}`);
      lines.push('');
    });
  }

  if (warningIssues.length > 0) {
    lines.push('  ⚠️ تحذيرات:');
    warningIssues.forEach((issue, idx) => {
      lines.push(`  ${idx + 1}. [${issue.category}] ${issue.title}`);
      if (issue.filePath) lines.push(`     📄 ${issue.filePath}${issue.line ? `:${issue.line}` : ''}`);
      lines.push(`     ${issue.description}`);
      if (issue.suggestion) lines.push(`     → ${issue.suggestion}`);
      lines.push('');
    });
  }

  if (infoIssues.length > 0) {
    lines.push('  ℹ️ معلومات وتوصيات:');
    infoIssues.forEach((issue, idx) => {
      lines.push(`  ${idx + 1}. [${issue.category}] ${issue.title}`);
      if (issue.filePath) lines.push(`     📄 ${issue.filePath}`);
      lines.push(`     ${issue.description}`);
      if (issue.suggestion) lines.push(`     → ${issue.suggestion}`);
      lines.push('');
    });
  }

  lines.push(divider);
  lines.push(`  تم إنشاء هذا التقرير بواسطة ChatZone Monitor`);
  lines.push(divider);

  return lines.join('\n');
}
