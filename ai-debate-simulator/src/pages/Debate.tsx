import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { debateTopics, judges, getRandomScore } from '../data/debates';
import DebateStage from '../components/game/DebateStage';
import JudgesPanel from '../components/game/JudgesPanel';
import ArgumentDisplay from '../components/game/ArgumentDisplay';
import ScoreBoard from '../components/game/ScoreBoard';
import { Home, Pause, Play, SkipForward, ThumbsUp, Heart } from 'lucide-react';
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
  const [phase, setPhase] = useState<'sideSelection' | 'intro' | 'side1' | 'judging1' | 'voting1' | 'side2' | 'judging2' | 'voting2' | 'roundEnd'>('sideSelection');
  const [showJudgesAverage, setShowJudgesAverage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userSupportedSide, setUserSupportedSide] = useState<'side1' | 'side2' | null>(null);
  const [_userVotes, setUserVotes] = useState<{ round: number; vote: 'side1' | 'side2' }[]>([]);
  const [showVoting, setShowVoting] = useState(false);
  const [currentVotingSide, setCurrentVotingSide] = useState<'side1' | 'side2' | null>(null);
  
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

  // Sound effects - softer and more balanced
  const playSound = (type: 'argument' | 'score' | 'win' | 'vote' | 'select') => {
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Use softer, more pleasant sounds
      oscillator.type = 'sine'; // Softer wave type
      
      switch (type) {
        case 'argument':
          // Soft notification sound
          oscillator.frequency.value = 392; // G4 note
          gainNode.gain.value = 0.03; // Very soft
          break;
        case 'score':
          // Gentle chime
          oscillator.frequency.value = 523; // C5 note
          gainNode.gain.value = 0.04;
          break;
        case 'win':
          // Pleasant victory sound
          oscillator.frequency.value = 659; // E5 note
          gainNode.gain.value = 0.05;
          break;
        case 'vote':
          // Quick soft click
          oscillator.frequency.value = 440; // A4 note
          gainNode.gain.value = 0.03;
          break;
        case 'select':
          // Selection confirmation
          oscillator.frequency.value = 587; // D5 note
          gainNode.gain.value = 0.04;
          break;
      }
      
      // Fade out for smoother sound
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 150); // Shorter duration
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

  // Handle side selection
  const handleSideSelection = (side: 'side1' | 'side2') => {
    setUserSupportedSide(side);
    playSound('select');
    setTimeout(() => {
      setPhase('intro');
    }, 500);
  };

  // Handle user vote
  const handleVote = (vote: 'side1' | 'side2') => {
    setUserVotes(prev => [...prev, { round: currentRound, vote }]);
    playSound('vote');
    setShowVoting(false);
    
    // Give bonus points to voted side
    if (vote === 'side1') {
      setSide1TotalScore(prev => prev + 5);
    } else {
      setSide2TotalScore(prev => prev + 5);
    }
    
    // Continue to next phase
    if (currentVotingSide === 'side1') {
      setPhase('side2');
    } else {
      setPhase('roundEnd');
    }
  };

  // Main debate flow - using simple intervals
  useEffect(() => {
    if (!topic || isPaused || isProcessing || phase === 'sideSelection') return;

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
              if (isMountedRef.current) {
                setCurrentVotingSide('side1');
                setShowVoting(true);
                setPhase('voting1');
              }
            }, 1500);
            break;
            
          case 'voting1':
            // Wait for user vote - handled by handleVote function
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
              if (isMountedRef.current) {
                setCurrentVotingSide('side2');
                setShowVoting(true);
                setPhase('voting2');
              }
            }, 1500);
            break;
            
          case 'voting2':
            // Wait for user vote - handled by handleVote function
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
      {/* Side Selection Modal */}
      {phase === 'sideSelection' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 md:p-8 max-w-2xl w-full text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {isArabic ? 'اختر الطرف الذي تدعمه' : 'Choose Your Side'}
            </h2>
            <p className="text-gray-400 mb-6">
              {isArabic ? 'صوّت للطرف الذي تعتقد أنه سيفوز!' : 'Vote for the side you think will win!'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Side 1 Button */}
              <button
                onClick={() => handleSideSelection('side1')}
                className="p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105"
                style={{ 
                  borderColor: topic.side1.color,
                  backgroundColor: `${topic.side1.color}20`
                }}
              >
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: topic.side1.color }}
                >
                  👤
                </div>
                <h3 className="text-xl font-bold text-white">{side1Name}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {isArabic ? 'اضغط للدعم' : 'Click to support'}
                </p>
              </button>
              
              {/* Side 2 Button */}
              <button
                onClick={() => handleSideSelection('side2')}
                className="p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105"
                style={{ 
                  borderColor: topic.side2.color,
                  backgroundColor: `${topic.side2.color}20`
                }}
              >
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: topic.side2.color }}
                >
                  👤
                </div>
                <h3 className="text-xl font-bold text-white">{side2Name}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {isArabic ? 'اضغط للدعم' : 'Click to support'}
                </p>
              </button>
            </div>
            
            {/* Skip option */}
            <button
              onClick={() => setPhase('intro')}
              className="mt-6 text-gray-500 hover:text-gray-300 text-sm"
            >
              {isArabic ? 'تخطي والمشاهدة فقط' : 'Skip and just watch'}
            </button>
          </div>
        </div>
      )}

      {/* Voting Modal */}
      {showVoting && (phase === 'voting1' || phase === 'voting2') && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 md:p-8 max-w-2xl w-full text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {isArabic ? 'صوّت للحجة الأقوى!' : 'Vote for the Stronger Argument!'}
            </h2>
            <p className="text-gray-400 mb-6">
              {isArabic 
                ? `الجولة ${currentRound} - من كانت حجته أقوى؟` 
                : `Round ${currentRound} - Whose argument was stronger?`}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vote Side 1 */}
              <button
                onClick={() => handleVote('side1')}
                className="p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex flex-col items-center"
                style={{ 
                  borderColor: topic.side1.color,
                  backgroundColor: userSupportedSide === 'side1' ? `${topic.side1.color}30` : `${topic.side1.color}10`
                }}
              >
                <ThumbsUp size={32} style={{ color: topic.side1.color }} />
                <h3 className="text-xl font-bold text-white mt-3">{side1Name}</h3>
                {userSupportedSide === 'side1' && (
                  <span className="text-xs mt-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                    {isArabic ? 'فريقك' : 'Your team'}
                  </span>
                )}
                <p className="text-gray-400 text-sm mt-2">+5 {isArabic ? 'نقاط' : 'points'}</p>
              </button>
              
              {/* Vote Side 2 */}
              <button
                onClick={() => handleVote('side2')}
                className="p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 flex flex-col items-center"
                style={{ 
                  borderColor: topic.side2.color,
                  backgroundColor: userSupportedSide === 'side2' ? `${topic.side2.color}30` : `${topic.side2.color}10`
                }}
              >
                <ThumbsUp size={32} style={{ color: topic.side2.color }} />
                <h3 className="text-xl font-bold text-white mt-3">{side2Name}</h3>
                {userSupportedSide === 'side2' && (
                  <span className="text-xs mt-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                    {isArabic ? 'فريقك' : 'Your team'}
                  </span>
                )}
                <p className="text-gray-400 text-sm mt-2">+5 {isArabic ? 'نقاط' : 'points'}</p>
              </button>
            </div>
            
            {/* User's supported side indicator */}
            {userSupportedSide && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <Heart size={16} className="text-red-400" />
                <span className="text-gray-400">
                  {isArabic ? 'أنت تدعم: ' : 'You support: '}
                  <span className="text-white font-bold">
                    {userSupportedSide === 'side1' ? side1Name : side2Name}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
