import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BUBBLE_COUNT = 60

function Bubbles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  const bubbleData = useMemo(() => {
    return Array.from({ length: BUBBLE_COUNT }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8 - 2
      ),
      speed: 0.1 + Math.random() * 0.3,
      wobbleSpeed: 0.5 + Math.random() * 1.5,
      wobbleAmount: 0.02 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      scale: 0.03 + Math.random() * 0.12,
      colorType: Math.random(),
    }))
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    bubbleData.forEach((bubble, i) => {
      const wobbleX = Math.sin(t * bubble.wobbleSpeed + bubble.phase) * bubble.wobbleAmount
      const wobbleY = Math.cos(t * bubble.wobbleSpeed * 0.7 + bubble.phase) * bubble.wobbleAmount

      dummy.position.set(
        bubble.position.x + wobbleX + mouseRef.current.x * 0.3,
        bubble.position.y + Math.sin(t * bubble.speed + bubble.phase) * 0.3 + wobbleY + mouseRef.current.y * 0.3,
        bubble.position.z
      )
      dummy.scale.setScalar(bubble.scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Handle mouse movement
  useMemo(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BUBBLE_COUNT]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial
        color="#F59E0B"
        transparent
        opacity={0.12}
        roughness={0.1}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </instancedMesh>
  )
}

function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const particleData = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.005
    pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.002) * 0.1
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particleData, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#06B6D4"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

export default function BubbleBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#0B1120' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#06B6D4" />
        <pointLight position={[-5, -3, 3]} intensity={0.3} color="#F59E0B" />
        <Bubbles />
        <FloatingParticles />
      </Canvas>
    </div>
  )
}
