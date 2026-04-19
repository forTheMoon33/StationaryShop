import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './Step4Color.module.css'

const WHEEL_SIZE = 128 // canvas px (1:1 device-independent)

const PRESETS = [
  // neutrals / warm
  '#ffffff', '#f5e6c8', '#d4b896', '#8B6F47',
  '#5a3e28', '#2d1a0a', '#e8e0d0', '#b0a090',
  // blues
  '#c8dff0', '#7aaecc', '#3d7fa8', '#1c4f6e',
  // greens
  '#c8e8c0', '#7ab87a', '#3d7a48', '#1c4a28',
  // reds / pinks
  '#f0c8c8', '#d48888', '#a83d3d', '#6e1c1c',
]

// ── Color math helpers ────────────────────────────────────────────────────────

function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255)
  return [f(0), f(8), f(4)]
}

function hslToHex(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    default: h = ((r - g) / d + 4) / 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function drawWheel(ctx, size) {
  const cx = size / 2, cy = size / 2
  const radius = size / 2 - 1
  const imageData = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= radius) {
        const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
        const sat = Math.min(dist / radius, 1) * 100
        const [r, g, b] = hslToRgb(hue, sat, 50)
        const i = (y * size + x) * 4
        imageData.data[i]     = r
        imageData.data[i + 1] = g
        imageData.data[i + 2] = b
        imageData.data[i + 3] = 255
      }
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step4Color({
  zones = [],
  selectedZoneIndex,
  zoneColors = {},
  onColorChange,
  onNext,
}) {
  const hasSelection = selectedZoneIndex != null
  const selectedZone = zones[selectedZoneIndex]
  const allColored   = zones.length > 0 && zones.every((_, i) => zoneColors[i] != null)

  // HSL picker state: { h, s } from wheel; l from slider
  const [pickedHS, setPickedHS]   = useState({ h: 0, s: 0 })
  const [lightness, setLightness] = useState(50)
  // cursor position on the wheel canvas (px, relative to canvas top-left)
  const [cursorPos, setCursorPos] = useState(null)

  const canvasRef   = useRef(null)
  const isDragging  = useRef(false)

  // Draw wheel once on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawWheel(canvas.getContext('2d'), WHEEL_SIZE)
  }, [])

  // Sync picker state when the selected zone changes (so wheel shows its current color)
  useEffect(() => {
    if (!hasSelection) return
    const hex = zoneColors[selectedZoneIndex]
    if (!hex) return
    const { h, s, l } = hexToHsl(hex)
    setPickedHS({ h, s })
    setLightness(l)
    setCursorPos(hslToCursorPos(h, s))
  }, [selectedZoneIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  function hslToCursorPos(h, s) {
    const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2
    const radius = WHEEL_SIZE / 2 - 1
    const angle = (h * Math.PI) / 180
    const dist  = (s / 100) * radius
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) }
  }

  const applyColor = useCallback((hex) => {
    if (!hasSelection) return
    onColorChange?.(selectedZoneIndex, hex)
  }, [hasSelection, selectedZoneIndex, onColorChange])

  function pickFromEvent(e) {
    if (!hasSelection) return
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = WHEEL_SIZE / rect.width
    const scaleY = WHEEL_SIZE / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top)  * scaleY
    const cx = WHEEL_SIZE / 2, cy = WHEEL_SIZE / 2
    const dx = x - cx, dy = y - cy
    const dist   = Math.sqrt(dx * dx + dy * dy)
    const radius = WHEEL_SIZE / 2 - 1
    if (dist > radius + 2) return

    const clamped = Math.min(dist, radius)
    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
    const sat = (clamped / radius) * 100

    setPickedHS({ h: hue, s: sat })
    setCursorPos({ x: cx + clamped * Math.cos(Math.atan2(dy, dx)), y: cy + clamped * Math.sin(Math.atan2(dy, dx)) })
    applyColor(hslToHex(hue, sat, lightness))
  }

  function handleMouseDown(e) {
    isDragging.current = true
    pickFromEvent(e)
  }
  function handleMouseMove(e) {
    if (isDragging.current) pickFromEvent(e)
  }
  function handleMouseUp() { isDragging.current = false }

  function handleLightness(e) {
    const l = Number(e.target.value)
    setLightness(l)
    applyColor(hslToHex(pickedHS.h, pickedHS.s, l))
  }

  function handlePreset(hex) {
    if (!hasSelection) return
    const { h, s, l } = hexToHsl(hex)
    setPickedHS({ h, s })
    setLightness(l)
    setCursorPos(hslToCursorPos(h, s))
    applyColor(hex)
  }

  // Derived current color for the preview swatch
  const currentHex = hasSelection && zoneColors[selectedZoneIndex]
    ? zoneColors[selectedZoneIndex]
    : hslToHex(pickedHS.h, pickedHS.s, lightness)

  const lightnessGradient = `linear-gradient(to right,
    #000000,
    ${hslToHex(pickedHS.h, pickedHS.s, 50)},
    #ffffff)`

  return (
    <div className={styles.container}>

      {/* ── Left: presets grid ── */}
      <div className={styles.presets}>
        <p className={styles.sectionLabel}>Presets</p>
        <div className={styles.swatchGrid}>
          {PRESETS.map(hex => (
            <button
              key={hex}
              className={[
                styles.presetSwatch,
                hasSelection && zoneColors[selectedZoneIndex] === hex
                  ? styles.presetActive : '',
                !hasSelection ? styles.swatchDisabled : '',
              ].filter(Boolean).join(' ')}
              style={{ background: hex }}
              onClick={() => handlePreset(hex)}
              disabled={!hasSelection}
              aria-label={hex}
              title={hex}
            />
          ))}
        </div>
      </div>

      {/* ── Center: wheel + lightness slider ── */}
      <div className={styles.wheelCol}>
        <p className={styles.sectionLabel}>Color wheel</p>
        <div
          className={[styles.wheelWrapper, !hasSelection ? styles.wheelDisabled : ''].join(' ')}
        >
          <canvas
            ref={canvasRef}
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            className={styles.wheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          {cursorPos && (
            <div
              className={styles.cursor}
              style={{
                left: `${(cursorPos.x / WHEEL_SIZE) * 100}%`,
                top:  `${(cursorPos.y / WHEEL_SIZE) * 100}%`,
                background: hslToHex(pickedHS.h, pickedHS.s, lightness),
              }}
            />
          )}
        </div>

        <div className={styles.sliderRow}>
          <span className={styles.sliderLabel}>L</span>
          <input
            type="range"
            min={0} max={100} value={lightness}
            className={styles.lightnessSlider}
            style={{ background: lightnessGradient }}
            onChange={handleLightness}
            disabled={!hasSelection}
            aria-label="Lightness"
          />
        </div>
      </div>

      {/* ── Right: preview + next ── */}
      <div className={styles.rightCol}>
        <p className={styles.sectionLabel}>
          {hasSelection ? selectedZone?.name : 'No zone'}
        </p>
        <div
          className={styles.preview}
          style={{ background: currentHex }}
          title={currentHex}
        />
        <code className={styles.hexLabel}>{currentHex.toUpperCase()}</code>

        <button
          className={styles.nextBtn}
          onClick={onNext}
          disabled={!allColored}
          title={!allColored ? 'Assign a color to every zone first' : ''}
        >
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
