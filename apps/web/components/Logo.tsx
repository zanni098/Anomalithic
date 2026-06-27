/** The Anomalithic mark — a Claude-style coral asterisk/spark over a faceted stone. */
export function Logo({ size = 26 }: { size?: number }) {
  const arms = [0, 30, 60, 90, 120, 150];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <g transform="translate(16 16)">
        {arms.map((deg) => (
          <rect
            key={deg}
            x="-1.5"
            y="-13"
            width="3"
            height="26"
            rx="1.5"
            fill="var(--clay)"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle r="3.2" fill="var(--clay-strong)" />
      </g>
    </svg>
  );
}
