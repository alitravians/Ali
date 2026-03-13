import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import { Plus, Search, Pencil, Trash2, MessageSquare, Hash, Clock, Calendar } from 'lucide-react';

export default function RepliesList() {
  const { rules, toggleRule, deleteRule } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredRules = rules.filter(rule =>
    rule.keywords.some(k => k.includes(searchQuery)) ||
    rule.replies.some(r => r.includes(searchQuery))
  );

  const handleDelete = (id: string) => {
    deleteRule(id);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Header
        title="الردود التلقائية"
        rightAction={
          <button
            onClick={() => navigate('/replies/new')}
            className="p-2 text-emerald-400 hover:text-emerald-300"
          >
            <Plus size={22} />
          </button>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="بحث في الردود والكلمات المفتاحية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{rules.length} رد إجمالي</span>
          <span>•</span>
          <span className="text-emerald-400">{rules.filter(r => r.isEnabled).length} نشط</span>
          <span>•</span>
          <span className="text-red-400">{rules.filter(r => !r.isEnabled).length} معطل</span>
        </div>

        {/* Rules List */}
        {filteredRules.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد ردود تلقائية بعد'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/replies/new')}
                className="mt-3 text-emerald-400 text-sm hover:text-emerald-300"
              >
                إضافة أول رد تلقائي
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-gray-900 rounded-2xl border transition-all overflow-hidden ${
                  rule.isEnabled ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {rule.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-xs"
                          >
                            <Hash size={10} />
                            {kw}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {rule.replies[0]}
                        {rule.replies.length > 1 && (
                          <span className="text-gray-500 text-xs mr-1">
                            (+{rule.replies.length - 1} ردود أخرى)
                          </span>
                        )}
                      </p>
                    </div>
                    <Toggle
                      enabled={rule.isEnabled}
                      onChange={() => toggleRule(rule.id)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/30 border-t border-gray-800/50">
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={10} />
                      {rule.usageCount} استخدام
                    </span>
                    {rule.delaySeconds > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {rule.delaySeconds} ث
                      </span>
                    )}
                    {rule.scheduleEnabled && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {rule.scheduleFrom}-{rule.scheduleTo}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      rule.matchType === 'exact'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {rule.matchType === 'exact' ? 'دقيق' : 'تقريبي'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/replies/edit/${rule.id}`)}
                      className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(rule.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-sm p-5">
            <h3 className="text-lg font-bold text-white mb-2">حذف الرد</h3>
            <p className="text-sm text-gray-400 mb-5">هل أنت متأكد من حذف هذا الرد التلقائي؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                حذف
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
