interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function Toggle({ enabled, onChange, size = 'md' }: ToggleProps) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  };

  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${s.track} ${
        enabled ? 'bg-emerald-500' : 'bg-gray-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out ${s.thumb} ${
          enabled ? `-translate-x-0.5 ${s.translate}` : 'translate-x-0.5'
        } mt-[2px]`}
      />
    </button>
  );
}
