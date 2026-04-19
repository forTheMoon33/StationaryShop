import { useState } from 'react'
import styles from './Step2Zones.module.css'

// Zone colors — warm palette, up to 3 zones per template
const ZONE_COLORS = ['#c9a87c', '#8B6F47', '#d4b896']

const TEMPLATES = [
  {
    id: 'full',
    label: 'Full Cover',
    zones: [
      { name: 'Cover', x: 0, y: 0, w: 1, h: 1 },
    ],
  },
  {
    id: 'top-bottom',
    label: 'Top / Bottom',
    zones: [
      { name: 'Top',    x: 0, y: 0,   w: 1, h: 0.5 },
      { name: 'Bottom', x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: 'left-right',
    label: 'Left / Right',
    zones: [
      { name: 'Left',  x: 0,   y: 0, w: 0.5, h: 1 },
      { name: 'Right', x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: 'top-mid-bottom',
    label: 'Three Rows',
    zones: [
      { name: 'Top',    x: 0, y: 0,      w: 1, h: 0.333 },
      { name: 'Middle', x: 0, y: 0.333,  w: 1, h: 0.334 },
      { name: 'Bottom', x: 0, y: 0.667,  w: 1, h: 0.333 },
    ],
  },
  {
    id: '3-columns',
    label: 'Three Columns',
    zones: [
      { name: 'Left',   x: 0,     y: 0, w: 0.333, h: 1 },
      { name: 'Center', x: 0.333, y: 0, w: 0.334, h: 1 },
      { name: 'Right',  x: 0.667, y: 0, w: 0.333, h: 1 },
    ],
  },
]

export default function Step2Zones({ onZonesConfirm, onNext }) {
  const [selectedId, setSelectedId] = useState(null)

  function handleSelect(template) {
    setSelectedId(template.id)
  }

  function handleConfirm() {
    const template = TEMPLATES.find(t => t.id === selectedId)
    if (!template) return
    onZonesConfirm?.(template.zones)
    onNext?.()
  }

  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        {TEMPLATES.map(template => (
          <button
            key={template.id}
            className={[
              styles.card,
              selectedId === template.id ? styles.cardSelected : '',
            ].join(' ')}
            onClick={() => handleSelect(template)}
            aria-pressed={selectedId === template.id}
          >
            <TemplatePreview zones={template.zones} selected={selectedId === template.id} />
            <span className={styles.label}>{template.label}</span>
            <span className={styles.zoneCount}>
              {template.zones.length} zone{template.zones.length !== 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>

      <button
        className={styles.confirmBtn}
        onClick={handleConfirm}
        disabled={!selectedId}
      >
        Confirm
        <Arrow />
      </button>
    </div>
  )
}

// SVG binder silhouette with zone rects
function TemplatePreview({ zones, selected }) {
  const W = 48
  const H = 64
  const spineW = 8
  // inner cover area where zones are drawn
  const coverX = spineW
  const coverW = W - spineW

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className={styles.preview}
      aria-hidden="true"
    >
      {/* spine */}
      <rect
        x={0} y={0} width={spineW} height={H} rx={2}
        fill={selected ? '#8B6F47' : '#cfc3b0'}
      />

      {/* zone fills */}
      {zones.map((zone, i) => (
        <rect
          key={i}
          x={coverX + zone.x * coverW}
          y={zone.y * H}
          width={zone.w * coverW}
          height={zone.h * H}
          fill={selected
            ? ZONE_COLORS[i % ZONE_COLORS.length]
            : lighten(ZONE_COLORS[i % ZONE_COLORS.length])}
          rx={i === 0 && zones.length === 1 ? 2 : 0}
        />
      ))}

      {/* zone dividers */}
      {zones.map((zone, i) => {
        if (i === 0) return null
        // horizontal divider
        const isRow = zone.x === 0 && zone.w === 1
        return isRow ? (
          <line
            key={i}
            x1={coverX} y1={zone.y * H}
            x2={W}      y2={zone.y * H}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1}
          />
        ) : (
          <line
            key={i}
            x1={coverX + zone.x * coverW} y1={0}
            x2={coverX + zone.x * coverW} y2={H}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={1}
          />
        )
      })}

      {/* cover outline */}
      <rect
        x={coverX} y={0} width={coverW} height={H} rx={2}
        fill="none"
        stroke={selected ? '#8B6F47' : '#b8a890'}
        strokeWidth={1}
      />
    </svg>
  )
}

// Desaturate a hex color for the unselected state
function lighten(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c) => Math.round(c * 0.3 + 220 * 0.7)
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`
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
