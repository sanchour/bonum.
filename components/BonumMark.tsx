/** The small six-petalled rose used as Bonum's mark (rail, splash, icons). */
export function BonumMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
    >
      <circle r="92" strokeOpacity="0.35" strokeWidth="3" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <path
          key={angle}
          transform={`rotate(${angle})`}
          d="M -12 -26 C -22 -42 -23 -64 0 -86 C 23 -64 22 -42 12 -26 Q 0 -22 -12 -26 Z"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      ))}
      <circle r="15" fill="currentColor" stroke="none" />
    </svg>
  );
}
