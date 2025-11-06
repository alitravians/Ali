import { useEffect, useState } from 'react';
import '../styles/loading-pro.css';

export default function LoadingScreenBigoPro() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!loading) return null;

  return (
    <div className="arena-loading-pro">
      <div className="arena-bg-gradient fade-in-slow" />

      <div className="arena-center fade-in">
        <img
          src="/bigo-logo.png"
          alt="BIGO LIVE Logo"
          className="arena-logo fade-in-up"
        />
        <p className="arena-text fade-in-up delay-150">جارٍ التحميل...</p>
        <div className="arena-progress fade-in-up delay-300">
          <div className="arena-progress-bar" />
        </div>
      </div>
    </div>
  );
}
