import { useEffect } from 'react';
import { wuduIntro } from '../data/wuduData';
import SubSectionCard from '../components/SubSectionCard';
import { useProgress } from '../contexts/ProgressContext';

export default function WuduIntroPage() {
  const { completeLesson } = useProgress();
  useEffect(() => { completeLesson('wudu-intro'); }, [completeLesson]);

  const subSections = [
    { title: 'شروط الوضوء', description: 'شروط صحة الوضوء', icon: '✅', path: '/wudu/conditions', count: 6 },
    { title: 'خطوات الوضوء', description: 'تعلم الوضوء خطوة بخطوة', icon: '💧', path: '/wudu/steps', count: 10 },
    { title: 'الأخطاء الشائعة', description: 'تجنب الأخطاء في الوضوء', icon: '⚠️', path: '/wudu/mistakes', count: 8 },
    { title: 'مبطلات الوضوء', description: 'ما ينقض الوضوء', icon: '🚫', path: '/wudu/invalidators', count: 6 },
  ];

  return (
    <div className="px-4 py-4 space-y-4 animate-fade-in">
      {/* Intro Card */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-2">{wuduIntro.title}</h2>
        <p className="text-white/90 text-sm leading-relaxed mb-3">{wuduIntro.definition}</p>
        <p className="text-white/80 text-sm leading-relaxed">{wuduIntro.importance}</p>
      </div>

      {/* Virtues */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-text-primary dark:text-dark-text mb-3">✨ فضائل الوضوء</h3>
        <ul className="space-y-2">
          {wuduIntro.virtues.map((v, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
              <span className="text-primary mt-0.5">●</span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sub sections */}
      <div className="space-y-2">
        {subSections.map((s) => (
          <SubSectionCard key={s.path} {...s} />
        ))}
      </div>
    </div>
  );
}
