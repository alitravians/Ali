import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App: React.FC = () => {
  const [, setAudioActive] = useState(false);
  const [, setSurvivors] = useState(8);
  const [, setInfectionRate] = useState(94);
  const [, setZombieCount] = useState(4521);
  const [, setTimeToEvacuation] = useState(18 * 60 + 32);
  const [, setCurrentAlert] = useState('');
  const [, setDeadCount] = useState(28947);
  const [, ] = useState('FAILED');
  const [, setBiohazardLevel] = useState(5);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSurvivors(prev => Math.max(0, prev - Math.floor(Math.random() * 2)));
      setInfectionRate(prev => Math.min(100, prev + Math.random() * 0.3));
      setZombieCount(prev => prev + Math.floor(Math.random() * 75));
      setTimeToEvacuation(prev => Math.max(0, prev - 1));
      setDeadCount(prev => prev + Math.floor(Math.random() * 150));
      setBiohazardLevel(prev => Math.min(5, prev + (Math.random() > 0.9 ? 1 : 0)));
    }, 2500);

    const alertTimer = setInterval(() => {
      const alerts = [
        'تحذير عاجل: انتشار وباء الزومبي خارج السيطرة',
        'خطر أقصى: الموتى الأحياء يهاجمون المدن',
        'إنذار أحمر: انهيار الحضارة البشرية',
        'تنبيه كارثي: فشل جميع خطط الإخلاء',
        'حالة طوارئ: تسرب بيولوجي مميت'
      ];
      setCurrentAlert(alerts[Math.floor(Math.random() * alerts.length)]);
    }, 3500);

    const playAudio = () => {
      if (audioRef.current) {
        const audioFiles = [
          '/Jumpscare_Horror_Sound_Effects_01.mp3',
          '/Jumpscare_Horror_Sound_Effects_05.mp3',
          '/Jumpscare_Horror_Sound_Effects_09.mp3'
        ];
        
        const randomAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        audioRef.current.src = randomAudio;
        audioRef.current.volume = 0.9;
        audioRef.current.play().catch(console.error);
        setAudioActive(true);
      }
    };

    const audioTimer = setTimeout(playAudio, 2000);
    const audioInterval = setInterval(playAudio, 10000 + Math.random() * 8000);

    return () => {
      clearInterval(timer);
      clearInterval(alertTimer);
      clearTimeout(audioTimer);
      clearInterval(audioInterval);
    };
  }, []);


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d0d, #1a0a00, #330000, #1a1a00, #000000)',
      color: '#ff3333',
      fontFamily: 'Courier New, monospace',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <audio ref={audioRef} />
      
      {/* Apocalyptic atmosphere with floating debris */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 15% 25%, rgba(255,69,0,0.2) 0%, transparent 35%),
          radial-gradient(circle at 85% 75%, rgba(139,0,0,0.2) 0%, transparent 35%),
          radial-gradient(circle at 45% 60%, rgba(255,0,0,0.15) 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, rgba(255,140,0,0.1) 0%, transparent 40%)
        `,
        animation: 'apocalypticPulse 5s ease-in-out infinite'
      }} />

      {/* Floating debris and ash */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${10 + i * 12}%`,
          left: `${5 + i * 11}%`,
          width: `${3 + Math.random() * 4}px`,
          height: `${3 + Math.random() * 4}px`,
          background: i % 3 === 0 ? '#8B4513' : i % 3 === 1 ? '#696969' : '#654321',
          borderRadius: '50%',
          animation: `floatDebris ${6 + i}s linear infinite ${i * 0.5}s`
        }} />
      ))}

      {/* Main header with enhanced styling */}
      <div style={{
        textAlign: 'center',
        padding: '30px',
        borderBottom: '4px solid #ff0000',
        background: 'rgba(0,0,0,0.95)',
        boxShadow: '0 0 30px rgba(255,0,0,0.6)',
        position: 'relative'
      }}>
        <div style={{ 
          fontSize: '56px', 
          fontWeight: 'bold', 
          marginBottom: '20px', 
          textShadow: '0 0 15px #ff0000, 0 0 30px #ff0000',
          animation: 'textGlow 2s ease-in-out infinite alternate'
        }}>
          🧟‍♂️ نهاية العالم - كارثة الزومبي 🧟‍♀️
        </div>
        <div style={{ 
          fontSize: '32px', 
          color: '#ffff00', 
          textShadow: '0 0 10px #ffff00',
          marginBottom: '15px'
        }}>
          ZOMBIE APOCALYPSE - CIVILIZATION COLLAPSE
        </div>
        <div style={{ fontSize: '22px', color: '#ff6666', marginTop: '15px' }}>
          الموتى الأحياء يسيطرون على الأرض - البشرية في خطر الانقراض
        </div>
        <div style={{ fontSize: '18px', color: '#ff9999', marginTop: '10px' }}>
          THE UNDEAD RULE THE EARTH - HUMANITY FACES EXTINCTION
        </div>
      </div>

      {/* Enhanced status panels with more dramatic styling */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '30px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: 'rgba(139,0,0,0.95)',
          border: '4px solid #ff0000',
          borderRadius: '20px',
          padding: '25px',
          margin: '15px',
          minWidth: '240px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(255,0,0,0.4)',
          animation: 'criticalPulse 3s ease-in-out infinite'
        }}>
          <div style={{ color: '#ffcccc', fontSize: '18px', fontWeight: 'bold' }}>الناجون المتبقون</div>
          <div style={{ color: '#ff0000', fontSize: '36px', fontWeight: 'bold', textShadow: '0 0 10px #ff0000' }}>
            8
          </div>
          <div style={{ color: '#ff9999', fontSize: '16px' }}>Survivors Remaining</div>
          <div style={{ color: '#ffaaaa', fontSize: '14px', marginTop: '5px' }}>CRITICAL</div>
        </div>

        <div style={{
          background: 'rgba(255,140,0,0.95)',
          border: '4px solid #ff8c00',
          borderRadius: '20px',
          padding: '25px',
          margin: '15px',
          minWidth: '240px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(255,140,0,0.4)',
          animation: 'warningPulse 2.5s ease-in-out infinite'
        }}>
          <div style={{ color: '#fff8dc', fontSize: '18px', fontWeight: 'bold' }}>معدل الإصابة</div>
          <div style={{ color: '#ff8c00', fontSize: '36px', fontWeight: 'bold', textShadow: '0 0 10px #ff8c00' }}>94%</div>
          <div style={{ color: '#ffd700', fontSize: '16px' }}>Infection Rate</div>
          <div style={{ color: '#ffcc00', fontSize: '14px', marginTop: '5px' }}>PANDEMIC</div>
        </div>

        <div style={{
          background: 'rgba(0,100,0,0.95)',
          border: '4px solid #32cd32',
          borderRadius: '20px',
          padding: '25px',
          margin: '15px',
          minWidth: '240px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(50,205,50,0.4)',
          animation: 'zombiePulse 2s ease-in-out infinite'
        }}>
          <div style={{ color: '#f0fff0', fontSize: '18px', fontWeight: 'bold' }}>عدد الزومبي</div>
          <div style={{ color: '#32cd32', fontSize: '36px', fontWeight: 'bold', textShadow: '0 0 10px #32cd32' }}>4,521</div>
          <div style={{ color: '#90ee90', fontSize: '16px' }}>Zombie Count</div>
          <div style={{ color: '#98fb98', fontSize: '14px', marginTop: '5px' }}>OVERRUN</div>
        </div>

        <div style={{
          background: 'rgba(75,0,130,0.95)',
          border: '4px solid #9400d3',
          borderRadius: '20px',
          padding: '25px',
          margin: '15px',
          minWidth: '240px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(148,0,211,0.4)',
          animation: 'evacuationPulse 1.8s ease-in-out infinite'
        }}>
          <div style={{ color: '#e6e6fa', fontSize: '18px', fontWeight: 'bold' }}>وقت الإخلاء</div>
          <div style={{ color: '#9400d3', fontSize: '36px', fontWeight: 'bold', textShadow: '0 0 10px #9400d3' }}>18:32</div>
          <div style={{ color: '#dda0dd', fontSize: '16px' }}>Evacuation Time</div>
          <div style={{ color: '#da70d6', fontSize: '14px', marginTop: '5px' }}>URGENT</div>
        </div>
      </div>

      {/* Enhanced critical alert with more dramatic styling */}
      <div style={{
        background: 'rgba(139,0,0,0.98)',
        border: '5px solid #ff0000',
        borderRadius: '25px',
        padding: '30px',
        margin: '30px',
        textAlign: 'center',
        animation: 'emergencyFlash 1.2s infinite',
        boxShadow: '0 0 35px rgba(255,0,0,0.6)',
        position: 'relative'
      }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', textShadow: '0 0 15px #ff0000' }}>
          ☠️ BIOHAZARD LEVEL 5 - TOTAL CONTAINMENT FAILURE ☠️
        </div>
        <div style={{ fontSize: '22px', color: '#ffff00', marginBottom: '15px', textShadow: '0 0 10px #ffff00' }}>
          ⚠️ انهيار كامل للحضارة - الموت يحكم الأرض ⚠️
        </div>
        <div style={{ fontSize: '18px', color: '#ff9999', marginTop: '15px' }}>
          COMPLETE CIVILIZATION COLLAPSE - DEATH RULES THE EARTH
        </div>
        <div style={{ fontSize: '16px', color: '#ffcccc', marginTop: '10px' }}>
          🧟‍♂️ NO SAFE ZONES REMAINING 🧟‍♀️
        </div>
      </div>

      {/* Enhanced infected zones with more locations */}
      <div style={{
        background: 'rgba(0,0,0,0.95)',
        border: '4px solid #ff4444',
        borderRadius: '20px',
        padding: '30px',
        margin: '30px'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '25px', textAlign: 'right', color: '#ff3333' }}>
          المناطق المصابة والمدمرة
        </div>
        
        <div style={{
          background: 'rgba(139,0,0,0.8)',
          border: '3px solid #8B0000',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          animation: 'overrunFlash 2s ease-in-out infinite'
        }}>
          <div style={{ color: '#ff6666', fontSize: '18px', fontWeight: 'bold' }}>OVERRUN - 100% INFECTED</div>
          <div style={{ color: '#ffcccc', fontSize: '16px' }}>مدينة الكويت</div>
          <div style={{ color: '#ff9999', fontSize: '15px' }}>Kuwait City</div>
          <div style={{ color: '#ffaaaa', fontSize: '14px' }}>Zombie Density: 100% | Survivors: 0</div>
        </div>

        <div style={{
          background: 'rgba(255,140,0,0.8)',
          border: '3px solid #ff8c00',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          animation: 'criticalFlash 2.2s ease-in-out infinite'
        }}>
          <div style={{ color: '#fff8dc', fontSize: '18px', fontWeight: 'bold' }}>CRITICAL - FALLING</div>
          <div style={{ color: '#ffd700', fontSize: '16px' }}>الرياض</div>
          <div style={{ color: '#ffff99', fontSize: '15px' }}>Riyadh</div>
          <div style={{ color: '#ffffcc', fontSize: '14px' }}>Infection Rate: 89% | Under Siege</div>
        </div>

        <div style={{
          background: 'rgba(255,69,0,0.8)',
          border: '3px solid #ff4500',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ color: '#ffe4e1', fontSize: '18px', fontWeight: 'bold' }}>EVACUATING - CHAOS</div>
          <div style={{ color: '#ffa07a', fontSize: '16px' }}>دبي</div>
          <div style={{ color: '#ffb07a', fontSize: '15px' }}>Dubai</div>
          <div style={{ color: '#ffc0cb', fontSize: '14px' }}>Survivors: 156 | Evacuation Failed</div>
        </div>

        <div style={{
          background: 'rgba(128,0,128,0.8)',
          border: '3px solid #800080',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ color: '#dda0dd', fontSize: '18px', fontWeight: 'bold' }}>QUARANTINE BREACH</div>
          <div style={{ color: '#da70d6', fontSize: '16px' }}>بغداد</div>
          <div style={{ color: '#ee82ee', fontSize: '15px' }}>Baghdad</div>
          <div style={{ color: '#dda0dd', fontSize: '14px' }}>Military Response: Failed</div>
        </div>

        <div style={{
          background: 'rgba(165,42,42,0.8)',
          border: '3px solid #a0522d',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ color: '#f5deb3', fontSize: '18px', fontWeight: 'bold' }}>LOST CONTACT</div>
          <div style={{ color: '#deb887', fontSize: '16px' }}>القاهرة</div>
          <div style={{ color: '#d2b48c', fontSize: '15px' }}>Cairo</div>
          <div style={{ color: '#bc8f8f', fontSize: '14px' }}>Status: Unknown | Presumed Overrun</div>
        </div>
      </div>

      {/* Enhanced footer with more dramatic styling */}
      <div style={{
        position: 'fixed',
        bottom: '25px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        background: 'rgba(0,0,0,0.95)',
        padding: '20px 30px',
        borderRadius: '20px',
        border: '3px solid #ff0000',
        boxShadow: '0 0 25px rgba(255,0,0,0.4)'
      }}>
        <div style={{ fontSize: '16px', color: '#ff6666', fontWeight: 'bold', textShadow: '0 0 5px #ff6666' }}>
          تم تطوير النظام بواسطة Boon
        </div>
        <div style={{ fontSize: '14px', color: '#ffaaaa', marginTop: '10px' }}>
          ☣️ ☠️ 🧟‍♂️ ☠️ ☣️
        </div>
        <div style={{ fontSize: '14px', color: '#ff9999', marginTop: '5px' }}>
          WARNING: ZOMBIE CONTAMINATION ZONE
        </div>
        <div style={{ fontSize: '12px', color: '#ffcccc', marginTop: '5px' }}>
          SYSTEM COMPROMISED - APOCALYPSE PROTOCOL ACTIVE
        </div>
      </div>

      <style>{`
        @keyframes apocalypticPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        
        @keyframes emergencyFlash {
          0%, 50% { opacity: 1; transform: scale(1); }
          25% { opacity: 0.8; transform: scale(1.03); }
          75% { opacity: 0.9; transform: scale(0.97); }
        }
        
        @keyframes floatDebris {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 1; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.7; }
        }
        
        @keyframes textGlow {
          0% { text-shadow: 0 0 15px #ff0000, 0 0 30px #ff0000; }
          100% { text-shadow: 0 0 25px #ff0000, 0 0 50px #ff0000, 0 0 75px #ff0000; }
        }
        
        @keyframes criticalPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,0,0,0.4); }
          50% { box-shadow: 0 0 35px rgba(255,0,0,0.8); }
        }
        
        @keyframes warningPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,140,0,0.4); }
          50% { box-shadow: 0 0 35px rgba(255,140,0,0.8); }
        }
        
        @keyframes zombiePulse {
          0%, 100% { box-shadow: 0 0 20px rgba(50,205,50,0.4); }
          50% { box-shadow: 0 0 35px rgba(50,205,50,0.8); }
        }
        
        @keyframes evacuationPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(148,0,211,0.4); }
          50% { box-shadow: 0 0 35px rgba(148,0,211,0.8); }
        }
        
        @keyframes overrunFlash {
          0%, 100% { background: rgba(139,0,0,0.8); }
          50% { background: rgba(139,0,0,1); }
        }
        
        @keyframes criticalFlash {
          0%, 100% { background: rgba(255,140,0,0.8); }
          50% { background: rgba(255,140,0,1); }
        }
      `}</style>
    </div>
  );
};

export default App;
