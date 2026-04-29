import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 80

function Particles() {
  const meshRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities: Array<[number, number, number]> = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3
      velocities.push([
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.004,
        0,
      ])
    }
    return { positions, velocities }
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] += velocities[i][0]
      pos[i * 3 + 1] += velocities[i][1]
      // wrap around
      if (pos[i * 3] > 6) pos[i * 3] = -6
      if (pos[i * 3] < -6) pos[i * 3] = 6
      if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4
      if (pos[i * 3 + 1] < -4) pos[i * 3 + 1] = 4
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  const colors = useMemo(() => {
    const c = new Float32Array(PARTICLE_COUNT * 3)
    const orange = new THREE.Color('#FF5500')
    const amber = new THREE.Color('#FFAA3B')
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = Math.random() > 0.4 ? orange : amber
      c[i * 3] = color.r
      c[i * 3 + 1] = color.g
      c[i * 3 + 2] = color.b
    }
    return c
  }, [])

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  )
}

export default function HeroCanvas() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
    }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <Particles />
      </Canvas>
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--hero-gradient)',
      }} />
    </div>
  )
}
