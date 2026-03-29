import { useNavigate } from 'react-router-dom';
import { useProgress } from '../contexts/ProgressContext';
import { useEffect } from 'react';
import { speakArabic, stopSpeaking } from '../utils/tts';
import TappableText from '../components/TappableText';

export default function ChildrenPage() {
  const navigate = useNavigate();
  const { progress, toggleChildMode } = useProgress();

  useEffect(() => {
    if (!progress.childMode) toggleChildMode();
    speakArabic('مرحبا بك! هيا نتعلم الوضوء والصلاة معا');
    return () => stopSpeaking();
  }, []);

  const items = [
    { title: 'تعلم الوضوء', desc: 'هيا نتعلم الوضوء معاً!', icon: '💧', path: '/wudu/steps', color: 'from-cyan-400 to-cyan-500' },
    { title: 'تعلم الصلاة', desc: 'هيا نتعلم الصلاة معاً!', icon: '🕌', path: '/salah/steps', color: 'from-green-400 to-green-500' },
    { title: 'الأذكار', desc: 'أذكار سهلة وجميلة', icon: '🌟', path: '/adhkar', color: 'from-purple-400 to-purple-500' },
    { title: 'اختبر نفسك!', desc: 'هل تعرف الإجابة؟', icon: '🎯', path: '/quiz', color: 'from-amber-400 to-amber-500' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-children-primary to-children-secondary text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="text-center">
          <span className="text-5xl block mb-2">👶🌟</span>
          <TappableText text="مرحبا بك! هيا نتعلم الوضوء والصلاة معا" as="h1" className="text-2xl font-bold mb-1 justify-center text-white" iconSize={20}>
            مرحباً بك!
          </TappableText>
          <TappableText text="هيا نتعلم الوضوء والصلاة معا" as="p" className="text-white/80 justify-center" iconSize={16}>
            هيا نتعلم الوضوء والصلاة معاً
          </TappableText>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 -mt-4">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full bg-gradient-to-l ${item.color} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all text-right text-white`}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{item.icon}</span>
              <div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-white/80 text-sm">{item.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
