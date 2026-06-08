import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { scenarios } from '@/data/bubbleData'
import type { Scenario } from '@/data/bubbleData'

export default function ScenarioPreview() {
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
            }, index * 150)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -15% 0px' }
    )

    const cards = sectionRef.current?.querySelectorAll('.scenario-card')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="w-full py-20 md:py-24 relative">
      {/* Background tint */}
      <div className="absolute inset-0 bg-primary-blue/10" />

      <div ref={sectionRef} className="max-w-[1200px] mx-auto px-4 md:px-6 relative z-10">
        {/* Title */}
        <div className="mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-3">
            情景预测
          </h2>
          <p className="font-body text-base text-text-secondary max-w-2xl">
            基于多维度模型推演，AI泡沫可能走向的四种路径。
          </p>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              index={index}
              isVisible={visibleCards.has(index)}
            />
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/scenarios')}
            className="font-mono-data text-sm text-cyan-accent hover:text-cyan-accent/80 transition-colors nav-link-indicator"
          >
            查看完整情景分析 &rarr;
          </button>
        </div>
      </div>
    </section>
  )
}

interface ScenarioCardProps {
  scenario: Scenario
  index: number
  isVisible: boolean
}

function ScenarioCard({ scenario, index, isVisible }: ScenarioCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      data-index={index}
      className="scenario-card relative rounded-xl overflow-hidden cursor-pointer transition-all duration-500"
      style={{
        background: 'rgba(11, 17, 32, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? isHovered ? 'translateY(-4px) scale(1)' : 'translateY(0) scale(1)'
          : 'scale(0.8)',
        boxShadow: isHovered
          ? '0px 12px 40px rgba(0, 0, 0, 0.5)'
          : '0px 4px 16px rgba(0, 0, 0, 0.3)',
        transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s, transform 0.3s ease`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top color bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: scenario.color }}
      />

      <div className="p-6">
        {/* Scenario name */}
        <h3 className="font-body text-lg font-semibold text-text-primary mb-1">
          {scenario.name}
        </h3>
        <p className="font-mono-data text-xs text-text-secondary/60 mb-4">
          {scenario.nameEn}
        </p>

        {/* Probability */}
        <div className="mb-4">
          <MotionProbability
            probability={scenario.probability}
            color={scenario.color}
            isHovered={isHovered}
          />
        </div>

        {/* Description */}
        <p className="font-body text-sm text-text-secondary mb-3">
          {scenario.description}
        </p>

        {/* Time window */}
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary/40">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="font-mono-data text-xs text-text-secondary/60">
            时间窗口: {scenario.timeWindow}
          </span>
        </div>
      </div>
    </div>
  )
}

function MotionProbability({
  probability,
  color,
  isHovered,
}: {
  probability: number
  color: string
  isHovered: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="font-display text-4xl font-bold transition-transform duration-400"
        style={{
          color,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {probability}%
      </span>
      <span className="font-mono-data text-xs text-text-secondary/50">
        概率
      </span>
    </div>
  )
}
