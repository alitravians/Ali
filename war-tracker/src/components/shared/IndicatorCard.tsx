import type { DashboardIndicator } from '../../types';
import { scoreColor, scoreTextColor } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IndicatorCardProps {
  indicator: DashboardIndicator;
  size?: 'sm' | 'lg';
}

export default function IndicatorCard({ indicator, size = 'sm' }: IndicatorCardProps) {
  const trendIcon = {
    up: <TrendingUp className="w-3.5 h-3.5 text-red-400" />,
    down: <TrendingDown className="w-3.5 h-3.5 text-green-400" />,
    stable: <Minus className="w-3.5 h-3.5 text-gray-400" />,
  };

  const diff = indicator.score - indicator.previousScore;

  return (
    <div className={`rounded-xl border border-gray-800 bg-[#12121a] ${size === 'lg' ? 'p-5' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className={`font-semibold text-gray-300 truncate ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
          {indicator.nameAr}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {trendIcon[indicator.trend]}
          <span className={`text-[10px] font-bold ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-gray-400'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className={`font-black ${scoreTextColor(indicator.score)} ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>
          {indicator.score}
        </span>
        <span className="text-[10px] text-gray-400 mb-1">/100</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full score-bar ${scoreColor(indicator.score)}`}
          style={{ width: `${indicator.score}%` }}
        />
      </div>

      {size === 'lg' && (
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          {indicator.descriptionAr}
        </p>
      )}
    </div>
  );
}
