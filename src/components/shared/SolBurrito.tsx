import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
    progress?: number
    size?: number
    message?: string
    showBar?: boolean
    timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night' | 'auto'
}

// Color palettes by time of day
const TIME_PALETTES = {
    dawn: { core: [1.0, 0.55, 0.20], ray: [1.0, 0.35, 0.10], aura: [0xff4400, 0xff6600, 0xff9900], bg: 0x1a0a05 },
    morning: { core: [1.0, 0.75, 0.10], ray: [1.0, 0.50, 0.00], aura: [0xff5500, 0xff7700, 0xffaa00], bg: 0x080705 },
    noon: { core: [1.0, 0.92, 0.20], ray: [1.0, 0.80, 0.00], aura: [0xffcc00, 0xffdd44, 0xffee88], bg: 0x050503 },
    afternoon: { core: [1.0, 0.65, 0.05], ray: [1.0, 0.40, 0.00], aura: [0xff6600, 0xff8800, 0xffbb00], bg: 0x080705 },
    dusk: { core: [1.0, 0.35, 0.10], ray: [0.95, 0.20, 0.05], aura: [0xff2200, 0xff4400, 0xff7700], bg: 0x120508 },
    night: { core: [0.50, 0.30, 0.80], ray: [0.35, 0.20, 0.70], aura: [0x4400ff, 0x6600cc, 0x9933ff], bg: 0x02010a },
}

function getAutoTimeOfDay(): keyof typeof TIME_PALETTES {
    const h = new Date().getHours()
    if (h >= 5 && h < 8) return 'dawn'
    if (h >= 8 && h < 12) return 'morning'
    if (h >= 12 && h < 15) return 'noon'
    if (h >= 15 && h < 18) return 'afternoon'
    if (h >= 18 && h < 21) return 'dusk'
    return 'night'
}

export default function SolBurrito({
    progress = 0,
    size = 220,
    message,
    showBar = true,
    timeOfDay = 'auto',
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const progressRef = useRef(progress)

    useEffect(() => { progressRef.current = progress }, [progress])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const tod = timeOfDay === 'auto' ? getAutoTimeOfDay() : timeOfDay
        const pal = TIME_PALETTES[tod]

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
        renderer.setSize(size, size)
        renderer.setClearColor(pal.bg, 1)
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
        camera.position.set(0, 0, 5.2)
        camera.lookAt(0, 0, 0)

        scene.add(new THREE.AmbientLight(0xfff0cc, 0.5))
        const l1 = new THREE.DirectionalLight(0xff6600, 2.0); l1.position.set(3, 4, 5); scene.add(l1)
        const l2 = new THREE.DirectionalLight(0xffaa00, 0.8); l2.position.set(-3, -2, 3); scene.add(l2)
        const l3 = new THREE.DirectionalLight(0xffffff, 0.4); l3.position.set(0, 0, -5); scene.add(l3)

        const VS = 0.20, R = 0.82
        const group = new THREE.Group()
        scene.add(group)

        const mkBox = (x: number, y: number, z: number, w: number, h: number, d: number, r: number, g: number, b: number) => {
            const m = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshPhongMaterial({ color: new THREE.Color(r, g, b), shininess: 60, transparent: true, opacity: 0 })
            )
            m.position.set(x, y, z)
            m.scale.set(0.01, 0.01, 0.01)
            return m
        }

        // Core voxels — spiral sort
        const coreVoxels: any[] = []
        for (let xi = -5; xi <= 5; xi++) for (let yi = -5; yi <= 5; yi++) for (let zi = -4; zi <= 4; zi++) {
            const x = xi * VS, y = yi * VS, z = zi * VS
            const dist = Math.sqrt(x * x + y * y + z * z)
            if (dist < R + VS * 0.4) {
                const t = Math.min(dist / R, 1)
                const angle = Math.atan2(y, x)
                const [cr, cg, cb] = pal.core
                coreVoxels.push({
                    x, y, z,
                    r: cr, g: cg - t * 0.45, b: cb,
                    w: VS - 0.02, h: VS - 0.02, d: VS - 0.02,
                    sort: dist + angle * 0.3
                })
            }
        }
        coreVoxels.sort((a, b) => a.sort - b.sort)

        // Rays
        const rayVoxels: any[] = []
            ;[0, 45, 90, 135, 180, 225, 270, 315].forEach((deg, di) => {
                const a = deg * Math.PI / 180
                for (let s = 0; s < 3; s++) {
                    const dist2 = 0.95 + s * 0.28, sz = 0.16 - s * 0.04
                    const [rr, rg, rb] = pal.ray
                    rayVoxels.push({
                        x: Math.cos(a) * dist2, y: Math.sin(a) * dist2, z: 0,
                        r: rr, g: rg - s * 0.08, b: rb,
                        w: sz, h: sz, d: sz * 0.6,
                        sort: 10 + di * 0.1 + s * 0.3
                    })
                }
            })

        const allVoxels = [...coreVoxels, ...rayVoxels]
        const total = allVoxels.length

        // Face on FRONT and BACK
        const faceOffset = 0.86
        const faceDefs = [
            // Front face (z = +faceOffset)
            [0.20, 0.20, faceOffset, 0.10, 0.10, 0.06, 0.10, 0.06, 0.01],
            [-0.20, 0.20, faceOffset, 0.10, 0.10, 0.06, 0.10, 0.06, 0.01],
            [0.22, 0.22, faceOffset + 0.03, 0.04, 0.04, 0.03, 0.98, 0.97, 0.96],
            [-0.17, 0.22, faceOffset + 0.03, 0.04, 0.04, 0.03, 0.98, 0.97, 0.96],
            [0, -0.13, faceOffset, 0.26, 0.06, 0.05, 0.10, 0.06, 0.01],
            [-0.11, -0.21, faceOffset, 0.06, 0.07, 0.05, 0.10, 0.06, 0.01],
            [0.11, -0.21, faceOffset, 0.06, 0.07, 0.05, 0.10, 0.06, 0.01],
            [0.46, 0.04, faceOffset - 0.10, 0.12, 0.06, 0.05, 1.0, 0.33, 0.0],
            [-0.46, 0.04, faceOffset - 0.10, 0.12, 0.06, 0.05, 1.0, 0.33, 0.0],
            // Back face (z = -faceOffset, mirrored X for cheeks/mouth to look correct from back)
            [-0.20, 0.20, -faceOffset, 0.10, 0.10, 0.06, 0.10, 0.06, 0.01],
            [0.20, 0.20, -faceOffset, 0.10, 0.10, 0.06, 0.10, 0.06, 0.01],
            [-0.22, 0.22, -(faceOffset + 0.03), 0.04, 0.04, 0.03, 0.98, 0.97, 0.96],
            [0.17, 0.22, -(faceOffset + 0.03), 0.04, 0.04, 0.03, 0.98, 0.97, 0.96],
            [0, -0.13, -faceOffset, 0.26, 0.06, 0.05, 0.10, 0.06, 0.01],
            [0.11, -0.21, -faceOffset, 0.06, 0.07, 0.05, 0.10, 0.06, 0.01],
            [-0.11, -0.21, -faceOffset, 0.06, 0.07, 0.05, 0.10, 0.06, 0.01],
            [-0.46, 0.04, -(faceOffset - 0.10), 0.12, 0.06, 0.05, 1.0, 0.33, 0.0],
            [0.46, 0.04, -(faceOffset - 0.10), 0.12, 0.06, 0.05, 1.0, 0.33, 0.0],
        ]

        const faceMeshes = faceDefs.map(([x, y, z, w, h, d, r, g, b]) => {
            const m = mkBox(x, y, z, w, h, d, r, g, b)
            group.add(m)
            return { mesh: m, born: null as number | null }
        })

        // Auras
        const auras = [1.3, 1.55, 1.8].map((r, i) => {
            const m = new THREE.Mesh(
                new THREE.TorusGeometry(r, 0.04, 8, 48),
                new THREE.MeshBasicMaterial({ color: pal.aura[i], transparent: true, opacity: 0 })
            )
            scene.add(m)
            return m
        })

        let spawned = 0
        let animT = 0
        let raf: number
        const spawnedMeshes: { mesh: THREE.Mesh; born: number }[] = []

        const popIn = (m: THREE.Mesh, age: number) => {
            const t = Math.min(age / 0.35, 1)
            const e = 1 - (1 - t) * (1 - t)
            m.scale.set(e || 0.01, e || 0.01, e || 0.01)
                ; (m.material as THREE.MeshPhongMaterial).opacity = e
        }

        const loop = () => {
            raf = requestAnimationFrame(loop)
            animT += 0.012

            const prog = Math.min(progressRef.current / 100, 1)
            const target = Math.floor(prog * total)

            while (spawned < target && spawned < total) {
                const v = allVoxels[spawned]
                const mesh = mkBox(v.x, v.y, v.z, v.w, v.h, v.d, v.r, v.g, v.b)
                group.add(mesh)
                spawnedMeshes.push({ mesh, born: animT })
                spawned++
            }

            spawnedMeshes.forEach(({ mesh, born }) => popIn(mesh, animT - born))

            if (prog > 0.88) {
                faceMeshes.forEach(f => {
                    if (f.born === null) f.born = animT
                    popIn(f.mesh, animT - f.born)
                })
            }

            group.rotation.y = animT * 0.5
            group.rotation.z = animT * 0.1
            const bob = Math.sin(animT * 1.1) * 0.06
            group.position.y = bob

            auras.forEach((a, i) => {
                const mat = a.material as THREE.MeshBasicMaterial
                const tgt = Math.max(0, (prog - 0.3) / 0.7) * (0.45 - i * 0.12)
                mat.opacity += (tgt - mat.opacity) * 0.05
                a.rotation.z = animT * (0.25 - i * 0.07)
                a.position.y = bob * 0.4
            })

            renderer.render(scene, camera)
        }

        loop()

        return () => {
            cancelAnimationFrame(raf)
            renderer.dispose()
        }
    }, [size, timeOfDay])

    const pct = Math.round(Math.min(progress, 100))
    const tod = timeOfDay === 'auto' ? getAutoTimeOfDay() : timeOfDay
    const barColor = {
        dawn: 'linear-gradient(90deg,#ff4400,#ff9900)',
        morning: 'linear-gradient(90deg,#ff5500,#ffaa00)',
        noon: 'linear-gradient(90deg,#ffcc00,#ffee88)',
        afternoon: 'linear-gradient(90deg,#ff6600,#ffbb00)',
        dusk: 'linear-gradient(90deg,#ff2200,#ff7700)',
        night: 'linear-gradient(90deg,#4400ff,#9933ff)',
    }[tod]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: '16px' }} />
            {showBar && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: size }}>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,85,0,0.15)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '100px', transition: 'width 0.15s linear' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ff8800', letterSpacing: '2px' }}>
                        {pct}%
                    </div>
                    {message && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'rgba(255,136,0,0.6)', letterSpacing: '1px', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}