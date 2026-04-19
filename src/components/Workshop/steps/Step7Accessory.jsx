import { useState } from 'react'
import styles from './Step7Accessory.module.css'

const OPTIONS = [
  { id: 'pen-loop', label: 'Pen Loop', desc: 'Elastic loop on spine' },
  { id: 'none',     label: 'None',     desc: 'Keep it minimal' },
]

export default function Step7Accessory({ onSelect, onNext }) {
  const [selected, setSelected] = useState(null)

  function handleSelect(id) {
    setSelected(id)
    onSelect?.(id)
  }

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            className={[
              styles.card,
              selected === opt.id ? styles.cardSelected : '',
            ].join(' ')}
            onClick={() => handleSelect(opt.id)}
            aria-pressed={selected === opt.id}
          >
            <AccessoryIcon type={opt.id} selected={selected === opt.id} />
            <span className={styles.optLabel}>{opt.label}</span>
            <span className={styles.optDesc}>{opt.desc}</span>
          </button>
        ))}
      </div>

      <button
        className={styles.finishBtn}
        onClick={onNext}
        disabled={!selected}
      >
        Complete <Checkmark />
      </button>
    </div>
  )
}

// ── SVG illustrations ─────────────────────────────────────────────────────────

function AccessoryIcon({ type, selected }) {
  const c  = selected ? '#8B6F47' : '#b0a090'
  const cs = selected ? '#c9a87c' : '#ccc0b0'

  if (type === 'pen-loop') {
    return (
      <svg width="56" height="80" viewBox="0 0 56 80" aria-hidden="true">
        {/* binder spine */}
        <rect x={6} y={4} width={12} height={72} rx={4} fill={c} />
        {/* elastic loop (side view) */}
        <rect x={18} y={18} width={9} height={44} rx={4.5}
          fill="none" stroke={cs} strokeWidth={2.5} />
        {/* pen body inside loop */}
        <rect x={20} y={14} width={5} height={52} rx={2.5}
          fill={c} opacity={0.5} />
        {/* pen tip */}
        <polygon points="20,66 25,66 22.5,72" fill={c} opacity={0.6} />
        {/* pen clip */}
        <rect x={23} y={14} width={1.5} height={20} rx={0.75}
          fill={cs} opacity={0.7} />
      </svg>
    )
  }

  // none
  return (
    <svg width="56" height="80" viewBox="0 0 56 80" aria-hidden="true">
      {/* binder outline (plain, no accessories) */}
      <rect x={8} y={8} width={12} height={64} rx={4} fill={c} opacity={0.5} />
      <rect x={20} y={8} width={28} height={64} rx={3}
        fill="none" stroke={c} strokeWidth={1.5} strokeDasharray="4 3" />
      {/* X mark */}
      <line x1={29} y1={30} x2={43} y2={50} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={43} y1={30} x2={29} y2={50} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}

function Checkmark() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <path d="M1.5 5.5L5.5 9.5L12.5 1.5"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
