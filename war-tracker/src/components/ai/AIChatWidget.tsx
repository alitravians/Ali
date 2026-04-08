import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';
import { useLiveData } from '../../context/LiveDataContext';
import { BACKEND_API_URL } from '../../config/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! أنا مساعد WarScope الذكي. اسألني عن أي حدث أو منطقة وسأعطيك ملخصاً فورياً.\n\nأمثلة:\n• "ما الوضع الحالي؟"\n• "أحداث اليوم العاجلة"\n• "ملخص أحداث البحرين"',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { events } = useLiveData();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const buildContext = useCallback(() => {
    const recent = events.slice(0, 20);
    const breaking = events.filter(e => e.isBreaking).slice(0, 5);
    const categories: Record<string, number> = {};
    const locations: Record<string, number> = {};
    events.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + 1;
      locations[e.location.nameAr] = (locations[e.location.nameAr] || 0) + 1;
    });

    return {
      total_events: events.length,
      breaking_count: breaking.length,
      categories,
      top_locations: Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 5),
      recent_events: recent.map(e => ({
        title: e.titleAr,
        category: e.category,
        location: e.location.nameAr,
        isBreaking: e.isBreaking,
        trustLevel: e.trustLevel,
        time: e.timestamp.toISOString(),
      })),
      breaking_events: breaking.map(e => ({
        title: e.titleAr,
        location: e.location.nameAr,
        time: e.timestamp.toISOString(),
      })),
    };
  }, [events]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();
      const resp = await fetch(`${BACKEND_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, context }),
      });

      let reply: string;
      if (resp.ok) {
        const data = await resp.json();
        reply = data.reply || data.response || 'عذراً، لم أتمكن من معالجة طلبك.';
      } else {
        // Fallback: generate local summary
        reply = generateLocalReply(userMsg.content, context);
      }

      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);
    } catch {
      const context = buildContext();
      const reply = generateLocalReply(userMsg.content, context);
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-110 group"
        >
          <MessageCircle className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a12]" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 left-4 z-50 w-[340px] sm:w-[380px] h-[480px] bg-[#12121a] border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">المساعد الذكي</div>
                <div className="text-[9px] text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  متصل • {events.length} حدث محمّل
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" dir="rtl">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant' ? 'bg-blue-500/20' : 'bg-gray-700'
                }`}>
                  {msg.role === 'assistant' ? <Bot className="w-3 h-3 text-blue-400" /> : <User className="w-3 h-3 text-gray-400" />}
                </div>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'assistant'
                    ? 'bg-gray-800/50 text-gray-200'
                    : 'bg-blue-500/20 text-white'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-blue-400" />
                </div>
                <div className="bg-gray-800/50 rounded-xl px-3 py-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="اسأل عن أي حدث..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
                dir="rtl"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white disabled:opacity-30 disabled:hover:bg-blue-500 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Local fallback reply generator
function generateLocalReply(question: string, context: {
  total_events: number;
  breaking_count: number;
  categories: Record<string, number>;
  top_locations: [string, number][];
  recent_events: { title: string; category: string; location: string; isBreaking: boolean; time: string }[];
  breaking_events: { title: string; location: string; time: string }[];
}): string {
  const q = question.toLowerCase();

  if (q.includes('وضع') || q.includes('ملخص') || q.includes('حالي') || q.includes('عام')) {
    const catSummary = Object.entries(context.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, count]) => {
        const names: Record<string, string> = { military: 'عسكري', alert: 'إنذار', official: 'رسمي', airspace: 'أجواء', maritime: 'بحري', fire: 'حراري', humanitarian: 'إنساني' };
        return `${names[cat] || cat}: ${count}`;
      }).join('، ');

    return `📊 ملخص الوضع الحالي:\n\n• إجمالي الأحداث: ${context.total_events}\n• أحداث عاجلة: ${context.breaking_count}\n• التصنيف: ${catSummary}\n\n📍 أكثر المواقع نشاطاً:\n${context.top_locations.slice(0, 3).map(([loc, count]) => `• ${loc} (${count} حدث)`).join('\n')}`;
  }

  if (q.includes('عاجل') || q.includes('عاجلة') || q.includes('breaking')) {
    if (context.breaking_events.length === 0) return '✅ لا توجد أحداث عاجلة حالياً.';
    return `🔴 الأحداث العاجلة (${context.breaking_events.length}):\n\n${context.breaking_events.map(e => `• ${e.title}\n  📍 ${e.location}`).join('\n\n')}`;
  }

  // Location-specific query
  const locationMatch = context.top_locations.find(([loc]) => q.includes(loc.toLowerCase()));
  if (locationMatch) {
    const locEvents = context.recent_events.filter(e => e.location === locationMatch[0]);
    return `📍 أحداث ${locationMatch[0]} (${locationMatch[1]} حدث):\n\n${locEvents.slice(0, 5).map(e => `• ${e.title}${e.isBreaking ? ' 🔴' : ''}`).join('\n')}`;
  }

  // Search in recent events
  const matchingEvents = context.recent_events.filter(e =>
    e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
  );
  if (matchingEvents.length > 0) {
    return `🔍 نتائج البحث (${matchingEvents.length}):\n\n${matchingEvents.slice(0, 5).map(e => `• ${e.title}\n  📍 ${e.location}${e.isBreaking ? ' 🔴' : ''}`).join('\n\n')}`;
  }

  return `📊 معلومات عامة:\n\n• إجمالي الأحداث المتابعة: ${context.total_events}\n• أحداث عاجلة: ${context.breaking_count}\n• أكثر المواقع نشاطاً: ${context.top_locations.slice(0, 3).map(([l]) => l).join('، ')}\n\nجرّب أسئلة مثل:\n• "ما الوضع الحالي؟"\n• "أحداث اليوم العاجلة"\n• "ملخص الأحداث"`;
}
