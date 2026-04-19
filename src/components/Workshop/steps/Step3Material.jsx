import styles from './Step3Material.module.css'

export const MATERIALS = [
  { id: 'leather', label: '真皮',    en: 'Leather' },
  { id: 'pvc',     label: '透明PVC', en: 'Transparent PVC' },
  { id: 'canvas',  label: '帆布',    en: 'Canvas' },
  { id: 'pu',      label: 'PU革',   en: 'PU Leather' },
]

export default function Step3Material({
  zones = [],
  selectedZoneIndex,
  zoneMaterials = {},
  onMaterialChange,
  onNext,
}) {
  const hasSelection   = selectedZoneIndex != null
  const selectedZone   = zones[selectedZoneIndex]
  const activeMaterial = hasSelection ? zoneMaterials[selectedZoneIndex] : null
  const allAssigned    = zones.length > 0 && zones.every((_, i) => zoneMaterials[i] != null)

  function handleMaterialClick(matId) {
    if (!hasSelection) return
    onMaterialChange?.(selectedZoneIndex, matId)
  }

  return (
    <div className={styles.container}>
      <div className={styles.hint}>
        {hasSelection
          ? <><span className={styles.hintZone}>{selectedZone?.name}</span> — choose a material</>
          : 'Select a zone from the panel →'
        }
      </div>

      <div className={styles.materials}>
        {MATERIALS.map(mat => (
          <button
            key={mat.id}
            className={[
              styles.card,
              activeMaterial === mat.id ? styles.cardSelected : '',
              !hasSelection ? styles.cardDisabled : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleMaterialClick(mat.id)}
            disabled={!hasSelection}
            aria-pressed={activeMaterial === mat.id}
          >
            <MaterialSwatch type={mat.id} selected={activeMaterial === mat.id} />
            <span className={styles.labelCn}>{mat.label}</span>
            <span className={styles.labelEn}>{mat.en}</span>
          </button>
        ))}
      </div>

      <button
        className={styles.nextBtn}
        onClick={onNext}
        disabled={!allAssigned}
        title={!allAssigned ? 'Assign a material to every zone first' : ''}
      >
        Next
        <Arrow />
      </button>
    </div>
  )
}

// ── Texture swatches ────────────────────────────────────────────────────────

function MaterialSwatch({ type, selected }) {
  const swatches = { leather: Leather, pvc: PVC, canvas: Canvas, pu: PU }
  const Swatch = swatches[type]
  return Swatch ? <Swatch selected={selected} /> : null
}

function Leather({ selected }) {
  const base = selected ? '#7a6040' : '#9a7a58'
  return (
    <svg width="56" height="38" viewBox="0 0 56 38" className={styles.swatch} aria-hidden="true">
      <defs>
        <pattern id="lp" patternUnits="userSpaceOnUse" width="7" height="7">
          <line x1="0" y1="7" x2="7" y2="0" stroke="rgba(0,0,0,0.18)" strokeWidth="0.9"/>
        </pattern>
      </defs>
      <rect width="56" height="38" rx="4" fill={base}/>
      <rect width="56" height="38" rx="4" fill="url(#lp)"/>
      {/* subtle highlight */}
      <rect x="6" y="4" width="18" height="6" rx="3" fill="rgba(255,255,255,0.12)"/>
    </svg>
  )
}

function PVC({ selected }) {
  const base = selected ? 'rgba(160,200,230,0.55)' : 'rgba(195,220,240,0.55)'
  return (
    <svg width="56" height="38" viewBox="0 0 56 38" className={styles.swatch} aria-hidden="true">
      <defs>
        <pattern id="pvcp" patternUnits="userSpaceOnUse" width="8" height="8">
          <circle cx="4" cy="4" r="1" fill="rgba(100,160,200,0.25)"/>
        </pattern>
      </defs>
      <rect width="56" height="38" rx="4" fill="#e8f3f8"/>
      <rect width="56" height="38" rx="4" fill={base}/>
      <rect width="56" height="38" rx="4" fill="url(#pvcp)"/>
      {/* gloss streak */}
      <rect x="8" y="5" width="22" height="4" rx="2" fill="rgba(255,255,255,0.55)"/>
    </svg>
  )
}

function Canvas({ selected }) {
  const base = selected ? '#b09060' : '#c8a870'
  return (
    <svg width="56" height="38" viewBox="0 0 56 38" className={styles.swatch} aria-hidden="true">
      <defs>
        <pattern id="cvp" patternUnits="userSpaceOnUse" width="5" height="5">
          <line x1="0" y1="0" x2="5" y2="0" stroke="rgba(0,0,0,0.14)" strokeWidth="1"/>
          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(0,0,0,0.14)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="56" height="38" rx="4" fill={base}/>
      <rect width="56" height="38" rx="4" fill="url(#cvp)"/>
    </svg>
  )
}

function PU({ selected }) {
  return (
    <svg width="56" height="38" viewBox="0 0 56 38" className={styles.swatch} aria-hidden="true">
      <defs>
        <linearGradient id="pug" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={selected ? '#5a5a68' : '#72727e'}/>
          <stop offset="60%"  stopColor={selected ? '#3a3a46' : '#4e4e5a'}/>
          <stop offset="100%" stopColor={selected ? '#26262f' : '#36363f'}/>
        </linearGradient>
      </defs>
      <rect width="56" height="38" rx="4" fill="url(#pug)"/>
      {/* highlight band */}
      <rect x="5" y="6" width="14" height="26" rx="5" fill="rgba(255,255,255,0.1)"/>
    </svg>
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
