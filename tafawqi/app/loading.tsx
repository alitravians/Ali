// Default route-level loading UI. Next.js streams this while a server
// component is still resolving (e.g. waiting on DB). Keeps the user oriented
// instead of staring at a blank page.

export default function Loading() {
  return (
    <div
      className="max-w-6xl mx-auto px-4 py-16"
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 bg-violet-200/60 dark:bg-violet-900/40 rounded-xl" />
        <div className="h-4 w-1/2 bg-violet-200/40 dark:bg-violet-900/30 rounded-xl" />
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 bg-violet-100/60 dark:bg-violet-900/30 rounded-2xl"
            />
          ))}
        </div>
        <div className="h-40 bg-violet-100/60 dark:bg-violet-900/30 rounded-2xl mt-6" />
      </div>
      <span className="sr-only">جاري التحميل</span>
    </div>
  );
}
