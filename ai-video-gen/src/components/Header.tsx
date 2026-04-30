export default function Header() {
  return (
    <header className="relative pt-6 md:pt-10 pb-4 text-center">
      <div className="inline-flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center glow-ring">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-l from-brand-300 via-white to-brand-300 bg-clip-text text-transparent">
          AI Video Gen
        </h1>
      </div>
      <p className="text-sm md:text-base text-brand-200/70 max-w-xl mx-auto leading-relaxed px-4">
        موقع مجاني لتوليد فيديوهات قصيرة بالذكاء الاصطناعي.
        <br className="hidden md:block" />
        اكتب وصف المشهد، اختر المدة، واحصل على فيديو جاهز للتحميل خلال ثوانٍ.
      </p>
    </header>
  );
}
