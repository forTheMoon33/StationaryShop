import { useState, useRef, useEffect } from 'react'
import StepNav      from '../../components/Workshop/StepNav'
import BinderCanvas  from '../../components/Workshop/BinderCanvas'
import FaceSelector  from '../../components/Workshop/FaceSelector'
import DesignCanvas  from '../../components/Workshop/DesignCanvas'
import OptionPanel   from '../../components/Workshop/OptionPanel'
import Step1Size     from '../../components/Workshop/steps/Step1Size'
import Step2ExteriorDesign from '../../components/Workshop/steps/Step2ExteriorDesign'
import Step3InteriorDesign from '../../components/Workshop/steps/Step3InteriorDesign'
import Step5Decoration     from '../../components/Workshop/steps/Step5Decoration'
import Step6Closure        from '../../components/Workshop/steps/Step6Closure'
import Step7Accessory      from '../../components/Workshop/steps/Step7Accessory'
import { SIZE_CONFIG } from '../../components/Workshop/BinderCanvas'
import { renderShapesToCanvas } from '../../utils/shapeRenderer'
import styles from './Workshop.module.css'

// ── Step definitions ──────────────────────────────────────────────────────────
export const STEPS = [
  { id: 1, label: 'Size'       },
  { id: 2, label: 'Exterior'   },
  { id: 3, label: 'Interior'   },
  { id: 4, label: 'Decoration' },
  { id: 5, label: 'Closure'    },
  { id: 6, label: 'Accessory'  },
]

const DESIGN_STEPS = new Set([2, 3])

const STEP_COMPONENTS = {
  1: Step1Size,
  2: Step2ExteriorDesign,
  3: Step3InteriorDesign,
  4: Step5Decoration,
  5: Step6Closure,
  6: Step7Accessory,
}

const FACE_IDS = [
  'exterior-right', 'exterior-left', 'spine-exterior',
  'interior-right', 'interior-left', 'spine-interior',
]

const EMPTY_FACE_DESIGNS = Object.fromEntries(FACE_IDS.map(id => [id, []]))

// Returns { w, h } in Three.js units for a face given size and faceId
function getFaceAspect(faceId, sizeId) {
  const d = SIZE_CONFIG[sizeId] ?? SIZE_CONFIG.A6
  return { w: faceId.includes('spine') ? d.spineW : d.coverW, h: d.h }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Workshop() {
  const [currentStep, setCurrentStep]       = useState(1)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [completed, setCompleted]           = useState(false)

  // Step 1
  const [selectedSize, setSelectedSize] = useState('A6')

  // Steps 2 & 3 — face designs
  const [faceDesigns, setFaceDesigns]       = useState(EMPTY_FACE_DESIGNS)
  const [activeFaceId, setActiveFaceId]     = useState('exterior-right')
  const [activeTool, setActiveTool]         = useState('select')
  const [selectedShapeId, setSelectedShapeId] = useState(null)

  // Step 4 — decorations
  const [decorations, setDecorations] = useState([])

  const canvasRef = useRef(null)

  // One offscreen canvas per face for Three.js CanvasTexture.
  // Created synchronously so the overlay is available on first design-step render.
  const texCanvasesRef = useRef(null)
  if (texCanvasesRef.current === null) {
    const canvases = {}
    for (const faceId of FACE_IDS) {
      const c = document.createElement('canvas')
      c.width = 512; c.height = 512
      canvases[faceId] = c
    }
    texCanvasesRef.current = canvases
  }

  // Sync texture canvases → Three.js whenever faceDesigns change
  useEffect(() => {
    const tc = texCanvasesRef.current
    if (!tc) return
    for (const [faceId, shapes] of Object.entries(faceDesigns)) {
      renderShapesToCanvas(tc[faceId], shapes)
      canvasRef.current?.updateFaceTexture(faceId, tc[faceId])
    }
  }, [faceDesigns])

  // ── Navigation ───────────────────────────────────────────────────────────────
  function handleStepClick(stepId) {
    if (completedSteps.has(stepId) || stepId === currentStep) setCurrentStep(stepId)
  }

  function advance() {
    const next = currentStep + 1
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    if (next <= 6) {
      setCurrentStep(next)
      // Switch face selector to interior when entering step 3
      if (next === 3) { setActiveFaceId('interior-right'); setSelectedShapeId(null) }
      // Reset tool when leaving design steps
      if (!DESIGN_STEPS.has(next))  setActiveTool('select')
    } else {
      setCompleted(true)
    }
  }

  // ── Face design callbacks ────────────────────────────────────────────────────
  function handleShapesChange(faceId, shapes) {
    setFaceDesigns(prev => ({ ...prev, [faceId]: shapes }))
    if (selectedShapeId && !shapes.find(s => s.id === selectedShapeId)) {
      setSelectedShapeId(null)
    }
  }

  function handleShapeUpdate(faceId, updatedShape) {
    setFaceDesigns(prev => ({
      ...prev,
      [faceId]: prev[faceId].map(s => s.id === updatedShape.id ? updatedShape : s),
    }))
  }

  function handleDeleteShape(faceId, shapeId) {
    setFaceDesigns(prev => ({
      ...prev,
      [faceId]: prev[faceId].filter(s => s.id !== shapeId),
    }))
    setSelectedShapeId(null)
  }

  function handleMoveForward(faceId, shapeId) {
    setFaceDesigns(prev => ({
      ...prev,
      [faceId]: prev[faceId].map(s =>
        s.id === shapeId ? { ...s, zIndex: (s.zIndex || 0) + 1 } : s,
      ),
    }))
  }

  function handleMoveBackward(faceId, shapeId) {
    setFaceDesigns(prev => ({
      ...prev,
      [faceId]: prev[faceId].map(s =>
        s.id === shapeId ? { ...s, zIndex: Math.max(0, (s.zIndex || 0) - 1) } : s,
      ),
    }))
  }

  function handleFaceSelect(faceId) {
    setActiveFaceId(faceId)
    setSelectedShapeId(null)
  }

  // ── Step 4: decoration drop ──────────────────────────────────────────────────
  function handleCanvasDrop(e) {
    e.preventDefault()
    const type = e.dataTransfer.getData('deco-type')
    if (!type) return
    const pos = canvasRef.current?.dropToFace(e.clientX, e.clientY)
    if (!pos) return
    setDecorations(prev => [...prev, { id: Date.now(), type, pos }])
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const activeShapes       = faceDesigns[activeFaceId] ?? []
  const selectedShape      = selectedShapeId
    ? activeShapes.find(s => s.id === selectedShapeId) ?? null
    : null
  const showFacePanel      = DESIGN_STEPS.has(currentStep)
  const showDesignOverlay  = DESIGN_STEPS.has(currentStep)
  const faceAspect         = getFaceAspect(activeFaceId, selectedSize)
  const faceSelectorMode   = currentStep === 2 ? 'exterior' : 'interior'

  // ── Per-step props ───────────────────────────────────────────────────────────
  const designStepProps = {
    activeTool,
    onToolChange:   setActiveTool,
    selectedShape,
    onShapeUpdate:  shape => handleShapeUpdate(activeFaceId, shape),
    onDeleteShape:  () => handleDeleteShape(activeFaceId, selectedShapeId),
    onMoveForward:  () => handleMoveForward(activeFaceId, selectedShapeId),
    onMoveBackward: () => handleMoveBackward(activeFaceId, selectedShapeId),
    onNext: advance,
  }

  const stepProps = {
    1: { onSelect: s => { setSelectedSize(s.id); setDecorations([]) }, onNext: advance },
    2: designStepProps,
    3: designStepProps,
    4: { decorations, onClearDecorations: () => setDecorations([]), onNext: advance },
    5: { onNext: advance },
    6: { onNext: advance },
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
        {/* Left: face selector for design steps */}
        {showFacePanel && (
          <aside className={styles.facePanel}>
            <FaceSelector
              mode={faceSelectorMode}
              activeFaceId={activeFaceId}
              onSelectFace={handleFaceSelect}
            />
          </aside>
        )}

        {/* Center: Three.js canvas */}
        <div
          className={styles.canvasArea}
          onDragOver={currentStep === 4 ? e => e.preventDefault() : undefined}
          onDrop={currentStep === 4 ? handleCanvasDrop : undefined}
        >
          <BinderCanvas
            ref={canvasRef}
            size={selectedSize}
            zones={[]}
            decorations={decorations}
            completed={completed}
          />

          {/* 2D design canvas overlay for steps 2 & 3 */}
          {showDesignOverlay && (
            <div className={styles.designOverlay}>
              <DesignCanvas
                key={activeFaceId}
                shapes={activeShapes}
                onShapesChange={shapes => handleShapesChange(activeFaceId, shapes)}
                activeTool={activeTool}
                selectedShapeId={selectedShapeId}
                onSelectShape={setSelectedShapeId}
                faceAspect={faceAspect}
                texCanvas={texCanvasesRef.current[activeFaceId]}
              />
            </div>
          )}
        </div>
      </div>

      {!completed && (
        <div className={styles.optionPanel}>
          <OptionPanel currentStep={currentStep}>
            <ActiveStep canvasRef={canvasRef} {...stepProps[currentStep]} />
          </OptionPanel>
        </div>
      )}
    </div>
  )
}
