import { useState } from 'react';
import { faqData } from '../data/faqData';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'wudu' | 'salah' | 'general'>('all');

  const filtered = filter === 'all' ? faqData : faqData.filter(f => f.category === filter);

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'wudu', 'salah', 'general'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === c ? 'bg-primary text-white' : 'bg-white dark:bg-dark-surface text-text-secondary'
            }`}
          >
            {c === 'all' ? 'الكل' : c === 'wudu' ? 'الوضوء' : c === 'salah' ? 'الصلاة' : 'عام'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="bg-white dark:bg-dark-surface rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 text-right"
              >
                <h3 className="font-bold text-text-primary dark:text-dark-text text-sm flex-1">{faq.question}</h3>
                {isOpen ? <ChevronUp size={18} className="text-primary shrink-0" /> : <ChevronDown size={18} className="text-text-tertiary shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 animate-fade-in">
                  <p className="text-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
