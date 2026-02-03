import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { debateTopics, judges, getRandomScore } from '../data/debates';
import DebateStage from '../components/game/DebateStage';
import JudgesPanel from '../components/game/JudgesPanel';
import ArgumentDisplay from '../components/game/ArgumentDisplay';
import ScoreBoard from '../components/game/ScoreBoard';
import { Home, Pause, Play, SkipForward } from 'lucide-react';
import i18n from '../i18n/config';

interface JudgeScore {
  judgeId: string;
  score: number | null;
  isEvaluating: boolean;
}

interface RoundResult {
  round: number;
  side1Score: number;
  side2Score: number;
  side1Argument: string;
  side2Argument: string;
}

const Debate: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const topic = debateTopics.find(t => t.id === topicId);
  
  const [currentRound, setCurrentRound] = useState(1);
  const [activeSide, setActiveSide] = useState<'side1' | 'side2' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentArgument, setCurrentArgument] = useState('');
  const [judgeScores, setJudgeScores] = useState<JudgeScore[]>(
    judges.map(j => ({ judgeId: j.id, score: null, isEvaluating: false }))
  );
  const [side1TotalScore, setSide1TotalScore] = useState(0);
  const [side2TotalScore, setSide2TotalScore] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roundResults, _setRoundResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<'intro' | 'side1' | 'judging1' | 'side2' | 'judging2' | 'roundEnd'>('intro');
  const [showJudgesAverage, setShowJudgesAverage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const totalRounds = topic ? Math.min(topic.side1.arguments.length, topic.side2.arguments.length) : 4;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sound effects
  const playSound = (type: 'argument' | 'score' | 'win') => {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'argument':
          oscillator.frequency.value = 440;
          gainNode.gain.value = 0.1;
          break;
        case 'score':
          oscillator.frequency.value = 880;
          gainNode.gain.value = 0.1;
          break;
        case 'win':
          oscillator.frequency.value = 660;
          gainNode.gain.value = 0.15;
          break;
      }
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    } catch (e) {
      // Ignore audio errors
    }
  };

  // Safe timeout helper
  const safeTimeout = (callback: () => void, delay: number) => {
    return new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          callback();
        }
        resolve();
      }, delay);
    });
  };

  // Main debate flow - using simple intervals
  useEffect(() => {
    if (!topic || isPaused || isProcessing) return;

    const runPhase = async () => {
      if (!isMountedRef.current) return;
      setIsProcessing(true);

      try {
        switch (phase) {
          case 'intro':
            await safeTimeout(() => {
              if (isMountedRef.current) setPhase('side1');
            }, 2000);
            break;
            
          case 'side1':
            setActiveSide('side1');
            setIsSpeaking(true);
            const arg1 = isArabic 
              ? topic.side1.arguments[currentRound - 1]?.ar 
              : topic.side1.arguments[currentRound - 1]?.en;
            setCurrentArgument(arg1 || '');
            playSound('argument');
            await safeTimeout(() => {
              if (isMountedRef.current) {
                setIsSpeaking(false);
                setPhase('judging1');
              }
            }, 4000);
            break;
            
          case 'judging1':
            setActiveSide(null);
            setShowJudgesAverage(false);
            setJudgeScores(judges.map(j => ({ judgeId: j.id, score: null, isEvaluating: false })));
            
            // Evaluate judges one by one
            let score1Total = 0;
            for (let i = 0; i < judges.length; i++) {
              await new Promise(r => setTimeout(r, 400));
              if (!isMountedRef.current) return;
              setJudgeScores(prev => prev.map((js, idx) => 
                idx === i ? { ...js, isEvaluating: true } : js
              ));
              await new Promise(r => setTimeout(r, 600));
              if (!isMountedRef.current) return;
              const score = getRandomScore();
              score1Total += score;
              playSound('score');
              setJudgeScores(prev => prev.map((js, idx) => 
                idx === i ? { ...js, score, isEvaluating: false } : js
              ));
            }
            
            setShowJudgesAverage(true);
            const avg1 = Math.round(score1Total / judges.length);
            setSide1TotalScore(prev => prev + avg1);
            
            await safeTimeout(() => {
              if (isMountedRef.current) setPhase('side2');
            }, 1500);
            break;
            
          case 'side2':
            setActiveSide('side2');
            setIsSpeaking(true);
            const arg2 = isArabic 
              ? topic.side2.arguments[currentRound - 1]?.ar 
              : topic.side2.arguments[currentRound - 1]?.en;
            setCurrentArgument(arg2 || '');
            playSound('argument');
            await safeTimeout(() => {
              if (isMountedRef.current) {
                setIsSpeaking(false);
                setPhase('judging2');
              }
            }, 4000);
            break;
            
          case 'judging2':
            setActiveSide(null);
            setShowJudgesAverage(false);
            setJudgeScores(judges.map(j => ({ judgeId: j.id, score: null, isEvaluating: false })));
            
            // Evaluate judges one by one
            let score2Total = 0;
            for (let i = 0; i < judges.length; i++) {
              await new Promise(r => setTimeout(r, 400));
              if (!isMountedRef.current) return;
              setJudgeScores(prev => prev.map((js, idx) => 
                idx === i ? { ...js, isEvaluating: true } : js
              ));
              await new Promise(r => setTimeout(r, 600));
              if (!isMountedRef.current) return;
              const score = getRandomScore();
              score2Total += score;
              playSound('score');
              setJudgeScores(prev => prev.map((js, idx) => 
                idx === i ? { ...js, score, isEvaluating: false } : js
              ));
            }
            
            setShowJudgesAverage(true);
            const avg2 = Math.round(score2Total / judges.length);
            setSide2TotalScore(prev => prev + avg2);
            
            await safeTimeout(() => {
              if (isMountedRef.current) setPhase('roundEnd');
            }, 1500);
            break;
            
          case 'roundEnd':
            if (currentRound >= totalRounds) {
              // Debate finished
              playSound('win');
              await new Promise(r => setTimeout(r, 2000));
              if (isMountedRef.current) {
                navigate('/results', {
                  state: {
                    topic,
                    side1TotalScore,
                    side2TotalScore,
                    roundResults,
                  }
                });
              }
            } else {
              // Next round
              setCurrentRound(prev => prev + 1);
              setCurrentArgument('');
              await safeTimeout(() => {
                if (isMountedRef.current) setPhase('side1');
              }, 1500);
            }
            break;
        }
      } finally {
        if (isMountedRef.current) {
          setIsProcessing(false);
        }
      }
    };

    runPhase();
  }, [phase, isPaused]);

  const handleSkip = () => {
    if (phase === 'side1' || phase === 'side2') {
      setIsSpeaking(false);
      setPhase(phase === 'side1' ? 'judging1' : 'judging2');
    }
  };

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">{t('common.error')}</div>
      </div>
    );
  }

  const side1Name = isArabic ? topic.side1.nameAr : topic.side1.nameEn;
  const side2Name = isArabic ? topic.side2.nameAr : topic.side2.nameEn;
  const topicTitle = isArabic ? topic.titleAr : topic.titleEn;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          <Home size={24} />
        </button>
        
        <h1 className="text-xl md:text-2xl font-bold text-white text-center flex-1 mx-4">
          {topicTitle}
        </h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
          <button
            onClick={handleSkip}
            disabled={phase !== 'side1' && phase !== 'side2'}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <SkipForward size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Score Board */}
        <div className="flex justify-center">
          <ScoreBoard
            currentRound={currentRound}
            totalRounds={totalRounds}
            side1Score={side1TotalScore}
            side2Score={side2TotalScore}
            side1Name={side1Name}
            side2Name={side2Name}
            side1Color={topic.side1.color}
            side2Color={topic.side2.color}
          />
        </div>

        {/* Debate Stage */}
        <DebateStage
          side1={{
            name: side1Name,
            color: topic.side1.color,
            score: side1TotalScore,
            customImage: localStorage.getItem('side1Image'),
          }}
          side2={{
            name: side2Name,
            color: topic.side2.color,
            score: side2TotalScore,
            customImage: localStorage.getItem('side2Image'),
          }}
          activeSide={activeSide}
          isSpeaking={isSpeaking}
        />

        {/* Argument Display */}
        <ArgumentDisplay
          argument={currentArgument}
          speakerName={activeSide === 'side1' ? side1Name : side2Name}
          speakerColor={activeSide === 'side1' ? topic.side1.color : topic.side2.color}
          isVisible={!!currentArgument && (phase === 'side1' || phase === 'side2')}
        />

        {/* Judges Panel */}
        <div className="flex justify-center">
          <JudgesPanel
            scores={judgeScores}
            showAverage={showJudgesAverage}
          />
        </div>

        {/* Status */}
        <div className="text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm ${
            isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {isPaused ? t('debate.pause') : t('debate.debateInProgress')}
          </span>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default Debate;
