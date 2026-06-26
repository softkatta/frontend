const CORE = { cx: 600, cy: 400 }

const ARC_PATHS = [
  'M 600 400 C 600 280 600 180 600 130',
  'M 600 400 C 480 400 280 400 150 400',
  'M 600 400 C 720 400 920 400 1050 400',
  'M 600 400 C 600 520 600 620 600 670',
] as const

const SATELLITES = [
  { cx: 600, cy: 130, delay: 0, icon: 'erp' as const },
  { cx: 150, cy: 400, delay: 0.45, icon: 'pos' as const },
  { cx: 1050, cy: 400, delay: 0.9, icon: 'crm' as const },
  { cx: 600, cy: 670, delay: 1.35, icon: 'hr' as const },
]

const ORBIT_DOTS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  return {
    cx: CORE.cx + Math.cos(a) * 118,
    cy: CORE.cy + Math.sin(a) * 72,
    delay: i * 0.12,
  }
})

const FLOW_WAVES = [
  'M-60,560 C220,500 380,300 600,360 S920,180 1260,240',
  'M-40,200 C240,260 420,100 640,220 S960,40 1260,120',
] as const

function hexPoints(size: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${Math.cos(angle) * size},${Math.sin(angle) * size}`
  }).join(' ')
}

function SatelliteIcon({ type }: { type: (typeof SATELLITES)[number]['icon'] }) {
  const s = 'hero-mesh__glyph'
  switch (type) {
    case 'erp':
      return (
        <g className={s}>
          <rect x="-9" y="4" width="4" height="7" rx="0.5" />
          <rect x="-2" y="-1" width="4" height="12" rx="0.5" />
          <rect x="5" y="-6" width="4" height="17" rx="0.5" />
        </g>
      )
    case 'pos':
      return (
        <g className={s}>
          <rect x="-10" y="-8" width="20" height="16" rx="2" fill="none" strokeWidth="1.5" />
          <line x1="-6" y1="-3" x2="6" y2="-3" strokeWidth="1.5" />
          <line x1="-6" y1="2" x2="2" y2="2" strokeWidth="1.5" />
        </g>
      )
    case 'crm':
      return (
        <g className={s}>
          <circle cx="0" cy="-6" r="3.5" fill="none" strokeWidth="1.5" />
          <circle cx="-7" cy="5" r="3" fill="none" strokeWidth="1.5" />
          <circle cx="7" cy="5" r="3" fill="none" strokeWidth="1.5" />
          <line x1="0" y1="-2.5" x2="-5" y2="3" strokeWidth="1.2" />
          <line x1="0" y1="-2.5" x2="5" y2="3" strokeWidth="1.2" />
        </g>
      )
    case 'hr':
      return (
        <g className={s}>
          <rect x="-9" y="-2" width="18" height="12" rx="2" fill="none" strokeWidth="1.5" />
          <path d="M-5 -2 V-6 H5 V-2" fill="none" strokeWidth="1.5" />
          <line x1="-4" y1="4" x2="4" y2="4" strokeWidth="1.5" />
        </g>
      )
  }
}

export function HeroPathAnimation() {
  return (
    <div className="hero-mesh absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="hero-mesh__aurora hero-mesh__aurora--1" />
      <div className="hero-mesh__aurora hero-mesh__aurora--2" />
      <div className="hero-mesh__perspective" />

      <svg
        className="hero-mesh__svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-mesh-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
            <stop offset="40%" stopColor="#2dd4bf" stopOpacity="1" />
            <stop offset="60%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="hero-mesh-core">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#2563eb" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
          </radialGradient>
          <filter id="hero-mesh-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {FLOW_WAVES.map((d, i) => (
          <g key={d}>
            <path d={d} className="hero-mesh__wave hero-mesh__wave--dim" />
            <path
              d={d}
              className="hero-mesh__wave hero-mesh__wave--bright"
              stroke="url(#hero-mesh-grad)"
              filter="url(#hero-mesh-glow)"
              style={{ animationDelay: `${i * 0.8}s`, animationDuration: `${5 + i}s` }}
            />
            <circle r="2.5" fill="#2dd4bf" opacity="0.9">
              <animateMotion dur={`${6 + i}s`} repeatCount="indefinite" path={d} begin={`${i}s`} />
            </circle>
          </g>
        ))}

        {[0, 1, 2].map((i) => (
          <circle
            key={`ripple-${i}`}
            cx={CORE.cx}
            cy={CORE.cy}
            r="36"
            className="hero-mesh__ripple"
            style={{ animationDelay: `${i * 1.4}s` }}
          />
        ))}

        {ARC_PATHS.map((d, i) => (
          <g key={d}>
            <path d={d} className="hero-mesh__arc hero-mesh__arc--ghost" />
            <path
              d={d}
              className="hero-mesh__arc hero-mesh__arc--pulse"
              style={{ animationDelay: `${SATELLITES[i].delay}s` }}
            />
            <circle r="2.5" fill="#2563eb" opacity="0.85">
              <animateMotion
                dur="3.2s"
                repeatCount="indefinite"
                path={d}
                begin={`${SATELLITES[i].delay}s`}
              />
            </circle>
          </g>
        ))}

        {ORBIT_DOTS.map(({ cx, cy, delay }, i) => (
          <circle
            key={`orbit-${i}`}
            cx={cx}
            cy={cy}
            r="2"
            className="hero-mesh__orbit-dot"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}

        <g transform={`translate(${CORE.cx}, ${CORE.cy})`} filter="url(#hero-mesh-glow)">
          <circle r="95" fill="url(#hero-mesh-core)" className="hero-mesh__core-breathe" />
          <g className="hero-mesh__spin hero-mesh__spin--a">
            <polygon points={hexPoints(62)} className="hero-mesh__hex hero-mesh__hex--a" />
          </g>
          <g className="hero-mesh__spin hero-mesh__spin--b">
            <polygon points={hexPoints(42)} className="hero-mesh__hex hero-mesh__hex--b" />
          </g>
          <g className="hero-mesh__spin hero-mesh__spin--c">
            <polygon points={hexPoints(22)} className="hero-mesh__hex hero-mesh__hex--c" />
          </g>
          <circle r="7" className="hero-mesh__core-pulse" />
        </g>

        {SATELLITES.map(({ cx, cy, delay, icon }) => (
          <g
            key={icon}
            transform={`translate(${cx}, ${cy})`}
            className="hero-mesh__satellite"
            style={{ animationDelay: `${delay}s` }}
          >
            <circle r="28" className="hero-mesh__sat-ring" />
            <circle r="20" className="hero-mesh__sat-core" />
            <SatelliteIcon type={icon} />
          </g>
        ))}
      </svg>
    </div>
  )
}
