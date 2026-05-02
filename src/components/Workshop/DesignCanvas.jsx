import { useEffect, useRef } from 'react'
import { getShapePath, makePattern, renderShapesToCanvas } from '../../utils/shapeRenderer'
import styles from './DesignCanvas.module.css'

const HANDLE_PX = 7   // corner handle size on display canvas
const MIN_NORM  = 0.03 // minimum shape size in face-normalised coords

// ── Face-rect helpers ──────────────────────────────────────────────────────────
function computeFaceRect(cw, ch, aspect) {
  // aspect = face width / face height (real-world)
  let fw = cw * 0.55, fh = fw / aspect
  if (fh > ch * 0.72) { fh = ch * 0.72; fw = fh * aspect }
  return { x: (cw - fw) / 2, y: (ch - fh) / 2, w: fw, h: fh }
}

// ── Main draw routine (reads from refs) ────────────────────────────────────────
function drawCanvas(canvas, shapesRef, selectedIdRef, toolRef, aspectRef, texCanvasRef, previewRef) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cw  = canvas.width
  const ch  = canvas.height

  ctx.clearRect(0, 0, cw, ch)

  // Dim the area outside the face
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  ctx.fillRect(0, 0, cw, ch)

  const { w: fa, h: fb } = aspectRef.current
  const fr = computeFaceRect(cw, ch, fa / fb)

  // Face background (clipped)
  ctx.save()
  ctx.beginPath()
  ctx.rect(fr.x, fr.y, fr.w, fr.h)
  ctx.clip()
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(fr.x, fr.y, fr.w, fr.h)

  // Draw shapes
  const shapes = shapesRef.current
  const sorted = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  for (const shape of sorted) {
    const px = fr.x + shape.x * fr.w
    const py = fr.y + shape.y * fr.h
    const pw = shape.w * fr.w
    const ph = shape.h * fr.h
    if (pw < 1 || ph < 1) continue

    ctx.save()
    const path = getShapePath(ctx, shape.type, px, py, pw, ph)
    const pat  = shape.fillPattern && shape.fillPattern !== 'solid'
      ? makePattern(ctx, shape.fill, shape.fillPattern)
      : null
    ctx.fillStyle = pat || shape.fill
    ctx.fill(path)

    if (shape.borderStyle && shape.borderStyle !== 'none') {
      ctx.strokeStyle = shape.borderColor || '#333'
      ctx.lineWidth   = (shape.borderWidth || 1) * 1.5
      const du = Math.max(pw, ph) * 0.06
      ctx.setLineDash(
        shape.borderStyle === 'dashed'  ? [du, du * 0.5] :
        shape.borderStyle === 'dotted'  ? [2, du * 0.4]  : [],
      )
      ctx.stroke(path)
      ctx.setLineDash([])
    }
    ctx.restore()
  }
  ctx.restore()

  // Face border
  ctx.strokeStyle = 'rgba(139,111,71,0.50)'
  ctx.lineWidth   = 1.5
  ctx.setLineDash([])
  ctx.strokeRect(fr.x, fr.y, fr.w, fr.h)

  // Selection handles
  const selId = selectedIdRef.current
  const sel   = selId ? shapes.find(s => s.id === selId) : null
  if (sel) {
    const px = fr.x + sel.x * fr.w
    const py = fr.y + sel.y * fr.h
    const pw = sel.w * fr.w
    const ph = sel.h * fr.h
    ctx.strokeStyle = '#2a7ff0'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 3])
    ctx.strokeRect(px, py, pw, ph)
    ctx.setLineDash([])
    for (const [hx, hy] of [[px, py], [px+pw, py], [px, py+ph], [px+pw, py+ph]]) {
      ctx.fillStyle   = '#fff'
      ctx.fillRect(hx - HANDLE_PX/2, hy - HANDLE_PX/2, HANDLE_PX, HANDLE_PX)
      ctx.strokeStyle = '#2a7ff0'
      ctx.lineWidth   = 1.5
      ctx.strokeRect(hx - HANDLE_PX/2, hy - HANDLE_PX/2, HANDLE_PX, HANDLE_PX)
    }
  }

  // Preview while drawing
  const preview = previewRef.current
  if (preview && preview.w > 0.005 && preview.h > 0.005) {
    const px = fr.x + preview.x * fr.w
    const py = fr.y + preview.y * fr.h
    const pw = preview.w * fr.w
    const ph = preview.h * fr.h
    const path = getShapePath(ctx, preview.type, px, py, pw, ph)
    ctx.fillStyle = 'rgba(42,127,240,0.08)'
    ctx.fill(path)
    ctx.strokeStyle = '#2a7ff0'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 3])
    ctx.stroke(path)
    ctx.setLineDash([])
  }

  // Sync texture canvas
  const tc = texCanvasRef.current
  if (tc) renderShapesToCanvas(tc, shapes)
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function DesignCanvas({
  shapes        = [],
  onShapesChange,
  activeTool    = 'select',
  selectedShapeId,
  onSelectShape,
  faceAspect    = { w: 2.10, h: 2.96 },
  texCanvas     = null,
}) {
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const renderRef    = useRef(null)
  const dragRef      = useRef(null)
  const previewRef   = useRef(null)

  // Always-current refs (avoid stale closures in resize observer)
  const shapesRef    = useRef(shapes);          shapesRef.current    = shapes
  const selectedRef  = useRef(selectedShapeId); selectedRef.current  = selectedShapeId
  const toolRef      = useRef(activeTool);      toolRef.current      = activeTool
  const aspectRef    = useRef(faceAspect);      aspectRef.current    = faceAspect
  const texRef       = useRef(texCanvas);       texRef.current       = texCanvas
  const onChangRef   = useRef(onShapesChange);  onChangRef.current   = onShapesChange
  const onSelectRef  = useRef(onSelectShape);   onSelectRef.current  = onSelectShape

  // Update renderRef every render so resize observer always calls the latest version
  renderRef.current = () =>
    drawCanvas(canvasRef.current, shapesRef, selectedRef, toolRef, aspectRef, texRef, previewRef)

  // One-time setup: resize observer
  useEffect(() => {
    const container = containerRef.current
    const canvas    = canvasRef.current
    if (!container || !canvas) return

    function resize() {
      canvas.width  = container.clientWidth
      canvas.height = container.clientHeight
      renderRef.current()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()
    return () => ro.disconnect()
  }, [])

  // Re-render on every React update (shapes / selection / tool / aspect change)
  useEffect(() => { renderRef.current() })

  // ── Coordinate helpers ───────────────────────────────────────────────────────
  function getCoords(e) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect  = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top)  * scaleY
    const { w: fa, h: fb } = aspectRef.current
    const fr = computeFaceRect(canvas.width, canvas.height, fa / fb)
    const nx = (mx - fr.x) / fr.w
    const ny = (my - fr.y) / fr.h
    return { mx, my, nx, ny, inFace: nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1, fr }
  }

  function findCornerHandle(sel, mx, my, fr) {
    const pts = [
      { name: 'nw', cx: fr.x + sel.x           * fr.w, cy: fr.y + sel.y           * fr.h },
      { name: 'ne', cx: fr.x + (sel.x + sel.w)  * fr.w, cy: fr.y + sel.y           * fr.h },
      { name: 'sw', cx: fr.x + sel.x           * fr.w, cy: fr.y + (sel.y + sel.h) * fr.h },
      { name: 'se', cx: fr.x + (sel.x + sel.w)  * fr.w, cy: fr.y + (sel.y + sel.h) * fr.h },
    ]
    const hit = HANDLE_PX + 3
    for (const p of pts) {
      if (Math.abs(mx - p.cx) <= hit && Math.abs(my - p.cy) <= hit) return p.name
    }
    return null
  }

  // ── Mouse events ─────────────────────────────────────────────────────────────
  function handleMouseDown(e) {
    const coords = getCoords(e)
    if (!coords) return
    const { mx, my, nx, ny, inFace, fr } = coords
    const shapes = shapesRef.current
    const tool   = toolRef.current

    if (tool === 'select') {
      const selId = selectedRef.current
      const sel   = selId ? shapes.find(s => s.id === selId) : null

      // Corner handle?
      if (sel) {
        const corner = findCornerHandle(sel, mx, my, fr)
        if (corner) {
          dragRef.current = { mode: 'resize', corner, shapeId: sel.id,
            startNX: nx, startNY: ny, orig: { ...sel } }
          return
        }
      }

      // Hit-test shapes (topmost first)
      const hit = [...shapes]
        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
        .find(s => nx >= s.x && nx <= s.x + s.w && ny >= s.y && ny <= s.y + s.h)
      if (hit) {
        onSelectRef.current?.(hit.id)
        dragRef.current = { mode: 'move', shapeId: hit.id,
          startNX: nx, startNY: ny, orig: { ...hit } }
        return
      }
      onSelectRef.current?.(null)

    } else if (inFace) {
      const snx = Math.max(0, Math.min(1, nx))
      const sny = Math.max(0, Math.min(1, ny))
      dragRef.current = { mode: 'draw', shapeType: tool, startNX: snx, startNY: sny }
      previewRef.current = { type: tool, x: snx, y: sny, w: 0, h: 0 }
      renderRef.current()
    }
  }

  function handleMouseMove(e) {
    const coords = getCoords(e)
    if (!coords || !dragRef.current) return
    const { nx, ny } = coords
    const ds = dragRef.current
    const shapes = shapesRef.current

    if (ds.mode === 'move') {
      const dx = nx - ds.startNX, dy = ny - ds.startNY
      const { orig } = ds
      onChangRef.current?.(shapes.map(s => s.id !== ds.shapeId ? s : {
        ...orig,
        x: Math.max(0, Math.min(1 - orig.w, orig.x + dx)),
        y: Math.max(0, Math.min(1 - orig.h, orig.y + dy)),
      }))

    } else if (ds.mode === 'resize') {
      const { orig, corner } = ds
      let { x, y, w, h } = orig
      if (corner === 'se') {
        w = Math.max(MIN_NORM, nx - orig.x)
        h = Math.max(MIN_NORM, ny - orig.y)
      } else if (corner === 'sw') {
        x = Math.min(nx, orig.x + orig.w - MIN_NORM); w = orig.x + orig.w - x
        h = Math.max(MIN_NORM, ny - orig.y)
      } else if (corner === 'ne') {
        w = Math.max(MIN_NORM, nx - orig.x)
        y = Math.min(ny, orig.y + orig.h - MIN_NORM); h = orig.y + orig.h - y
      } else if (corner === 'nw') {
        x = Math.min(nx, orig.x + orig.w - MIN_NORM); w = orig.x + orig.w - x
        y = Math.min(ny, orig.y + orig.h - MIN_NORM); h = orig.y + orig.h - y
      }
      onChangRef.current?.(shapes.map(s => s.id !== ds.shapeId ? s : { ...s, x, y, w, h }))

    } else if (ds.mode === 'draw') {
      const cnx = Math.max(0, Math.min(1, nx))
      const cny = Math.max(0, Math.min(1, ny))
      previewRef.current = {
        type: ds.shapeType,
        x: Math.min(ds.startNX, cnx), y: Math.min(ds.startNY, cny),
        w: Math.abs(cnx - ds.startNX),  h: Math.abs(cny - ds.startNY),
      }
      renderRef.current()
    }
  }

  function handleMouseUp(e) {
    const ds = dragRef.current
    dragRef.current = null

    if (ds?.mode === 'draw') {
      const coords = getCoords(e)
      const cnx = coords ? Math.max(0, Math.min(1, coords.nx)) : ds.startNX
      const cny = coords ? Math.max(0, Math.min(1, coords.ny)) : ds.startNY
      let x = Math.min(ds.startNX, cnx)
      let y = Math.min(ds.startNY, cny)
      let w = Math.abs(cnx - ds.startNX)
      let h = Math.abs(cny - ds.startNY)
      // Give a minimum size if the user just clicked (no drag)
      if (w < MIN_NORM) { w = 0.20; x = Math.max(0, Math.min(1 - w, x)) }
      if (h < MIN_NORM) { h = 0.15; y = Math.max(0, Math.min(1 - h, y)) }

      const newShape = {
        id:          `shape-${Date.now()}`,
        type:        ds.shapeType,
        x, y, w, h,
        fill:        '#c07850',
        fillPattern: 'solid',
        borderStyle: 'none',
        borderColor: '#5a3a20',
        borderWidth: 1,
        zIndex:      shapesRef.current.length,
      }
      onChangRef.current?.([...shapesRef.current, newShape])
      onSelectRef.current?.(newShape.id)
      previewRef.current = null
    }
  }

  function handleMouseLeave() {
    dragRef.current    = null
    previewRef.current = null
    renderRef.current()
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}
