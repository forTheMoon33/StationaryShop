import styles from './Step2ExteriorDesign.module.css'

// ── Tool definitions ──────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'select',    label: 'Select' },
  { id: 'rectangle', label: 'Rect'   },
  { id: 'circle',    label: 'Circle' },
  { id: 'heart',     label: 'Heart'  },
  { id: 'star',      label: 'Star'   },
]

const FILL_PATTERNS = [
  { value: 'solid',   label: 'Solid'   },
  { value: 'leather', label: 'Leather' },
  { value: 'canvas',  label: 'Canvas'  },
  { value: 'pvc',     label: 'PVC'     },
]

const BORDER_STYLES = [
  { value: 'none',   label: 'None'   },
  { value: 'solid',  label: 'Solid'  },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
]

const BORDER_WIDTHS = [
  { value: 1, label: 'Thin'   },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Thick'  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function Step2ExteriorDesign({
  activeTool    = 'select',
  onToolChange,
  selectedShape = null,
  onShapeUpdate,
  onDeleteShape,
  onMoveForward,
  onMoveBackward,
  onNext,
}) {
  function updateProp(key, value) {
    if (!selectedShape) return
    onShapeUpdate?.({ ...selectedShape, [key]: value })
  }

  return (
    <div className={styles.container}>

      {/* ── Tool strip ── */}
      <div className={styles.tools}>
        {TOOLS.map(t => (
          <button
            key={t.id}
            className={`${styles.toolBtn} ${activeTool === t.id ? styles.toolActive : ''}`}
            onClick={() => onToolChange?.(t.id)}
            title={t.label}
          >
            <ToolIcon type={t.id} />
            <span className={styles.toolLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Shape properties (visible when a shape is selected) ── */}
      {selectedShape ? (
        <div className={styles.props}>

          <div className={styles.propGroup}>
            <label className={styles.propLabel}>Fill</label>
            <input
              type="color"
              className={styles.colorInput}
              value={selectedShape.fill}
              onChange={e => updateProp('fill', e.target.value)}
            />
            <div className={styles.segmented}>
              {FILL_PATTERNS.map(p => (
                <button
                  key={p.value}
                  className={`${styles.seg} ${selectedShape.fillPattern === p.value ? styles.segActive : ''}`}
                  onClick={() => updateProp('fillPattern', p.value)}
                >{p.label}</button>
              ))}
            </div>
          </div>

          <div className={styles.propGroup}>
            <label className={styles.propLabel}>Border</label>
            <div className={styles.segmented}>
              {BORDER_STYLES.map(b => (
                <button
                  key={b.value}
                  className={`${styles.seg} ${selectedShape.borderStyle === b.value ? styles.segActive : ''}`}
                  onClick={() => updateProp('borderStyle', b.value)}
                >{b.label}</button>
              ))}
            </div>
            {selectedShape.borderStyle !== 'none' && (
              <>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={selectedShape.borderColor}
                  onChange={e => updateProp('borderColor', e.target.value)}
                />
                <div className={styles.segmented}>
                  {BORDER_WIDTHS.map(w => (
                    <button
                      key={w.value}
                      className={`${styles.seg} ${selectedShape.borderWidth === w.value ? styles.segActive : ''}`}
                      onClick={() => updateProp('borderWidth', w.value)}
                    >{w.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={styles.propGroup}>
            <label className={styles.propLabel}>Order</label>
            <div className={styles.segmented}>
              <button className={styles.seg} onClick={onMoveForward} title="Bring forward">↑</button>
              <button className={styles.seg} onClick={onMoveBackward} title="Send backward">↓</button>
            </div>
            <button className={styles.deleteBtn} onClick={onDeleteShape} title="Delete shape">
              ✕ Delete
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.hint}>
          {activeTool === 'select' ? 'Click a shape to select it' : 'Click or drag on the face to draw'}
        </p>
      )}

      <button className={styles.nextBtn} onClick={onNext}>
        Next <Arrow />
      </button>
    </div>
  )
}

// ── Tool icons ────────────────────────────────────────────────────────────────
function ToolIcon({ type }) {
  switch (type) {
    case 'select':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 2l10 6-5.5 1L5 14 3 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      )
    case 'rectangle':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    case 'circle':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <ellipse cx="8" cy="8" rx="6" ry="6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    case 'heart':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 13C8 13 2 9 2 5.5A3.5 3.5 0 0 1 8 4.5a3.5 3.5 0 0 1 6 1C14 9 8 13 8 13z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      )
    case 'star':
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2l1.8 3.6L14 6.5l-3 2.9.7 4.1L8 11.4l-3.7 2.1.7-4.1-3-2.9 4.2-.9z"
            stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
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
