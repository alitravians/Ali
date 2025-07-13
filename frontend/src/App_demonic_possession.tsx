import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface DemonicAlert {
  id: number;
  message: string;
  severity: 'WHISPER' | 'SCREAM' | 'TORMENT' | 'POSSESSION';
  timestamp: Date;
}

interface PossessedSoul {
  id: number;
  name: string;
  nameAr: string;
  corruptionLevel: number;
  status: 'CORRUPTED' | 'POSSESSED' | 'DAMNED';
}

const App: React.FC = () => {
  const [soulIntegrity, setSoulIntegrity] = useState(100);
  const [demonicPresence, setDemonicPresence] = useState(0);
  const [possessionProgress, setPossessionProgress] = useState(0);
  const [damnationTimer, setDamnationTimer] = useState(6666);
  const [demonicAlerts, setDemonicAlerts] = useState<DemonicAlert[]>([]);
  const [, setAudioActive] = useState(false);
  const [fullPossession, setFullPossession] = useState(false);
  const [possessedSouls, setPossessedSouls] = useState<PossessedSoul[]>([]);
  const [shadowDemons, setShadowDemons] = useState<{x: number, y: number, id: number, type: string}[]>([]);
  const [screenDistortion, setScreenDistortion] = useState(false);
  const [demonicVisions, setDemonicVisions] = useState<{x: number, y: number, id: number, vision: string}[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const demonicAudioFiles = [
    '/Jumpscare_Horror_Sound_Effects_01.mp3',
    '/Jumpscare_Horror_Sound_Effects_05.mp3', 
    '/Jumpscare_Horror_Sound_Effects_09.mp3',
    '/evil_beep.wav',
    '/evil_laugh.wav',
    '/terrifying_scream.wav'
  ];

  const demonicMessages = [
    { en: "YOUR SOUL BELONGS TO US NOW", ar: "روحك ملكنا الآن" },
    { en: "THE DEMONS HAVE AWAKENED", ar: "الشياطين قد استيقظت" },
    { en: "ETERNAL TORMENT AWAITS", ar: "العذاب الأبدي في انتظارك" },
    { en: "YOUR FLESH IS OUR VESSEL", ar: "جسدك هو وعاؤنا" },
    { en: "HELL'S GATES ARE OPEN", ar: "أبواب الجحيم مفتوحة" },
    { en: "THE DARKNESS CONSUMES ALL", ar: "الظلام يلتهم كل شيء" },
    { en: "YOUR SCREAMS FEED US", ar: "صراخك يغذينا" },
    { en: "WELCOME TO YOUR NIGHTMARE", ar: "مرحباً بك في كابوسك" }
  ];

  const humanSouls = [
    { id: 1, name: "Innocent Child", nameAr: "طفل بريء" },
    { id: 2, name: "Faithful Believer", nameAr: "مؤمن مخلص" },
    { id: 3, name: "Pure Heart", nameAr: "قلب طاهر" },
    { id: 4, name: "Righteous Soul", nameAr: "روح صالحة" },
    { id: 5, name: "Holy Priest", nameAr: "كاهن مقدس" },
    { id: 6, name: "Loving Mother", nameAr: "أم محبة" },
    { id: 7, name: "Kind Father", nameAr: "أب طيب" },
    { id: 8, name: "Gentle Spirit", nameAr: "روح لطيفة" }
  ];

  const demonicVisionTypes = [
    '👹', '💀', '🔥', '⚡', '👁️', '🩸', '⛓️', '🗡️'
  ];

  useEffect(() => {
    initializeDemonicAudio();
    startSoulCorruption();
    startDemonicAlerts();
    startDamnationCountdown();
    startPossessionSequence();
    startHellishSounds();
    startDemonicVisions();
  }, []);

  const initializeDemonicAudio = () => {
    const playDemonicAudio = () => {
      if (audioRef.current) {
        const randomAudio = demonicAudioFiles[Math.floor(Math.random() * demonicAudioFiles.length)];
        audioRef.current.src = randomAudio;
        audioRef.current.volume = 0.95;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.log('Audio play failed:', error);
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
          }, 1000);
        });
      }
    };

    if (audioRef.current) {
      audioRef.current.onended = () => {
        setTimeout(() => {
          playDemonicAudio();
        }, Math.random() * 3000 + 1000);
      };
    }

    setTimeout(() => {
      setAudioActive(true);
      playDemonicAudio();
    }, 500);
  };

  const startSoulCorruption = () => {
    setInterval(() => {
      setSoulIntegrity(prev => Math.max(prev - Math.random() * 3, 0));
      setDemonicPresence(prev => Math.min(prev + Math.random() * 4, 100));
      setPossessionProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 2, 100);
        if (newProgress >= 80 && !fullPossession) {
          setFullPossession(true);
          setScreenDistortion(true);
          setTimeout(() => setScreenDistortion(false), 1000);
        }
        return newProgress;
      });
    }, 1200);
  };

  const startDemonicAlerts = () => {
    setInterval(() => {
      const randomMessage = demonicMessages[Math.floor(Math.random() * demonicMessages.length)];
      const severities: ('WHISPER' | 'SCREAM' | 'TORMENT' | 'POSSESSION')[] = ['WHISPER', 'SCREAM', 'TORMENT', 'POSSESSION'];
      
      setDemonicAlerts(prev => [
        ...prev,
        {
          id: Date.now(),
          message: randomMessage.ar,
          severity: severities[Math.floor(Math.random() * severities.length)],
          timestamp: new Date()
        }
      ].slice(-7));
    }, 2000);
  };

  const startDamnationCountdown = () => {
    setInterval(() => {
      setDamnationTimer(prev => {
        const newTime = Math.max(prev - 1, 0);
        if (newTime <= 666) {
          setFullPossession(true);
        }
        return newTime;
      });
    }, 1000);
  };

  const startPossessionSequence = () => {
    humanSouls.forEach((soul, index) => {
      setTimeout(() => {
        setPossessedSouls(prev => [
          ...prev,
          {
            ...soul,
            corruptionLevel: Math.random() * 100,
            status: Math.random() > 0.7 ? 'DAMNED' : Math.random() > 0.4 ? 'POSSESSED' : 'CORRUPTED'
          }
        ]);
      }, index * 4000);
    });
  };

  const startHellishSounds = () => {
    setInterval(() => {
      if (Math.random() > 0.3) {
        setAudioActive(true);
      }
    }, 5000);
  };

  const startDemonicVisions = () => {
    setInterval(() => {
      spawnShadowDemon();
      spawnDemonicVision();
    }, 1500);
  };

  const spawnShadowDemon = () => {
    const newDemon = {
      id: Date.now(),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      type: demonicVisionTypes[Math.floor(Math.random() * demonicVisionTypes.length)]
    };
    
    setShadowDemons(prev => [...prev, newDemon].slice(-15));
    
    setTimeout(() => {
      setShadowDemons(prev => prev.filter(demon => demon.id !== newDemon.id));
    }, 5000);
  };

  const spawnDemonicVision = () => {
    const visions = ['HELL', 'PAIN', 'DEATH', 'FEAR', 'DOOM', 'EVIL', 'DARK', 'BURN'];
    const newVision = {
      id: Date.now() + Math.random(),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vision: visions[Math.floor(Math.random() * visions.length)]
    };
    
    setDemonicVisions(prev => [...prev, newVision].slice(-10));
    
    setTimeout(() => {
      setDemonicVisions(prev => prev.filter(vision => vision.id !== newVision.id));
    }, 7000);
  };

  const formatDamnationTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'POSSESSION': return 'text-red-600 bg-red-900 border-red-600';
      case 'TORMENT': return 'text-orange-500 bg-orange-900 border-orange-500';
      case 'SCREAM': return 'text-yellow-500 bg-yellow-900 border-yellow-500';
      case 'WHISPER': return 'text-purple-500 bg-purple-900 border-purple-500';
      default: return 'text-red-400 bg-red-700 border-red-400';
    }
  };

  return (
    <div className={`min-h-screen bg-black text-red-400 font-mono overflow-hidden relative ${screenDistortion ? 'animate-pulse' : ''} ${fullPossession ? 'bg-red-900 bg-opacity-50' : ''}`}
         style={{
           background: fullPossession 
             ? 'radial-gradient(circle, #660000, #330000, #000000)' 
             : 'radial-gradient(circle, #000000, #110000, #220000)',
           filter: `brightness(${fullPossession ? 0.7 : 0.9}) contrast(${fullPossession ? 2.0 : 1.5}) saturate(${possessionProgress > 50 ? 2.0 : 1.3})`
         }}>
      
      <audio ref={audioRef} />
      
      {/* Shadow Demons */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {shadowDemons.map((demon) => (
          <div key={demon.id}
               className="absolute text-red-600 text-4xl animate-bounce"
               style={{
                 left: demon.x,
                 top: demon.y,
                 textShadow: '0 0 30px #ff0000, 0 0 60px #ff0000',
                 animation: 'bounce 3s ease-in-out infinite',
                 transform: `rotate(${Math.random() * 360}deg) scale(${0.7 + Math.random() * 0.6})`
               }}>
            {demon.type}
          </div>
        ))}
      </div>

      {/* Demonic Visions */}
      {demonicVisions.map(vision => (
        <div key={vision.id}
             className="fixed text-6xl animate-pulse z-30 pointer-events-none opacity-70"
             style={{
               left: vision.x,
               top: vision.y,
               textShadow: '0 0 50px red, 0 0 100px red',
               animation: 'pulse 4s ease-in-out infinite',
               color: '#ff0000',
               fontWeight: 'bold'
             }}>
          {vision.vision}
        </div>
      ))}

      {/* Full Possession Alert */}
      {fullPossession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-pulse">
            <div className="text-9xl mb-4 text-red-600" style={{textShadow: '0 0 100px red'}}>
              👹💀👹
            </div>
            <div className="text-6xl font-bold text-red-500 mb-4">
              COMPLETE DEMONIC POSSESSION
            </div>
            <div className="text-5xl text-red-400">
              استحواذ شيطاني كامل
            </div>
            <div className="text-3xl text-red-300 mt-4">
              YOUR SOUL IS OURS FOREVER
            </div>
          </div>
        </div>
      )}

      {/* Main Interface */}
      <div className="relative z-20 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-7xl font-bold mb-4 animate-pulse text-red-500" 
              style={{textShadow: '0 0 80px red'}}>
            👹 استحواذ شيطاني - روحك في خطر 👹
          </h1>
          <h2 className="text-5xl mb-4 text-red-400">
            DEMONIC POSSESSION - YOUR SOUL IS BEING CONSUMED
          </h2>
          <p className="text-3xl text-red-300 animate-pulse">
            الشياطين تسيطر على روحك - لا مفر من العذاب الأبدي
          </p>
        </div>

        {/* Soul Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-900 bg-opacity-90 p-4 rounded border-2 border-red-500 animate-pulse">
            <h3 className="text-lg font-bold mb-2 text-red-300">سلامة الروح</h3>
            <div className="text-4xl font-mono text-red-500">{Math.floor(soulIntegrity)}%</div>
            <div className="text-sm text-red-400">Soul Integrity</div>
          </div>

          <div className="bg-orange-900 bg-opacity-90 p-4 rounded border-2 border-orange-500 animate-pulse">
            <h3 className="text-lg font-bold mb-2 text-orange-300">الحضور الشيطاني</h3>
            <div className="text-4xl font-mono text-orange-500">{Math.floor(demonicPresence)}%</div>
            <div className="text-sm text-orange-400">Demonic Presence</div>
          </div>

          <div className="bg-yellow-900 bg-opacity-90 p-4 rounded border-2 border-yellow-500 animate-pulse">
            <h3 className="text-lg font-bold mb-2 text-yellow-300">تقدم الاستحواذ</h3>
            <div className="text-4xl font-mono text-yellow-500">{Math.floor(possessionProgress)}%</div>
            <div className="text-sm text-yellow-400">Possession Progress</div>
          </div>

          <div className="bg-purple-900 bg-opacity-90 p-4 rounded border-2 border-purple-500 animate-pulse">
            <h3 className="text-lg font-bold mb-2 text-purple-300">العد التنازلي للهلاك</h3>
            <div className="text-2xl font-mono text-purple-600">{formatDamnationTime(damnationTimer)}</div>
            <div className="text-sm text-purple-400">Damnation Timer</div>
          </div>
        </div>

        {/* Demonic Alerts */}
        <div className="mb-8">
          <h3 className="text-3xl font-bold mb-4 text-red-400 animate-pulse">رسائل من الجحيم</h3>
          <div className="space-y-2">
            {demonicAlerts.map(alert => (
              <div key={alert.id} 
                   className={`p-4 rounded border-2 animate-pulse ${getSeverityColor(alert.severity)}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl">
                    👹 {alert.message}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-bold">{alert.severity}</div>
                    <div className="text-xs">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Possessed Souls */}
        <div className="mb-8">
          <h3 className="text-3xl font-bold mb-4 text-red-400">الأرواح المستحوذة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {possessedSouls.map(soul => (
              <div key={soul.id} 
                   className="bg-red-800 bg-opacity-80 p-4 rounded border border-red-500">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-red-300">{soul.nameAr}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    soul.status === 'DAMNED' ? 'bg-red-600 text-white' :
                    soul.status === 'POSSESSED' ? 'bg-orange-600 text-white' :
                    'bg-yellow-600 text-black'
                  }`}>
                    {soul.status}
                  </span>
                </div>
                <div className="text-sm text-red-400 mb-2">{soul.name}</div>
                <div className="text-xs text-red-300 mb-2">
                  Corruption: {Math.floor(soul.corruptionLevel)}%
                </div>
                <div className="w-full bg-red-900 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full animate-pulse" 
                       style={{width: `${soul.corruptionLevel}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demonic Message */}
        {fullPossession && (
          <div className="border border-red-600 p-6 bg-red-900 bg-opacity-60 animate-pulse">
            <h3 className="text-3xl font-bold text-red-400 mb-4">👹 رسالة من سيد الشياطين</h3>
            <p className="text-red-300 mb-4 text-xl">
              روحك الآن ملكنا إلى الأبد. ستعيش في عذاب لا ينتهي في أعماق الجحيم.
            </p>
            <p className="text-red-300 text-xl">
              YOUR SOUL NOW BELONGS TO US FOR ETERNITY. YOU WILL SUFFER ENDLESS TORMENT IN THE DEPTHS OF HELL.
            </p>
            <div className="mt-6 text-center">
              <div className="text-red-400 font-bold text-3xl animate-bounce">
                💀 WELCOME TO HELL 💀
              </div>
              <div className="text-yellow-400 text-lg mt-3">
                TIME UNTIL ETERNAL DAMNATION: {formatDamnationTime(damnationTimer)}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-4 mt-8">
          <p>تم تطوير النظام بواسطة Boon</p>
          <p className="text-red-400 animate-pulse">👹 تحذير: منطقة استحواذ شيطاني 👹</p>
          <p className="text-yellow-400 text-xs mt-2">WARNING: DEMONIC POSSESSION ZONE</p>
        </div>
      </div>
    </div>
  );
};

export default App;
