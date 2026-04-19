import styles from './Step5Decoration.module.css'

// ── Shared icon components (also imported by index.jsx for canvas overlays) ──

export function FlowerIcon({ size = 32 }) {
  const c = size / 2
  const r = size * 0.28 // petal offset from center
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {/* 6 petals */}
      {[0, 60, 120, 180, 240, 300].map(a => (
        <ellipse
          key={a}
          cx={16}
          cy={16 - r}
          rx={4}
          ry={7}
          fill="#c9a87c"
          opacity={0.88}
          transform={`rotate(${a} 16 16)`}
        />
      ))}
      {/* center */}
      <circle cx={16} cy={16} r={5}  fill="#8B6F47" />
      <circle cx={16} cy={16} r={2.5} fill="#c9a87c" />
    </svg>
  )
}

export function ButtonIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {/* outer rim */}
      <circle cx={16} cy={16} r={13} fill="#5a3e28" />
      {/* inner face */}
      <circle cx={16} cy={16} r={10} fill="#7a5a38" />
      {/* rim highlight */}
      <circle cx={16} cy={16} r={13} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      {/* 4 thread holes */}
      {[[-3,-3],[3,-3],[-3,3],[3,3]].map(([dx,dy],i) => (
        <circle key={i} cx={16+dx} cy={16+dy} r={1.8} fill="rgba(0,0,0,0.45)" />
      ))}
      {/* thread cross */}
      <line x1={13} y1={13} x2={19} y2={19} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8}/>
      <line x1={19} y1={13} x2={13} y2={19} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8}/>
    </svg>
  )
}

// ── Palette item data ─────────────────────────────────────────────────────────

const PALETTE = [
  { id: 'flower', label: 'Metal Flower', Icon: FlowerIcon },
  { id: 'button', label: 'Button',       Icon: ButtonIcon },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step5Decoration({ decorations = [], onClearDecorations, onNext }) {
  const counts = Object.fromEntries(
    PALETTE.map(({ id }) => [id, decorations.filter(d => d.type === id).length])
  )
  const total = decorations.length

  return (
    <div className={styles.container}>
      <p className={styles.hint}>Drag onto the binder to place</p>

      <div className={styles.palette}>
        {PALETTE.map(({ id, label, Icon }) => (
          <div key={id} className={styles.paletteItem}>
            <div
              draggable
              className={styles.dragCard}
              onDragStart={e => {
                e.dataTransfer.setData('deco-type', id)
                e.dataTransfer.effectAllowed = 'copy'
              }}
            >
              <Icon size={44} />
            </div>
            <span className={styles.paletteLabel}>{label}</span>
            {counts[id] > 0 && (
              <span className={styles.badge}>×{counts[id]}</span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        {total > 0 && (
          <button className={styles.clearBtn} onClick={onClearDecorations}>
            Clear all ({total})
          </button>
        )}

        <button className={styles.nextBtn} onClick={onNext}>
          Next <Arrow />
        </button>
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
