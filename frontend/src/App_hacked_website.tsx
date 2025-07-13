import React, { useState, useEffect, useRef } from 'react';

const App: React.FC = () => {
  const [systemStatus] = useState('COMPROMISED');
  const [hackProgress, setHackProgress] = useState(0);
  const [currentAlert, setCurrentAlert] = useState('');
  const [, ] = useState(5);
  const [dataStolen, setDataStolen] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setHackProgress(prev => Math.min(prev + Math.random() * 2, 100));
      setDataStolen(prev => prev + Math.floor(Math.random() * 1000));
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const alertTimer = setInterval(() => {
      const alerts = [
        'تحذير: تم اختراق النظام بالكامل',
        'WARNING: UNAUTHORIZED ACCESS DETECTED',
        'خرق أمني: جاري سرقة البيانات',
        'SECURITY BREACH: DATA EXTRACTION IN PROGRESS',
        'تنبيه: فشل جميع أنظمة الحماية',
        'ALERT: ALL SECURITY PROTOCOLS FAILED'
      ];
      setCurrentAlert(alerts[Math.floor(Math.random() * alerts.length)]);
    }, 2000);

    const playAudio = () => {
      const audioFiles = [
        '/scary-ambience-59002.mp3',
        '/horror_scream.wav',
        '/evil_beep.wav'
      ];
      
      const randomAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];
      if (audioRef.current) {
        audioRef.current.src = randomAudio;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
        
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }, 20000);
      }
    };

    const audioInterval = setInterval(playAudio, 25000);
    playAudio();

    return () => {
      clearInterval(timer);
      clearInterval(alertTimer);
      clearInterval(audioInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000, #0a0a0a, #1a0000, #000a00, #000000)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 8s ease infinite',
      color: '#00ff00',
      fontFamily: 'Courier New, monospace',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <audio ref={audioRef} />
      
      {/* Matrix Rain Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 98px,
            rgba(0, 255, 0, 0.03) 100px
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 98px,
            rgba(0, 255, 0, 0.03) 100px
          )
        `,
        animation: 'matrixRain 3s linear infinite'
      }} />

      {/* Glitch Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'repeating-linear-gradient(90deg, transparent 0px, rgba(255, 0, 0, 0.1) 2px, transparent 4px)',
        animation: 'glitchEffect 0.3s infinite'
      }} />

      <div style={{
        padding: '20px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          border: '2px solid #ff0000',
          padding: '20px',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          animation: 'pulse 2s infinite'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#ff0000',
            textShadow: '0 0 20px #ff0000',
            margin: '0 0 10px 0',
            animation: 'flicker 1s infinite'
          }}>
            ⚠️ تم اختراق النظام - SYSTEM HACKED ⚠️
          </h1>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#00ff00',
            margin: '10px 0',
            animation: 'typewriter 4s steps(40) infinite'
          }}>
            خرق أمني كامل - TOTAL SECURITY BREACH
          </h2>
          <p style={{
            color: '#ffff00',
            fontSize: '1.2rem',
            margin: '10px 0'
          }}>
            جميع البيانات تحت السيطرة - ALL DATA COMPROMISED
          </p>
        </div>

        {/* Status Panels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            border: '2px solid #ff0000',
            padding: '20px',
            borderRadius: '10px',
            animation: 'pulse 1.5s infinite'
          }}>
            <h3 style={{ color: '#ff0000', margin: '0 0 10px 0', fontSize: '1.2rem' }}>
              🔴 حالة النظام
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.5rem', margin: '5px 0' }}>
              {systemStatus}
            </p>
            <p style={{ color: '#ffff00', fontSize: '0.9rem' }}>
              System Status
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            border: '2px solid #00ff00',
            padding: '20px',
            borderRadius: '10px',
            animation: 'pulse 2s infinite'
          }}>
            <h3 style={{ color: '#00ff00', margin: '0 0 10px 0', fontSize: '1.2rem' }}>
              📊 تقدم الاختراق
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.5rem', margin: '5px 0' }}>
              {hackProgress.toFixed(1)}%
            </p>
            <p style={{ color: '#ffff00', fontSize: '0.9rem' }}>
              Hack Progress
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            border: '2px solid #ffff00',
            padding: '20px',
            borderRadius: '10px',
            animation: 'pulse 2.5s infinite'
          }}>
            <h3 style={{ color: '#ffff00', margin: '0 0 10px 0', fontSize: '1.2rem' }}>
              💾 البيانات المسروقة
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.5rem', margin: '5px 0' }}>
              {dataStolen.toLocaleString()} MB
            </p>
            <p style={{ color: '#ffff00', fontSize: '0.9rem' }}>
              Data Stolen
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 0, 255, 0.2)',
            border: '2px solid #ff00ff',
            padding: '20px',
            borderRadius: '10px',
            animation: 'pulse 3s infinite'
          }}>
            <h3 style={{ color: '#ff00ff', margin: '0 0 10px 0', fontSize: '1.2rem' }}>
              ⏱️ وقت الاختراق
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.5rem', margin: '5px 0' }}>
              {formatTime(timeElapsed)}
            </p>
            <p style={{ color: '#ffff00', fontSize: '0.9rem' }}>
              Time Elapsed
            </p>
          </div>
        </div>

        {/* Critical Alert */}
        <div style={{
          backgroundColor: 'rgba(255, 0, 0, 0.3)',
          border: '3px solid #ff0000',
          padding: '25px',
          marginBottom: '30px',
          borderRadius: '15px',
          animation: 'criticalAlert 1s infinite'
        }}>
          <h2 style={{
            color: '#ff0000',
            textAlign: 'center',
            margin: '0 0 15px 0',
            fontSize: '1.8rem',
            textShadow: '0 0 15px #ff0000'
          }}>
            ☠️ تحذير أمني عاجل - CRITICAL SECURITY ALERT ☠️
          </h2>
          <p style={{
            color: '#ffffff',
            textAlign: 'center',
            fontSize: '1.3rem',
            margin: '10px 0',
            animation: 'blink 0.5s infinite'
          }}>
            {currentAlert}
          </p>
          <div style={{
            textAlign: 'center',
            marginTop: '15px'
          }}>
            <p style={{ color: '#ffff00', fontSize: '1.1rem', margin: '5px 0' }}>
              🚨 جميع كلمات المرور تم كشفها
            </p>
            <p style={{ color: '#ffff00', fontSize: '1.1rem', margin: '5px 0' }}>
              🚨 ALL PASSWORDS COMPROMISED
            </p>
          </div>
        </div>

        {/* Hacker Terminal */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00ff00',
          padding: '20px',
          marginBottom: '30px',
          borderRadius: '10px',
          fontFamily: 'Courier New, monospace'
        }}>
          <div style={{
            color: '#00ff00',
            marginBottom: '15px',
            fontSize: '1.2rem'
          }}>
            💻 HACKER TERMINAL - طرفية الهاكر
          </div>
          <div style={{ color: '#00ff00', fontSize: '0.9rem', lineHeight: '1.4' }}>
            <p>root@hacked-system:~# access granted</p>
            <p>root@hacked-system:~# extracting user_data.db... 100%</p>
            <p>root@hacked-system:~# bypassing security protocols... SUCCESS</p>
            <p>root@hacked-system:~# installing backdoor... COMPLETE</p>
            <p style={{ color: '#ff0000' }}>root@hacked-system:~# SYSTEM FULLY COMPROMISED</p>
            <p style={{ color: '#ffff00' }}>root@hacked-system:~# النظام تحت السيطرة الكاملة</p>
          </div>
        </div>

        {/* Compromised Systems */}
        <div style={{
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          border: '2px solid #ff0000',
          padding: '20px',
          marginBottom: '30px',
          borderRadius: '10px'
        }}>
          <h3 style={{
            color: '#ff0000',
            textAlign: 'center',
            margin: '0 0 20px 0',
            fontSize: '1.5rem'
          }}>
            🔓 الأنظمة المخترقة - COMPROMISED SYSTEMS
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {[
              { name: 'قاعدة البيانات', status: 'مخترقة 100%', color: '#ff0000' },
              { name: 'نظام المصادقة', status: 'معطل', color: '#ff0000' },
              { name: 'جدار الحماية', status: 'مدمر', color: '#ff0000' },
              { name: 'نظام النسخ الاحتياطي', status: 'محذوف', color: '#ff0000' },
              { name: 'سجلات الأمان', status: 'ممحوة', color: '#ff0000' },
              { name: 'نظام المراقبة', status: 'معطل', color: '#ff0000' }
            ].map((system, index) => (
              <div key={index} style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: `1px solid ${system.color}`,
                padding: '15px',
                borderRadius: '8px',
                animation: `pulse ${1 + index * 0.2}s infinite`
              }}>
                <p style={{ color: '#ffffff', margin: '0 0 5px 0', fontSize: '1rem' }}>
                  {system.name}
                </p>
                <p style={{ color: system.color, margin: '0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {system.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '2px solid #00ff00',
          borderRadius: '10px'
        }}>
          <p style={{
            color: '#ff0000',
            fontSize: '1.3rem',
            margin: '10px 0',
            animation: 'flicker 2s infinite'
          }}>
            ⚠️ تم إغلاق النظام نهائياً بسبب الاختراق الأمني ⚠️
          </p>
          <p style={{
            color: '#ffff00',
            fontSize: '1.1rem',
            margin: '10px 0'
          }}>
            SYSTEM PERMANENTLY CLOSED DUE TO SECURITY BREACH
          </p>
          <p style={{
            color: '#00ff00',
            fontSize: '1rem',
            margin: '20px 0 10px 0'
          }}>
            تم تطوير النظام بواسطة Boon
          </p>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes matrixRain {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes glitchEffect {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes criticalAlert {
          0% { border-color: #ff0000; box-shadow: 0 0 20px #ff0000; }
          50% { border-color: #ffff00; box-shadow: 0 0 30px #ffff00; }
          100% { border-color: #ff0000; box-shadow: 0 0 20px #ff0000; }
        }
        
        @keyframes typewriter {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;
