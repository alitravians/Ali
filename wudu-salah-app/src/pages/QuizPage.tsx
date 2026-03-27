import { useState, useMemo } from 'react';
import { getQuizByCategory, getChildrenQuiz, getAdultsQuiz } from '../data/quizData';
import type { QuizQuestion } from '../data/quizData';
import { useProgress } from '../contexts/ProgressContext';
import { RotateCcw, Trophy } from 'lucide-react';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPage() {
  const { progress, saveQuizScore, addAchievement } = useProgress();
  const isChild = progress.childMode;

  const [category, setCategory] = useState<'all' | 'wudu' | 'salah'>('all');
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const questions: QuizQuestion[] = useMemo(() => {
    let qs: QuizQuestion[];
    if (isChild) {
      qs = getChildrenQuiz();
    } else {
      qs = category === 'all' ? getAdultsQuiz() : getQuizByCategory(category).filter(q => !q.forChildren);
    }
    return shuffleArray(qs);
  }, [category, isChild, started]);

  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (q.type === 'true-false') {
        if (answers[i] === q.correctAnswer) correct++;
      } else if (q.type === 'multiple-choice') {
        if (answers[i] !== undefined && Number(answers[i]) === Number(q.correctAnswer)) correct++;
      }
    });
    return correct;
  };

  const handleAnswer = (answer: string | number) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: answer }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      const score = calculateScore();
      const pct = Math.round((score / totalQuestions) * 100);
      const quizId = isChild ? 'children' : category;
      saveQuizScore(quizId, pct);
      if (pct >= 80) addAchievement('quiz-' + quizId);
      if (pct === 100) addAchievement('perfect-' + quizId);
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setStarted(false);
    setCurrentIdx(0);
    setAnswers({});
    setShowResult(false);
    setShowExplanation(false);
  };

  if (!started) {
    return (
      <div className="px-4 py-4 space-y-4 animate-fade-in">
        <div className="bg-gradient-to-br from-accent to-accent-light rounded-2xl p-5 text-white shadow-lg text-center">
          <span className="text-4xl block mb-2">📝</span>
          <h2 className="text-xl font-bold mb-1">الاختبارات</h2>
          <p className="text-white/80 text-sm">اختبر معلوماتك في الوضوء والصلاة</p>
        </div>

        {!isChild && (
          <div className="flex gap-2">
            {(['all', 'wudu', 'salah'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  category === c ? 'bg-accent text-white' : 'bg-white dark:bg-dark-surface text-text-secondary'
                }`}
              >
                {c === 'all' ? 'الكل' : c === 'wudu' ? 'الوضوء' : 'الصلاة'}
              </button>
            ))}
          </div>
        )}

        {/* Previous scores */}
        {Object.keys(progress.quizScores).length > 0 && (
          <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-text-primary dark:text-dark-text mb-2">📊 نتائجك السابقة</h3>
            {Object.entries(progress.quizScores).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1">
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">{k === 'children' ? 'أطفال' : k === 'wudu' ? 'الوضوء' : k === 'salah' ? 'الصلاة' : 'الكل'}</span>
                <span className={`text-sm font-bold ${v >= 80 ? 'text-success' : v >= 50 ? 'text-accent' : 'text-danger'}`}>{v}%</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setStarted(true)}
          className="w-full bg-gradient-to-l from-accent to-accent-light text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          ابدأ الاختبار
        </button>
      </div>
    );
  }

  if (showResult) {
    const score = calculateScore();
    const pct = Math.round((score / totalQuestions) * 100);
    return (
      <div className="px-4 py-8 text-center animate-scale-in">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
          pct >= 80 ? 'bg-success/20' : pct >= 50 ? 'bg-accent/20' : 'bg-danger/20'
        }`}>
          <Trophy size={48} className={pct >= 80 ? 'text-success' : pct >= 50 ? 'text-accent' : 'text-danger'} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text mb-2">
          {pct >= 80 ? '🎉 ممتاز!' : pct >= 50 ? '👍 جيد!' : '💪 حاول مرة أخرى'}
        </h2>
        <p className="text-text-secondary dark:text-dark-text-secondary mb-1">
          النتيجة: {score} / {totalQuestions}
        </p>
        <p className={`text-3xl font-bold mb-6 ${pct >= 80 ? 'text-success' : pct >= 50 ? 'text-accent' : 'text-danger'}`}>
          {pct}%
        </p>

        {pct >= 80 && (
          <div className="bg-success/10 rounded-xl p-3 mb-4">
            <p className="text-success text-sm font-medium">🏅 حصلت على شارة الإنجاز!</p>
          </div>
        )}

        {/* Review answers */}
        <div className="text-right space-y-3 mb-6">
          {questions.map((q, i) => {
            const userAns = answers[i];
            const isCorrect = q.type === 'true-false'
              ? userAns === q.correctAnswer
              : userAns !== undefined && Number(userAns) === Number(q.correctAnswer);
            return (
              <div key={i} className={`bg-white dark:bg-dark-surface rounded-xl p-3 border-r-4 ${isCorrect ? 'border-success' : 'border-danger'}`}>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text mb-1">{q.question}</p>
                <p className={`text-xs ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? '✔ إجابة صحيحة' : '✖ إجابة خاطئة'}
                </p>
                <p className="text-xs text-text-tertiary mt-1">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <button onClick={resetQuiz} className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
          <RotateCcw size={18} />
          إعادة الاختبار
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
          السؤال {currentIdx + 1} من {totalQuestions}
        </span>
        <span className="text-sm font-bold text-primary">{Math.round(((currentIdx + 1) / totalQuestions) * 100)}%</span>
      </div>
      <div className="w-full h-2 bg-surface-tertiary dark:bg-dark-surface-secondary rounded-full mb-4">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: ((currentIdx + 1) / totalQuestions * 100) + '%' }} />
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-md mb-4">
        <h3 className="font-bold text-text-primary dark:text-dark-text text-base mb-4">{currentQ.question}</h3>

        {currentQ.type === 'multiple-choice' && currentQ.options && (
          <div className="space-y-2">
            {currentQ.options.map((opt, i) => {
              const selected = answers[currentIdx] === i;
              const answered = answers[currentIdx] !== undefined;
              const isCorrect = i === Number(currentQ.correctAnswer);
              return (
                <button
                  key={i}
                  onClick={() => !answered && handleAnswer(i)}
                  disabled={answered}
                  className={`w-full text-right p-3 rounded-xl border-2 transition-all text-sm ${
                    answered
                      ? isCorrect ? 'border-success bg-success/10 text-success' : selected ? 'border-danger bg-danger/10 text-danger' : 'border-surface-tertiary text-text-secondary'
                      : 'border-surface-tertiary hover:border-primary text-text-primary dark:text-dark-text'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {currentQ.type === 'true-false' && (
          <div className="flex gap-3">
            {['صح', 'خطأ'].map((label) => {
              const val = label === 'صح' ? 'صح' : 'خطأ';
              const selected = answers[currentIdx] === val;
              const answered = answers[currentIdx] !== undefined;
              const isCorrect = val === currentQ.correctAnswer;
              return (
                <button
                  key={label}
                  onClick={() => !answered && handleAnswer(val)}
                  disabled={answered}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                    answered
                      ? isCorrect ? 'border-success bg-success/10 text-success' : selected ? 'border-danger bg-danger/10 text-danger' : 'border-surface-tertiary text-text-secondary'
                      : 'border-surface-tertiary hover:border-primary text-text-primary dark:text-dark-text'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-3 mb-4 animate-fade-in">
          <p className="text-primary dark:text-primary-light text-sm">💡 {currentQ.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {showExplanation && (
        <button onClick={handleNext} className="w-full bg-primary text-white py-3 rounded-xl font-bold transition-all hover:bg-primary-dark">
          {currentIdx < totalQuestions - 1 ? 'السؤال التالي' : 'عرض النتيجة'}
        </button>
      )}
    </div>
  );
}
