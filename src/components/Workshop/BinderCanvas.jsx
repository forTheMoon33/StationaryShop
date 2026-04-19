import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import styles from './BinderCanvas.module.css'

// ── Binder dimensions ─────────────────────────────────────────────────────────
// 1 Three.js unit = 50 mm
// coverW = one cover plate width, spineW = spine plate width
const SIZE_DATA = {
  A7: { h: 2.10, coverW: 1.54, spineW: 0.36, rings: 6 },
  A6: { h: 2.96, coverW: 2.10, spineW: 0.40, rings: 6 },
  M5: { h: 2.56, coverW: 1.60, spineW: 0.36, rings: 5 },
}
const DEFAULT_SIZE = 'A6'

// ── Material presets ──────────────────────────────────────────────────────────
const MAT_PROPS = {
  leather: { roughness: 0.80, metalness: 0.04 },
  pvc:     { roughness: 0.10, metalness: 0.08, transparent: true, opacity: 0.80 },
  canvas:  { roughness: 0.92, metalness: 0.00 },
  pu:      { roughness: 0.25, metalness: 0.20 },
}

const COVER_DEPTH  = 0.06   // cover / spine plate thickness (Z axis)
const RING_RADIUS  = 0.055  // binder ring cylinder radius
const RING_PAD     = 0.20   // gap from top / bottom edge to first / last ring

// ── Geometry / material helpers ───────────────────────────────────────────────

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

// ── Build the binder plates + rings ───────────────────────────────────────────
function buildBinder(group, sizeId) {
  clearGroup(group)

  const cfg = SIZE_DATA[sizeId] ?? SIZE_DATA[DEFAULT_SIZE]
  const { h, coverW, spineW, rings } = cfg
  const coverX = spineW / 2 + coverW / 2   // X centre of each cover plate

  // Shared colour constants
  const COVER_COLOR = 0x8B6F47
  const SPINE_COLOR = 0x6b5035
  const RING_COLOR  = 0xb8a060

  function coverMat() {
    return new THREE.MeshStandardMaterial({
      color: COVER_COLOR, roughness: 0.72, metalness: 0.05,
    })
  }

  // ── Front cover ─────────────────────────────────────────────────────────────
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(coverW, h, COVER_DEPTH),
    coverMat(),
  )
  frontCover.name = 'front-cover'
  frontCover.position.x = coverX
  frontCover.castShadow = frontCover.receiveShadow = true
  group.add(frontCover)

  // ── Back cover ──────────────────────────────────────────────────────────────
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(coverW, h, COVER_DEPTH),
    coverMat(),
  )
  backCover.name = 'back-cover'
  backCover.position.x = -coverX
  backCover.castShadow = backCover.receiveShadow = true
  group.add(backCover)

  // ── Spine ────────────────────────────────────────────────────────────────────
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(spineW, h, COVER_DEPTH * 1.05),
    new THREE.MeshStandardMaterial({ color: SPINE_COLOR, roughness: 0.75, metalness: 0.05 }),
  )
  spine.name = 'spine'
  spine.castShadow = spine.receiveShadow = true
  group.add(spine)

  // ── Rings (CylinderGeometry, axis along Z so they show as circles on the spine face)
  // Each ring protrudes COVER_DEPTH/4 beyond the spine front face.
  const ringLength = COVER_DEPTH + 0.05
  const ringMat    = new THREE.MeshStandardMaterial({
    color: RING_COLOR, roughness: 0.28, metalness: 0.70,
  })
  const usableH   = h - RING_PAD * 2
  const ringStep  = rings > 1 ? usableH / (rings - 1) : 0
  const ringTopY  = h / 2 - RING_PAD

  for (let i = 0; i < rings; i++) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(RING_RADIUS, RING_RADIUS, ringLength, 20),
      ringMat.clone(),
    )
    ring.name = `ring-${i}`
    // Rotate so the cylinder axis becomes Z (shows circular face from front)
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, ringTopY - i * ringStep, 0)
    ring.castShadow = ring.receiveShadow = true
    group.add(ring)
  }

  // Store geometry parameters so buildZones can reference them without re-parsing
  group.userData.sizeParams = { h, coverW, spineW, coverX }
}

// ── Build zone overlay meshes on the front cover face ────────────────────────
// zones: Array<{ x, y, w, h, color: string|null, material: string|null }>
// All x/y/w/h are in 0-1 UV space, top-left origin.
function buildZones(group, zoneMeshesRef, zones) {
  // Remove + dispose previous zone overlays
  for (const m of zoneMeshesRef.current) {
    group.remove(m)
    disposeMesh(m)
  }
  zoneMeshesRef.current = []

  const { sizeParams } = group.userData
  if (!sizeParams || !zones?.length) return

  const { h, coverW, coverX } = sizeParams
  // Zone meshes sit just in front of the cover face to avoid z-fighting
  const ZONE_DEPTH = 0.003
  const zoneZ      = COVER_DEPTH / 2 + ZONE_DEPTH / 2 + 0.0005

  for (const zone of zones) {
    const zw = zone.w * coverW
    const zh = zone.h * h

    // Convert UV (top-left origin, 0-1) → Three.js local (centre origin, Y-up)
    const localUX = zone.x + zone.w / 2 - 0.5   // -0.5 … +0.5 relative to cover centre
    const localUY = -(zone.y + zone.h / 2 - 0.5) // flip Y

    const zx = coverX + localUX * coverW
    const zy = localUY * h

    const matDef  = MAT_PROPS[zone.material] ?? { roughness: 0.72, metalness: 0.05 }
    const hexStr  = zone.color ?? '#a08060'      // neutral default if not yet assigned
    const opacity = zone.color ? 1.0 : 0.35      // fade unassigned zones

    const mat = new THREE.MeshStandardMaterial({
      color:     new THREE.Color(hexStr),
      roughness: matDef.roughness,
      metalness: matDef.metalness,
      transparent: !zone.color || !!matDef.transparent,
      opacity:   matDef.transparent ? (matDef.opacity ?? 0.80) : opacity,
    })

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(zw, zh, ZONE_DEPTH), mat)
    mesh.position.set(zx, zy, zoneZ)
    mesh.name = `zone-${zone.name ?? 'unnamed'}`
    group.add(mesh)
    zoneMeshesRef.current.push(mesh)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const BinderCanvas = forwardRef(function BinderCanvas(
  { size = DEFAULT_SIZE, zones = [] },
  ref,
) {
  const mountRef       = useRef(null)
  const sceneRef       = useRef(null)
  const cameraRef      = useRef(null)
  const rendererRef    = useRef(null)
  const controlsRef    = useRef(null)
  const binderGroupRef = useRef(null)
  const zoneMeshesRef  = useRef([])

  // Always-current zones reference (read by the size effect without re-running it)
  const zonesRef = useRef(zones)
  zonesRef.current = zones

  // Expose a small imperative API for future step integrations
  useImperativeHandle(ref, () => ({
    getScene:    () => sceneRef.current,
    getCamera:   () => cameraRef.current,
    getRenderer: () => rendererRef.current,
  }))

  // ── Effect 1: one-time scene / renderer / controls / loop setup ─────────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf2ece3)
    scene.fog = new THREE.Fog(0xf2ece3, 14, 32)
    sceneRef.current = scene

    // Camera
    const { clientWidth: cw, clientHeight: ch } = mount
    const camera = new THREE.PerspectiveCamera(36, cw / ch, 0.1, 100)
    camera.position.set(1.4, 1.0, 8.0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(cw, ch)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Lights ────────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xfff5e8, 1.1)
    scene.add(ambient)

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

    // Cool fill from the opposite side to show material depth
    const fillLight = new THREE.DirectionalLight(0xd8e8ff, 0.55)
    fillLight.position.set(-4, 2, -5)
    scene.add(fillLight)

    // Soft rimlight from above-back
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.30)
    rimLight.position.set(0, 6, -4)
    scene.add(rimLight)

    // Shadow catcher under the binder
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.ShadowMaterial({ opacity: 0.10 }),
    )
    ground.rotation.x  = -Math.PI / 2
    ground.position.y  = -2.0
    ground.receiveShadow = true
    scene.add(ground)

    // ── Binder group (geometry built by size effect below) ────────────────────
    const binderGroup = new THREE.Group()
    // Tilt toward camera slightly so the cover face is prominent
    binderGroup.rotation.x = 0.06
    binderGroup.rotation.y = -0.18   // slight turn to reveal spine depth
    scene.add(binderGroup)
    binderGroupRef.current = binderGroup

    // ── OrbitControls ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping  = true
    controls.dampingFactor  = 0.055
    controls.minDistance    = 2.5
    controls.maxDistance    = 18
    controls.maxPolarAngle  = Math.PI * 0.70
    controls.target.set(0, 0, 0)
    controls.update()
    controlsRef.current = controls

    // ── Resize observer ───────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const { clientWidth: rw, clientHeight: rh } = mount
      if (!rw || !rh) return
      camera.aspect = rw / rh
      camera.updateProjectionMatrix()
      renderer.setSize(rw, rh)
    })
    ro.observe(mount)

    // ── Animation loop ────────────────────────────────────────────────────────
    let rafId
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      scene.traverse(obj => {
        if (obj.isMesh) disposeMesh(obj)
      })
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: rebuild binder geometry when size changes ───────────────────
  useEffect(() => {
    const group = binderGroupRef.current
    if (!group) return
    buildBinder(group, size)
    // Also rebuild zones since the cover dimensions changed
    buildZones(group, zoneMeshesRef, zonesRef.current)
  }, [size]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: update zone overlays when zones (color / material) change ───
  useEffect(() => {
    const group = binderGroupRef.current
    if (!group?.userData.sizeParams) return
    buildZones(group, zoneMeshesRef, zones)
  }, [zones])

  return <div ref={mountRef} className={styles.mount} />
})

export default BinderCanvas
