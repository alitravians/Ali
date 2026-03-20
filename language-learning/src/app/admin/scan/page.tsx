"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface SystemIssue {
  id: string;
  name: string;
  type: string;
  severity: string;
  section: string;
  fileName: string;
  filePath: string;
  lineNumber: number | null;
  description: string;
  cause: string;
  solution: string;
  recommendation: string;
  status: string;
  detectedAt: string;
}

interface SystemScan {
  id: string;
  status: string;
  scanType: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  duration: number;
  summary: string;
  startedAt: string;
  completedAt: string | null;
  startedBy: string;
  issues: SystemIssue[];
}

interface ScanHistoryItem {
  id: string;
  status: string;
  scanType: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  duration: number;
  summary: string;
  startedAt: string;
  completedAt: string | null;
  _count: { issues: number };
}

const SCAN_TYPES = [
  { value: "full", label: "فحص شامل" },
  { value: "pages", label: "فحص الصفحات" },
  { value: "api", label: "فحص API" },
  { value: "database", label: "فحص قاعدة البيانات" },
  { value: "security", label: "فحص الأمان" },
  { value: "performance", label: "فحص الأداء" },
  { value: "tickets", label: "فحص التذاكر" },
  { value: "notifications", label: "فحص الإشعارات" },
  { value: "certificates", label: "فحص الشهادات" },
  { value: "tests", label: "فحص الاختبارات" },
  { value: "chat", label: "فحص الدردشة" },
  { value: "gamification", label: "فحص التلعيب" },
  { value: "inventory", label: "فحص الحقيبة" },
  { value: "moderator", label: "فحص الإشراف" },
  { value: "badges", label: "فحص الشارات" },
  { value: "team", label: "فحص الفريق" },
];

const SEVERITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "حرجة", color: "text-red-700", bg: "bg-red-100" },
  high: { label: "عالية", color: "text-orange-700", bg: "bg-orange-100" },
  medium: { label: "متوسطة", color: "text-yellow-700", bg: "bg-yellow-100" },
  low: { label: "منخفضة", color: "text-blue-700", bg: "bg-blue-100" },
};

const TYPE_MAP: Record<string, string> = {
  page: "صفحة",
  file: "ملف",
  api: "واجهة API",
  database: "قاعدة بيانات",
  performance: "أداء",
  security: "أمان",
  config: "إعدادات",
  ui: "واجهة المستخدم",
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "جديدة", color: "text-blue-700", bg: "bg-blue-100" },
  in_progress: { label: "قيد المعالجة", color: "text-yellow-700", bg: "bg-yellow-100" },
  fixed: { label: "تم الإصلاح", color: "text-green-700", bg: "bg-green-100" },
  ignored: { label: "تم تجاهلها", color: "text-gray-700", bg: "bg-gray-100" },
};

const NAV_ITEMS = [
  { label: "الرئيسية", href: "/admin", icon: "🏠" },
  { label: "اللغات", href: "/admin/languages", icon: "🌐" },
  { label: "المستويات", href: "/admin/levels", icon: "📊" },
  { label: "الدروس", href: "/admin/lessons", icon: "📚" },
  { label: "الأسئلة", href: "/admin/questions", icon: "❓" },
  { label: "الشهادات", href: "/admin/certificates", icon: "🎓" },
  { label: "المستخدمين", href: "/admin/users", icon: "👥" },
  { label: "التذاكر", href: "/admin/tickets", icon: "🎫" },
  { label: "رسائل الاتصال", href: "/admin/contact", icon: "📬" },
  { label: "الإشعارات", href: "/admin/notifications", icon: "🔔" },
  { label: "فحص النظام", href: "/admin/scan", icon: "🔍" },
  { label: "الإعدادات", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminScanPage() {
  const [currentScan, setCurrentScan] = useState<SystemScan | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedScanType, setSelectedScanType] = useState("full");
  const [selectedIssue, setSelectedIssue] = useState<SystemIssue | null>(null);
  const [tab, setTab] = useState<"results" | "history" | "reports">("results");

  // Filters
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/scan");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.scans || []);
      }
    } catch { /* skip */ }
    setLoading(false);
  }, []);

  const loadScan = useCallback(async (scanId: string) => {
    try {
      const res = await fetch(`/api/admin/scan?scanId=${scanId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentScan(data);
        setTab("results");
      }
    } catch { /* skip */ }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Load latest scan on page load
  useEffect(() => {
    if (history.length > 0 && !currentScan) {
      loadScan(history[0].id);
    }
  }, [history, currentScan, loadScan]);

  const startScan = async () => {
    setScanning(true);
    setScanProgress(0);
    setSelectedIssue(null);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 300);

    try {
      const res = await fetch("/api/admin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanType: selectedScanType }),
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (res.ok) {
        const data = await res.json();
        setCurrentScan(data);
        await fetchHistory();
      } else {
        const err = await res.json();
        alert(err.error || "حدث خطأ أثناء الفحص");
      }
    } catch {
      clearInterval(progressInterval);
      alert("فشل الاتصال بالخادم");
    }

    setTimeout(() => {
      setScanning(false);
      setScanProgress(0);
    }, 500);
  };

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/scan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, status }),
      });
      if (res.ok && currentScan) {
        setCurrentScan({
          ...currentScan,
          issues: currentScan.issues.map((i) =>
            i.id === issueId ? { ...i, status } : i
          ),
        });
        if (selectedIssue?.id === issueId) {
          setSelectedIssue({ ...selectedIssue, status });
        }
      }
    } catch { /* skip */ }
  };

  const deleteScan = async (scanId: string) => {
    if (!confirm("هل تريد حذف هذا الفحص؟")) return;
    try {
      await fetch("/api/admin/scan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      });
      if (currentScan?.id === scanId) setCurrentScan(null);
      await fetchHistory();
    } catch { /* skip */ }
  };

  const exportReport = () => {
    if (!currentScan) return;
    const lines: string[] = [];
    lines.push("=" .repeat(60));
    lines.push("تقرير فحص النظام الذكي - AI System Monitor");
    lines.push("=" .repeat(60));
    lines.push(`نوع الفحص: ${SCAN_TYPES.find(t => t.value === currentScan.scanType)?.label || currentScan.scanType}`);
    lines.push(`تاريخ الفحص: ${new Date(currentScan.startedAt).toLocaleString("ar")}`);
    lines.push(`المدة: ${(currentScan.duration / 1000).toFixed(1)} ثانية`);
    lines.push(`إجمالي الفحوصات: ${currentScan.totalChecks}`);
    lines.push(`الفحوصات الناجحة: ${currentScan.passedChecks}`);
    lines.push(`الفحوصات الفاشلة: ${currentScan.failedChecks}`);
    lines.push("");
    lines.push(`حرجة: ${currentScan.criticalCount} | عالية: ${currentScan.highCount} | متوسطة: ${currentScan.mediumCount} | منخفضة: ${currentScan.lowCount}`);
    lines.push("");
    lines.push("-".repeat(60));
    lines.push("التحليل الذكي:");
    lines.push(currentScan.summary);
    lines.push("-".repeat(60));
    lines.push("");

    currentScan.issues.forEach((issue, idx) => {
      lines.push(`[${idx + 1}] ${issue.name}`);
      lines.push(`   النوع: ${TYPE_MAP[issue.type] || issue.type}`);
      lines.push(`   الخطورة: ${SEVERITY_MAP[issue.severity]?.label || issue.severity}`);
      lines.push(`   القسم: ${issue.section}`);
      if (issue.fileName) lines.push(`   الملف: ${issue.fileName}`);
      if (issue.filePath) lines.push(`   المسار: ${issue.filePath}`);
      if (issue.lineNumber) lines.push(`   السطر: ${issue.lineNumber}`);
      lines.push(`   الوصف: ${issue.description}`);
      lines.push(`   السبب: ${issue.cause}`);
      lines.push(`   الحل: ${issue.solution}`);
      lines.push(`   التوصية: ${issue.recommendation}`);
      lines.push(`   الحالة: ${STATUS_MAP[issue.status]?.label || issue.status}`);
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-scan-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter issues
  const filteredIssues = currentScan?.issues.filter((issue) => {
    if (filterSeverity && issue.severity !== filterSeverity) return false;
    if (filterType && issue.type !== filterType) return false;
    if (filterStatus && issue.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.name.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.section.toLowerCase().includes(q) ||
        issue.fileName.toLowerCase().includes(q) ||
        issue.filePath.toLowerCase().includes(q)
      );
    }
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔍 فحص النظام الذكي - AI System Monitor</h1>
              <p className="text-sm text-gray-500">فحص شامل للنظام باستخدام الذكاء الاصطناعي</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin" className="btn-secondary text-sm">← لوحة التحكم</Link>
              <Link href="/" className="btn-primary text-sm">← العودة للموقع</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {NAV_ITEMS.map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  nav.href === "/admin/scan" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {nav.icon} {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Scan Controls */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">بدء فحص جديد</h3>
              <div className="flex flex-wrap gap-2">
                {SCAN_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedScanType(type.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedScanType === type.value
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startScan}
              disabled={scanning}
              className="btn-primary px-6 py-3 text-base font-bold disabled:opacity-50"
            >
              {scanning ? "جاري الفحص..." : "🔍 بدء الفحص"}
            </button>
          </div>

          {/* Scanning Progress */}
          {scanning && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">جاري فحص النظام...</span>
                <span className="text-sm font-bold text-primary-600">{Math.round(scanProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-primary-500 to-primary-600 rounded-full transition-all duration-300 relative"
                  style={{ width: `${scanProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>يتم فحص {SCAN_TYPES.find(t => t.value === selectedScanType)?.label || "النظام"}...</span>
              </div>
            </div>
          )}
        </div>

        {/* Last Scan Summary */}
        {currentScan && !scanning && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{currentScan.totalChecks}</p>
              <p className="text-xs text-gray-500">إجمالي الفحوصات</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{currentScan.passedChecks}</p>
              <p className="text-xs text-gray-500">ناجحة</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{currentScan.criticalCount}</p>
              <p className="text-xs text-gray-500">حرجة</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{currentScan.highCount}</p>
              <p className="text-xs text-gray-500">عالية</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{currentScan.mediumCount}</p>
              <p className="text-xs text-gray-500">متوسطة</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{currentScan.lowCount}</p>
              <p className="text-xs text-gray-500">منخفضة</p>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {currentScan && currentScan.summary && !scanning && (
          <div className="card p-5 mb-6 border-r-4 border-r-primary-500">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">تحليل الذكاء الاصطناعي</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{currentScan.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("results")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "results" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            نتائج الفحص {currentScan ? `(${currentScan.issues.length})` : ""}
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "history" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            سجل الفحوصات ({history.length})
          </button>
          <button
            onClick={() => setTab("reports")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "reports" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            التقارير البيانية
          </button>
          {currentScan && (
            <button
              onClick={exportReport}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 mr-auto"
            >
              📥 تصدير التقرير
            </button>
          )}
        </div>

        {/* Results Tab */}
        {tab === "results" && (
          <>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : !currentScan ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">لم يتم إجراء فحص بعد</h3>
                <p className="text-gray-500">اضغط على زر &quot;بدء الفحص&quot; لبدء فحص شامل للنظام</p>
              </div>
            ) : currentScan.issues.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-green-600 mb-2">النظام في حالة ممتازة!</h3>
                <p className="text-gray-500">لم يتم اكتشاف أي مشاكل. جميع الفحوصات نجحت بنجاح.</p>
                <p className="text-xs text-gray-400 mt-2">المدة: {(currentScan.duration / 1000).toFixed(1)} ثانية</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Issues List */}
                <div className="lg:col-span-2">
                  {/* Filters */}
                  <div className="card p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">الخطورة</label>
                        <select
                          value={filterSeverity}
                          onChange={(e) => setFilterSeverity(e.target.value)}
                          className="w-full text-sm border rounded-lg px-3 py-2"
                        >
                          <option value="">الكل</option>
                          <option value="critical">حرجة</option>
                          <option value="high">عالية</option>
                          <option value="medium">متوسطة</option>
                          <option value="low">منخفضة</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">النوع</label>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full text-sm border rounded-lg px-3 py-2"
                        >
                          <option value="">الكل</option>
                          {Object.entries(TYPE_MAP).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">الحالة</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full text-sm border rounded-lg px-3 py-2"
                        >
                          <option value="">الكل</option>
                          {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">بحث</label>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ابحث..."
                          className="w-full text-sm border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">
                    عرض {filteredIssues.length} من {currentScan.issues.length} مشكلة
                  </p>

                  <div className="space-y-3">
                    {filteredIssues.map((issue) => {
                      const sev = SEVERITY_MAP[issue.severity];
                      const st = STATUS_MAP[issue.status];
                      return (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                            selectedIssue?.id === issue.id ? "ring-2 ring-primary-500" : ""
                          } ${issue.severity === "critical" ? "border-r-4 border-r-red-500" : issue.severity === "high" ? "border-r-4 border-r-orange-500" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm mb-1">{issue.name}</h4>
                              <p className="text-xs text-gray-500 truncate">{issue.description}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev?.bg} ${sev?.color}`}>
                                  {sev?.label}
                                </span>
                                <span className="text-xs text-gray-400">{TYPE_MAP[issue.type] || issue.type}</span>
                                {issue.section && <span className="text-xs text-gray-400">| {issue.section}</span>}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${st?.bg} ${st?.color}`}>
                                  {st?.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Issue Detail */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">تفاصيل المشكلة</h3>
                  {selectedIssue ? (
                    <div className="card p-5 sticky top-4">
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{selectedIssue.name}</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_MAP[selectedIssue.severity]?.bg} ${SEVERITY_MAP[selectedIssue.severity]?.color}`}>
                            {SEVERITY_MAP[selectedIssue.severity]?.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                            {TYPE_MAP[selectedIssue.type] || selectedIssue.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_MAP[selectedIssue.status]?.bg} ${STATUS_MAP[selectedIssue.status]?.color}`}>
                            {STATUS_MAP[selectedIssue.status]?.label}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        {selectedIssue.section && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">القسم المتأثر</p>
                            <p className="text-gray-800">{selectedIssue.section}</p>
                          </div>
                        )}
                        {selectedIssue.fileName && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">اسم الملف</p>
                            <p className="text-gray-800 font-mono text-xs">{selectedIssue.fileName}</p>
                          </div>
                        )}
                        {selectedIssue.filePath && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">مسار الملف</p>
                            <p className="text-gray-800 font-mono text-xs" dir="ltr">{selectedIssue.filePath}</p>
                          </div>
                        )}
                        {selectedIssue.lineNumber && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">رقم السطر</p>
                            <p className="text-gray-800">{selectedIssue.lineNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">الوصف</p>
                          <p className="text-gray-800">{selectedIssue.description}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs text-red-400 mb-0.5">السبب المحتمل</p>
                          <p className="text-red-800 text-sm">{selectedIssue.cause}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-400 mb-0.5">الحل المقترح</p>
                          <p className="text-green-800 text-sm">{selectedIssue.solution}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-400 mb-0.5">التوصية التقنية</p>
                          <p className="text-blue-800 text-sm">{selectedIssue.recommendation}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">وقت الاكتشاف</p>
                          <p className="text-gray-800">{new Date(selectedIssue.detectedAt).toLocaleString("ar")}</p>
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-400 mb-2">تحديث الحالة</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <button
                              key={key}
                              onClick={() => updateIssueStatus(selectedIssue.id, key)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedIssue.status === key
                                  ? `${val.bg} ${val.color} ring-2 ring-offset-1`
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {val.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card p-8 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-gray-500">اختر مشكلة لعرض تفاصيلها</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <div>
            {history.length < 2 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">بيانات غير كافية للتقارير</h3>
                <p className="text-gray-500">أجرِ فحصين على الأقل لرؤية التقارير البيانية والاتجاهات</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Health Score Trend */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">مؤشر صحة النظام عبر الزمن</h3>
                  <div className="relative h-48 flex items-end gap-1">
                    {(() => {
                      const sortedScans = [...history].filter(s => s.status === "completed").reverse().slice(-15);
                      const maxChecks = Math.max(...sortedScans.map(s => s.totalChecks), 1);
                      return sortedScans.map((scan, idx) => {
                        const healthScore = scan.totalChecks > 0 ? Math.round((scan.passedChecks / scan.totalChecks) * 100) : 0;
                        const barHeight = Math.max((healthScore / 100) * 100, 5);
                        const color = healthScore >= 80 ? "bg-green-500" : healthScore >= 50 ? "bg-yellow-500" : "bg-red-500";
                        return (
                          <div key={scan.id} className="flex-1 flex flex-col items-center gap-1" title={`${new Date(scan.startedAt).toLocaleDateString("ar")} - ${healthScore}%`}>
                            <span className="text-xs text-gray-500 font-bold">{healthScore}%</span>
                            <div
                              className={`w-full rounded-t-md ${color} transition-all duration-500 min-w-[20px]`}
                              style={{ height: `${barHeight}%` }}
                            />
                            <span className="text-[9px] text-gray-400 truncate w-full text-center">
                              {new Date(scan.startedAt).toLocaleDateString("ar", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> 80%+ ممتاز</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> 50-79% متوسط</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> أقل من 50% ضعيف</span>
                  </div>
                </div>

                {/* Issues by Severity Over Time */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">توزيع المشاكل حسب الخطورة</h3>
                  <div className="relative h-48 flex items-end gap-1">
                    {(() => {
                      const sortedScans = [...history].filter(s => s.status === "completed").reverse().slice(-15);
                      const maxIssues = Math.max(...sortedScans.map(s => s.criticalCount + s.highCount + s.mediumCount + s.lowCount), 1);
                      return sortedScans.map((scan) => {
                        const total = scan.criticalCount + scan.highCount + scan.mediumCount + scan.lowCount;
                        const critH = maxIssues > 0 ? (scan.criticalCount / maxIssues) * 100 : 0;
                        const highH = maxIssues > 0 ? (scan.highCount / maxIssues) * 100 : 0;
                        const medH = maxIssues > 0 ? (scan.mediumCount / maxIssues) * 100 : 0;
                        const lowH = maxIssues > 0 ? (scan.lowCount / maxIssues) * 100 : 0;
                        return (
                          <div key={scan.id} className="flex-1 flex flex-col items-center" title={`إجمالي: ${total} مشكلة`}>
                            <span className="text-xs text-gray-500 font-bold mb-1">{total}</span>
                            <div className="w-full flex flex-col-reverse min-w-[20px]">
                              {scan.lowCount > 0 && <div className="bg-blue-400 rounded-sm" style={{ height: `${Math.max(lowH, 2)}%` }} />}
                              {scan.mediumCount > 0 && <div className="bg-yellow-400 rounded-sm" style={{ height: `${Math.max(medH, 2)}%` }} />}
                              {scan.highCount > 0 && <div className="bg-orange-500 rounded-sm" style={{ height: `${Math.max(highH, 2)}%` }} />}
                              {scan.criticalCount > 0 && <div className="bg-red-600 rounded-sm" style={{ height: `${Math.max(critH, 2)}%` }} />}
                            </div>
                            <span className="text-[9px] text-gray-400 truncate w-full text-center mt-1">
                              {new Date(scan.startedAt).toLocaleDateString("ar", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600 inline-block" /> حرجة</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" /> عالية</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> متوسطة</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> منخفضة</span>
                  </div>
                </div>

                {/* Scan Duration Trend */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">مدة الفحص عبر الزمن (ثانية)</h3>
                  <div className="relative h-36 flex items-end gap-1">
                    {(() => {
                      const sortedScans = [...history].filter(s => s.status === "completed").reverse().slice(-15);
                      const maxDuration = Math.max(...sortedScans.map(s => s.duration), 1);
                      return sortedScans.map((scan) => {
                        const durationSec = (scan.duration / 1000);
                        const barHeight = Math.max((scan.duration / maxDuration) * 100, 5);
                        return (
                          <div key={scan.id} className="flex-1 flex flex-col items-center gap-1" title={`${durationSec.toFixed(1)}s`}>
                            <span className="text-xs text-gray-500">{durationSec.toFixed(1)}s</span>
                            <div
                              className="w-full rounded-t-md bg-purple-500 min-w-[20px]"
                              style={{ height: `${barHeight}%` }}
                            />
                            <span className="text-[9px] text-gray-400 truncate w-full text-center">
                              {new Date(scan.startedAt).toLocaleDateString("ar", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const completedScans = history.filter(s => s.status === "completed");
                    const totalScans = completedScans.length;
                    const avgHealth = totalScans > 0 ? Math.round(completedScans.reduce((sum, s) => sum + (s.totalChecks > 0 ? (s.passedChecks / s.totalChecks) * 100 : 0), 0) / totalScans) : 0;
                    const totalCritical = completedScans.reduce((sum, s) => sum + s.criticalCount, 0);
                    const avgDuration = totalScans > 0 ? (completedScans.reduce((sum, s) => sum + s.duration, 0) / totalScans / 1000).toFixed(1) : "0";
                    const totalIssues = completedScans.reduce((sum, s) => sum + s.criticalCount + s.highCount + s.mediumCount + s.lowCount, 0);
                    return (
                      <>
                        <div className="card p-5 text-center">
                          <p className="text-3xl font-bold text-primary-600">{totalScans}</p>
                          <p className="text-sm text-gray-500 mt-1">إجمالي الفحوصات</p>
                        </div>
                        <div className="card p-5 text-center">
                          <p className={`text-3xl font-bold ${avgHealth >= 80 ? "text-green-600" : avgHealth >= 50 ? "text-yellow-600" : "text-red-600"}`}>{avgHealth}%</p>
                          <p className="text-sm text-gray-500 mt-1">متوسط صحة النظام</p>
                        </div>
                        <div className="card p-5 text-center">
                          <p className="text-3xl font-bold text-red-600">{totalCritical}</p>
                          <p className="text-sm text-gray-500 mt-1">إجمالي المشاكل الحرجة</p>
                        </div>
                        <div className="card p-5 text-center">
                          <p className="text-3xl font-bold text-purple-600">{avgDuration}s</p>
                          <p className="text-sm text-gray-500 mt-1">متوسط مدة الفحص</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">لا يوجد سجل فحوصات</h3>
                <p className="text-gray-500">ابدأ أول فحص للنظام لرؤية السجل هنا</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((scan) => (
                  <div
                    key={scan.id}
                    className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                      currentScan?.id === scan.id ? "ring-2 ring-primary-500" : ""
                    }`}
                    onClick={() => loadScan(scan.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-gray-900 text-sm">
                            {SCAN_TYPES.find(t => t.value === scan.scanType)?.label || scan.scanType}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            scan.status === "completed" ? "bg-green-100 text-green-700" :
                            scan.status === "failed" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {scan.status === "completed" ? "مكتمل" : scan.status === "failed" ? "فشل" : "جاري"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>📅 {new Date(scan.startedAt).toLocaleString("ar")}</span>
                          <span>⏱️ {(scan.duration / 1000).toFixed(1)}s</span>
                          <span>📊 {scan._count.issues} مشكلة</span>
                          {scan.criticalCount > 0 && <span className="text-red-600 font-bold">🔴 {scan.criticalCount} حرجة</span>}
                          {scan.highCount > 0 && <span className="text-orange-600">🟠 {scan.highCount} عالية</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); loadScan(scan.id); }}
                          className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100"
                        >
                          عرض
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteScan(scan.id); }}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
