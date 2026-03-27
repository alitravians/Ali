import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ProgressState {
  completedLessons: string[];
  quizScores: Record<string, number>;
  favorites: string[];
  achievements: string[];
  lastVisited: string;
  childMode: boolean;
}

interface ProgressContextType {
  progress: ProgressState;
  completeLesson: (id: string) => void;
  saveQuizScore: (quizId: string, score: number) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addAchievement: (id: string) => void;
  hasAchievement: (id: string) => boolean;
  setLastVisited: (path: string) => void;
  toggleChildMode: () => void;
  resetProgress: () => void;
  getOverallProgress: () => number;
}

const defaultProgress: ProgressState = {
  completedLessons: [],
  quizScores: {},
  favorites: [],
  achievements: [],
  lastVisited: '/',
  childMode: false,
};

const ProgressContext = createContext<ProgressContextType>({
  progress: defaultProgress,
  completeLesson: () => {},
  saveQuizScore: () => {},
  toggleFavorite: () => {},
  isFavorite: () => false,
  addAchievement: () => {},
  hasAchievement: () => false,
  setLastVisited: () => {},
  toggleChildMode: () => {},
  resetProgress: () => {},
  getOverallProgress: () => 0,
});

const TOTAL_LESSONS = 20;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => {
    const saved = localStorage.getItem('wudu-salah-progress');
    return saved ? JSON.parse(saved) : defaultProgress;
  });

  useEffect(() => {
    localStorage.setItem('wudu-salah-progress', JSON.stringify(progress));
  }, [progress]);

  const completeLesson = useCallback((id: string) => {
    setProgress(prev => ({
      ...prev,
      completedLessons: prev.completedLessons.includes(id) ? prev.completedLessons : [...prev.completedLessons, id],
    }));
  }, []);

  const saveQuizScore = useCallback((quizId: string, score: number) => {
    setProgress(prev => ({
      ...prev,
      quizScores: { ...prev.quizScores, [quizId]: Math.max(prev.quizScores[quizId] || 0, score) },
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setProgress(prev => ({
      ...prev,
      favorites: prev.favorites.includes(id)
        ? prev.favorites.filter(f => f !== id)
        : [...prev.favorites, id],
    }));
  }, []);

  const isFavorite = (id: string) => progress.favorites.includes(id);

  const addAchievement = useCallback((id: string) => {
    setProgress(prev => ({
      ...prev,
      achievements: prev.achievements.includes(id) ? prev.achievements : [...prev.achievements, id],
    }));
  }, []);

  const hasAchievement = (id: string) => progress.achievements.includes(id);

  const setLastVisited = useCallback((path: string) => {
    setProgress(prev => ({ ...prev, lastVisited: path }));
  }, []);

  const toggleChildMode = useCallback(() => {
    setProgress(prev => ({ ...prev, childMode: !prev.childMode }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
    localStorage.removeItem('wudu-salah-progress');
  }, []);

  const getOverallProgress = () => {
    return Math.round((progress.completedLessons.length / TOTAL_LESSONS) * 100);
  };

  return (
    <ProgressContext.Provider value={{
      progress, completeLesson, saveQuizScore, toggleFavorite, isFavorite,
      addAchievement, hasAchievement, setLastVisited, toggleChildMode, resetProgress, getOverallProgress,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => useContext(ProgressContext);
