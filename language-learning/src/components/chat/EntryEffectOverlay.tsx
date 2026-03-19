"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// Effect type definitions
export type EffectType = 
  | "glow" | "neon" | "sparks" | "stars" | "royal" 
  | "legendary" | "fire" | "lightning" | "hearts" 
  | "bubbles" | "fireworks" | "crown" | "sparkle"
  | "seasonal_snow" | "seasonal_cherry" | "seasonal_leaves";

export interface EntryEffect {
  userId: string;
  userName: string;
  effectType: EffectType;
  icon: string;
  color: string;
  nameAr: string;
  rarity: string;
  videoUrl?: string;
  soundUrl?: string;
  effectDuration?: number;
}

interface EntryEffectOverlayProps {
  effects: EntryEffect[];
  onEffectComplete: (userId: string) => void;
  soundMuted?: boolean;
}

// Particle system for various effects
function generateParticles(effectType: EffectType, count: number): Array<{
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  emoji?: string;
  opacity: number;
  rotation: number;
}> {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 8 + Math.random() * 24,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 2,
      emoji: getParticleEmoji(effectType, i),
      opacity: 0.6 + Math.random() * 0.4,
      rotation: Math.random() * 360,
    });
  }
  return particles;
}

function getParticleEmoji(effectType: EffectType, index: number): string {
  const emojiSets: Record<string, string[]> = {
    stars: ["⭐", "🌟", "✨", "💫", "🌠"],
    hearts: ["❤️", "💖", "💗", "💕", "💝"],
    fire: ["🔥", "🔥", "💥", "🌋", "☄️"],
    lightning: ["⚡", "⚡", "💥", "🌩️", "⚡"],
    bubbles: ["🫧", "🫧", "💧", "🫧", "✨"],
    fireworks: ["🎆", "🎇", "✨", "💥", "🌟"],
    crown: ["👑", "💎", "✨", "🌟", "👑"],
    sparkle: ["✨", "💎", "🌟", "✨", "💫"],
    royal: ["👑", "🏰", "⚜️", "💎", "🌟"],
    legendary: ["🐉", "⚔️", "🔮", "💎", "🌟"],
    neon: ["💜", "💙", "💚", "💛", "🤍"],
    glow: ["🌟", "✨", "💫", "⭐", "🔆"],
    sparks: ["✨", "⚡", "💫", "🌟", "✨"],
    seasonal_snow: ["❄️", "🌨️", "☃️", "❄️", "🌟"],
    seasonal_cherry: ["🌸", "🌺", "💮", "🌸", "✨"],
    seasonal_leaves: ["🍂", "🍁", "🍃", "🍂", "🌟"],
  };
  const set = emojiSets[effectType] || emojiSets.stars;
  return set[index % set.length];
}

function getEffectConfig(effectType: EffectType): {
  bgGradient: string;
  glowColor: string;
  borderColor: string;
  textColor: string;
  particleCount: number;
  animationClass: string;
  label: string;
} {
  const configs: Record<string, {
    bgGradient: string;
    glowColor: string;
    borderColor: string;
    textColor: string;
    particleCount: number;
    animationClass: string;
    label: string;
  }> = {
    glow: {
      bgGradient: "radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, transparent 70%)",
      glowColor: "rgba(251,191,36,0.6)",
      borderColor: "#fbbf24",
      textColor: "#fbbf24",
      particleCount: 20,
      animationClass: "entry-glow",
      label: "توهج ضوئي",
    },
    neon: {
      bgGradient: "radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.1) 50%, transparent 70%)",
      glowColor: "rgba(139,92,246,0.8)",
      borderColor: "#8b5cf6",
      textColor: "#c4b5fd",
      particleCount: 25,
      animationClass: "entry-neon",
      label: "نيون",
    },
    sparks: {
      bgGradient: "radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.1) 50%, transparent 70%)",
      glowColor: "rgba(245,158,11,0.7)",
      borderColor: "#f59e0b",
      textColor: "#fcd34d",
      particleCount: 30,
      animationClass: "entry-sparks",
      label: "شرارات",
    },
    stars: {
      bgGradient: "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 50%, transparent 70%)",
      glowColor: "rgba(96,165,250,0.6)",
      borderColor: "#60a5fa",
      textColor: "#93c5fd",
      particleCount: 25,
      animationClass: "entry-stars",
      label: "نجوم",
    },
    royal: {
      bgGradient: "radial-gradient(ellipse at center, rgba(234,179,8,0.2) 0%, rgba(180,83,9,0.1) 50%, transparent 70%)",
      glowColor: "rgba(234,179,8,0.8)",
      borderColor: "#eab308",
      textColor: "#fde047",
      particleCount: 20,
      animationClass: "entry-royal",
      label: "إطار ملكي",
    },
    legendary: {
      bgGradient: "radial-gradient(ellipse at center, rgba(168,85,247,0.25) 0%, rgba(234,179,8,0.15) 50%, transparent 70%)",
      glowColor: "rgba(168,85,247,0.9)",
      borderColor: "#a855f7",
      textColor: "#e9d5ff",
      particleCount: 35,
      animationClass: "entry-legendary",
      label: "أسطوري",
    },
    fire: {
      bgGradient: "radial-gradient(ellipse at center, rgba(239,68,68,0.2) 0%, rgba(245,158,11,0.15) 50%, transparent 70%)",
      glowColor: "rgba(239,68,68,0.7)",
      borderColor: "#ef4444",
      textColor: "#fca5a5",
      particleCount: 25,
      animationClass: "entry-fire",
      label: "نار",
    },
    lightning: {
      bgGradient: "radial-gradient(ellipse at center, rgba(59,130,246,0.2) 0%, rgba(147,197,253,0.1) 50%, transparent 70%)",
      glowColor: "rgba(59,130,246,0.8)",
      borderColor: "#3b82f6",
      textColor: "#93c5fd",
      particleCount: 20,
      animationClass: "entry-lightning",
      label: "برق",
    },
    hearts: {
      bgGradient: "radial-gradient(ellipse at center, rgba(236,72,153,0.2) 0%, rgba(219,39,119,0.1) 50%, transparent 70%)",
      glowColor: "rgba(236,72,153,0.6)",
      borderColor: "#ec4899",
      textColor: "#f9a8d4",
      particleCount: 20,
      animationClass: "entry-hearts",
      label: "قلوب",
    },
    bubbles: {
      bgGradient: "radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, rgba(34,211,238,0.1) 50%, transparent 70%)",
      glowColor: "rgba(6,182,212,0.5)",
      borderColor: "#06b6d4",
      textColor: "#67e8f9",
      particleCount: 20,
      animationClass: "entry-bubbles",
      label: "فقاعات",
    },
    fireworks: {
      bgGradient: "radial-gradient(ellipse at center, rgba(168,85,247,0.2) 0%, rgba(236,72,153,0.15) 50%, transparent 70%)",
      glowColor: "rgba(168,85,247,0.7)",
      borderColor: "#a855f7",
      textColor: "#d8b4fe",
      particleCount: 30,
      animationClass: "entry-fireworks",
      label: "ألعاب نارية",
    },
    crown: {
      bgGradient: "radial-gradient(ellipse at center, rgba(234,179,8,0.25) 0%, rgba(217,119,6,0.15) 50%, transparent 70%)",
      glowColor: "rgba(234,179,8,0.9)",
      borderColor: "#eab308",
      textColor: "#fde047",
      particleCount: 20,
      animationClass: "entry-crown",
      label: "تاج",
    },
    sparkle: {
      bgGradient: "radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 50%, transparent 70%)",
      glowColor: "rgba(99,102,241,0.6)",
      borderColor: "#6366f1",
      textColor: "#a5b4fc",
      particleCount: 25,
      animationClass: "entry-sparkle",
      label: "بريق",
    },
    seasonal_snow: {
      bgGradient: "radial-gradient(ellipse at center, rgba(186,230,253,0.2) 0%, rgba(224,242,254,0.15) 50%, transparent 70%)",
      glowColor: "rgba(186,230,253,0.6)",
      borderColor: "#bae6fd",
      textColor: "#e0f2fe",
      particleCount: 30,
      animationClass: "entry-snow",
      label: "ثلوج",
    },
    seasonal_cherry: {
      bgGradient: "radial-gradient(ellipse at center, rgba(244,114,182,0.2) 0%, rgba(251,207,232,0.15) 50%, transparent 70%)",
      glowColor: "rgba(244,114,182,0.6)",
      borderColor: "#f472b6",
      textColor: "#fbcfe8",
      particleCount: 25,
      animationClass: "entry-cherry",
      label: "أزهار الكرز",
    },
    seasonal_leaves: {
      bgGradient: "radial-gradient(ellipse at center, rgba(180,83,9,0.15) 0%, rgba(217,119,6,0.1) 50%, transparent 70%)",
      glowColor: "rgba(180,83,9,0.6)",
      borderColor: "#b45309",
      textColor: "#fcd34d",
      particleCount: 25,
      animationClass: "entry-leaves",
      label: "أوراق الخريف",
    },
  };
  return configs[effectType] || configs.glow;
}

// Rarity badge colors
function getRarityStyle(rarity: string): { bg: string; text: string; border: string; label: string } {
  const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    common: { bg: "rgba(156,163,175,0.2)", text: "#9ca3af", border: "#9ca3af", label: "عادي" },
    uncommon: { bg: "rgba(34,197,94,0.2)", text: "#22c55e", border: "#22c55e", label: "غير شائع" },
    rare: { bg: "rgba(59,130,246,0.2)", text: "#3b82f6", border: "#3b82f6", label: "نادر" },
    epic: { bg: "rgba(168,85,247,0.2)", text: "#a855f7", border: "#a855f7", label: "أسطوري" },
    legendary: { bg: "rgba(245,158,11,0.2)", text: "#f59e0b", border: "#f59e0b", label: "خرافي" },
  };
  return styles[rarity] || styles.common;
}

// Single effect renderer with video/audio support
function SingleEntryEffect({ effect, onComplete, soundMuted }: { effect: EntryEffect; onComplete: () => void; soundMuted?: boolean }) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const config = getEffectConfig(effect.effectType);
  const particles = generateParticles(effect.effectType, config.particleCount);
  const rarityStyle = getRarityStyle(effect.rarity);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasVideo = Boolean(effect.videoUrl);
  const hasSound = Boolean(effect.soundUrl);
  const duration = (effect.effectDuration || 5) * 1000;

  useEffect(() => {
    const enterTime = 500;
    const exitTime = duration - 1000;
    const enterTimer = setTimeout(() => setPhase("show"), enterTime);
    const exitTimer = setTimeout(() => setPhase("exit"), exitTime);
    const completeTimer = setTimeout(() => onComplete(), duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  // Play video when effect starts
  useEffect(() => {
    if (hasVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [hasVideo]);

  // Play audio when effect starts (if not muted)
  useEffect(() => {
    if (hasSound && audioRef.current && !soundMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.6;
      audioRef.current.play().catch(() => {});
    }
  }, [hasSound, soundMuted]);

  // Fade out audio/video on exit
  useEffect(() => {
    if (phase === "exit") {
      if (videoRef.current) {
        videoRef.current.style.opacity = "0";
      }
      if (audioRef.current) {
        const audio = audioRef.current;
        const fadeInterval = setInterval(() => {
          if (audio.volume > 0.05) {
            audio.volume = Math.max(0, audio.volume - 0.1);
          } else {
            audio.pause();
            clearInterval(fadeInterval);
          }
        }, 50);
      }
    }
  }, [phase]);

  return (
    <div 
      className={`entry-effect-container entry-effect-${phase}`}
      style={{ background: hasVideo ? "rgba(0,0,0,0.85)" : config.bgGradient }}
    >
      {/* Video background (fullscreen) */}
      {hasVideo && (
        <video
          ref={videoRef}
          className="entry-effect-video"
          src={effect.videoUrl}
          muted
          playsInline
          loop={false}
          style={{
            opacity: phase === "exit" ? 0 : 1,
            transition: "opacity 0.8s ease",
          }}
        />
      )}

      {/* Audio element */}
      {hasSound && !soundMuted && (
        <audio
          ref={audioRef}
          src={effect.soundUrl}
          preload="auto"
        />
      )}

      {/* Animated particles */}
      <div className="entry-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`entry-particle ${config.animationClass}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: phase === "exit" ? 0 : p.opacity,
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Radial light burst */}
      <div 
        className="entry-light-burst"
        style={{ 
          boxShadow: `0 0 100px 50px ${config.glowColor}, 0 0 200px 100px ${config.glowColor}40`,
          opacity: phase === "show" ? 1 : 0,
        }}
      />

      {/* Center card */}
      <div className={`entry-card entry-card-${phase}`}>
        {/* Glow ring behind card */}
        <div 
          className="entry-card-glow"
          style={{ 
            boxShadow: `0 0 40px 20px ${config.glowColor}, 0 0 80px 40px ${config.glowColor}40`,
          }}
        />
        
        {/* Card content */}
        <div 
          className="entry-card-inner"
          style={{ 
            borderColor: config.borderColor,
            boxShadow: `0 0 20px ${config.glowColor}, inset 0 0 20px ${config.glowColor}20`,
          }}
        >
          {/* Top decorative line */}
          <div 
            className="entry-card-top-line"
            style={{ background: `linear-gradient(90deg, transparent, ${config.borderColor}, transparent)` }}
          />
          
          {/* Effect icon */}
          <div className="entry-card-icon-wrapper">
            <div 
              className="entry-card-icon"
              style={{ 
                boxShadow: `0 0 30px ${config.glowColor}`,
                borderColor: config.borderColor,
              }}
            >
              <span className="entry-card-icon-emoji">{effect.icon}</span>
            </div>
          </div>

          {/* User name */}
          <div className="entry-card-name" style={{ color: config.textColor }}>
            {effect.userName}
          </div>

          {/* Entry text */}
          <div className="entry-card-subtitle">
            دخل الدردشة
          </div>

          {/* Effect name */}
          <div 
            className="entry-card-effect-name"
            style={{ 
              color: config.borderColor,
              textShadow: `0 0 10px ${config.glowColor}`,
            }}
          >
            {effect.nameAr}
          </div>

          {/* Rarity badge */}
          <div 
            className="entry-card-rarity"
            style={{ 
              backgroundColor: rarityStyle.bg,
              color: rarityStyle.text,
              borderColor: rarityStyle.border,
            }}
          >
            {rarityStyle.label}
          </div>

          {/* Sound indicator */}
          {hasSound && (
            <div className="entry-card-sound-indicator">
              {soundMuted ? "🔇" : "🔊"}
            </div>
          )}

          {/* Bottom decorative line */}
          <div 
            className="entry-card-bottom-line"
            style={{ background: `linear-gradient(90deg, transparent, ${config.borderColor}, transparent)` }}
          />
        </div>
      </div>
    </div>
  );
}

// Preview component for inventory page
export function EntryEffectPreview({ effectType, icon, color, nameAr, size = "medium", videoUrl }: {
  effectType: EffectType;
  icon: string;
  color: string;
  nameAr: string;
  size?: "small" | "medium" | "large";
  videoUrl?: string;
}) {
  const config = getEffectConfig(effectType);
  const particles = generateParticles(effectType, size === "small" ? 8 : size === "medium" ? 12 : 18);
  const sizeClass = size === "small" ? "entry-preview-sm" : size === "medium" ? "entry-preview-md" : "entry-preview-lg";

  return (
    <div className={`entry-preview ${sizeClass}`} style={{ background: config.bgGradient }}>
      {/* Video thumbnail if available */}
      {videoUrl && (
        <video
          className="entry-preview-video"
          src={videoUrl}
          muted
          playsInline
          autoPlay
          loop
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.4,
            borderRadius: "16px",
          }}
        />
      )}
      {/* Mini particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`entry-particle ${config.animationClass}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${Math.max(6, p.size * (size === "small" ? 0.4 : 0.6))}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity * 0.7,
          }}
        >
          {p.emoji}
        </div>
      ))}
      {/* Center icon */}
      <div className="entry-preview-center">
        <div 
          className="entry-preview-icon"
          style={{ 
            borderColor: config.borderColor,
            boxShadow: `0 0 15px ${config.glowColor}`,
          }}
        >
          <span>{icon}</span>
        </div>
        <div className="entry-preview-name" style={{ color: config.textColor }}>
          {nameAr}
        </div>
      </div>
    </div>
  );
}

// Main overlay component
export default function EntryEffectOverlay({ effects, onEffectComplete, soundMuted }: EntryEffectOverlayProps) {
  const [activeEffect, setActiveEffect] = useState<EntryEffect | null>(null);
  const [queue, setQueue] = useState<EntryEffect[]>([]);

  useEffect(() => {
    if (effects.length > 0) {
      setQueue((prev) => {
        const newEffects = effects.filter(
          (e) => !prev.some((p) => p.userId === e.userId) && activeEffect?.userId !== e.userId
        );
        return [...prev, ...newEffects];
      });
    }
  }, [effects, activeEffect]);

  useEffect(() => {
    if (!activeEffect && queue.length > 0) {
      const [next, ...rest] = queue;
      setActiveEffect(next);
      setQueue(rest);
    }
  }, [activeEffect, queue]);

  const handleComplete = useCallback(() => {
    if (activeEffect) {
      onEffectComplete(activeEffect.userId);
      setActiveEffect(null);
    }
  }, [activeEffect, onEffectComplete]);

  if (!activeEffect) return null;

  return (
    <div className="entry-effect-overlay" onClick={handleComplete}>
      <SingleEntryEffect effect={activeEffect} onComplete={handleComplete} soundMuted={soundMuted} />
    </div>
  );
}
