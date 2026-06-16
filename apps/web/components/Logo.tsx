/** The Anomalithic mark: an irregular, off-axis faceted stone — an "abnormal stone". */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <polygon
        points="9,2 21,3.6 30,13 25.6,26.2 12,30 3,20.6 2,9.6"
        fill="var(--clay)"
        stroke="var(--ink)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <g
        stroke="var(--ink)"
        strokeWidth="0.8"
        strokeOpacity="0.5"
        strokeLinejoin="round"
        fill="none"
      >
        <polyline points="9,2 14.5,13 30,13" />
        <polyline points="14.5,13 12,30" />
        <polyline points="14.5,13 2,9.6" />
        <polyline points="14.5,13 25.6,26.2" />
      </g>
    </svg>
  );
}
