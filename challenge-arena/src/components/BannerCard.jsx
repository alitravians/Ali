function BannerCard({ challenge }) {
  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('ar-EG');
  };

  const showScores = Number(challenge.score1 || 0) > 0 || Number(challenge.score2 || 0) > 0;

  return (
    <div className="w-full mx-auto overflow-hidden shadow-2xl relative" style={{ maxWidth: '560px' }}>
      <div 
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'url(/banner-default.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          maxWidth: '560px',
          paddingBottom: '61.39%'
        }}
      >

        <div className="absolute z-[5]" style={{ left: '30%', top: '57.5%', transform: 'translate(-50%, -50%)', width: '29%', minWidth: '80px', maxWidth: '300px' }}>
          <div className="flex flex-col items-center gap-1">
            <div
              className="relative w-full rounded-full overflow-hidden ring-2 ring-orange-500 shadow-2xl"
              style={{
                aspectRatio: '1 / 1',
                backgroundImage: `url(${challenge.opponent1Avatar || '/default-avatar.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: '50% 50%'
              }}
              role="img"
              aria-label={challenge.opponent1}
            >
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 14px rgba(0,0,0,0.25), 0 0 22px 6px rgba(251,146,60,0.35)' }} />
            </div>
            <div className="text-center">
              <h3 className="text-xs sm:text-sm font-black text-white mb-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{
                textShadow: '0 0 10px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.8)'
              }}>
                {challenge.opponent1}
              </h3>
              {challenge.opponent1PlatformId && (
                <p className="text-[10px] sm:text-[11px] text-white font-bold drop-shadow-lg" style={{
                  textShadow: '0 0 10px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.8)'
                }}>
                  ID: {challenge.opponent1PlatformId}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="absolute z-[5]" style={{ left: '70%', top: '57.5%', transform: 'translate(-50%, -50%)', width: '29%', minWidth: '80px', maxWidth: '300px' }}>
          <div className="flex flex-col items-center gap-1">
            <div
              className="relative w-full rounded-full overflow-hidden ring-2 ring-blue-500 shadow-2xl"
              style={{
                aspectRatio: '1 / 1',
                backgroundImage: `url(${challenge.opponent2Avatar || '/default-avatar.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: '50% 50%'
              }}
              role="img"
              aria-label={challenge.opponent2}
            >
              <span className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 14px rgba(0,0,0,0.25), 0 0 22px 6px rgba(59,130,246,0.35)' }} />
            </div>
            <div className="text-center">
              <h3 className="text-xs sm:text-sm font-black text-white mb-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{
                textShadow: '0 0 10px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.8)'
              }}>
                {challenge.opponent2}
              </h3>
              {challenge.opponent2PlatformId && (
                <p className="text-[10px] sm:text-[11px] text-white font-bold drop-shadow-lg" style={{
                  textShadow: '0 0 10px rgba(255,255,255,0.9), 0 2px 4px rgba(0,0,0,0.8)'
                }}>
                  ID: {challenge.opponent2PlatformId}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 z-20 flex flex-col items-center gap-1" style={{ transform: 'translate(-50%, -50%)' }}>
          <div className="relative text-3xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{
            WebkitTextStroke: '1px rgba(0,0,0,0.5)',
            textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)'
          }}>
            VS
          </div>
          {!challenge.result && showScores && (
            <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">
                  {challenge.score1 !== undefined ? challenge.score1 : 0}
                </div>
              </div>
              <div className="text-sm font-bold text-white/50">-</div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {challenge.score2 !== undefined ? challenge.score2 : 0}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-[4%] left-1/2 z-20" style={{ transform: 'translateX(-50%)' }}>
          <div className="relative rounded-full p-[1px]" style={{
            background: 'linear-gradient(90deg, rgba(251, 146, 60, 0.6) 0%, rgba(96, 165, 250, 0.6) 100%)'
          }}>
            <div className="rounded-full bg-slate-900/40 backdrop-blur-sm px-3 py-1 flex items-center gap-2 border border-white/10">
              <span className="text-xs font-semibold text-white">
                {formatTime(challenge.dateTime)} ✓
              </span>
              {challenge.roundType && (
                <>
                  <span className="text-white/50 text-xs">•</span>
                  <span className="text-xs font-semibold text-white">
                    {challenge.roundType}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {challenge.result && (
          <div className="absolute bottom-10 left-0 right-0 text-center z-20">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1 rounded-full">
              <p className="text-xs font-bold text-gray-900">
                🏆 الفائز: {challenge.result}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-4 py-2 text-center border-t border-white/10">
        <span className="text-xs text-gray-400">{formatDate(challenge.dateTime)}</span>
      </div>
    </div>
  );
}

export default BannerCard;
