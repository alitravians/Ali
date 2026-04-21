import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { TrustLevel, EventCategory, RiskLevel, AlertSeverity } from '../types';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Decode common HTML entities back to their characters.
 *  Needed because RSS / news-API payloads often arrive pre-encoded. */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&'); // must be last so earlier replacements aren't double-decoded
}

export function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ar });
}

export function trustLevelColor(level: TrustLevel): string {
  switch (level) {
    case 'confirmed': return 'text-green-400 bg-green-400/10 border-green-400/30';
    case 'high': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    case 'low': return 'text-red-400 bg-red-400/10 border-red-400/30';
  }
}

export function trustLevelText(level: TrustLevel): string {
  switch (level) {
    case 'confirmed': return 'مؤكد';
    case 'high': return 'مرجّح';
    case 'medium': return 'قيد التحقق';
    case 'low': return 'غير مؤكد';
  }
}

export function categoryColor(cat: EventCategory): string {
  switch (cat) {
    case 'military': return '#ef4444';
    case 'alert': return '#f59e0b';
    case 'official': return '#3b82f6';
    case 'airspace': return '#f97316';
    case 'maritime': return '#a855f7';
    case 'fire': return '#dc2626';
    case 'humanitarian': return '#22c55e';
  }
}

export function categoryTextAr(cat: EventCategory): string {
  switch (cat) {
    case 'military': return 'عسكري';
    case 'alert': return 'إنذار';
    case 'official': return 'رسمي';
    case 'airspace': return 'أجواء';
    case 'maritime': return 'بحري';
    case 'fire': return 'حراري';
    case 'humanitarian': return 'إنساني';
  }
}

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/40';
    case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
    case 'elevated': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
    case 'moderate': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
    case 'low': return 'text-green-400 bg-green-500/20 border-green-500/40';
  }
}

export function riskLevelTextAr(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'حرج';
    case 'high': return 'مرتفع';
    case 'elevated': return 'متصاعد';
    case 'moderate': return 'متوسط';
    case 'low': return 'منخفض';
  }
}

export function severityColor(sev: AlertSeverity): string {
  switch (sev) {
    case 'critical': return 'border-red-500 bg-red-500/10';
    case 'high': return 'border-orange-500 bg-orange-500/10';
    case 'medium': return 'border-yellow-500 bg-yellow-500/10';
    case 'low': return 'border-blue-500 bg-blue-500/10';
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-blue-500';
  return 'bg-green-500';
}

export function scoreTextColor(score: number): string {
  if (score >= 80) return 'text-red-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 40) return 'text-yellow-400';
  if (score >= 20) return 'text-blue-400';
  return 'text-green-400';
}

export function sourceTypeAr(type: string): string {
  switch (type) {
    case 'official': return 'رسمي';
    case 'media': return 'إعلامي';
    case 'humanitarian': return 'إنساني';
    case 'technical': return 'تقني';
    case 'social': return 'اجتماعي';
    default: return type;
  }
}
