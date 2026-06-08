import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { dimensions, riskLevelColors } from '@/data/bubbleData'
import type { Dimension } from '@/data/bubbleData'

export default function DimensionGrid() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setTimeout(() => {
              setVisibleCards((prev) => new Set(prev).add(index))
            }, index * 100)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -20% 0px' }
    )

    const cards = sectionRef.current?.querySelectorAll('.dimension-card')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="w-full py-20 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Title */}
        <div className="mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-3">
            八维度风险扫描
          </h2>
          <p className="font-body text-base text-text-secondary max-w-2xl">
            从估值、资金流向、技术基础设施等八个维度，全方位量化AI泡沫风险。
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dim, index) => (
            <DimensionCard
              key={dim.id}
              dim={dim}
              index={index}
              isVisible={visibleCards.has(index)}
              onClick={() => navigate('/index-detail')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface DimensionCardProps {
  dim: Dimension
  index: number
  isVisible: boolean
  onClick: () => void
}

function DimensionCard({ dim, index, isVisible, onClick }: DimensionCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const colors = riskLevelColors[dim.riskLevel]

  return (
    <div
      data-index={index}
      className="dimension-card glass-card glass-card-hover rounded-xl p-6 cursor-pointer transition-all duration-800"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-body text-lg font-semibold text-text-primary">
            {dim.name}
          </h3>
          <p className="font-mono-data text-xs text-text-secondary/60">
            {dim.nameEn}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
          style={{
            borderColor: `${colors.border}40`,
            backgroundColor: `${colors.bg}15`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse-dot"
            style={{ backgroundColor: colors.text }}
          />
          <span
            className="font-mono-data text-xs font-semibold"
            style={{ color: colors.text }}
          >
            {dim.riskLabel} {dim.score}
          </span>
        </div>
      </div>

      {/* Key Metric */}
      <p className="font-body text-sm text-text-secondary mb-4">
        {dim.keyMetric}
      </p>

      {/* Progress Bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: isHovered ? `${dim.score}%` : '0%',
            background: `linear-gradient(90deg, ${colors.bg}80, ${colors.bg})`,
            transitionDelay: isHovered ? '0s' : '0s',
          }}
        />
      </div>

      {/* Weight badge */}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono-data text-[10px] text-text-secondary/40">
          权重 {(dim.weight * 100).toFixed(0)}%
        </span>
        <span className="font-mono-data text-[10px] text-text-secondary/40">
          {dim.score}/100
        </span>
      </div>
    </div>
  )
}
