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
    <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="relative bg-gradient-to-r from-red-950 via-gray-900 to-blue-950 px-8 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,100,50,0.3)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(50,150,255,0.3)_0%,transparent_50%)]"></div>
        
        <div className="absolute top-4 left-0 right-0 text-center z-10">
          <div className="inline-flex items-center gap-4 bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full">
            <span className="text-xl font-bold text-white">
              {formatTime(challenge.dateTime)}
            </span>
            {challenge.roundType && (
              <>
                <span className="text-white">•</span>
                <span className="text-lg font-bold text-yellow-400">
                  {challenge.roundType}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-8">
          <div className="flex-1 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500 via-red-500 to-transparent rounded-full blur-2xl opacity-60 scale-150"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-t from-orange-600/80 via-red-600/40 to-transparent rounded-full blur-xl"></div>
              <img
                src={challenge.opponent1Avatar || '/default-avatar.png'}
                alt={challenge.opponent1}
                className="relative w-[50px] h-[50px] rounded-full object-cover ring-4 ring-orange-500 shadow-2xl"
              />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                {challenge.opponent1}
              </h3>
              {challenge.opponent1PlatformId && (
                <p className="text-sm text-orange-300 font-semibold">
                  ID: {challenge.opponent1PlatformId}
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-4 pb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-2xl"></div>
              <div className="relative text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" style={{
                WebkitTextStroke: '3px rgba(0,0,0,0.5)',
                textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)'
              }}>
                VS
              </div>
            </div>
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-sm px-8 py-3 rounded-2xl border-2 border-white/20">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400">
                  {challenge.score1 !== undefined ? challenge.score1 : 0}
                </div>
              </div>
              <div className="text-3xl font-bold text-white/50">-</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400">
                  {challenge.score2 !== undefined ? challenge.score2 : 0}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500 via-cyan-500 to-transparent rounded-full blur-2xl opacity-60 scale-150"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-t from-blue-600/80 via-cyan-600/40 to-transparent rounded-full blur-xl"></div>
              <img
                src={challenge.opponent2Avatar || '/default-avatar.png'}
                alt={challenge.opponent2}
                className="relative w-[50px] h-[50px] rounded-full object-cover ring-4 ring-blue-500 shadow-2xl"
              />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                {challenge.opponent2}
              </h3>
              {challenge.opponent2PlatformId && (
                <p className="text-sm text-blue-300 font-semibold">
                  ID: {challenge.opponent2PlatformId}
                </p>
              )}
            </div>
          </div>
        </div>

        {challenge.result && (
          <div className="absolute bottom-4 left-0 right-0 text-center z-10">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-2 rounded-full">
              <p className="text-lg font-bold text-gray-900">
                🏆 الفائز: {challenge.result}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-3 text-center border-t border-white/10">
        <span className="text-sm text-gray-400">{formatDate(challenge.dateTime)}</span>
      </div>
    </div>
  );
}

export default BannerCard;
