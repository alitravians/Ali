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
    <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative">
      <div 
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'url(/banner-default.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#0a0a0a',
          aspectRatio: '1000 / 511',
          minHeight: '300px'
        }}
      >
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

        <div className="absolute left-[22%] bottom-[12%] z-10 flex flex-col items-center gap-3" style={{ transform: 'translateX(-50%)' }}>
          <img
            src={challenge.opponent1Avatar || '/default-avatar.png'}
            alt={challenge.opponent1}
            className="w-[50px] h-[50px] rounded-full object-cover ring-4 ring-orange-500 shadow-2xl"
          />
          <div className="text-center">
            <h3 className="text-3xl font-black text-orange-400 mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{
              textShadow: '0 0 20px rgba(255,150,50,0.8), 0 2px 8px rgba(0,0,0,0.8)'
            }}>
              {challenge.opponent1}
            </h3>
            {challenge.opponent1PlatformId && (
              <p className="text-base text-orange-200 font-bold drop-shadow-lg">
                ID: {challenge.opponent1PlatformId}
              </p>
            )}
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 flex flex-col items-center gap-2" style={{ transform: 'translate(-50%, -50%)' }}>
          <div className="relative text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" style={{
            WebkitTextStroke: '3px rgba(0,0,0,0.5)',
            textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)'
          }}>
            VS
          </div>
          {!challenge.result && showScores && (
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
          )}
        </div>

        <div className="absolute right-[22%] bottom-[12%] z-10 flex flex-col items-center gap-3" style={{ transform: 'translateX(50%)' }}>
          <img
            src={challenge.opponent2Avatar || '/default-avatar.png'}
            alt={challenge.opponent2}
            className="w-[50px] h-[50px] rounded-full object-cover ring-4 ring-blue-500 shadow-2xl"
          />
          <div className="text-center">
            <h3 className="text-3xl font-black text-cyan-400 mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{
              textShadow: '0 0 20px rgba(50,200,255,0.8), 0 2px 8px rgba(0,0,0,0.8)'
            }}>
              {challenge.opponent2}
            </h3>
            {challenge.opponent2PlatformId && (
              <p className="text-base text-cyan-200 font-bold drop-shadow-lg">
                ID: {challenge.opponent2PlatformId}
              </p>
            )}
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
