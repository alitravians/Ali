
const COMMIT_TYPE_MAP = {
  feat: { ar: 'إضافة', en: 'Added', emoji: '✨' },
  fix: { ar: 'إصلاح', en: 'Fixed', emoji: '🐛' },
  chore: { ar: 'صيانة', en: 'Maintenance', emoji: '🔧' },
  refactor: { ar: 'إعادة هيكلة', en: 'Refactored', emoji: '♻️' },
  docs: { ar: 'توثيق', en: 'Documentation', emoji: '📝' },
  perf: { ar: 'تحسين الأداء', en: 'Performance', emoji: '⚡' },
  style: { ar: 'تنسيق', en: 'Styling', emoji: '💄' },
  test: { ar: 'اختبارات', en: 'Tests', emoji: '✅' }
};

const KEYWORD_TRANSLATIONS = {
  'navbar': 'شريط التنقل',
  'loading screen': 'شاشة التحميل',
  'footer': 'التذييل',
  'admin panel': 'لوحة التحكم',
  'banner': 'البانر',
  'maintenance': 'الصيانة',
  'dark mode': 'الوضع الداكن',
  'leaderboard': 'المتصدرون',
  'tournaments': 'البطولات',
  'rules': 'القواعد',
  'updates': 'التحديثات',
  'home': 'الرئيسية',
  'button': 'زر',
  'page': 'صفحة',
  'add': 'إضافة',
  'remove': 'حذف',
  'update': 'تحديث',
  'fix': 'إصلاح',
  'improve': 'تحسين'
};

/**
 * Fetches recent commits from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} since - ISO date string to fetch commits since
 * @param {string} path - Optional path filter (e.g., 'challenge-arena')
 * @returns {Promise<Array>} Array of commit objects
 */
export async function fetchGitHubCommits(owner, repo, since, path = null) {
  try {
    let url = `https://api.github.com/repos/${owner}/${repo}/commits?since=${since}`;
    if (path) {
      url += `&path=${path}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('تم تجاوز حد الطلبات من GitHub API. يرجى المحاولة لاحقاً.');
      }
      throw new Error(`فشل جلب البيانات من GitHub: ${response.status}`);
    }
    
    const commits = await response.json();
    return commits;
  } catch (error) {
    console.error('Error fetching commits:', error);
    throw error;
  }
}

/**
 * Parses a conventional commit message
 * @param {string} message - Commit message
 * @returns {Object} Parsed commit with type and description
 */
function parseCommitMessage(message) {
  const conventionalMatch = message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
  
  if (conventionalMatch) {
    const [, type, scope, description] = conventionalMatch;
    return {
      type: type.toLowerCase(),
      scope,
      description,
      fullMessage: message
    };
  }
  
  return {
    type: 'chore',
    scope: null,
    description: message,
    fullMessage: message
  };
}

/**
 * Translates English keywords to Arabic in a description
 * @param {string} text - Text to translate
 * @returns {string} Translated text
 */
function translateKeywords(text) {
  let translated = text;
  
  Object.entries(KEYWORD_TRANSLATIONS).forEach(([en, ar]) => {
    const regex = new RegExp(en, 'gi');
    translated = translated.replace(regex, ar);
  });
  
  return translated;
}

/**
 * Groups commits by type
 * @param {Array} commits - Array of parsed commits
 * @returns {Object} Commits grouped by type
 */
function groupCommitsByType(commits) {
  const grouped = {};
  
  commits.forEach(commit => {
    const { type } = commit;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(commit);
  });
  
  return grouped;
}

/**
 * Generates Arabic changelog text from grouped commits
 * @param {Object} groupedCommits - Commits grouped by type
 * @param {string} version - Version number
 * @returns {string} Formatted Arabic changelog
 */
function generateArabicChangelog(groupedCommits, version) {
  let changelog = `📋 **الإصدار ${version}**\n\n`;
  
  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'style', 'docs', 'chore', 'test'];
  
  typeOrder.forEach(type => {
    if (groupedCommits[type] && groupedCommits[type].length > 0) {
      const typeInfo = COMMIT_TYPE_MAP[type] || { ar: 'تغييرات', emoji: '📌' };
      changelog += `${typeInfo.emoji} **${typeInfo.ar}:**\n`;
      
      groupedCommits[type].forEach(commit => {
        const translatedDesc = translateKeywords(commit.description);
        changelog += `  • ${translatedDesc}\n`;
      });
      
      changelog += '\n';
    }
  });
  
  return changelog.trim();
}

/**
 * Generates English changelog text from grouped commits
 * @param {Object} groupedCommits - Commits grouped by type
 * @param {string} version - Version number
 * @returns {string} Formatted English changelog
 */
function generateEnglishChangelog(groupedCommits, version) {
  let changelog = `📋 **Version ${version}**\n\n`;
  
  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'style', 'docs', 'chore', 'test'];
  
  typeOrder.forEach(type => {
    if (groupedCommits[type] && groupedCommits[type].length > 0) {
      const typeInfo = COMMIT_TYPE_MAP[type] || { en: 'Changes', emoji: '📌' };
      changelog += `${typeInfo.emoji} **${typeInfo.en}:**\n`;
      
      groupedCommits[type].forEach(commit => {
        changelog += `  • ${commit.description}\n`;
      });
      
      changelog += '\n';
    }
  });
  
  return changelog.trim();
}

/**
 * Main function to generate changelog from git commits
 * @param {Object} options - Generation options
 * @param {string} options.owner - GitHub repo owner
 * @param {string} options.repo - GitHub repo name
 * @param {string} options.since - ISO date to fetch commits since
 * @param {string} options.path - Optional path filter
 * @param {string} options.version - Version number for the changelog
 * @returns {Promise<Object>} Generated changelog in Arabic and English
 */
export async function generateChangelog({ owner, repo, since, path, version }) {
  try {
    const commits = await fetchGitHubCommits(owner, repo, since, path);
    
    if (!commits || commits.length === 0) {
      return {
        textAr: `📋 **الإصدار ${version}**\n\nلا توجد تغييرات جديدة منذ آخر تحديث.`,
        textEn: `📋 **Version ${version}**\n\nNo new changes since last update.`,
        commitCount: 0
      };
    }
    
    const parsedCommits = commits.map(commit => {
      const firstLine = commit.commit.message.split('\n')[0];
      return parseCommitMessage(firstLine);
    });
    
    const groupedCommits = groupCommitsByType(parsedCommits);
    
    const textAr = generateArabicChangelog(groupedCommits, version);
    const textEn = generateEnglishChangelog(groupedCommits, version);
    
    return {
      textAr,
      textEn,
      commitCount: commits.length,
      commits: parsedCommits
    };
  } catch (error) {
    console.error('Error generating changelog:', error);
    throw error;
  }
}

/**
 * Gets the last update date from Firebase updates
 * @param {Array} updates - Array of update objects from Firebase
 * @returns {string} ISO date string of the last update
 */
export function getLastUpdateDate(updates) {
  if (!updates || updates.length === 0) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo.toISOString();
  }
  
  const sortedUpdates = [...updates].sort((a, b) => {
    return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
  });
  
  const lastUpdate = sortedUpdates[0];
  const lastDate = new Date(lastUpdate.createdAt || lastUpdate.date);
  
  return lastDate.toISOString();
}
