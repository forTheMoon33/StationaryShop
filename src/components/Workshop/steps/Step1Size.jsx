import { useState } from 'react'
import styles from './Step1Size.module.css'

const SIZES = [
  {
    id: 'A7',
    label: 'A7',
    dims: '105 × 77 mm',
    holes: 6,
    // portrait: height / width
    ratio: 105 / 77,
  },
  {
    id: 'A6',
    label: 'A6',
    dims: '148 × 105 mm',
    holes: 6,
    ratio: 148 / 105,
  },
  {
    id: 'M5',
    label: 'M5',
    dims: '128 × 80 mm',
    holes: 5,
    ratio: 128 / 80,
  },
]

export default function Step1Size({ onSelect, onNext }) {
  const [selected, setSelected] = useState(null)

  function handleSelect(size) {
    setSelected(size.id)
    onSelect?.(size)
  }

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        {SIZES.map(size => {
          const isSelected = selected === size.id
          return (
            <button
              key={size.id}
              className={[styles.card, isSelected ? styles.cardSelected : ''].join(' ')}
              onClick={() => handleSelect(size)}
              aria-pressed={isSelected}
            >
              <BinderPreview size={size} selected={isSelected} />
              <span className={styles.sizeName}>{size.label}</span>
              <span className={styles.dims}>{size.dims}</span>
              <span className={styles.holeCount}>
                {size.holes}-hole
              </span>
            </button>
          )
        })}
      </div>

      <button
        className={styles.nextBtn}
        onClick={onNext}
        disabled={!selected}
      >
        Next
        <Arrow />
      </button>
    </div>
  )
}

// Small proportional binder silhouette with spine + hole dots
function BinderPreview({ size, selected }) {
  // Fixed display width; height driven by real proportion
  const W = 52
  const H = Math.round(W * size.ratio)

  const spineW = 9
  const holeR = 2.5
  const holeX = spineW / 2
  const topPad = 8
  const botPad = 8
  const holeSpacing = (H - topPad - botPad) / (size.holes - 1)

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={styles.preview}
      aria-hidden="true"
    >
      {/* Cover body */}
      <rect
        x={spineW}
        y={0}
        width={W - spineW}
        height={H}
        rx={3}
        className={[styles.coverRect, selected ? styles.coverSelected : ''].join(' ')}
      />
      {/* Spine strip */}
      <rect
        x={0}
        y={0}
        width={spineW}
        height={H}
        rx={2}
        className={[styles.spineRect, selected ? styles.spineSelected : ''].join(' ')}
      />
      {/* Binding holes */}
      {Array.from({ length: size.holes }).map((_, i) => (
        <circle
          key={i}
          cx={holeX}
          cy={topPad + i * holeSpacing}
          r={holeR}
          className={[styles.hole, selected ? styles.holeSelected : ''].join(' ')}
        />
      ))}
    </svg>
  )
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 7h9M7.5 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
