import type React from 'react';

interface SakuraPetalsProps {
  enabled?: boolean;
  pace?: number;
}

const PETALS = [
  { left: '8%', size: 12, duration: '14s', delay: '0s', drift: '28px', opacity: 0.65 },
  { left: '19%', size: 9, duration: '17s', delay: '2.5s', drift: '-22px', opacity: 0.5 },
  { left: '31%', size: 14, duration: '13s', delay: '5s', drift: '34px', opacity: 0.55 },
  { left: '46%', size: 10, duration: '16s', delay: '1.2s', drift: '-26px', opacity: 0.45 },
  { left: '61%', size: 13, duration: '15s', delay: '4s', drift: '24px', opacity: 0.6 },
  { left: '74%', size: 9, duration: '18s', delay: '0.8s', drift: '-30px', opacity: 0.5 },
  { left: '86%', size: 12, duration: '14.5s', delay: '3.2s', drift: '20px', opacity: 0.58 },
  { left: '93%', size: 10, duration: '16.5s', delay: '6s', drift: '-18px', opacity: 0.48 },
];

export function SakuraPetals({ enabled = true, pace = 1 }: SakuraPetalsProps) {
  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {PETALS.map((petal, idx) => (
        <svg
          key={idx}
          viewBox="0 0 24 24"
          className="sakura-petal"
          style={
            {
              left: petal.left,
              width: `${petal.size}px`,
              height: `${petal.size}px`,
              animationDuration: `${(parseFloat(petal.duration) * pace).toFixed(1)}s`,
              animationDelay: petal.delay,
              opacity: petal.opacity,
              '--drift-x': petal.drift,
            } as React.CSSProperties
          }
        >
          <path
            d="M12 2C15.5 5 19 9.5 17.5 15.5C16.2 19.5 13.8 21.5 12 22C10.2 21.5 7.8 19.5 6.5 15.5C5 9.5 8.5 5 12 2Z"
            fill="#E9A9B8"
          />
          <path
            d="M12 2C13 6 13.2 11 12 18"
            stroke="#F4DCE3"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ))}
    </div>
  );
}
