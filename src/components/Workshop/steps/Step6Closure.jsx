import { useState } from 'react'
import styles from './Step6Closure.module.css'

const CATEGORIES = [
  {
    id: 'strap',
    label: 'Strap',
    options: [
      { id: 'thin-strap', label: 'Thin Strap' },
      { id: 'wide-strap', label: 'Wide Strap' },
    ],
  },
  {
    id: 'buckle',
    label: 'Buckle',
    options: [
      { id: 'buckle-a', label: 'Buckle A' },
      { id: 'buckle-b', label: 'D-ring B' },
    ],
  },
  {
    id: 'snap',
    label: 'Snap',
    options: [
      { id: 'round-snap', label: 'Round Snap' },
      { id: 'hidden-snap', label: 'Hidden Snap' },
    ],
  },
]

export default function Step6Closure({ onSelect, onNext }) {
  const [selected, setSelected] = useState(null)

  function handleSelect(id) {
    setSelected(id)
    onSelect?.(id)
  }

  return (
    <div className={styles.container}>
      <div className={styles.categories}>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className={styles.category}>
            <p className={styles.catLabel}>{cat.label}</p>
            <div className={styles.options}>
              {cat.options.map(opt => (
                <button
                  key={opt.id}
                  className={[
                    styles.card,
                    selected === opt.id ? styles.cardSelected : '',
                  ].join(' ')}
                  onClick={() => handleSelect(opt.id)}
                  aria-pressed={selected === opt.id}
                >
                  <ClosureIcon type={opt.id} selected={selected === opt.id} />
                  <span className={styles.optLabel}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className={styles.nextBtn}
        onClick={onNext}
        disabled={!selected}
      >
        Next <Arrow />
      </button>
    </div>
  )
}

// ── SVG closure illustrations ─────────────────────────────────────────────────

function ClosureIcon({ type, selected }) {
  const c  = selected ? '#8B6F47' : '#b0a090'
  const cs = selected ? '#8B6F47' : '#c0b0a0'

  switch (type) {
    case 'thin-strap':
      return (
        <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
          {/* strap */}
          <rect x={2} y={15} width={52} height={6} rx={3} fill={c} />
          {/* buckle frame */}
          <rect x={20} y={11} width={16} height={14} rx={2} fill="none" stroke={cs} strokeWidth={1.8} />
          {/* center pin */}
          <line x1={28} y1={11} x2={28} y2={25} stroke={cs} strokeWidth={1.2} />
        </svg>
      )
    case 'wide-strap':
      return (
        <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
          <rect x={2} y={11} width={52} height={14} rx={4} fill={c} />
          <rect x={18} y={7}  width={20} height={22} rx={3} fill="none" stroke={cs} strokeWidth={1.8} />
          <line x1={28} y1={7} x2={28} y2={29} stroke={cs} strokeWidth={1.2} />
        </svg>
      )
    case 'buckle-a':
      return (
        <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
          {/* leather strap */}
          <rect x={2} y={14} width={32} height={8} rx={4} fill={c} />
          {/* rectangular buckle frame */}
          <rect x={30} y={9} width={24} height={18} rx={2} fill="none" stroke={cs} strokeWidth={2} />
          {/* center bar pin */}
          <line x1={42} y1={9}  x2={42} y2={27} stroke={cs} strokeWidth={1.5} />
          {/* strap tongue through buckle */}
          <line x1={30} y1={18} x2={54} y2={18} stroke={cs} strokeWidth={1} strokeDasharray="2 2" />
        </svg>
      )
    case 'buckle-b':
      return (
        <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
          {/* leather strap */}
          <rect x={2} y={14} width={28} height={8} rx={4} fill={c} />
          {/* D-ring: flat side left, curve right */}
          <path
            d="M30 10 L38 10 A10 8 0 0 1 38 26 L30 26 Z"
            fill="none" stroke={cs} strokeWidth={2} strokeLinejoin="round"
          />
          <line x1={30} y1={10} x2={30} y2={26} stroke={cs} strokeWidth={2} />
        </svg>
      )
    case 'round-snap':
      return (
        <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
          <circle cx={28} cy={18} r={13} fill="none" stroke={cs} strokeWidth={2} />
          <circle cx={28} cy={18} r={7}  fill="none" stroke={cs} strokeWidth={1.5} />
          <circle cx={28} cy={18} r={3}  fill={c} />
          {/* small notch lines */}
          {[0,90,180,270].map(a => {
            const rad = a * Math.PI / 180
            return (
              <line
                key={a}
                x1={28 + 13 * Math.cos(rad)} y1={18 + 13 * Math.sin(rad)}
                x2={28 + 10 * Math.cos(rad)} y2={18 + 10 * Math.sin(rad)}
                stroke={cs} strokeWidth={1.2}
              />
            )
          })}
        </svg>
      )
    case 'hidden-snap':
      return (
        <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden="true">
          {/* capsule housing */}
          <rect x={8} y={11} width={40} height={14} rx={7} fill="none" stroke={cs} strokeWidth={1.8} />
          {/* divider seam */}
          <line x1={28} y1={11} x2={28} y2={25} stroke={cs} strokeWidth={1} strokeDasharray="2 2" />
          {/* magnet indicators */}
          <circle cx={18} cy={18} r={3.5} fill={c} opacity={0.7} />
          <circle cx={38} cy={18} r={3.5} fill={c} opacity={0.7} />
          {/* N/S labels implied by small lines */}
          <line x1={15} y1={18} x2={21} y2={18} stroke="rgba(255,255,255,0.5)" strokeWidth={1}/>
          <line x1={35} y1={18} x2={41} y2={18} stroke="rgba(255,255,255,0.5)" strokeWidth={1}/>
        </svg>
      )
    default:
      return null
  }
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
