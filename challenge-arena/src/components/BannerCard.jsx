import { Calendar, Clock } from 'lucide-react';

function BannerCard({ challenge }) {
  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('ar-EG');
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Bar - Time and Round */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <span className="text-2xl font-bold text-gray-900">
            {formatTime(challenge.dateTime)}
          </span>
          {challenge.roundType && (
            <span className="text-xl font-bold text-gray-900">
              [{challenge.roundType}]
            </span>
          )}
        </div>
      </div>

      {/* Middle Section - Opponents */}
      <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 px-8 py-12">
        <div className="flex items-center justify-between">
          {/* Opponent 1 */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <img
              src={challenge.opponent1Avatar || '/default-avatar.png'}
              alt={challenge.opponent1}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-amber-400 shadow-xl"
            />
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">
                {challenge.opponent1}
              </h3>
              {challenge.opponent1PlatformId && (
                <p className="text-lg text-gray-300">
                  {challenge.opponent1PlatformId}
                </p>
              )}
            </div>
          </div>

          {/* VS */}
          <div className="flex-shrink-0 px-8">
            <div className="text-7xl font-bold text-yellow-400">VS</div>
          </div>

          {/* Opponent 2 */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <img
              src={challenge.opponent2Avatar || '/default-avatar.png'}
              alt={challenge.opponent2}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-500 shadow-xl"
            />
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">
                {challenge.opponent2}
              </h3>
              {challenge.opponent2PlatformId && (
                <p className="text-lg text-gray-300">
                  {challenge.opponent2PlatformId}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Score */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-6">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-xl">
            <span className="text-white text-sm">⭐</span>
            <span className="text-3xl font-bold text-gray-900">
              {challenge.score1 !== undefined ? challenge.score1 : 0}
            </span>
          </div>
          <span className="text-3xl font-bold text-gray-900">—</span>
          <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-xl">
            <span className="text-3xl font-bold text-gray-900">
              {challenge.score2 !== undefined ? challenge.score2 : 0}
            </span>
            <span className="text-white text-sm">⭐</span>
          </div>
        </div>
        {challenge.result && (
          <div className="mt-4 text-center">
            <p className="text-xl font-bold text-gray-900">
              🏆 الفائز: {challenge.result}
            </p>
          </div>
        )}
      </div>

      {/* Date Display */}
      <div className="bg-gray-800 px-6 py-3 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-300">
          <Calendar size={16} />
          <span className="text-sm">{formatDate(challenge.dateTime)}</span>
        </div>
      </div>
    </div>
  );
}

export default BannerCard;
