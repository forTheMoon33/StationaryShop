import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import styles from './BinderCanvas.module.css'

// Maps face IDs to the mesh name used in buildBinderOpen
const FACE_MESH = {
  'exterior-right': 'front-cover',
  'exterior-left':  'back-cover',
  'spine-exterior': 'spine',
  'interior-right': 'front-cover',
  'interior-left':  'back-cover',
  'spine-interior': 'spine',
}

// ── Units: 1 Three.js unit = 50 mm ───────────────────────────────────────────
const MM = 1 / 50

// ── Ring position helpers ─────────────────────────────────────────────────────
// Returns Y positions (top → bottom) for ring centres, centred at Y=0.
function uniformRings(count, spacingMM = 19) {
  const step = spacingMM * MM
  const half = (count - 1) * step / 2
  return Array.from({ length: count }, (_, i) => half - i * step)
}

function a6Rings() {
  // Two groups of 3: 19 mm within each group, 50 mm centre-to-centre between groups.
  // Total span = 2×19 + 50 + 2×19 = 126 mm = 2.52 u  →  half = 1.26 u
  const step = 19 * MM   // 0.38 u
  const gap  = 50 * MM   // 1.00 u
  const half = (2 * step + gap + 2 * step) / 2  // 1.26 u
  return [
     half,
     half - step,
     half - 2 * step,
    -(half - 2 * step),
    -(half - step),
    -half,
  ]
}

// ── Size configuration — add a 'custom' entry here to support custom sizes ────
export const SIZE_CONFIG = {
  A7: { h: 2.10, coverW: 1.54, spineW: 0.36, ringPositions: uniformRings(6) },
  A6: { h: 2.96, coverW: 2.10, spineW: 0.40, ringPositions: a6Rings()       },
  M5: { h: 2.56, coverW: 1.60, spineW: 0.36, ringPositions: uniformRings(5) },
}
const DEFAULT_SIZE = 'A6'

// ── Material presets ──────────────────────────────────────────────────────────
const MAT_PROPS = {
  leather: { roughness: 0.80, metalness: 0.04 },
  pvc:     { roughness: 0.10, metalness: 0.08, transparent: true, opacity: 0.80 },
  canvas:  { roughness: 0.92, metalness: 0.00 },
  pu:      { roughness: 0.25, metalness: 0.20 },
}

// ── Geometry constants ────────────────────────────────────────────────────────
const COVER_DEPTH  = 0.06   // open view: cover plate thickness (Z)
const CLOSED_THICK = 0.09   // closed view: cover plate thickness (Y)
const SPINE_THICK  = 0.22   // closed view: spine thickness (Y), contains rings
const RING_RADIUS  = 0.055
// Decoration disc radii and height
const DECO_RADII   = { flower: 0.085, button: 0.065 }
const DECO_HEIGHT  = 0.012

// ── Helpers ───────────────────────────────────────────────────────────────────
function disposeMesh(obj) {
  if (!obj) return
  obj.geometry?.dispose()
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
  mats.forEach(m => m?.dispose())
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[0]
    group.remove(child)
    disposeMesh(child)
  }
}

// ── Open binder (covers face the camera) ──────────────────────────────────────
function buildBinderOpen(group, cfg) {
  const { h, coverW, spineW, ringPositions } = cfg
  const coverX = spineW / 2 + coverW / 2

  const COVER_COLOR = 0x8B6F47
  const SPINE_COLOR = 0x6b5035
  const RING_COLOR  = 0xc0c8d0   // silver

  const coverMat = () => new THREE.MeshStandardMaterial({
    color: COVER_COLOR, roughness: 0.72, metalness: 0.05,
  })

  // Front cover
  const frontCover = new THREE.Mesh(new THREE.BoxGeometry(coverW, h, COVER_DEPTH), coverMat())
  frontCover.name = 'front-cover'
  frontCover.position.x = coverX
  frontCover.castShadow = frontCover.receiveShadow = true
  group.add(frontCover)

  // Back cover
  const backCover = new THREE.Mesh(new THREE.BoxGeometry(coverW, h, COVER_DEPTH), coverMat())
  backCover.name = 'back-cover'
  backCover.position.x = -coverX
  backCover.castShadow = backCover.receiveShadow = true
  group.add(backCover)

  // Spine
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(spineW, h, COVER_DEPTH * 1.05),
    new THREE.MeshStandardMaterial({ color: SPINE_COLOR, roughness: 0.75, metalness: 0.05 }),
  )
  spine.name = 'spine'
  spine.castShadow = spine.receiveShadow = true
  group.add(spine)

  // Rings — cylinders rotated so axis runs along Z (circles visible from front)
  const ringLength = COVER_DEPTH + 0.05
  const ringMat = new THREE.MeshStandardMaterial({
    color: RING_COLOR, roughness: 0.2, metalness: 0.9,
  })
  for (let i = 0; i < ringPositions.length; i++) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(RING_RADIUS, RING_RADIUS, ringLength, 20),
      ringMat.clone(),
    )
    ring.name = `ring-${i}`
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, ringPositions[i], 0)
    ring.castShadow = ring.receiveShadow = true
    group.add(ring)
  }

  group.userData.sizeParams = { h, coverW, spineW, coverX, closed: false }
}

// ── Closed binder (top-down view, camera from above) ─────────────────────────
// Layout: spine on the left, front cover on top, back cover below.
// Total binder width (spineW + coverW) is centred at x=0.
function buildBinderClosed(group, cfg, zones = []) {
  const { h, coverW, spineW, ringPositions } = cfg

  // spineX: spine centre;  coverXc: front/back cover centre
  const spineXc = -coverW / 2
  const coverXc =  spineW / 2

  // Apply first assigned zone's color/material to the front cover
  const firstZone = zones.find(z => z.color || z.material)
  const coverColor = firstZone?.color
    ? new THREE.Color(firstZone.color)
    : new THREE.Color(0x8B6F47)
  const matDef = MAT_PROPS[firstZone?.material] ?? { roughness: 0.72, metalness: 0.05 }

  const SPINE_COLOR = 0x6b5035
  const RING_COLOR  = 0xc0c8d0

  const coverMat = () => new THREE.MeshStandardMaterial({
    color: coverColor, roughness: matDef.roughness, metalness: matDef.metalness,
  })

  // Front cover — top face
  const frontCover = new THREE.Mesh(new THREE.BoxGeometry(coverW, CLOSED_THICK, h), coverMat())
  frontCover.name = 'front-cover-closed'
  frontCover.position.set(coverXc, CLOSED_THICK / 2, 0)
  frontCover.castShadow = frontCover.receiveShadow = true
  group.add(frontCover)

  // Spine — full thickness, contains rings
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(spineW, SPINE_THICK, h),
    new THREE.MeshStandardMaterial({ color: SPINE_COLOR, roughness: 0.75, metalness: 0.05 }),
  )
  spine.name = 'spine-closed'
  spine.position.set(spineXc, 0, 0)
  spine.castShadow = spine.receiveShadow = true
  group.add(spine)

  // Back cover — slightly below
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(coverW, CLOSED_THICK, h),
    new THREE.MeshStandardMaterial({ color: 0x7a5e38, roughness: 0.75, metalness: 0.04 }),
  )
  backCover.name = 'back-cover-closed'
  backCover.position.set(coverXc, -CLOSED_THICK / 2, 0)
  backCover.castShadow = backCover.receiveShadow = true
  group.add(backCover)

  // Rings — vertical cylinders (Y axis) inside spine, visible from above
  const ringMat = new THREE.MeshStandardMaterial({
    color: RING_COLOR, roughness: 0.2, metalness: 0.9,
  })
  for (let i = 0; i < ringPositions.length; i++) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(RING_RADIUS, RING_RADIUS, SPINE_THICK + 0.01, 20),
      ringMat.clone(),
    )
    ring.name = `ring-closed-${i}`
    ring.position.set(spineXc, 0, ringPositions[i])   // Z = height axis in closed view
    ring.castShadow = ring.receiveShadow = true
    group.add(ring)
  }

  group.userData.sizeParams = {
    h, coverW, spineW, coverX: spineW / 2 + coverW / 2, closed: true,
  }
}

function buildBinder(group, sizeId, closed = false, zones = []) {
  clearGroup(group)
  const cfg = SIZE_CONFIG[sizeId] ?? SIZE_CONFIG[DEFAULT_SIZE]
  if (closed) {
    buildBinderClosed(group, cfg, zones)
  } else {
    buildBinderOpen(group, cfg)
  }
}

// ── Zone overlays on the front cover face (open view only) ────────────────────
function buildZones(group, zoneMeshesRef, zones) {
  for (const m of zoneMeshesRef.current) {
    group.remove(m)
    disposeMesh(m)
  }
  zoneMeshesRef.current = []

  const { sizeParams } = group.userData
  if (!sizeParams || sizeParams.closed || !zones?.length) return

  const { h, coverW, coverX } = sizeParams
  const ZONE_DEPTH = 0.003
  const zoneZ = COVER_DEPTH / 2 + ZONE_DEPTH / 2 + 0.0005

  for (const zone of zones) {
    const zw = zone.w * coverW
    const zh = zone.h * h
    const localUX = zone.x + zone.w / 2 - 0.5
    const localUY = -(zone.y + zone.h / 2 - 0.5)
    const zx = coverX + localUX * coverW
    const zy = localUY * h

    const matDef  = MAT_PROPS[zone.material] ?? { roughness: 0.72, metalness: 0.05 }
    const hexStr  = zone.color ?? '#a08060'
    const opacity = zone.color ? 1.0 : 0.35

    const mat = new THREE.MeshStandardMaterial({
      color:       new THREE.Color(hexStr),
      roughness:   matDef.roughness,
      metalness:   matDef.metalness,
      transparent: !zone.color || !!matDef.transparent,
      opacity:     matDef.transparent ? (matDef.opacity ?? 0.80) : opacity,
    })

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(zw, zh, ZONE_DEPTH), mat)
    mesh.position.set(zx, zy, zoneZ)
    mesh.name = `zone-${zone.name ?? 'unnamed'}`
    group.add(mesh)
    zoneMeshesRef.current.push(mesh)
  }
}

// ── Decoration meshes on the front cover face (open view only) ────────────────
// Each deco is a flat disc (CylinderGeometry) placed at deco.pos (world coords).
function buildDecorations(group, decoMeshesRef, decorations) {
  for (const m of decoMeshesRef.current) {
    group.remove(m)
    disposeMesh(m)
  }
  decoMeshesRef.current = []

  const { sizeParams } = group.userData
  if (!sizeParams || sizeParams.closed || !decorations?.length) return

  for (const deco of decorations) {
    if (!deco.pos) continue
    const r         = DECO_RADII[deco.type] ?? 0.07
    const color     = deco.type === 'flower' ? 0xc9a87c : 0x5a3e28
    const metalness = deco.type === 'flower' ? 0.55 : 0.25

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, DECO_HEIGHT, 24),
      new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness }),
    )
    mesh.name = `deco-${deco.id}`
    mesh.rotation.x = Math.PI / 2   // axis → Z, so the flat face points toward camera
    // Sit just in front of the cover face
    mesh.position.set(deco.pos.x, deco.pos.y, deco.pos.z + DECO_HEIGHT / 2 + 0.001)
    mesh.castShadow = true
    group.add(mesh)
    decoMeshesRef.current.push(mesh)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
const BinderCanvas = forwardRef(function BinderCanvas(
  { size = DEFAULT_SIZE, zones = [], decorations = [], completed = false },
  ref,
) {
  const mountRef       = useRef(null)
  const sceneRef       = useRef(null)
  const cameraRef      = useRef(null)
  const rendererRef    = useRef(null)
  const controlsRef    = useRef(null)
  const binderGroupRef = useRef(null)
  const zoneMeshesRef  = useRef([])
  const decoMeshesRef  = useRef([])

  // Always-current refs — read by effects without creating new deps
  const zonesRef     = useRef(zones)
  zonesRef.current   = zones
  const sizeRef      = useRef(size)
  sizeRef.current    = size
  const completedRef = useRef(completed)
  completedRef.current = completed

  // ── Imperative API ──────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    getScene:    () => sceneRef.current,
    getCamera:   () => cameraRef.current,
    getRenderer: () => rendererRef.current,

    // Ray-cast the pointer position against the front cover.
    // Returns { x, y, z } world position, or null if not over the cover.
    dropToFace(clientX, clientY) {
      const renderer = rendererRef.current
      const camera   = cameraRef.current
      const group    = binderGroupRef.current
      if (!renderer || !camera || !group) return null

      const rect = renderer.domElement.getBoundingClientRect()
      const ndcX =  ((clientX - rect.left) / rect.width)  * 2 - 1
      const ndcY = -((clientY - rect.top)  / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera)

      const frontCover = group.children.find(c => c.name === 'front-cover')
      if (!frontCover) return null

      const hits = raycaster.intersectObject(frontCover)
      if (!hits.length) return null
      const { x, y, z } = hits[0].point
      return { x, y, z }
    },

    // Apply a 2D canvas as a texture to the Three.js mesh for a given face.
    updateFaceTexture(faceId, canvas) {
      const group = binderGroupRef.current
      if (!group) return
      const meshName = FACE_MESH[faceId]
      if (!meshName) return
      const mesh = group.children.find(c => c.name === meshName)
      if (!mesh || !mesh.material) return

      if (!mesh._designTextures) mesh._designTextures = {}
      if (!mesh._designTextures[faceId]) {
        const tex = new THREE.CanvasTexture(canvas)
        tex.flipY = false
        mesh._designTextures[faceId] = tex
      } else {
        mesh._designTextures[faceId].needsUpdate = true
      }

      // Apply exterior texture (faceId contains 'exterior' or is a spine/interior).
      // For simplicity we apply to the main material map; interior textures show
      // on the mesh when orbited to the back.
      const tex = mesh._designTextures[faceId]
      if (!mesh.material.map || mesh.material.map !== tex) {
        // Only override with exterior textures in normal view; interior textures
        // are stored and accessible but not forced over exterior ones.
        if (!faceId.includes('interior') ||
            !mesh._designTextures[faceId.replace('interior', 'exterior')]) {
          mesh.material.map = tex
          mesh.material.needsUpdate = true
        }
      } else {
        mesh.material.needsUpdate = true
      }
    },
  }))

  // ── Effect 1: one-time scene / renderer / lights / controls / loop ──────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf2ece3)
    scene.fog = new THREE.Fog(0xf2ece3, 14, 32)
    sceneRef.current = scene

    const { clientWidth: cw, clientHeight: ch } = mount
    const camera = new THREE.PerspectiveCamera(36, cw / ch, 0.1, 100)
    camera.position.set(1.4, 1.0, 8.0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(cw, ch)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    scene.add(new THREE.AmbientLight(0xfff5e8, 1.1))

    const keyLight = new THREE.DirectionalLight(0xfff0d8, 2.2)
    keyLight.position.set(4, 8, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    keyLight.shadow.camera.near   = 0.5
    keyLight.shadow.camera.far    = 30
    keyLight.shadow.camera.left   = -6
    keyLight.shadow.camera.right  =  6
    keyLight.shadow.camera.top    =  5
    keyLight.shadow.camera.bottom = -5
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xd8e8ff, 0.55)
    fillLight.position.set(-4, 2, -5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.30)
    rimLight.position.set(0, 6, -4)
    scene.add(rimLight)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.ShadowMaterial({ opacity: 0.10 }),
    )
    ground.rotation.x  = -Math.PI / 2
    ground.position.y  = -2.0
    ground.receiveShadow = true
    scene.add(ground)

    const binderGroup = new THREE.Group()
    binderGroup.rotation.x = 0.06
    binderGroup.rotation.y = -0.18
    scene.add(binderGroup)
    binderGroupRef.current = binderGroup

    // Fix 1 — lower the orbit target so the binder sits in the upper portion
    // of the canvas, leaving clear space for the floating bottom option panel.
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.055
    controls.minDistance   = 2.5
    controls.maxDistance   = 18
    controls.maxPolarAngle = Math.PI * 0.70
    controls.target.set(0, -0.6, 0)
    controls.update()
    controlsRef.current = controls

    const ro = new ResizeObserver(() => {
      const { clientWidth: rw, clientHeight: rh } = mount
      if (!rw || !rh) return
      camera.aspect = rw / rh
      camera.updateProjectionMatrix()
      renderer.setSize(rw, rh)
    })
    ro.observe(mount)

    let rafId
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      scene.traverse(obj => { if (obj.isMesh) disposeMesh(obj) })
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: rebuild geometry when size changes ──────────────────────────
  useEffect(() => {
    const group = binderGroupRef.current
    if (!group) return
    buildBinder(group, size, completedRef.current, zonesRef.current)
    // Reset overlay refs — their old meshes were cleared by buildBinder
    zoneMeshesRef.current = []
    decoMeshesRef.current = []
    if (!completedRef.current) {
      buildZones(group, zoneMeshesRef, zonesRef.current)
      // Decoration positions are size-specific; they are cleared rather than kept.
    }
  }, [size]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: update zone overlays when zones (color / material) change ───
  useEffect(() => {
    const group = binderGroupRef.current
    if (!group?.userData.sizeParams) return
    buildZones(group, zoneMeshesRef, zones)
  }, [zones])

  // ── Effect 4: update decoration meshes when decorations change ────────────
  useEffect(() => {
    const group = binderGroupRef.current
    if (!group?.userData.sizeParams) return
    buildDecorations(group, decoMeshesRef, decorations)
  }, [decorations])

  // ── Effect 5: switch to closed top-down view when completed ───────────────
  useEffect(() => {
    const group    = binderGroupRef.current
    const camera   = cameraRef.current
    const controls = controlsRef.current
    if (!group || !camera || !controls) return

    if (completed) {
      buildBinder(group, sizeRef.current, true, zonesRef.current)
      zoneMeshesRef.current = []
      decoMeshesRef.current = []
      // Lay the group flat; camera will look from above
      group.rotation.set(0, 0, 0)
      camera.position.set(0, 9, 3)
      controls.target.set(0, 0, 0)
      controls.maxPolarAngle = Math.PI * 0.35   // keep near-top-down view
      controls.update()
    }
  }, [completed]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mountRef} className={styles.mount} />
})

export default BinderCanvas
