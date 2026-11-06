import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BUILDINGS, CRANES, LAKE, PARK, PIPE_RACK, TANKS, type BuildingSpec } from '@/mock/scene'

export type ToolMode = 'select' | 'measure' | 'section' | 'annotate' | 'compare' | 'walk'
export type PointMode = 'rgb' | 'elevation' | 'intensity'
export type LayerKey = 'mesh' | 'pointcloud' | 'bim' | 'pipe' | 'annotation' | 'route' | 'underground' | 'env'

export interface PickInfo {
  nodeId: string
  name: string
  code: string
  position: [number, number, number]
  meta: Record<string, string | number>
}

export interface MeasureResult {
  type: string
  value: string
  detail: string
}

export interface ViewerStats {
  fps: number
  triangles: number
  calls: number
}

interface Callbacks {
  onPick?: (info: PickInfo | null) => void
  onMeasure?: (m: MeasureResult) => void
  onStats?: (s: ViewerStats) => void
  onCoords?: (c: { X: string; Y: string; Z: string; lat: string; lng: string }) => void
  onAnnotation?: (id: string) => void
  onBusy?: (msg: string) => void
}

const COL = {
  ground: 0x0a1020,
  road: 0x1b2437,
  water: 0x0b3a4a,
  bim: 0x38bdf8,
  pipe: 0x22d3ee,
}

export class ParkViewer {
  private container: HTMLElement
  private cb: Callbacks
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private clock = new THREE.Clock()
  private raf = 0

  private buildingGroups = new Map<string, THREE.Group>()
  private pickables: THREE.Object3D[] = []
  private clipMatrices: THREE.Material[] = []
  private clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 500)

  private layers: Record<string, THREE.Object3D[]> = {}

  private tool: ToolMode = 'select'
  private points: THREE.Vector3[] = []
  private measureGroup = new THREE.Group()
  private annotationGroup = new THREE.Group()
  private pointCloud?: THREE.Points
  private pointCloudBase?: Float32Array
  private bimGroup = new THREE.Group()

  private frames = 0
  private fpsTime = 0
  private lastCoord = 0
  private fly?: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; start: number }
  private disposed = false

  private lite: boolean

  constructor(container: HTMLElement, cb: Callbacks, opts?: { lite?: boolean }) {
    this.container = container
    this.cb = cb
    this.lite = Boolean(opts?.lite)

    this.scene.background = new THREE.Color(0x070b14)
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.00022)

    this.camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 1, 8000)
    this.camera.position.set(760, 600, 880)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false })
    this.renderer.setPixelRatio(this.lite ? 1 : Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.localClippingEnabled = true
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.touchAction = 'none'

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.075
    this.controls.maxPolarAngle = Math.PI / 2.06
    this.controls.minDistance = 30
    this.controls.maxDistance = 2400
    this.controls.target.set(0, 10, 0)

    this.buildLights()
    this.buildGround()
    this.buildBuildings()
    this.buildTanks()
    this.buildPipeRack()
    this.buildCranes()
    this.buildEnv()
    if (!this.lite) {
      this.buildRoute()
      this.buildUnderground()
      this.buildPointCloud()
      this.buildBimLayer()
    } else {
      this.renderer.shadowMap.enabled = false
      this.controls.autoRotate = true
      this.controls.autoRotateSpeed = 0.45
      this.camera.position.set(900, 760, 1020)
    }
    this.scene.add(this.measureGroup, this.annotationGroup)
    this.scene.add(this.bimGroup)

    this.controls.update()
    this.bindEvents()
    this.loop()
  }

  // ---------- 场景构建 ----------

  private buildLights() {
    this.scene.add(new THREE.HemisphereLight(0x8ec5ff, 0x0b1220, 0.85))
    const dir = new THREE.DirectionalLight(0xffffff, 1.9)
    dir.position.set(520, 780, 380)
    dir.castShadow = true
    dir.shadow.mapSize.set(1536, 1536)
    dir.shadow.camera.near = 10
    dir.shadow.camera.far = 2600
    const c = dir.shadow.camera as THREE.OrthographicCamera
    c.left = -900
    c.right = 900
    c.top = 900
    c.bottom = -900
    dir.shadow.bias = -0.0006
    this.scene.add(dir)
    const fill = new THREE.DirectionalLight(0x6366f1, 0.35)
    fill.position.set(-600, 300, -500)
    this.scene.add(fill)
  }

  private buildGround() {
    const env = new THREE.Group()
    this.layers.env = [env]

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(3000, 3000),
      new THREE.MeshStandardMaterial({ color: COL.ground, roughness: 1, metalness: 0 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    env.add(ground)

    const grid = new THREE.GridHelper(2800, 56, 0x1e3a5f, 0x14243a)
    const gm = grid.material as THREE.Material
    gm.transparent = true
    gm.opacity = 0.35
    grid.position.y = 0.02
    env.add(grid)

    // 环形主干道
    const roadMat = new THREE.MeshStandardMaterial({ color: COL.road, roughness: 0.92 })
    const roadRing = [
      { w: 1400, d: 14, x: 0, z: -660 },
      { w: 1400, d: 14, x: 0, z: 660 },
      { w: 14, d: 1330, x: -690, z: 0 },
      { w: 14, d: 1330, x: 690, z: 0 },
      { w: 14, d: 900, x: 0, z: 0 },
      { w: 900, d: 14, x: 0, z: -120 },
    ]
    roadRing.forEach((r) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(r.w, 0.12, r.d), roadMat)
      m.position.set(r.x, 0.06, r.z)
      m.receiveShadow = true
      env.add(m)
    })

    // 水面
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(LAKE.r, 64),
      new THREE.MeshStandardMaterial({ color: COL.water, roughness: 0.18, metalness: 0.65, transparent: true, opacity: 0.92 }),
    )
    water.rotation.x = -Math.PI / 2
    water.position.set(LAKE.x, 0.16, LAKE.z)
    env.add(water)
    this.layers.water = [water]

    // 树
    const treeCount = 220
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 4, 5)
    const leafGeo = new THREE.ConeGeometry(3.2, 9, 6)
    const trunk = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x3a2f26, roughness: 1 }), treeCount)
    const leaf = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x1f5b45, roughness: 1 }), treeCount)
    const dummy = new THREE.Object3D()
    let ti = 0
    for (let i = 0; i < treeCount; i++) {
      const side = i % 4
      const t = (Math.floor(i / 4) / (treeCount / 4)) * 1300 - 650
      let x = 0
      let z = 0
      if (side === 0) { x = t; z = -690 + (i % 2 ? 14 : -14) }
      if (side === 1) { x = t; z = 690 + (i % 2 ? 14 : -14) }
      if (side === 2) { x = -720 + (i % 2 ? 14 : -14); z = t }
      if (side === 3) { x = 720 + (i % 2 ? 14 : -14); z = t }
      if (Math.abs(x) < 60 && Math.abs(z) < 60) continue
      dummy.position.set(x, 2, z)
      dummy.rotation.y = (i * 1.7) % 6.28
      dummy.updateMatrix()
      trunk.setMatrixAt(ti, dummy.matrix)
      dummy.position.y = 8
      dummy.scale.setScalar(0.8 + ((i * 7) % 10) / 25)
      dummy.updateMatrix()
      leaf.setMatrixAt(ti, dummy.matrix)
      ti++
    }
    trunk.count = ti
    leaf.count = ti
    leaf.castShadow = true
    env.add(trunk, leaf)

    // 车辆
    const carGeo = new THREE.BoxGeometry(4.6, 1.7, 2)
    const car = new THREE.InstancedMesh(carGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.3 }), 48)
    for (let i = 0; i < 48; i++) {
      const onX = i % 2 === 0
      dummy.position.set(
        onX ? ((i * 137) % 1200) - 600 : (i % 3 === 0 ? -672 : 672),
        1,
        onX ? (i % 3 === 0 ? -660 : 660) : ((i * 173) % 1200) - 600,
      )
      dummy.rotation.y = onX ? 0 : Math.PI / 2
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      car.setMatrixAt(i, dummy.matrix)
    }
    env.add(car)

    // 集装箱堆场
    const boxGeo = new THREE.BoxGeometry(12, 5.4, 5)
    const boxes = new THREE.InstancedMesh(boxGeo, new THREE.MeshStandardMaterial({ color: 0x9a5b3a, roughness: 0.85 }), 36)
    const boxColors = [0x9a5b3a, 0x2f6f8f, 0x5b7a4a, 0x8f7a2f]
    for (let i = 0; i < 36; i++) {
      dummy.position.set(-560 + (i % 6) * 14, 2.7 + Math.floor(i / 18) * 5.6, 300 + Math.floor((i % 18) / 6) * 6)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      boxes.setMatrixAt(i, dummy.matrix)
      boxes.setColorAt(i, new THREE.Color(boxColors[i % 4]))
    }
    env.add(boxes)

    // 路灯
    const lampGeo = new THREE.CylinderGeometry(0.25, 0.25, 12, 6)
    const lamps = new THREE.InstancedMesh(lampGeo, new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 }), 40)
    for (let i = 0; i < 40; i++) {
      const onX = i % 2 === 0
      dummy.position.set(onX ? ((i * 67) % 1300) - 650 : (i % 4 === 0 ? -676 : 676), 6, onX ? (i % 4 === 0 ? -676 : 676) : ((i * 89) % 1300) - 650)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      lamps.setMatrixAt(i, dummy.matrix)
    }
    env.add(lamps)

    this.scene.add(env)
  }

  private makeBuilding(b: BuildingSpec) {
    const g = new THREE.Group()
    g.position.set(b.x, 0, b.z)
    g.userData = { nodeId: `bld-${b.code}`, code: b.code, name: `${b.code} ${b.name}` }

    const wallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(b.wall), roughness: 0.88, metalness: 0.04 })
    const roofMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(b.roof), roughness: 0.72, metalness: 0.16 })
    this.clipMatrices.push(wallMat, roofMat)

    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), wallMat)
    body.position.y = b.h / 2
    body.castShadow = true
    body.receiveShadow = true
    body.userData = { nodeId: `bld-${b.code}`, code: b.code, name: `${b.code} ${b.name}` }
    g.add(body)
    this.pickables.push(body)

    // 屋顶
    if (b.roofType === 'flat') {
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.6, 1.1, b.d + 0.6), roofMat)
      parapet.position.y = b.h + 0.3
      parapet.castShadow = true
      g.add(parapet)
      const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w - 1, 0.3, b.d - 1), roofMat)
      slab.position.y = b.h + 0.05
      g.add(slab)
      // 屋顶空调机组
      for (let i = 0; i < 3; i++) {
        const ac = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 3), new THREE.MeshStandardMaterial({ color: 0xb8c4d4, roughness: 0.7 }))
        ac.position.set(-b.w / 3 + i * (b.w / 3), b.h + 1.3, -b.d / 5)
        ac.castShadow = true
        g.add(ac)
      }
    } else if (b.roofType === 'sawtooth') {
      const teeth = Math.max(4, Math.round(b.w / 18))
      const step = b.w / teeth
      for (let i = 0; i < teeth; i++) {
        const slope = new THREE.Mesh(new THREE.BoxGeometry(step * 1.14, 0.4, b.d), roofMat)
        slope.position.set(-b.w / 2 + step * (i + 0.5), b.h + 1.6, 0)
        slope.rotation.z = -0.42
        slope.castShadow = true
        this.clipMatrices.push(slope.material as THREE.Material)
        g.add(slope)
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(step * 0.9, 2.4, b.d - 2),
          new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.2, metalness: 0.4, emissive: 0x0c4a6e, emissiveIntensity: 0.4 }),
        )
        glass.position.set(-b.w / 2 + step * (i + 0.5) + 2.6, b.h + 0.6, 0)
        glass.rotation.z = -0.42
        g.add(glass)
      }
    } else {
      const half = b.w / 2
      const slopeLen = Math.sqrt(half * half + 6 * 6)
      const left = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.4, b.d + 1.2), roofMat)
      left.position.set(-half / 2, b.h + 3, 0)
      left.rotation.z = Math.atan2(6, half)
      left.castShadow = true
      const right = left.clone()
      right.position.x = half / 2
      right.rotation.z = -Math.atan2(6, half)
      g.add(left, right)
    }

    // 窗户（实例化）
    const winPer = b.windowsPerFloor
    const total = winPer * b.floors * 2
    const winGeo = new THREE.BoxGeometry(2.6, 2.2, 0.3)
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc, roughness: 0.18, metalness: 0.55, emissive: 0x0e7490, emissiveIntensity: 0.35,
    })
    this.clipMatrices.push(winMat)
    const win = new THREE.InstancedMesh(winGeo, winMat, total)
    const d = new THREE.Object3D()
    let idx = 0
    for (let f = 0; f < b.floors; f++) {
      for (let i = 0; i < winPer; i++) {
        const x = -b.w / 2 + (b.w / (winPer + 1)) * (i + 1)
        d.position.set(x, 2.4 + f * (b.h / b.floors), b.d / 2 + 0.1)
        d.updateMatrix()
        win.setMatrixAt(idx++, d.matrix)
        d.position.z = -b.d / 2 - 0.1
        d.updateMatrix()
        win.setMatrixAt(idx++, d.matrix)
      }
    }
    win.count = idx
    g.add(win)

    // 装卸月台
    if (b.hasDock) {
      const dock = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.7, 1.3, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 }))
      dock.position.set(0, 0.65, b.d / 2 + 4)
      dock.receiveShadow = true
      g.add(dock)
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.72, 0.25, 7), roofMat)
      canopy.position.set(0, 6.4, b.d / 2 + 3.6)
      canopy.castShadow = true
      g.add(canopy)
    }

    // 烟囱
    if (b.hasChimney) {
      const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2.1, 32, 12),
        new THREE.MeshStandardMaterial({ color: 0x8b5a4a, roughness: 0.95 }),
      )
      chimney.position.set(b.w / 2 + 6, 16, -b.d / 3)
      chimney.castShadow = true
      g.add(chimney)
      for (let i = 1; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75 - i * 0.08, 0.16, 6, 16), new THREE.MeshStandardMaterial({ color: 0x4b5563 }))
        ring.rotation.x = Math.PI / 2
        ring.position.set(b.w / 2 + 6, i * 8, -b.d / 3)
        g.add(ring)
      }
    }

    // 入口雨棚
    if (b.h > 10) {
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 5), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }))
      canopy.position.set(0, 4.2, b.d / 2 + 2.5)
      canopy.castShadow = true
      g.add(canopy)
    }

    this.buildingGroups.set(`bld-${b.code}`, g)
    return g
  }

  private buildBuildings() {
    const meshGroup = new THREE.Group()
    BUILDINGS.forEach((b) => meshGroup.add(this.makeBuilding(b)))
    this.layers.mesh = [meshGroup]
    this.scene.add(meshGroup)
  }

  private buildTanks() {
    const group = new THREE.Group()
    const mat = new THREE.MeshStandardMaterial({ color: 0xd7dee7, roughness: 0.4, metalness: 0.55 })
    this.clipMatrices.push(mat)
    TANKS.forEach((t) => {
      const g = new THREE.Group()
      g.position.set(t.x, 0, t.z)
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r, t.h, 32, 1, true), mat)
      cyl.position.y = t.h / 2
      cyl.castShadow = true
      cyl.receiveShadow = true
      g.add(cyl)
      const top = new THREE.Mesh(new THREE.CylinderGeometry(t.r + 0.2, t.r + 0.2, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 }))
      top.position.y = t.h
      g.add(top)
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(t.r + 0.15, 0.12, 5, 40), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }))
        ring.rotation.x = Math.PI / 2
        ring.position.y = 2 + i * 7
        g.add(ring)
      }
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.8, t.h, 0.3), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }))
      ladder.position.set(t.r, t.h / 2, 0)
      g.add(ladder)
      group.add(g)
    })
    this.layers.mesh.push(group)
    this.scene.add(group)
  }

  private buildPipeRack() {
    const group = new THREE.Group()
    const curve = new THREE.CatmullRomCurve3(PIPE_RACK.map(([x, z]) => new THREE.Vector3(x, 5.2, z)))
    const colors = [0x22d3ee, 0x6366f1, 0xfbbf24, 0x94a3b8]
    colors.forEach((c, i) => {
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 60, 0.55 - i * 0.06, 8, false),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.5 }),
      )
      tube.position.set(i * 1.1 - 1.6, 0, 0)
      tube.castShadow = true
      group.add(tube)
    })
    PIPE_RACK.forEach(([x, z]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(1, 5.2, 1), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 }))
      col.position.set(x, 2.6, z)
      col.castShadow = true
      group.add(col)
      const beam = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x64748b }))
      beam.position.set(x, 5.2, z)
      group.add(beam)
    })
    this.layers.pipe = [group]
    this.scene.add(group)
  }

  private buildCranes() {
    const group = new THREE.Group()
    const mat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, metalness: 0.35 })
    CRANES.forEach((c) => {
      const g = new THREE.Group()
      g.position.set(c.x, 0, c.z)
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.6, c.h, 1.6), mat)
        leg.position.set(i % 2 ? 8 : -8, c.h / 2, i < 2 ? -10 : 10)
        leg.castShadow = true
        g.add(leg)
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 2), mat)
      beam.position.y = c.h
      g.add(beam)
      const boom = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 30), mat)
      boom.position.set(0, c.h + 1, -6)
      g.add(boom)
      const cab = new THREE.Mesh(new THREE.BoxGeometry(4, 3.5, 4), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 }))
      cab.position.set(0, c.h + 2.5, 8)
      g.add(cab)
      group.add(g)
    })
    // 码头面
    const deck = new THREE.Mesh(new THREE.BoxGeometry(120, 1.2, 420), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 }))
    deck.position.set(650, 0.6, 400)
    deck.receiveShadow = true
    group.add(deck)
    this.layers.mesh.push(group)
    this.scene.add(group)
  }

  /** 巡检路线图层：沿主干道串联各厂房出入口的发光管线 + 途经点位标记 */
  private buildRoute() {
    const g = new THREE.Group()
    const picks = BUILDINGS.filter((_, i) => i % 2 === 0).slice(0, 9)
    const pts = picks.map((b) => new THREE.Vector3(b.x, 1.6, b.z + b.d / 2 + 14))
    if (pts.length < 2) return
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3)
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 260, 0.9, 8, false),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.5,
        roughness: 0.4,
        metalness: 0.2,
      }),
    )
    g.add(tube)

    const ringGeo = new THREE.RingGeometry(3.4, 4.8, 24)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.7, roughness: 0.5 })
    const pinGeo = new THREE.ConeGeometry(1.7, 5.2, 12)
    picks.forEach((b) => {
      const x = b.x
      const z = b.z + b.d / 2 + 14
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.set(x, 1.3, z)
      g.add(ring)
      const pin = new THREE.Mesh(pinGeo, pinMat)
      pin.position.set(x, 5.6, z)
      pin.rotation.x = Math.PI
      g.add(pin)
    })

    g.visible = false
    this.layers.route = [g]
    this.scene.add(g)
  }

  private buildEnv() {
    // 变电站构架
    const g = new THREE.Group()
    const steel = new THREE.MeshStandardMaterial({ color: 0x8fa6bf, roughness: 0.6, metalness: 0.5 })
    for (let i = 0; i < 3; i++) {
      const frame = new THREE.Group()
      frame.position.set(-120 + i * 26, 0, -500)
      ;[-6, 6].forEach((dx) => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, 16, 0.8), steel)
        col.position.set(dx, 8, 0)
        col.castShadow = true
        frame.add(col)
      })
      const top = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 0.8), steel)
      top.position.y = 15
      frame.add(top)
      g.add(frame)
    }
    ;[-40, -10].forEach((x) => {
      const tx = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 7), new THREE.MeshStandardMaterial({ color: 0x4b5f75, roughness: 0.7 }))
      tx.position.set(x, 3, -470)
      tx.castShadow = true
      g.add(tx)
    })
    this.layers.env.push(g)
    this.scene.add(g)
  }

  private buildUnderground() {
    const g = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 })
    ;[[-600, 0, 600, 0], [0, -600, 0, 600], [-600, -300, 600, -300], [-300, -600, -300, 600]].forEach(([x1, z1, x2, z2]) => {
      const p1 = new THREE.Vector3(x1, -3.2, z1)
      const p2 = new THREE.Vector3(x2, -3.2, z2)
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2])
      g.add(new THREE.Line(geo, mat))
    })
    g.visible = false
    this.layers.underground = [g]
    this.scene.add(g)
  }

  private buildBimLayer() {
    const mat = new THREE.MeshBasicMaterial({ color: COL.bim, wireframe: true, transparent: true, opacity: 0.55 })
    BUILDINGS.forEach((b) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat)
      m.position.set(b.x, b.h / 2, b.z)
      this.bimGroup.add(m)
      const fl = Math.max(1, b.floors)
      for (let i = 1; i < fl; i++) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(b.w - 1, 0.12, b.d - 1), mat)
        plate.position.set(b.x, (b.h / fl) * i, b.z)
        this.bimGroup.add(plate)
      }
    })
    this.bimGroup.visible = false
    this.layers.bim = [this.bimGroup]
  }

  private buildPointCloud() {
    const count = 90000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    let i = 0
    while (i < count) {
      const b = BUILDINGS[i % BUILDINGS.length]
      const face = i % 4
      const u = Math.random() - 0.5
      const v = Math.random()
      let x = b.x
      let y = 0
      let z = b.z
      if (face < 2) {
        x = b.x + u * b.w
        y = v * b.h
        z = b.z + (face === 0 ? b.d / 2 : -b.d / 2)
      } else if (face === 2) {
        x = b.x + u * b.w
        y = b.h
        z = b.z + (Math.random() - 0.5) * b.d
      } else {
        x = b.x + (u > 0 ? b.w / 2 : -b.w / 2)
        y = v * b.h
        z = b.z + (Math.random() - 0.5) * b.d
      }
      positions[i * 3] = x + (Math.random() - 0.5) * 0.3
      positions[i * 3 + 1] = Math.max(0.2, y)
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3
      colors[i * 3] = 0.58
      colors[i * 3 + 1] = 0.64
      colors[i * 3 + 2] = 0.72
      i++
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.pointCloudBase = colors.slice()
    const mat = new THREE.PointsMaterial({ size: 1.15, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true })
    this.pointCloud = new THREE.Points(geo, mat)
    this.pointCloud.visible = false
    this.layers.pointcloud = [this.pointCloud]
    this.scene.add(this.pointCloud)
    this.applyPointColor('elevation')
  }

  // ---------- 外部 API ----------

  setTool(t: ToolMode) {
    this.tool = t
    this.clearMeasure()
    if (t === 'walk') {
      this.controls.enabled = false
      this.camera.position.set(-180, 1.75, 60)
      this.controls.target.set(-180, 1.7, -120)
    } else {
      this.controls.enabled = true
    }
    this.renderer.domElement.style.cursor = t === 'select' ? 'default' : 'crosshair'
  }

  setLayer(key: LayerKey, visible: boolean) {
    const list = this.layers[key]
    if (!list) return
    list.forEach((o) => (o.visible = visible))
  }

  setLayerOpacity(key: LayerKey, v: number) {
    const list = this.layers[key]
    if (!list) return
    list.forEach((o) =>
      o.traverse((child) => {
        const m = (child as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
        if (!m) return
        const arr = Array.isArray(m) ? m : [m]
        arr.forEach((mm) => {
          mm.transparent = v < 100
          mm.opacity = v / 100
          mm.needsUpdate = true
        })
      }),
    )
  }

  setPointMode(mode: PointMode) {
    this.applyPointColor(mode)
  }

  private applyPointColor(mode: PointMode) {
    if (!this.pointCloud || !this.pointCloudBase) return
    const geo = this.pointCloud.geometry
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    const col = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (mode === 'rgb') {
        col[i * 3] = this.pointCloudBase[i * 3]
        col[i * 3 + 1] = this.pointCloudBase[i * 3 + 1]
        col[i * 3 + 2] = this.pointCloudBase[i * 3 + 2]
      } else if (mode === 'elevation') {
        const t = Math.min(1, Math.max(0, (y - PARK.baseElevation) / (PARK.maxElevation + 20)))
        c.setHSL(0.58 - t * 0.62, 0.85, 0.35 + t * 0.25)
        col[i * 3] = c.r
        col[i * 3 + 1] = c.g
        col[i * 3 + 2] = c.b
      } else {
        const t = (i % 200) / 200
        c.setHSL(0.08, 0.05 + t * 0.75, 0.18 + t * 0.55)
        col[i * 3] = c.r
        col[i * 3 + 1] = c.g
        col[i * 3 + 2] = c.b
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  }

  setPointSize(v: number) {
    if (this.pointCloud) (this.pointCloud.material as THREE.PointsMaterial).size = v
  }

  setClip(ratio: number) {
    this.clipPlane.constant = 700 - ratio * 14
    this.clipMatrices.forEach((m) => {
      m.clippingPlanes = ratio > 0 && ratio < 100 ? [this.clipPlane] : []
      m.needsUpdate = true
    })
  }

  setClipEnabled(on: boolean) {
    this.clipMatrices.forEach((m) => {
      m.clippingPlanes = on ? [this.clipPlane] : []
      m.needsUpdate = true
    })
  }

  setCompare(on: boolean) {
    this.bimGroup.visible = on
    this.layers.mesh.forEach((g) =>
      g.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.isMesh && mesh.material) {
          const m = mesh.material as THREE.MeshStandardMaterial
          if (m.color && 'setHex' in m.color) {
            if (m.userData.origColor === undefined) m.userData.origColor = m.color.getHex()
            m.color.setHex(on ? 0x64748b : (m.userData.origColor as number))
          }
        }
      }),
    )
  }

  focus(nodeId: string) {
    const g = this.buildingGroups.get(nodeId)
    if (!g) return
    const box = new THREE.Box3().setFromObject(g)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3()).length()
    const dist = Math.max(70, size * 1.7)
    const to = center.clone().add(new THREE.Vector3(dist * 0.62, dist * 0.55, dist * 0.62))
    this.flyTo(to, center.clone().setY(center.y * 0.7))
  }

  resetView() {
    this.flyTo(new THREE.Vector3(760, 600, 880), new THREE.Vector3(0, 10, 0))
  }

  private flyTo(pos: THREE.Vector3, target: THREE.Vector3) {
    this.fly = { from: this.camera.position.clone(), to: pos, tFrom: this.controls.target.clone(), tTo: target, start: performance.now() }
  }

  addAnnotation(a: { id: string; title: string; color: string; pos: [number, number, number] }) {
    const existing = this.annotationGroup.getObjectByName(a.id)
    if (existing) this.annotationGroup.remove(existing)
    const sprite = this.makeSprite(a.title, a.color, a.id)
    sprite.position.set(a.pos[0], a.pos[1], a.pos[2])
    sprite.name = a.id
    this.annotationGroup.add(sprite)
    this.layers.annotation = [this.annotationGroup]
  }

  removeAnnotation(id: string) {
    const o = this.annotationGroup.getObjectByName(id)
    if (o) this.annotationGroup.remove(o)
  }

  private makeSprite(text: string, color: string, id: string) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 96
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 256, 96)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(36, 40, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.92)'
    ctx.beginPath()
    ctx.arc(36, 40, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(36, 52)
    ctx.lineTo(36, 78)
    ctx.stroke()
    ctx.font = '500 20px "PingFang SC", sans-serif'
    ctx.fillStyle = '#E6EDF7'
    ctx.fillText(text.slice(0, 10), 56, 46)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    const s = new THREE.Sprite(mat)
    s.scale.set(26, 9.75, 1)
    s.userData = { annotationId: id }
    s.renderOrder = 10
    return s
  }

  screenshot() {
    return this.renderer.domElement.toDataURL('image/png')
  }

  private bindEvents() {
    const el = this.renderer.domElement
    el.addEventListener('pointerdown', this.onPointerDown)
    el.addEventListener('pointermove', this.onPointerMove)
    el.addEventListener('dblclick', this.onDblClick)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('keydown', this.onKey)
  }

  private onResize = () => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private keys = new Set<string>()

  private onKey = (e: KeyboardEvent) => {
    if (this.tool !== 'walk') return
    this.keys.add(e.key.toLowerCase())
    if (e.type === 'keydown') setTimeout(() => this.keys.delete(e.key.toLowerCase()), 200)
  }

  private onDblClick = () => {
    if (this.tool === 'measure') {
      this.finishMeasure()
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const now = performance.now()
    if (now - this.lastCoord < 120) return
    this.lastCoord = now
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0]
    const p = hit?.point ?? this.raycaster.ray.at(400, new THREE.Vector3())
    const x = p.x
    const y = Math.max(0, p.y)
    const z = p.z
    const X = 3453210.456 + x
    const Y = 40512880.132 - z
    const lat = 30.2841 + z / 111320
    const lng = 120.1526 + x / (111320 * Math.cos((30.2841 * Math.PI) / 180))
    this.cb.onCoords?.({
      X: X.toFixed(3), Y: Y.toFixed(3), Z: y.toFixed(2),
      lat: lat.toFixed(6), lng: lng.toFixed(6),
    })
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)

    if (this.annotationGroup.visible) {
      const hitAnno = this.raycaster.intersectObjects(this.annotationGroup.children, true)[0]
      if (hitAnno) {
        const id = hitAnno.object.userData.annotationId as string
        if (id) {
          this.cb.onAnnotation?.(id)
          return
        }
      }
    }

    if (this.tool === 'select') {
      const hit = this.raycaster.intersectObjects(this.pickables, false)[0]
      if (hit) {
        const o = hit.object
        const nodeId = (o.userData.nodeId as string) ?? ''
        const b = BUILDINGS.find((x) => `bld-${x.code}` === nodeId)
        if (b) {
          this.cb.onPick?.({
            nodeId, name: `${b.code} ${b.name}`, code: b.code,
            position: [hit.point.x, hit.point.y, hit.point.z],
            meta: {
              建筑面积: `${(b.w * b.d * b.floors * 0.82).toFixed(0)} m²`,
              层数: b.floors, 檐高: `${b.h} m`, 结构: b.structure,
              建成年份: b.builtYear, 复刻精度: '±3.1 cm',
              构件数: Math.round((b.w * b.d) / 6),
            },
          })
        }
      } else {
        this.cb.onPick?.(null)
      }
      return
    }

    if (this.tool === 'measure') {
      const hit = this.raycaster.intersectObjects(this.pickables, false)[0]
      const p = hit?.point ?? this.raycaster.ray.at(600, new THREE.Vector3())
      this.points.push(p.clone())
      this.drawMeasure()
    }

    if (this.tool === 'annotate') {
      const hit = this.raycaster.intersectObjects(this.pickables, false)[0]
      const p = hit?.point ?? this.raycaster.ray.at(600, new THREE.Vector3())
      this.cb.onPick?.({
        nodeId: 'annotation-point', name: '落点', code: '',
        position: [p.x, p.y, p.z], meta: {},
      })
    }

  }

  private drawMeasure() {
    while (this.measureGroup.children.length) {
      const c = this.measureGroup.children.pop() as THREE.Object3D
      this.measureGroup.remove(c)
    }
    if (this.points.length === 0) return
    const positions: number[] = []
    this.points.forEach((p) => positions.push(p.x, p.y, p.z))
    if (this.points.length > 1) {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x22d3ee }))
      this.measureGroup.add(line)
    }
    this.points.forEach((p) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }))
      dot.position.copy(p)
      this.measureGroup.add(dot)
    })
    if (this.points.length >= 2) {
      const a = this.points[this.points.length - 2]
      const b = this.points[this.points.length - 1]
      const d = a.distanceTo(b)
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const label = this.makeSprite(`${d.toFixed(2)} m`, '#22d3ee', `m-${this.points.length}`)
      label.scale.set(18, 6.75, 1)
      label.position.copy(mid).add(new THREE.Vector3(0, 3, 0))
      this.measureGroup.add(label)
      this.cb.onMeasure?.({
        type: '距离', value: `${d.toFixed(2)} m`,
        detail: `Δx ${Math.abs(a.x - b.x).toFixed(2)} m · Δz ${Math.abs(a.z - b.z).toFixed(2)} m`,
      })
    }
  }

  private finishMeasure() {
    if (this.points.length >= 3) {
      let area = 0
      for (let i = 0; i < this.points.length; i++) {
        const p1 = this.points[i]
        const p2 = this.points[(i + 1) % this.points.length]
        area += p1.x * p2.z - p2.x * p1.z
      }
      area = Math.abs(area / 2)
      const ys = this.points.map((p) => p.y)
      const height = Math.max(...ys) - Math.min(...ys)
      this.cb.onMeasure?.({ type: '面积', value: `${area.toFixed(1)} m²`, detail: `投影面积 · 高差 ${height.toFixed(2)} m` })
    }
    this.points = []
    this.drawMeasure()
  }

  clearMeasure() {
    this.points = []
    while (this.measureGroup.children.length) {
      const c = this.measureGroup.children.pop() as THREE.Object3D
      this.measureGroup.remove(c)
    }
  }

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = this.clock.getDelta()

    if (this.fly) {
      const t = Math.min(1, (performance.now() - this.fly.start) / 1100)
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      this.camera.position.lerpVectors(this.fly.from, this.fly.to, e)
      this.controls.target.lerpVectors(this.fly.tFrom, this.fly.tTo, e)
      if (t >= 1) this.fly = undefined
      this.controls.update()
    } else if (this.tool === 'walk') {
      const speed = 90 * dt
      const dir = new THREE.Vector3()
      this.camera.getWorldDirection(dir)
      const flat = new THREE.Vector3(dir.x, 0, dir.z).normalize()
      const right = new THREE.Vector3().crossVectors(flat, new THREE.Vector3(0, 1, 0))
      if (this.keys.has('w')) this.camera.position.addScaledVector(flat, speed)
      if (this.keys.has('s')) this.camera.position.addScaledVector(flat, -speed)
      if (this.keys.has('a')) this.camera.position.addScaledVector(right, -speed)
      if (this.keys.has('d')) this.camera.position.addScaledVector(right, speed)
      this.camera.position.y = 1.75
      this.controls.target.copy(this.camera.position).add(flat)
    } else {
      this.controls.update()
    }

    this.renderer.render(this.scene, this.camera)

    this.frames++
    this.fpsTime += dt
    if (this.fpsTime >= 1) {
      const info = this.renderer.info
      this.cb.onStats?.({
        fps: Math.round(this.frames / this.fpsTime),
        triangles: info.render.triangles,
        calls: info.render.calls,
      })
      this.frames = 0
      this.fpsTime = 0
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onPointerDown)
    el.removeEventListener('pointermove', this.onPointerMove)
    el.removeEventListener('dblclick', this.onDblClick)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('keydown', this.onKey)
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
      const mat = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
      else mat?.dispose()
    })
    this.renderer.dispose()
    if (el.parentElement === this.container) this.container.removeChild(el)
  }

  getStats() {
    const info = this.renderer.info
    return { calls: info.render.calls, triangles: info.render.triangles }
  }
}
