// ── Shape drawing utilities ───────────────────────────────────────────────────
// Used by DesignCanvas (display) and renderShapesToCanvas (Three.js texture).

export function getShapePath(_ctx, type, px, py, pw, ph) {
  const path = new Path2D()
  const cx = px + pw / 2, cy = py + ph / 2
  switch (type) {
    case 'circle':
      path.ellipse(cx, cy, pw / 2, ph / 2, 0, 0, Math.PI * 2)
      break
    case 'heart': {
      path.moveTo(cx, cy + ph * 0.38)
      path.bezierCurveTo(cx - pw * 0.80, cy + ph * 0.10, cx - pw * 0.80, cy - ph * 0.48, cx, cy - ph * 0.08)
      path.bezierCurveTo(cx + pw * 0.80, cy - ph * 0.48, cx + pw * 0.80, cy + ph * 0.10, cx, cy + ph * 0.38)
      path.closePath()
      break
    }
    case 'star': {
      const r1 = Math.min(pw, ph) * 0.48
      const r2 = r1 * 0.42
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 2 * Math.PI / 5) - Math.PI / 2
        const a2 = a1 + Math.PI / 5
        if (i === 0) path.moveTo(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1))
        else         path.lineTo(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1))
        path.lineTo(cx + r2 * Math.cos(a2), cy + r2 * Math.sin(a2))
      }
      path.closePath()
      break
    }
    default: // rectangle
      path.rect(px, py, pw, ph)
  }
  return path
}

export function makePattern(ctx, fillColor, patternType) {
  const size = 8
  const pc   = document.createElement('canvas')
  pc.width = size; pc.height = size
  const pctx = pc.getContext('2d')
  pctx.fillStyle = fillColor
  pctx.fillRect(0, 0, size, size)
  pctx.strokeStyle = 'rgba(0,0,0,0.20)'
  pctx.lineWidth = 0.8
  if (patternType === 'leather') {
    pctx.beginPath(); pctx.moveTo(0, size); pctx.lineTo(size, 0); pctx.stroke()
  } else if (patternType === 'canvas') {
    pctx.beginPath(); pctx.moveTo(0, 0); pctx.lineTo(size, 0); pctx.stroke()
    pctx.beginPath(); pctx.moveTo(0, 0); pctx.lineTo(0, size); pctx.stroke()
  } else if (patternType === 'pvc') {
    pctx.fillStyle = 'rgba(255,255,255,0.30)'
    pctx.fillRect(0, 0, size * 0.55, size * 0.28)
  }
  return ctx.createPattern(pc, 'repeat')
}

export function drawShapeOnCanvas(ctx, shape, tw, th) {
  const px = shape.x * tw
  const py = shape.y * th
  const pw = shape.w * tw
  const ph = shape.h * th
  if (pw < 1 || ph < 1) return

  ctx.save()
  const path = getShapePath(ctx, shape.type, px, py, pw, ph)

  // Fill
  const pat = shape.fillPattern && shape.fillPattern !== 'solid'
    ? makePattern(ctx, shape.fill, shape.fillPattern)
    : null
  ctx.fillStyle = pat || shape.fill
  ctx.fill(path)

  // Border
  if (shape.borderStyle && shape.borderStyle !== 'none') {
    ctx.strokeStyle  = shape.borderColor || '#333'
    ctx.lineWidth    = (shape.borderWidth || 1) * 1.5
    const dashUnit   = Math.max(pw, ph) * 0.06
    ctx.setLineDash(
      shape.borderStyle === 'dashed'  ? [dashUnit, dashUnit * 0.5] :
      shape.borderStyle === 'dotted'  ? [2, dashUnit * 0.4]        : [],
    )
    ctx.stroke(path)
    ctx.setLineDash([])
  }
  ctx.restore()
}

// Render all shapes to an offscreen canvas (used as Three.js CanvasTexture).
export function renderShapesToCanvas(canvas, shapes) {
  const ctx = canvas.getContext('2d')
  const tw  = canvas.width, th = canvas.height
  ctx.clearRect(0, 0, tw, th)
  const sorted = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  for (const shape of sorted) drawShapeOnCanvas(ctx, shape, tw, th)
}
