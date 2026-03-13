import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X, Save, Eye, Hash, MessageSquare } from 'lucide-react';
import { AutoReplyRule } from '../types';

export default function AddEditReply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { rules, addRule, updateRule } = useApp();
  const isEditing = Boolean(id);
  const presetState = location.state as { presetMessage?: string; presetKeywords?: string[] } | null;

  const [keywords, setKeywords] = useState<string[]>(['']);
  const [replies, setReplies] = useState<string[]>(['']);
  const [matchType, setMatchType] = useState<'exact' | 'fuzzy'>('fuzzy');
  const [isEnabled, setIsEnabled] = useState(true);
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrom, setScheduleFrom] = useState('09:00');
  const [scheduleTo, setScheduleTo] = useState('22:00');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const rule = rules.find(r => r.id === id);
      if (rule) {
        setKeywords(rule.keywords.length > 0 ? rule.keywords : ['']);
        setReplies(rule.replies.length > 0 ? rule.replies : ['']);
        setMatchType(rule.matchType);
        setIsEnabled(rule.isEnabled);
        setDelaySeconds(rule.delaySeconds);
        setScheduleEnabled(rule.scheduleEnabled);
        setScheduleFrom(rule.scheduleFrom);
        setScheduleTo(rule.scheduleTo);
      }
    } else if (presetState) {
      if (presetState.presetKeywords) setKeywords(presetState.presetKeywords);
      if (presetState.presetMessage) setReplies([presetState.presetMessage]);
    }
  }, [id, isEditing, rules, presetState]);

  const addKeyword = () => setKeywords([...keywords, '']);
  const removeKeyword = (index: number) => {
    if (keywords.length > 1) setKeywords(keywords.filter((_, i) => i !== index));
  };
  const updateKeyword = (index: number, value: string) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  const addReply = () => setReplies([...replies, '']);
  const removeReply = (index: number) => {
    if (replies.length > 1) setReplies(replies.filter((_, i) => i !== index));
  };
  const updateReply = (index: number, value: string) => {
    const updated = [...replies];
    updated[index] = value;
    setReplies(updated);
  };

  const handleSave = () => {
    const validKeywords = keywords.filter(k => k.trim());
    const validReplies = replies.filter(r => r.trim());

    if (validKeywords.length === 0 || validReplies.length === 0) return;

    const now = new Date().toISOString();
    const rule: AutoReplyRule = {
      id: isEditing && id ? id : uuidv4(),
      keywords: validKeywords,
      replies: validReplies,
      matchType,
      isEnabled,
      delaySeconds,
      scheduleEnabled,
      scheduleFrom,
      scheduleTo,
      createdAt: isEditing ? (rules.find(r => r.id === id)?.createdAt || now) : now,
      updatedAt: now,
      usageCount: isEditing ? (rules.find(r => r.id === id)?.usageCount || 0) : 0,
    };

    if (isEditing) {
      updateRule(rule);
    } else {
      addRule(rule);
    }
    navigate('/replies');
  };

  const isValid = keywords.some(k => k.trim()) && replies.some(r => r.trim());

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Header
        title={isEditing ? 'تعديل الرد' : 'رد تلقائي جديد'}
        showBack
        rightAction={
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Eye size={20} />
          </button>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-5">
        {/* Keywords Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Hash size={14} className="text-emerald-400" />
              الكلمات المفتاحية
            </label>
            <button
              onClick={addKeyword}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus size={12} />
              إضافة
            </button>
          </div>
          <div className="space-y-2">
            {keywords.map((kw, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={kw}
                  onChange={(e) => updateKeyword(i, e.target.value)}
                  placeholder={`كلمة مفتاحية ${i + 1}...`}
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
                {keywords.length > 1 && (
                  <button
                    onClick={() => removeKeyword(i)}
                    className="p-2 text-gray-500 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Match Type */}
        <section>
          <label className="text-sm font-bold text-white mb-3 block">نوع المطابقة</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMatchType('fuzzy')}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                matchType === 'fuzzy'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              تقريبي (يحتوي على)
            </button>
            <button
              onClick={() => setMatchType('exact')}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                matchType === 'exact'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-900 text-gray-400 border border-gray-800'
              }`}
            >
              دقيق (مطابق تماماً)
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {matchType === 'fuzzy'
              ? '• سيتم الرد إذا احتوت الرسالة على الكلمة المفتاحية في أي موضع'
              : '• سيتم الرد فقط إذا تطابقت الرسالة تماماً مع الكلمة المفتاحية'}
          </p>
        </section>

        {/* Replies Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare size={14} className="text-emerald-400" />
              الردود
              {replies.filter(r => r.trim()).length > 1 && (
                <span className="text-[10px] text-gray-500 font-normal">(سيتم اختيار رد عشوائي)</span>
              )}
            </label>
            <button
              onClick={addReply}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus size={12} />
              إضافة
            </button>
          </div>
          <div className="space-y-2">
            {replies.map((reply, i) => (
              <div key={i} className="flex items-start gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => updateReply(i, e.target.value)}
                  placeholder={`نص الرد ${i + 1}...`}
                  rows={2}
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
                {replies.length > 1 && (
                  <button
                    onClick={() => removeReply(i)}
                    className="p-2 text-gray-500 hover:text-red-400 mt-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Delay */}
        <section className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-white">تأخير الرد</label>
            <span className="text-xs text-gray-400">
              {delaySeconds === 0 ? 'فوري' : `${delaySeconds} ثانية`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            dir="ltr"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1" dir="ltr">
            <span>0 ث</span>
            <span>15 ث</span>
            <span>30 ث</span>
          </div>
        </section>

        {/* Schedule */}
        <section className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-white">جدولة الرد</label>
            <Toggle enabled={scheduleEnabled} onChange={setScheduleEnabled} size="sm" />
          </div>
          {scheduleEnabled && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">من</label>
                <input
                  type="time"
                  value={scheduleFrom}
                  onChange={(e) => setScheduleFrom(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">إلى</label>
                <input
                  type="time"
                  value={scheduleTo}
                  onChange={(e) => setScheduleTo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </section>

        {/* Enable/Disable */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
          <label className="text-sm font-bold text-white">تفعيل الرد</label>
          <Toggle enabled={isEnabled} onChange={setIsEnabled} />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-emerald-500/30">
            <h3 className="text-sm font-bold text-emerald-400 mb-3">معاينة</h3>
            <div className="space-y-2 bg-gray-800/50 rounded-xl p-3">
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                  <p className="text-sm text-white">{keywords.find(k => k.trim()) || 'كلمة مفتاحية...'}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-emerald-600 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                  <p className="text-sm text-white">{replies.find(r => r.trim()) || 'نص الرد...'}</p>
                  {delaySeconds > 0 && (
                    <p className="text-[10px] text-emerald-200 mt-1">⏱ بعد {delaySeconds} ثانية</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`w-full font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 ${
            isValid
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Save size={18} />
          {isEditing ? 'حفظ التعديلات' : 'إضافة الرد'}
        </button>
      </div>
    </div>
  );
}
