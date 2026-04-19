import { useState, useRef, useMemo } from 'react'
import StepNav from '../../components/Workshop/StepNav'
import BinderCanvas from '../../components/Workshop/BinderCanvas'
import ZonePanel from '../../components/Workshop/ZonePanel'
import OptionPanel from '../../components/Workshop/OptionPanel'
import Step1Size from '../../components/Workshop/steps/Step1Size'
import Step2Zones from '../../components/Workshop/steps/Step2Zones'
import Step3Material from '../../components/Workshop/steps/Step3Material'
import Step4Color from '../../components/Workshop/steps/Step4Color'
import Step5Decoration, { FlowerIcon, ButtonIcon } from '../../components/Workshop/steps/Step5Decoration'
import Step6Closure from '../../components/Workshop/steps/Step6Closure'
import Step7Accessory from '../../components/Workshop/steps/Step7Accessory'
import styles from './Workshop.module.css'

export const STEPS = [
  { id: 1, label: 'Size' },
  { id: 2, label: 'Zones' },
  { id: 3, label: 'Material' },
  { id: 4, label: 'Color' },
  { id: 5, label: 'Decoration' },
  { id: 6, label: 'Closure' },
  { id: 7, label: 'Accessory' },
]

const ZONE_PANEL_STEPS = new Set([3, 4])

const MATERIAL_LABELS = {
  leather: '真皮', pvc: '透明PVC', canvas: '帆布', pu: 'PU革',
}

const DECO_ICONS = { flower: FlowerIcon, button: ButtonIcon }

const STEP_COMPONENTS = {
  1: Step1Size, 2: Step2Zones, 3: Step3Material,
  4: Step4Color, 5: Step5Decoration, 6: Step6Closure, 7: Step7Accessory,
}

export default function Workshop() {
  const [currentStep, setCurrentStep]       = useState(1)
  const [completedSteps, setCompletedSteps] = useState(new Set())

  const [selectedSize, setSelectedSize]           = useState('A6')
  const [zones, setZones]                         = useState([])
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(null)
  const [zoneMaterials, setZoneMaterials]         = useState({})
  const [zoneColors, setZoneColors]               = useState({})
  const [decorations, setDecorations]             = useState([])

  // Combined zones prop for BinderCanvas — stable reference via useMemo
  const binderZones = useMemo(() =>
    zones.map((zone, i) => ({
      ...zone,
      material: zoneMaterials[i] ?? null,
      color:    zoneColors[i]    ?? null,
    })),
    [zones, zoneMaterials, zoneColors],
  )

  const canvasRef    = useRef(null)
  const showZonePanel = ZONE_PANEL_STEPS.has(currentStep)

  // ── Navigation ──────────────────────────────────────────
  function handleStepClick(stepId) {
    if (completedSteps.has(stepId) || stepId === currentStep) setCurrentStep(stepId)
  }

  function advance() {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    if (currentStep < 7) setCurrentStep(prev => prev + 1)
  }

  // ── Step callbacks ───────────────────────────────────────
  function handleZonesConfirm(confirmedZones) {
    setZones(confirmedZones)
    setSelectedZoneIndex(confirmedZones.length > 0 ? 0 : null)
    setZoneMaterials({})
    setZoneColors({})
  }

  function handleMaterialChange(index, matId) {
    setZoneMaterials(prev => ({ ...prev, [index]: matId }))
  }

  function handleColorChange(index, color) {
    setZoneColors(prev => ({ ...prev, [index]: color }))
  }

  function handleCanvasDrop(e) {
    e.preventDefault()
    const type = e.dataTransfer.getData('deco-type')
    if (!type || !DECO_ICONS[type]) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setDecorations(prev => [...prev, { id: Date.now(), type, x, y }])
  }

  function handleDecorationMove(id, x, y) {
    setDecorations(prev => prev.map(d => d.id === id ? { ...d, x, y } : d))
  }

  function handleDecorationRemove(id) {
    setDecorations(prev => prev.filter(d => d.id !== id))
  }

  // ── ZonePanel assignments ────────────────────────────────
  function getAssignments() {
    if (currentStep === 3) {
      return zones.map((_, i) => ({
        label: zoneMaterials[i] ? MATERIAL_LABELS[zoneMaterials[i]] : '—',
        color: '#8B6F47',
      }))
    }
    if (currentStep === 4) {
      return zones.map((_, i) => ({
        label: zoneColors[i] ? zoneColors[i].toUpperCase() : '—',
        color: zoneColors[i] || '#e8dfd0',
      }))
    }
    return []
  }

  // ── Per-step props ───────────────────────────────────────
  const stepProps = {
    1: { onSelect: s => setSelectedSize(s.id), onNext: advance },
    2: { onZonesConfirm: handleZonesConfirm, onNext: advance },
    3: {
      zones, selectedZoneIndex,
      zoneMaterials, onMaterialChange: handleMaterialChange, onNext: advance,
    },
    4: {
      zones, selectedZoneIndex,
      zoneColors, onColorChange: handleColorChange, onNext: advance,
    },
    5: {
      decorations,
      onClearDecorations: () => setDecorations([]),
      onNext: advance,
    },
    6: { onNext: advance },
    7: { onNext: advance },
  }

  const ActiveStep = STEP_COMPONENTS[currentStep]

  return (
    <div className={styles.layout}>
      <header className={styles.stepBar}>
        <StepNav
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </header>

      <div className={styles.body}>
        <div
          className={styles.canvasArea}
          onDragOver={currentStep === 5 ? e => e.preventDefault() : undefined}
          onDrop={currentStep === 5 ? handleCanvasDrop : undefined}
        >
          <BinderCanvas ref={canvasRef} size={selectedSize} zones={binderZones} />

          {decorations.length > 0 && (
            <div className={styles.decoLayer}>
              {decorations.map(d => (
                <DecorationOverlay
                  key={d.id}
                  deco={d}
                  icons={DECO_ICONS}
                  onMove={handleDecorationMove}
                  onRemove={handleDecorationRemove}
                />
              ))}
            </div>
          )}
        </div>

        {showZonePanel && (
          <aside className={styles.zonePanel}>
            <ZonePanel
              zones={zones}
              selectedIndex={selectedZoneIndex}
              onSelect={setSelectedZoneIndex}
              assignments={getAssignments()}
            />
          </aside>
        )}
      </div>

      <div className={styles.optionPanel}>
        <OptionPanel currentStep={currentStep} zones={binderZones}>
          <ActiveStep canvasRef={canvasRef} {...stepProps[currentStep]} />
        </OptionPanel>
      </div>
    </div>
  )
}

// ── Decoration overlay (portaled into canvasArea) ────────────────────────────
function DecorationOverlay({ deco, icons, onMove, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const isDragging  = useRef(false)
  const layerRect   = useRef(null)
  const Icon = icons[deco.type]

  function handlePointerDown(e) {
    if (e.button !== 0) return
    e.preventDefault()
    isDragging.current = true
    // parent is .decoLayer which is inset:0 inside canvasArea — same bounding rect
    layerRect.current = e.currentTarget.parentElement.getBoundingClientRect()
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!isDragging.current) return
    const { left, top, width, height } = layerRect.current
    const x = Math.max(2, Math.min(98, ((e.clientX - left) / width) * 100))
    const y = Math.max(2, Math.min(96, ((e.clientY - top)  / height) * 100))
    onMove(deco.id, x, y)
  }

  function handlePointerUp(e) {
    isDragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${deco.x}%`,
        top:  `${deco.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        filter: 'drop-shadow(0 2px 8px rgba(45,25,10,0.28))',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {Icon && <Icon size={36} />}

      {hovered && (
        <button
          style={{
            position: 'absolute', top: -9, right: -9,
            width: 18, height: 18, borderRadius: '50%',
            background: '#b03020', color: '#fff',
            border: '1.5px solid #fff', fontSize: 12, fontWeight: 700,
            lineHeight: 1, cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
          }}
          onClick={e => { e.stopPropagation(); onRemove(deco.id) }}
          onPointerDown={e => e.stopPropagation()}
        >
          ×
        </button>
      )}
    </div>
  )
}
