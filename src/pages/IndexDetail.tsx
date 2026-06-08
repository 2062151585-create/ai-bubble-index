import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { currentIndex, riskLevelColors } from '@/data/bubbleData'
import RadarChartSection from '@/components/index-detail/RadarChartSection'
import DimensionAccordion from '@/components/index-detail/DimensionAccordion'
import CrossDimensionInsights from '@/components/index-detail/CrossDimensionInsights'
import CompanyValuationTable from '@/components/index-detail/CompanyValuationTable'

// Get current risk level for index
function getCurrentRiskLevel(score: number) {
  if (score <= 40) return { label: '安全', color: '#14B8A6', level: 'safe' as const }
  if (score <= 55) return { label: '注意', color: '#3B82F6', level: 'caution' as const }
  if (score <= 70) return { label: '警戒', color: '#F59E0B', level: 'warning' as const }
  if (score <= 80) return { label: '高风险', color: '#EF4444', level: 'alert' as const }
  return { label: '极高风险', color: '#7F1D1D', level: 'extreme' as const }
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1500, delay: number = 300) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const startAnimation = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current - delay

      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(startAnimation)
        return
      }

      const progress = Math.min(elapsed / duration, 1)
      // power3.out easing approximation
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(parseFloat((eased * target).toFixed(1)))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(startAnimation)
      }
    }

    rafRef.current = requestAnimationFrame(startAnimation)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay])

  return value
}

// Page Hero Section
function PageHero() {
  const risk = getCurrentRiskLevel(currentIndex)
  const animatedScore = useAnimatedCounter(currentIndex, 1500, 400)
  const colors = riskLevelColors[risk.level]

  return (
    <section
      className="relative w-full pt-16 flex items-center"
      style={{
        minHeight: 'max(40vh, 360px)',
        background: '#0B1120',
      }}
    >
      {/* Subtle radial gradient at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center bottom, rgba(21, 30, 50, 0.8) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-[1200px] mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Left: Title block */}
          <motion.div
            className="md:w-[60%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb */}
            <motion.div
              className="flex items-center gap-2 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Link
                to="/"
                className="font-mono-data text-xs text-text-secondary hover:text-cyan-accent transition-colors duration-200"
              >
                首页
              </Link>
              <span className="text-text-secondary/40">/</span>
              <span className="font-mono-data text-xs text-text-secondary">
                指数详情
              </span>
            </motion.div>

            {/* H1 Title */}
            <motion.h1
              className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-3"
              style={{ letterSpacing: '-0.01em', lineHeight: 1.1 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              AI泡沫预警指数详情
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base text-text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              八大维度加权计算 · 每日自动更新
            </motion.p>
          </motion.div>

          {/* Right: Score block */}
          <motion.div
            className="md:w-[40%] flex flex-col items-start md:items-end"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {/* Label */}
            <span className="font-mono-data text-[11px] text-text-secondary uppercase tracking-wider mb-1">
              综合指数
            </span>

            {/* Big Score */}
            <motion.span
              className="font-display text-7xl md:text-[80px] font-bold text-glow-amber"
              style={{
                color: '#F59E0B',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {animatedScore.toFixed(1)}
            </motion.span>

            {/* Risk Badge */}
            <div className="flex items-center gap-2 mt-3 mb-3">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: colors.text,
                  boxShadow: `0 0 10px ${colors.glow}`,
                }}
              />
              <span
                className="font-mono-data text-sm font-medium"
                style={{ color: colors.text }}
              >
                {risk.label}等级
              </span>
            </div>

            {/* Formula */}
            <span className="font-mono-data text-[11px] text-text-secondary">
              加权计算公式: Σ(维度评分 × 权重)
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Main Page Component
export default function IndexDetail() {
  return (
    <div className="min-h-[100dvh] bg-deep-navy">
      {/* 1. Page Hero */}
      <PageHero />

      {/* 2. Radar Chart */}
      <RadarChartSection />

      {/* 3. Dimension Accordion */}
      <DimensionAccordion />

      {/* 4. Cross-Dimensional Insights */}
      <CrossDimensionInsights />

      {/* 5. Company Valuation Table */}
      <CompanyValuationTable />
    </div>
  )
}
