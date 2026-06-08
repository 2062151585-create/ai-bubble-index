import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { currentIndex, lastUpdate, getRiskLevel } from '@/data/bubbleData'
import BubbleBackground from './BubbleBackground'

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-300, 300], [5, -5])
  const rotateY = useTransform(mouseX, [-500, 500], [-5, 5])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      {/* Three.js Background Layer (z-0) */}
      <BubbleBackground />

      {/* 3D Parallax Layer (z-10) */}
      <ParallaxDecorations />

      {/* Central Gauge Card (z-20) */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          zIndex: 20,
        }}
        className="relative perspective-1000"
      >
        <IndexGaugeCard />
      </motion.div>
    </section>
  )
}

function ParallaxDecorations() {
  const warningRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      if (warningRef.current) {
        warningRef.current.style.transform = `translate(${-x * 15}px, ${-y * 15}px)`
      }
      if (chartRef.current) {
        chartRef.current.style.transform = `translate(${-x * 25}px, ${-y * 25}px)`
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      {/* Warning symbol - top left */}
      <div
        ref={warningRef}
        className="absolute top-[15%] left-[10%] pointer-events-none select-none transition-transform duration-300 ease-out"
        style={{ zIndex: 10 }}
      >
        <svg width="200" height="200" viewBox="0 0 24 24" fill="none" opacity="0.05">
          <path
            d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14zm-1 8h2v2h-2v-2zm0-4h2v3h-2v-3z"
            fill="#F59E0B"
          />
        </svg>
      </div>

      {/* Chart outline - bottom right */}
      <div
        ref={chartRef}
        className="absolute bottom-[10%] right-[5%] pointer-events-none select-none transition-transform duration-300 ease-out"
        style={{ zIndex: 10 }}
      >
        <svg width="400" height="200" viewBox="0 0 400 200" fill="none" opacity="0.08">
          <path
            d="M0 180 C50 170, 80 160, 100 140 C120 120, 130 100, 150 80 C170 60, 200 50, 220 40 C240 30, 260 20, 280 30 C300 40, 310 60, 320 80 C330 100, 340 130, 350 150 C360 170, 380 190, 400 200"
            stroke="#06B6D4"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0 180 C50 170, 80 160, 100 140 C120 120, 130 100, 150 80 C170 60, 200 50, 220 40 C240 30, 260 20, 280 30 C300 40, 310 60, 320 80 C330 100, 340 130, 350 150 C360 170, 380 190, 400 200 L400 200 L0 200 Z"
            fill="url(#chartGradient)"
          />
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </>
  )
}

function IndexGaugeCard() {
  const [displayValue, setDisplayValue] = useState(0)
  const [showBadge, setShowBadge] = useState(false)
  const currentRisk = getRiskLevel(currentIndex)

  useEffect(() => {
    const duration = 2000
    const startTime = performance.now()
    const startValue = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // power3.out easing
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (currentIndex - startValue) * eased
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setTimeout(() => setShowBadge(true), 200)
      }
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(animate)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="glass-hero-card rounded-2xl px-8 py-10 md:px-16 md:py-14 w-[340px] md:w-[480px] flex flex-col items-center">
      {/* Caption label */}
      <p className="font-mono-data text-xs text-text-secondary uppercase tracking-[0.05em] mb-4">
        综合AI泡沫预警指数 (AI-BWI)
      </p>

      {/* Giant Index Number */}
      <div className="relative">
        <span
          className="font-display text-[80px] md:text-[120px] font-bold leading-none text-glow-amber"
          style={{ color: '#F59E0B' }}
        >
          {displayValue.toFixed(1)}
        </span>
        <span className="absolute -right-4 md:-right-8 top-2 font-display text-xl md:text-2xl font-semibold text-text-secondary">
          /100
        </span>
      </div>

      {/* Risk Badge */}
      <div
        className="mt-6 transition-all duration-600"
        style={{
          opacity: showBadge ? 1 : 0,
          transform: showBadge ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-alert-red/10 border border-alert-red/30">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse-dot"
            style={{ backgroundColor: currentRisk.color }}
          />
          <span className="font-body text-sm font-semibold" style={{ color: currentRisk.color }}>
            {currentRisk.label}等级 {currentIndex}
          </span>
        </div>
      </div>

      {/* Last Update */}
      <p className="mt-4 font-mono-data text-xs text-text-secondary/60">
        最后更新: {lastUpdate}
      </p>
    </div>
  )
}
