import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Link } from 'react-router'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'

// ─── Data ───────────────────────────────────────────────────────────────

interface ScenarioData {
  id: string
  name: string
  nameEn: string
  subtitle: string
  description: string
  probability: number
  color: string
  glowColor: string
  timeWindow: string
  marketImpact: { label: string; value: string }[]
  assetPerformance: { asset: string; value: number }[]
  keyPoints: string[]
}

const scenarios: ScenarioData[] = [
  {
    id: 'pessimistic',
    name: '泡沫破裂',
    nameEn: 'Bubble Burst',
    subtitle: '技术商业化不及预期 + 宏观紧缩',
    description:
      'AI投入产出比持续恶化，企业大规模削减AI capex。美联储维持高利率，流动性枯竭触发估值重估。散户恐慌性抛售，被动投资放大下跌。',
    probability: 45,
    color: '#7F1D1D',
    glowColor: 'rgba(127,29,29,0.6)',
    timeWindow: '2026H2 — 2027',
    marketImpact: [
      { label: '标普500回调', value: '20-30%' },
      { label: '纳斯达克回调', value: '40-60%' },
      { label: 'AI龙头平均跌幅', value: '50-70%' },
    ],
    assetPerformance: [
      { asset: '标普500', value: -25 },
      { asset: '纳斯达克', value: -50 },
      { asset: 'AI龙头', value: -60 },
      { asset: '黄金', value: 15 },
      { asset: '国债', value: 8 },
      { asset: 'VIX', value: 200 },
    ],
    keyPoints: [
      '科技成长股遭受最严厉打击',
      '避险资产获得显著资金流入',
      'VIX飙升至40+水平',
      '价值股相对抗跌',
    ],
  },
  {
    id: 'baseline',
    name: '软着陆',
    nameEn: 'Soft Landing',
    subtitle: '技术渐进进步 + 宏观温和调整',
    description:
      'AI技术稳步推进但无突破性进展，企业理性调整投资策略。美联储有序降息，市场经历温和回调后进入震荡整理期。',
    probability: 25,
    color: '#F59E0B',
    glowColor: 'rgba(245,158,11,0.6)',
    timeWindow: '6-18个月',
    marketImpact: [
      { label: '标普500回调', value: '10-15%' },
      { label: '纳斯达克回调', value: '20-30%' },
      { label: 'AI龙头平均跌幅', value: '25-35%' },
    ],
    assetPerformance: [
      { asset: '标普500', value: -12 },
      { asset: '纳斯达克', value: -25 },
      { asset: 'AI龙头', value: -30 },
      { asset: '黄金', value: 8 },
      { asset: '国债', value: 5 },
      { asset: 'VIX', value: 80 },
    ],
    keyPoints: [
      '温和回调后进入震荡',
      'AI龙头分化加剧',
      '防御性板块跑赢',
      '债券收益率曲线正常化',
    ],
  },
  {
    id: 'optimistic',
    name: '生产率革命',
    nameEn: 'Productivity Revolution',
    subtitle: '技术突破 + 宏观宽松',
    description:
      'AGI或超级智能实现重大突破，全要素生产率跃升。AI应用层全面爆发，企业ROI转正，估值被盈利增长消化。',
    probability: 15,
    color: '#14B8A6',
    glowColor: 'rgba(20,184,166,0.6)',
    timeWindow: '18-36个月',
    marketImpact: [
      { label: '标普500涨幅', value: '20-30%' },
      { label: '纳斯达克涨幅', value: '30-50%' },
      { label: 'AI龙头平均涨幅', value: '40-80%' },
    ],
    assetPerformance: [
      { asset: '标普500', value: 25 },
      { asset: '纳斯达克', value: 40 },
      { asset: 'AI龙头', value: 60 },
      { asset: '黄金', value: -5 },
      { asset: '国债', value: -3 },
      { asset: 'VIX', value: -30 },
    ],
    keyPoints: [
      'AI应用层公司领涨',
      '风险偏好全面提升',
      '利率预期重新定价',
      '小型AI公司迎来估值修复',
    ],
  },
  {
    id: 'extreme',
    name: '系统性危机',
    nameEn: 'Systemic Crisis',
    subtitle: '黑天鹅事件 + 全球连锁反应',
    description:
      '地缘冲突升级、台海危机或重大AI安全事故触发全球风险资产抛售。信用紧缩与流动性危机共振，形成2008年级别的系统性冲击。',
    probability: 15,
    color: '#EF4444',
    glowColor: 'rgba(239,68,68,0.6)',
    timeWindow: '0-12个月',
    marketImpact: [
      { label: '标普500跌幅', value: '40%+' },
      { label: '纳斯达克跌幅', value: '60%+' },
      { label: 'VIX峰值', value: '>60' },
    ],
    assetPerformance: [
      { asset: '标普500', value: -45 },
      { asset: '纳斯达克', value: -65 },
      { asset: 'AI龙头', value: -75 },
      { asset: '黄金', value: 25 },
      { asset: '国债', value: 12 },
      { asset: 'VIX', value: 400 },
    ],
    keyPoints: [
      '全资产类别无差别抛售',
      '黄金成为唯一避风港',
      '信用市场冻结',
      '央行紧急救市',
    ],
  },
]

const probabilityDistribution = [
  { name: '泡沫破裂', probability: 45, color: '#7F1D1D', id: 'pessimistic' },
  { name: '软着陆', probability: 25, color: '#F59E0B', id: 'baseline' },
  { name: '生产率革命', probability: 15, color: '#14B8A6', id: 'optimistic' },
  { name: '系统性危机', probability: 15, color: '#EF4444', id: 'extreme' },
]

const timeWindows = [
  {
    label: '最近窗口',
    months: 3,
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.1)',
    events: '美联储Q4利率决议 · AI Q3财报季',
    description: '接下来的财报季将是检验AI商业化进展的关键窗口',
  },
  {
    label: '中期窗口',
    months: 9,
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.1)',
    events: '2027年财政年度预算 · 美国大选后政策落地',
    description: '政府AI支出预算和贸易政策的明确化',
  },
  {
    label: '远期窗口',
    months: 18,
    color: '#14B8A6',
    bgColor: 'rgba(20,184,166,0.1)',
    events: 'AGI时间线验证 · 电力基础设施验收',
    description: '远期技术里程碑和物理约束的最终检验',
  },
]

const triggerConditions = [
  {
    id: 'pessimistic',
    label: '泡沫破裂',
    color: '#7F1D1D',
    conditions: ['Capex连续两季下滑', '核心PCE > 3.5%', '英伟达PE > 40x'],
  },
  {
    id: 'baseline',
    label: '软着陆',
    color: '#F59E0B',
    conditions: ['GDP增速 1.5-2.5%', 'CPI稳步回落至2.5%', 'AI收入占比稳步提升'],
  },
  {
    id: 'optimistic',
    label: '生产率革命',
    color: '#14B8A6',
    conditions: ['AGI评估突破阈值', '全要素生产率增长 > 3%', 'AI应用MAU > 10亿'],
  },
  {
    id: 'extreme',
    label: '系统性危机',
    color: '#EF4444',
    conditions: ['地缘冲突升级', '主要AI公司财报暴雷', '信用利差 > 500bp'],
  },
]

const tabOrder = ['pessimistic', 'baseline', 'optimistic', 'extreme']

// ─── Animation Variants ─────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
}

// ─── Sub-Components ─────────────────────────────────────────────────────

/* 1. Mini probability donut (SVG) for page header */
function ProbabilityDonut() {
  const size = 160
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const total = probabilityDistribution.reduce((s, d) => s + d.probability, 0)
  let offset = 0

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      {probabilityDistribution.map((seg, i) => {
        const segLen = (seg.probability / total) * circumference
        const segOffset = offset
        offset += segLen
        return (
          <motion.circle
            key={seg.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${segLen} ${circumference - segLen}`}
            strokeDashoffset={-segOffset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
          />
        )
      })}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono"
        fill="#F8FAFC"
        fontSize="20"
        fontWeight="500"
      >
        100%
      </text>
    </motion.svg>
  )
}

/* 2. Animated counter for probability numbers */
function AnimatedCounter({
  target,
  color,
  duration = 1.5,
}: {
  target: number
  color: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let startTime: number
    let animId: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      // power3.out easing approximation
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        animId = requestAnimationFrame(animate)
      }
    }
    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [isInView, target, duration])

  return (
    <span ref={ref} style={{ color }}>
      {count}
    </span>
  )
}

/* 3. Scenario card for the 4-quadrant matrix */
function ScenarioCard({
  scenario,
  index,
  highlighted,
  onHover,
  onLeave,
}: {
  scenario: ScenarioData
  index: number
  highlighted: boolean
  onHover: (id: string | null) => void
  onLeave: () => void
}) {
  const isMostLikely = scenario.probability === 45
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, x: index % 2 === 0 ? -20 : 20, y: index < 2 ? -20 : 20 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      onMouseEnter={() => onHover(scenario.id)}
      onMouseLeave={onLeave}
      className={cn(
        'glass-card rounded-xl overflow-hidden cursor-pointer transition-all duration-300',
        isMostLikely && 'ring-1',
        highlighted ? 'opacity-100' : 'opacity-100'
      )}
      style={{
        minHeight: 360,
        borderColor: isMostLikely ? scenario.color : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isMostLikely
          ? `0px 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px ${scenario.glowColor}`
          : undefined,
      }}
    >
      {/* Top status bar */}
      <div
        className="h-1 w-full transition-all duration-300 group-hover:h-2"
        style={{ backgroundColor: scenario.color }}
      />

      <div className="p-6 flex flex-col h-full" style={{ minHeight: 356 }}>
        {/* Probability number */}
        <div
          className="font-display text-[56px] font-bold leading-none mb-2"
          style={{ color: scenario.color, textShadow: `0 0 30px ${scenario.glowColor}` }}
        >
          <AnimatedCounter target={scenario.probability} color={scenario.color} />
          <span className="text-2xl ml-1">%</span>
        </div>

        {/* Scenario name */}
        <h3 className="font-display text-[28px] font-semibold text-[#F8FAFC] leading-tight mb-1">
          {scenario.name}
        </h3>
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">
          {scenario.nameEn}
        </p>

        {/* Subtitle */}
        <p className="text-xs text-[#94A3B8] mb-3 font-medium">{scenario.subtitle}</p>

        {/* Description */}
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-5 flex-1">
          {scenario.description}
        </p>

        {/* Market impact metrics */}
        <div className="space-y-2 mb-5">
          {scenario.marketImpact.map((mi) => (
            <div key={mi.label} className="flex justify-between items-center">
              <span className="font-mono text-sm text-[#94A3B8]">{mi.label}</span>
              <span className="font-mono text-sm font-medium" style={{ color: scenario.color }}>
                {mi.value}
              </span>
            </div>
          ))}
        </div>

        {/* Time window pill */}
        <div className="flex items-center justify-between">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${scenario.color}15`,
              border: `1px solid ${scenario.color}`,
              color: scenario.color,
            }}
          >
            {scenario.timeWindow}
          </span>
          {isMostLikely && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: scenario.color, color: '#fff' }}
            >
              最可能
            </span>
          )}
        </div>
      </div>

      {/* Bottom border glow */}
      <div
        className="h-[2px] w-full opacity-30"
        style={{ backgroundColor: scenario.color }}
      />
    </motion.div>
  )
}

/* 4. Time window card */
function TimeWindowCard({
  window,
  index,
}: {
  window: (typeof timeWindows)[number]
  index: number
}) {
  const circumference = 2 * Math.PI * 54
  const maxMonths = 24
  const progress = window.months / maxMonths
  const dashOffset = circumference * (1 - progress)

  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      className="glass-card rounded-xl p-6 flex flex-col items-center text-center"
      style={{ height: 280 }}
    >
      {/* Time label */}
      <span
        className="text-xs font-medium uppercase tracking-wider mb-4"
        style={{ color: window.color }}
      >
        {window.label}
      </span>

      {/* Circular countdown */}
      <div className="relative mb-4">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={window.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: dashOffset }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-mono text-[28px] font-medium text-[#F8FAFC]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <AnimatedCounter target={window.months} color="#F8FAFC" duration={2} />
          </motion.span>
          <span className="text-[10px] text-[#94A3B8] uppercase">个月</span>
        </div>
      </div>

      {/* Events */}
      <p className="text-sm text-[#F8FAFC] font-medium mb-2 leading-snug">{window.events}</p>

      {/* Description */}
      <p className="text-xs text-[#94A3B8] leading-relaxed">{window.description}</p>
    </motion.div>
  )
}

/* 5. Recharts tooltip */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="glass-card rounded-lg px-3 py-2 text-xs">
        <p className="text-[#F8FAFC] font-medium mb-1">{label}</p>
        <p
          className="font-mono font-semibold"
          style={{ color: val >= 0 ? '#14B8A6' : '#EF4444' }}
        >
          {val >= 0 ? '+' : ''}
          {val}%
        </p>
      </div>
    )
  }
  return null
}

/* ─── Main Page Component ──────────────────────────────────────────────── */

export default function Scenarios() {
  const [activeTab, setActiveTab] = useState('pessimistic')
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null)

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeTab)!,
    [activeTab]
  )

  // Handle card hover to highlight probability bar
  const handleCardHover = (id: string | null) => setHoveredScenario(id)
  const handleCardLeave = () => setHoveredScenario(null)

  // Header ref for scroll detection
  const headerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full min-h-[100dvh] pt-16">
      {/* ════════════════════════════════════════════════════
          1. Page Header
      ════════════════════════════════════════════════════ */}
      <section
        ref={headerRef}
        className="relative w-full overflow-hidden"
        style={{
          minHeight: 300,
          height: '35vh',
          backgroundColor: '#0B1120',
        }}
      >
        {/* Radial gradient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 600px 400px at 75% 50%, rgba(30, 58, 138, 0.25), transparent)',
          }}
        />

        <div className="relative max-w-[1200px] mx-auto px-4 md:px-6 h-full flex items-center">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-8">
            {/* Left side - Title */}
            <motion.div
              className="flex-1"
              style={{ maxWidth: '65%' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-4">
                <Link to="/" className="text-xs text-[#94A3B8] hover:text-[#06B6D4] transition-colors">
                  首页
                </Link>
                <span className="text-xs text-[#94A3B8]">/</span>
                <span className="text-xs text-[#94A3B8]">情景预测</span>
              </div>

              <h1 className="font-display text-3xl md:text-5xl font-bold text-[#F8FAFC] mb-4 tracking-tight">
                情景预测分析
              </h1>
              <p className="text-base text-[#94A3B8] leading-relaxed max-w-xl">
                基于多维度量化模型，推演AI泡沫未来四种可能路径及其概率分布
              </p>
            </motion.div>

            {/* Right side - Donut chart */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
            >
              <ProbabilityDonut />
              <p className="text-[11px] text-[#94A3B8] font-medium tracking-wider text-center">
                综合概率模型 · 2026.07更新
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          2. Four-Quadrant Scenario Matrix
      ════════════════════════════════════════════════════ */}
      <section className="w-full py-20" style={{ backgroundColor: '#151E32' }}>
        <div className="max-w-[1000px] mx-auto px-4 md:px-6">
          {/* Section title */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-2xl md:text-4xl font-semibold text-[#F8FAFC] mb-3">
              四象限情景矩阵
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium tracking-wider uppercase">
              横轴: 技术实现进度 · 纵轴: 宏观经济环境
            </p>
          </motion.div>

          {/* 2x2 Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {scenarios.map((scenario, index) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                index={index}
                highlighted={
                  hoveredScenario === null || hoveredScenario === scenario.id
                }
                onHover={handleCardHover}
                onLeave={handleCardLeave}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          3. Probability Distribution Bar Chart
      ════════════════════════════════════════════════════ */}
      <section className="w-full py-20" style={{ backgroundColor: '#0B1120' }}>
        <div className="max-w-[800px] mx-auto px-4 md:px-6">
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-2xl md:text-4xl font-semibold text-[#F8FAFC]">
              情景概率分布
            </h2>
          </motion.div>

          {/* Stacked probability bar */}
          <motion.div
            className="glass-card rounded-xl p-6 mb-8"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
          >
            <div className="flex h-14 rounded-lg overflow-hidden gap-[2px]">
              {probabilityDistribution.map((seg, i) => (
                <motion.div
                  key={seg.id}
                  className="relative flex items-center justify-center"
                  style={{ backgroundColor: seg.color }}
                  initial={{ width: 0, opacity: 0 }}
                  whileInView={{
                    width: `${seg.probability}%`,
                    opacity:
                      hoveredScenario === null || hoveredScenario === seg.id
                        ? 1
                        : 0.35,
                  }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.2,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                >
                  <span className="font-mono text-sm font-semibold text-white whitespace-nowrap">
                    {seg.probability}%
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-5">
              {probabilityDistribution.map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center gap-2 cursor-pointer transition-opacity duration-300"
                  style={{
                    opacity:
                      hoveredScenario === null || hoveredScenario === seg.id
                        ? 1
                        : 0.35,
                  }}
                  onMouseEnter={() => handleCardHover(seg.id)}
                  onMouseLeave={handleCardLeave}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs text-[#94A3B8]">{seg.name}</span>
                  <span className="font-mono text-xs font-medium text-[#F8FAFC]">
                    {seg.probability}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trigger conditions grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {triggerConditions.map((tc) => (
              <motion.div
                key={tc.id}
                variants={staggerChild}
                className="glass-card rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tc.color }}
                  />
                  <span className="text-sm font-semibold text-[#F8FAFC]">
                    {tc.label}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] ml-auto uppercase tracking-wider">
                    触发条件
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tc.conditions.map((cond) => (
                    <span
                      key={cond}
                      className="text-xs text-[#94A3B8] px-2 py-1 rounded"
                      style={{ backgroundColor: '#151E32' }}
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          4. Time Window Panel
      ════════════════════════════════════════════════════ */}
      <section className="w-full py-20" style={{ backgroundColor: '#0B1120' }}>
        <div className="max-w-[1000px] mx-auto px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-2xl md:text-4xl font-semibold text-[#F8FAFC] mb-3">
              关键时间窗口
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium tracking-wider">
              泡沫演变的关键时间节点与倒计时
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {timeWindows.map((tw, i) => (
              <TimeWindowCard key={tw.label} window={tw} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          5. Market Impact Simulator (Tab-based)
      ════════════════════════════════════════════════════ */}
      <section className="w-full py-20" style={{ backgroundColor: '#151E32' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-2xl md:text-4xl font-semibold text-[#F8FAFC] mb-3">
              市场影响模拟器
            </h2>
            <p className="text-xs text-[#94A3B8] font-medium tracking-wider">
              选择情景查看各资产类别的预期表现
            </p>
          </motion.div>

          {/* Tab buttons */}
          <motion.div
            className="flex flex-wrap gap-2 mb-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {tabOrder.map((tabId) => {
              const s = scenarios.find((sc) => sc.id === tabId)!
              const isActive = activeTab === tabId
              return (
                <motion.button
                  key={tabId}
                  variants={staggerChild}
                  onClick={() => setActiveTab(tabId)}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'font-semibold'
                      : 'text-[#94A3B8] border border-white/20 hover:border-white/40 hover:text-[#F8FAFC]'
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: s.color,
                          color: '#0B1120',
                          border: `1px solid ${s.color}`,
                        }
                      : undefined
                  }
                >
                  {s.name}
                </motion.button>
              )
            })}
          </motion.div>

          {/* Chart + Summary */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="flex flex-col lg:flex-row gap-6"
            >
              {/* Bar Chart */}
              <div className="glass-card rounded-xl p-4 md:p-6 flex-1" style={{ minHeight: 380 }}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={activeScenario.assetPerformance}
                    margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="asset"
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {activeScenario.assetPerformance.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.value >= 0
                              ? 'url(#positiveGradient)'
                              : 'url(#negativeGradient)'
                          }
                        />
                      ))}
                      {/* Gradients */}
                    </Bar>
                    <defs>
                      <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14B8A6" />
                        <stop offset="100%" stopColor="#0D9488" />
                      </linearGradient>
                      <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#DC2626" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary panel */}
              <div
                className="glass-card rounded-xl p-6 lg:w-[380px] flex flex-col"
                style={{ minHeight: 380 }}
              >
                <h3
                  className="font-display text-xl font-semibold mb-4"
                  style={{ color: activeScenario.color }}
                >
                  {activeScenario.name}
                  <span className="text-sm text-[#94A3B8] ml-2 font-normal">
                    ({activeScenario.probability}%概率)
                  </span>
                </h3>

                <ul className="space-y-3 flex-1">
                  {activeScenario.keyPoints.map((point, idx) => (
                    <motion.li
                      key={point}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      className="flex items-start gap-3 text-sm text-[#94A3B8] leading-relaxed"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: activeScenario.color }}
                      />
                      {point}
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link
                    to="/advisory"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#06B6D4] hover:text-[#22D3EE] transition-colors group"
                  >
                    查看完整投资策略
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-1"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          6. Prediction Methodology
      ════════════════════════════════════════════════════ */}
      <section className="w-full py-16" style={{ backgroundColor: '#0B1120' }}>
        <div className="max-w-[800px] mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-display text-xl font-semibold text-[#F8FAFC] mb-6">
              预测方法论与免责声明
            </h3>

            <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
              本情景预测基于蒙特卡洛模拟（10,000次路径模拟），结合8维度评分的历史回归分析、宏观情景推演和专家判断权重调整。每种情景的概率为模型输出与主观概率的贝叶斯加权结果。
            </p>

            <p className="text-sm text-[#94A3B8] leading-relaxed mb-8">
              <span className="text-[#F59E0B] mr-1">⚠</span>
              本预测仅供参考，不构成投资建议。金融市场具有高度不确定性，实际结果可能与预测存在重大偏差。投资者应基于自身风险承受能力做出独立判断。
            </p>

            {/* Methodology tags */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {['蒙特卡洛模拟 · 10,000次', '贝叶斯加权', '每日参数更新'].map(
                (tag) => (
                  <motion.span
                    key={tag}
                    variants={staggerChild}
                    className="px-4 py-2 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#06B6D4',
                    }}
                  >
                    {tag}
                  </motion.span>
                )
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
