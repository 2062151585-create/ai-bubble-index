import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { currentIndex, currentAdvisory, riskLevelColors } from '@/data/bubbleData'
import { getRiskLevel } from '@/data/bubbleData'

export default function AdvisoryCTA() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()
  const currentRisk = getRiskLevel(currentIndex)
  const colors = riskLevelColors[currentRisk.level]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="w-full py-20 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Title */}
        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-3">
            当前风险等级:{' '}
            <span style={{ color: colors.text }}>
              {currentRisk.label} ({currentIndex})
            </span>
          </h2>
          <p className="font-body text-base text-text-secondary">
            基于当前指数水平，系统生成的投资策略建议。
          </p>
        </div>

        {/* Advisory Card */}
        <div
          className="glass-card rounded-2xl p-8 md:p-10 transition-all duration-1000"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(60px)',
            borderColor: `${colors.border}50`,
            boxShadow: `0px 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px ${colors.glow}30`,
            animation: isVisible ? 'breathe-border 3s ease-in-out infinite' : 'none',
          }}
        >
          {/* Warning Icon + Title */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.bg}20` }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="font-mono-data text-xs text-text-secondary/60 uppercase tracking-wider mb-1">
                指数处于 {currentRisk.min}-{currentRisk.max} {currentRisk.label}区间
              </p>
              <h3 className="font-body text-xl md:text-2xl font-semibold text-text-primary">
                建议: {currentAdvisory.title}
              </h3>
            </div>
          </div>

          {/* Action Items */}
          <ul className="space-y-3 mb-8">
            {currentAdvisory.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: `${colors.bg}20` }}
                >
                  <span
                    className="font-mono-data text-xs font-bold"
                    style={{ color: colors.text }}
                  >
                    {i + 1}
                  </span>
                </span>
                <span className="font-body text-sm md:text-base text-text-secondary">
                  {action}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/advisory')}
            className="w-full py-4 px-6 rounded-xl font-body text-base font-semibold transition-all duration-300 hover:brightness-110"
            style={{
              backgroundColor: '#F59E0B',
              color: '#0B1120',
            }}
          >
            查看完整投资策略 &rarr;
          </button>
        </div>
      </div>
    </section>
  )
}
