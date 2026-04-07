import type { TrustLevel } from '../../types';
import { trustLevelColor, trustLevelText } from '../../utils/helpers';
import { ShieldCheck, ShieldAlert, Shield, ShieldX } from 'lucide-react';

interface TrustBadgeProps {
  level: TrustLevel;
  reason?: string;
  size?: 'sm' | 'md';
}

export default function TrustBadge({ level, reason, size = 'sm' }: TrustBadgeProps) {
  const icons = {
    confirmed: ShieldCheck,
    high: Shield,
    medium: ShieldAlert,
    low: ShieldX,
  };
  const Icon = icons[level];

  return (
    <div className="group relative inline-flex">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${trustLevelColor(level)} ${size === 'md' ? 'text-xs px-3 py-1' : ''}`}>
        <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
        {trustLevelText(level)}
      </span>
      {reason && (
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
          <div className="bg-[#1a1a25] border border-gray-700 rounded-lg p-2 text-[11px] text-gray-300 max-w-[200px] shadow-xl">
            {reason}
          </div>
        </div>
      )}
    </div>
  );
}
