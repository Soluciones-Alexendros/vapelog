export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 32"
      role="img"
      aria-label="Vapelog"
      className={className}
    >
      <title>Vapelog</title>
      <g transform="translate(0 0)">
        <path
          d="M8 7 L16 22.5 L24 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 21.5 c0.3 3.5 3 5.6 5.9 4.7 c2.3 -0.7 3.2 -3.3 1.9 -5 c-1.1 -1.5 -3.3 -1.4 -4.2 0.3 c-0.6 1.1 0 2.3 1.1 2.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      </g>
      <text
        x="38"
        y="23.5"
        fill="currentColor"
        fontFamily="Public Sans Variable, Public Sans, system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="21"
        fontWeight="600"
        letterSpacing="-0.4"
      >
        Vapelog
      </text>
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      role="img"
      aria-label="Vapelog"
      className={className}
    >
      <title>Vapelog</title>
      <path
        d="M8 7 L16 22.5 L24 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21.5 c0.3 3.5 3 5.6 5.9 4.7 c2.3 -0.7 3.2 -3.3 1.9 -5 c-1.1 -1.5 -3.3 -1.4 -4.2 0.3 c-0.6 1.1 0 2.3 1.1 2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
