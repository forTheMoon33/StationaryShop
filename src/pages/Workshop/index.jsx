import { useState, useRef, useMemo } from 'react'
import StepNav from '../../components/Workshop/StepNav'
import BinderCanvas from '../../components/Workshop/BinderCanvas'
import ZonePanel from '../../components/Workshop/ZonePanel'
import OptionPanel from '../../components/Workshop/OptionPanel'
import Step1Size from '../../components/Workshop/steps/Step1Size'
import Step2Zones from '../../components/Workshop/steps/Step2Zones'
import Step3Material from '../../components/Workshop/steps/Step3Material'
import Step4Color from '../../components/Workshop/steps/Step4Color'
import Step5Decoration from '../../components/Workshop/steps/Step5Decoration'
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

const STEP_COMPONENTS = {
  1: Step1Size, 2: Step2Zones, 3: Step3Material,
  4: Step4Color, 5: Step5Decoration, 6: Step6Closure, 7: Step7Accessory,
}

export default function Workshop() {
  const [currentStep, setCurrentStep]       = useState(1)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [completed, setCompleted]           = useState(false)

  const [selectedSize, setSelectedSize]           = useState('A6')
  const [zones, setZones]                         = useState([])
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(null)
  const [zoneMaterials, setZoneMaterials]         = useState({})
  const [zoneColors, setZoneColors]               = useState({})
  // Each decoration: { id, type, pos: { x, y, z } } — pos is a world-space
  // point on the front cover face, obtained via raycasting in BinderCanvas.
  const [decorations, setDecorations]             = useState([])

  const binderZones = useMemo(() =>
    zones.map((zone, i) => ({
      ...zone,
      material: zoneMaterials[i] ?? null,
      color:    zoneColors[i]    ?? null,
    })),
    [zones, zoneMaterials, zoneColors],
  )

  const canvasRef     = useRef(null)
  const showZonePanel = ZONE_PANEL_STEPS.has(currentStep)

  // ── Navigation ──────────────────────────────────────────
  function handleStepClick(stepId) {
    if (completedSteps.has(stepId) || stepId === currentStep) setCurrentStep(stepId)
  }

  function advance() {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    if (currentStep < 7) {
      setCurrentStep(prev => prev + 1)
    } else {
      setCompleted(true)
    }
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

  // Fix 2 — drop handler uses raycasting to place decoration on the 3-D cover face.
  function handleCanvasDrop(e) {
    e.preventDefault()
    const type = e.dataTransfer.getData('deco-type')
    if (!type) return
    const pos = canvasRef.current?.dropToFace(e.clientX, e.clientY)
    if (!pos) return   // dropped outside the front cover face
    setDecorations(prev => [...prev, { id: Date.now(), type, pos }])
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
    1: {
      onSelect: s => { setSelectedSize(s.id); setDecorations([]) },
      onNext: advance,
    },
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
          <BinderCanvas
            ref={canvasRef}
            size={selectedSize}
            zones={binderZones}
            decorations={decorations}
            completed={completed}
          />
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

      {!completed && (
        <div className={styles.optionPanel}>
          <OptionPanel currentStep={currentStep} zones={binderZones}>
            <ActiveStep canvasRef={canvasRef} {...stepProps[currentStep]} />
          </OptionPanel>
        </div>
      )}
    </div>
  )
}
