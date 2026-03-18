"use client";

interface StampSettings {
  stampTopText: string;
  stampBottomText: string;
  stampCenterText: string;
  stampColor: string;
  stampStars: number;
  stampShowDots: boolean;
}

interface OfficialStampProps {
  settings?: StampSettings;
  size?: number;
  idPrefix?: string;
}

const defaultSettings: StampSettings = {
  stampTopText: "LINGUAMASTER",
  stampBottomText: "CERTIFIED",
  stampCenterText: "معتمدة",
  stampColor: "#1e40af",
  stampStars: 3,
  stampShowDots: true,
};

export default function OfficialStamp({ settings, size = 140, idPrefix = "stamp" }: OfficialStampProps) {
  const s = settings || defaultSettings;
  const color = s.stampColor || "#1e40af";
  const stars = "★ ".repeat(s.stampStars).trim();

  return (
    <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
        {/* Outer ring */}
        <circle cx="100" cy="100" r="95" fill="none" stroke={color} strokeWidth="3" opacity="0.8" />
        <circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
        {/* Decorative dots around the outer ring */}
        {s.stampShowDots && Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10 * Math.PI) / 180;
          const x = 100 + 91.5 * Math.cos(angle);
          const y = 100 + 91.5 * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="1.2" fill={color} opacity="0.5" />;
        })}
        {/* Curved text paths */}
        <defs>
          <path id={`${idPrefix}TopArc`} d="M 30,100 a 70,70 0 0,1 140,0" fill="none" />
          <path id={`${idPrefix}BottomArc`} d="M 170,100 a 70,70 0 0,1 -140,0" fill="none" />
        </defs>
        {/* Top text */}
        <text fill={color} fontSize="13" fontWeight="bold" letterSpacing="3">
          <textPath href={`#${idPrefix}TopArc`} startOffset="50%" textAnchor="middle">{s.stampTopText}</textPath>
        </text>
        {/* Bottom text */}
        <text fill={color} fontSize="11" fontWeight="bold" letterSpacing="4">
          <textPath href={`#${idPrefix}BottomArc`} startOffset="50%" textAnchor="middle">{s.stampBottomText}</textPath>
        </text>
        {/* Inner circle */}
        <circle cx="100" cy="100" r="55" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
        {/* Star decoration */}
        <polygon points="100,55 104,68 118,68 107,76 111,89 100,81 89,89 93,76 82,68 96,68" fill={color} opacity="0.15" />
        {/* Center content */}
        <text x="100" y="95" textAnchor="middle" fill={color} fontSize="28" fontWeight="bold">&#x2713;</text>
        <text x="100" y="115" textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">{s.stampCenterText}</text>
        {/* Decorative stars */}
        {s.stampStars > 0 && (
          <text x="100" y="130" textAnchor="middle" fill={color} fontSize="8" opacity="0.7">{stars}</text>
        )}
        {/* Inner dashed ring */}
        <circle cx="100" cy="100" r="45" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" strokeDasharray="3,3" />
      </svg>
    </div>
  );
}

export type { StampSettings };
