import { cn } from "@/lib/cn";

/** Static illustration shown when WebGL is unavailable. */
export function FallbackCup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 300" className={cn("drop-shadow-2xl", className)} role="img" aria-label="A glass cup of coffee on a saucer">
      <defs>
        <linearGradient id="fb-coffee" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b3417" />
          <stop offset="1" stopColor="#1c0c05" />
        </linearGradient>
        <radialGradient id="fb-crema" cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#c98a50" />
          <stop offset="1" stopColor="#6e3b1b" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="262" rx="140" ry="26" fill="#efe3d2" />
      <ellipse cx="160" cy="256" rx="112" ry="18" fill="#e3d4c0" />
      <path d="M96 92h128l-10 150a14 14 0 0 1-14 12h-80a14 14 0 0 1-14-12z" fill="url(#fb-coffee)" />
      <ellipse cx="160" cy="98" rx="62" ry="15" fill="url(#fb-crema)" />
      <path d="M86 70h148l-12 176a16 16 0 0 1-16 14h-92a16 16 0 0 1-16-14z" fill="#fff" fillOpacity="0.08" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" />
      <ellipse cx="160" cy="70" rx="74" ry="16" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
      <path d="M230 110c40 0 44 70 4 80" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="12" strokeLinecap="round" />
      <path d="M108 90v130" stroke="#fff" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
