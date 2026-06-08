import { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react'
import { historicalTimeline, dimensions, getRiskLevel } from '@/data/bubbleData'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimeRange {
  label: string
  value: string
  months: number
}

interface HeatmapQuarter {
  quarter: string
  scores: Record<string, number>
}

interface BubbleComparisonRow {
  name: string
  year: string
  peakGain: string
  maxDrawdown: number
  recoveryTime: string
  capePeak: string
  comparison: string
  comparisonDir: 'higher' | 'lower' | 'similar' | 'na'
  isCurrent?: boolean
}

interface TimelineEvent {
  date: string
  title: string
  description: string
  index: number
}

/* ------------------------------------------------------------------ */
/*  Constants & Data                                                   */
/* ------------------------------------------------------------------ */

const timeRanges: TimeRange[] = [
  { label: '1Y', value: '1y', months: 12 },
  { label: '3Y', value: '3y', months: 36 },
  { label: '5Y', value: '5y', months: 60 },
  { label: 'ALL', value: 'all', months: 0 },
]

const areaChartEvents: Record<string, { event: string; risk: string }> = {
  '2023-12': { event: 'ChatGPT Enterprise发布', risk: 'warning' },
  '2024-03': { event: 'Sora视频模型发布', risk: 'warning' },
  '2024-06': { event: '英伟达拆股后回调', risk: 'warning' },
  '2024-09': { event: '大模型价格战', risk: 'warning' },
  '2024-12': { event: '万亿美元市值俱乐部扩容', risk: 'warning' },
  '2025-03': { event: 'xAI融资$60B', risk: 'alert' },
  '2025-06': { event: '通用AI Agent热潮', risk: 'alert' },
  '2025-09': { event: '美联储降息落地', risk: 'alert' },
  '2025-12': { event: 'AGI时间线争论白热化', risk: 'alert' },
  '2026-03': { event: '历史最高点，电力危机报道', risk: 'alert' },
  '2026-06': { event: 'DeepSeek冲击，指数回调', risk: 'alert' },
}

const heatmapData: HeatmapQuarter[] = [
  { quarter: '23Q1', scores: { valuation: 45, 'capital-flow': 42, infrastructure: 48, sentiment: 40, 'market-structure': 38, fundamentals: 55, 'macro-policy': 50, geopolitics: 46 } },
  { quarter: '23Q2', scores: { valuation: 50, 'capital-flow': 48, infrastructure: 52, sentiment: 46, 'market-structure': 42, fundamentals: 54, 'macro-policy': 51, geopolitics: 47 } },
  { quarter: '23Q3', scores: { valuation: 55, 'capital-flow': 55, infrastructure: 56, sentiment: 52, 'market-structure': 46, fundamentals: 56, 'macro-policy': 52, geopolitics: 49 } },
  { quarter: '23Q4', scores: { valuation: 58, 'capital-flow': 60, infrastructure: 60, sentiment: 58, 'market-structure': 50, fundamentals: 57, 'macro-policy': 54, geopolitics: 50 } },
  { quarter: '24Q1', scores: { valuation: 62, 'capital-flow': 65, infrastructure: 64, sentiment: 62, 'market-structure': 55, fundamentals: 58, 'macro-policy': 56, geopolitics: 52 } },
  { quarter: '24Q2', scores: { valuation: 60, 'capital-flow': 62, infrastructure: 63, sentiment: 60, 'market-structure': 56, fundamentals: 58, 'macro-policy': 58, geopolitics: 54 } },
  { quarter: '24Q3', scores: { valuation: 64, 'capital-flow': 68, infrastructure: 66, sentiment: 65, 'market-structure': 60, fundamentals: 59, 'macro-policy': 60, geopolitics: 56 } },
  { quarter: '24Q4', scores: { valuation: 68, 'capital-flow': 72, infrastructure: 70, sentiment: 70, 'market-structure': 64, fundamentals: 60, 'macro-policy': 62, geopolitics: 58 } },
  { quarter: '25Q1', scores: { valuation: 72, 'capital-flow': 76, infrastructure: 74, sentiment: 74, 'market-structure': 68, fundamentals: 60, 'macro-policy': 64, geopolitics: 60 } },
  { quarter: '25Q2', scores: { valuation: 74, 'capital-flow': 78, infrastructure: 76, sentiment: 76, 'market-structure': 70, fundamentals: 61, 'macro-policy': 66, geopolitics: 62 } },
  { quarter: '25Q3', scores: { valuation: 76, 'capital-flow': 80, infrastructure: 78, sentiment: 78, 'market-structure': 70, fundamentals: 61, 'macro-policy': 67, geopolitics: 64 } },
  { quarter: '25Q4', scores: { valuation: 78, 'capital-flow': 82, infrastructure: 80, sentiment: 78, 'market-structure': 71, fundamentals: 61, 'macro-policy': 68, geopolitics: 66 } },
  { quarter: '26Q1', scores: { valuation: 80, 'capital-flow': 84, infrastructure: 82, sentiment: 78, 'market-structure': 72, fundamentals: 61, 'macro-policy': 69, geopolitics: 68 } },
  { quarter: '26Q2', scores: { valuation: 84, 'capital-flow': 85, infrastructure: 82, sentiment: 78, 'market-structure': 72, fundamentals: 61, 'macro-policy': 69, geopolitics: 68 } },
]

const bubbleRows: BubbleComparisonRow[] = [
  { name: '郁金香狂热', year: '1637', peakGain: '~2000%', maxDrawdown: 99, recoveryTime: '永不恢复', capePeak: 'N/A', comparison: '—', comparisonDir: 'na' },
  { name: '南海泡沫', year: '1720', peakGain: '800%', maxDrawdown: 96, recoveryTime: '数十年', capePeak: 'N/A', comparison: '—', comparisonDir: 'na' },
  { name: '1929年大萧条', year: '1929', peakGain: '400%', maxDrawdown: 89, recoveryTime: '25年', capePeak: '32.5x', comparison: '当前更高', comparisonDir: 'higher' },
  { name: '日本泡沫', year: '1989', peakGain: '500%', maxDrawdown: 80, recoveryTime: '34年+', capePeak: '90x+', comparison: '当前更低', comparisonDir: 'lower' },
  { name: '互联网泡沫', year: '2000', peakGain: '1090%', maxDrawdown: 78, recoveryTime: '15年', capePeak: '44.2x', comparison: '当前接近', comparisonDir: 'similar' },
  { name: '2008年金融危机', year: '2007', peakGain: '~200%', maxDrawdown: 57, recoveryTime: '4年', capePeak: '27.2x', comparison: '当前更高', comparisonDir: 'higher' },
  { name: '当前AI泡沫', year: '2026', peakGain: '~300%', maxDrawdown: 0, recoveryTime: '?', capePeak: '40.7x', comparison: '—', comparisonDir: 'na', isCurrent: true },
]

const timelineEvents: TimelineEvent[] = [
  { date: '2022.11', title: 'ChatGPT发布', description: '生成式AI引爆全球关注，AI投资热潮启动', index: 35.2 },
  { date: '2023.05', title: '英伟达突破$1T', description: '首家万亿市值芯片公司诞生，GPU成为新石油', index: 48.6 },
  { date: '2023.11', title: 'GPT-4 Turbo发布', description: '大模型能力跃升，企业AI预算激增', index: 52.1 },
  { date: '2024.02', title: 'Sora震撼发布', description: 'AI视频生成颠覆内容产业，估值加速膨胀', index: 60.3 },
  { date: '2024.06', title: '英伟达登顶全球第一', description: '3.3万亿美元市值超越微软，芯片泡沫论升温', index: 63.8 },
  { date: '2024.11', title: 'xAI融资$50B', description: '马斯克xAI成为史上最大AI融资之一', index: 67.2 },
  { date: '2025.03', title: '通用Agent热潮', description: 'AI Agent概念引爆，软件股普涨', index: 72.1 },
  { date: '2025.08', title: 'AGI辩论白热化', description: 'OpenAI声称接近AGI，监管与伦理争议加剧', index: 75.4 },
  { date: '2026.01', title: '电力危机报道', description: '40%AI项目受电力瓶颈制约，物理约束浮现', index: 78.5 },
  { date: '2026.06', title: 'DeepSeek冲击', description: '中国DeepSeek以极低成本挑战西方AI，指数回调', index: 73.2 },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScoreColor(score: number): string {
  if (score <= 40) return '#14B8A6'
  if (score <= 55) return '#3B82F6'
  if (score <= 70) return '#F59E0B'
  if (score <= 80) return '#EF4444'
  return '#7F1D1D'
}

function getScoreOpacity(score: number): string {
  if (score <= 40) return 'rgba(20,184,166,0.25)'
  if (score <= 55) return 'rgba(59,130,246,0.35)'
  if (score <= 70) return 'rgba(245,158,11,0.4)'
  if (score <= 80) return 'rgba(239,68,68,0.5)'
  return 'rgba(127,29,29,0.6)'
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-')
  return `${y}.${m}`
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip for Area Chart                                      */
/* ------------------------------------------------------------------ */

function CustomAreaTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  const risk = getRiskLevel(value)
  const event = areaChartEvents[label || '']
  return (
    <div className="glass-card rounded-lg p-3 min-w-[180px]">
      <p className="font-mono text-xs text-[#94A3B8] mb-1">{formatMonthLabel(label || '')}</p>
      <p className="font-display text-xl font-bold" style={{ color: risk.color }}>
        {value.toFixed(1)}
      </p>
      <p className="text-xs mt-0.5" style={{ color: risk.color }}>
        {risk.label}
      </p>
      {event && (
        <p className="text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-white/5">
          {event.event}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 1 — Page Header                                            */
/* ------------------------------------------------------------------ */

function PageHeader() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section
      ref={ref}
      className="relative w-full bg-deep-navy pt-24 pb-10 px-4 md:px-6"
      style={{ minHeight: '35vh' }}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        {/* Left — Title */}
        <motion.div
          className="lg:w-[60%]"
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <p className="font-mono text-xs text-[#94A3B8] tracking-wider mb-3">
            <Link to="/" className="hover:text-cyan-accent transition-colors">首页</Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary">历史数据</span>
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
            历史数据与趋势
          </h1>
          <p className="text-base text-[#94A3B8] leading-relaxed max-w-xl">
            追溯AI泡沫预警指数的变化轨迹，对比历史泡沫的演进规律
          </p>
        </motion.div>

        {/* Right — Stat Cards */}
        <div className="lg:w-[40%] flex flex-col sm:flex-row gap-3">
          {[
            { label: '数据起始日', value: '2023.01.01', color: '#06B6D4', icon: Calendar },
            { label: '历史最高', value: '78.5', color: '#EF4444', icon: TrendingUp },
            { label: '历史最低', value: '31.2', color: '#14B8A6', icon: TrendingDown },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass-card rounded-xl p-4 flex-1"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.15 * (i + 1),
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={14} style={{ color: stat.color }} />
                <span className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="font-mono text-lg font-semibold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 2 — Area Chart                                             */
/* ------------------------------------------------------------------ */

function AreaChartSection() {
  const [activeRange, setActiveRange] = useState<string>('all')
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const filteredData = useMemo(() => {
    const range = timeRanges.find((r) => r.value === activeRange)
    if (!range || range.months === 0) return historicalTimeline
    return historicalTimeline.slice(-range.months)
  }, [activeRange])

  return (
    <section ref={ref} className="w-full bg-surface-dark py-20 px-4 md:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Title + Range Selector */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
              AI-BWI 指数走势
            </h2>
            <p className="font-mono text-xs text-[#94A3B8] mt-1">
              2020年 — 2026年 &middot; 月度数据
            </p>
          </div>
          <div className="flex items-center gap-1 bg-deep-navy/60 rounded-lg p-1 border border-white/5">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setActiveRange(range.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md font-mono text-xs font-medium transition-all duration-200',
                  activeRange === range.value
                    ? 'bg-cyan-accent text-deep-navy'
                    : 'text-[#94A3B8] hover:text-text-primary hover:bg-white/5'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          className="glass-card rounded-2xl p-4 md:p-6"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="w-full" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v: string) => {
                    const [y, m] = v.split('-')
                    return `${y}/${m}`
                  }}
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <ReferenceLine
                  y={80}
                  stroke="#EF4444"
                  strokeDasharray="6 4"
                  strokeOpacity={0.6}
                  label={{
                    value: '极高风险阈值',
                    position: 'insideTopRight',
                    fill: '#EF4444',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <ReferenceLine
                  y={70}
                  stroke="#F59E0B"
                  strokeDasharray="6 4"
                  strokeOpacity={0.6}
                  label={{
                    value: '高风险阈值',
                    position: 'insideTopRight',
                    fill: '#F59E0B',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <ReferenceLine
                  y={55}
                  stroke="#14B8A6"
                  strokeDasharray="6 4"
                  strokeOpacity={0.6}
                  label={{
                    value: '警戒线',
                    position: 'insideTopRight',
                    fill: '#14B8A6',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="index"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#06B6D4', stroke: '#0B1120', strokeWidth: 2 }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
            {[
              { color: '#14B8A6', label: '安全 (0-40)' },
              { color: '#3B82F6', label: '注意 (40-55)' },
              { color: '#F59E0B', label: '警戒 (55-70)' },
              { color: '#EF4444', label: '高风险 (70-80)' },
              { color: '#7F1D1D', label: '极高风险 (80-100)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-mono text-[10px] text-[#94A3B8]">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 3 — Heatmap                                                */
/* ------------------------------------------------------------------ */

function HeatmapSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [hoveredDim, setHoveredDim] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ dim: string; q: string; score: number } | null>(null)

  const dimLabels = useMemo(() => dimensions.map((d) => ({
    id: d.id,
    name: d.name,
    nameEn: d.nameEn,
  })), [])

  return (
    <section ref={ref} className="w-full bg-deep-navy py-20 px-4 md:px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
            八维度历史热力图
          </h2>
          <p className="font-mono text-xs text-[#94A3B8] mt-2">
            每个维度评分随时间的演变，颜色越深代表风险越高
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-4 md:p-6 overflow-x-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="min-w-[640px]">
            {/* Header row — quarter labels */}
            <div className="flex items-center mb-1">
              <div className="w-[120px] shrink-0" />
              <div className="flex-1 grid grid-cols-14 gap-[2px]">
                {heatmapData.map((q) => (
                  <div key={q.quarter} className="text-center">
                    <span className="font-mono text-[10px] text-[#94A3B8]">{q.quarter}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension rows */}
            {dimLabels.map((dim, dimIdx) => (
              <div
                key={dim.id}
                className="flex items-center mb-[2px]"
                onMouseEnter={() => setHoveredDim(dim.id)}
                onMouseLeave={() => setHoveredDim(null)}
              >
                {/* Y-axis label */}
                <div
                  className={cn(
                    'w-[120px] shrink-0 pr-3 transition-all duration-200',
                    hoveredDim === dim.id && 'bg-cyan-accent/10 rounded-l'
                  )}
                >
                  <p className="font-body text-[13px] text-[#94A3B8] text-right leading-tight">
                    {dim.name}
                  </p>
                  <p className="font-mono text-[9px] text-[#94A3B8]/60 text-right">
                    {dim.nameEn}
                  </p>
                </div>

                {/* Cells */}
                <div className="flex-1 grid grid-cols-14 gap-[2px]">
                  {heatmapData.map((q, qIdx) => {
                    const score = q.scores[dim.id] ?? 0
                    const isHovered = hoveredDim === dim.id
                    const isCellHovered = hoveredCell?.dim === dim.id && hoveredCell?.q === q.quarter
                    return (
                      <motion.div
                        key={`${dim.id}-${q.quarter}`}
                        className={cn(
                          'relative aspect-square rounded-sm flex items-center justify-center cursor-pointer transition-all duration-200',
                          isHovered && 'ring-1 ring-cyan-accent/60',
                          isCellHovered && 'scale-125 z-10 shadow-lg'
                        )}
                        style={{ backgroundColor: getScoreOpacity(score) }}
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{
                          duration: 0.4,
                          delay: dimIdx * 0.08 + qIdx * 0.01,
                          ease: 'easeOut',
                        }}
                        onMouseEnter={() => setHoveredCell({ dim: dim.id, q: q.quarter, score })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <span
                          className="font-mono text-[9px] md:text-[10px] font-medium"
                          style={{ color: score > 70 ? '#F8FAFC' : getScoreColor(score) }}
                        >
                          {score}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Hover info panel */}
            <AnimatePresence>
              {hoveredCell && (
                <motion.div
                  className="mt-4 glass-card rounded-lg p-3 flex items-center gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Activity size={16} className="text-cyan-accent shrink-0" />
                  <div>
                    <p className="font-body text-sm text-text-primary">
                      {dimLabels.find((d) => d.id === hoveredCell.dim)?.name}
                      <span className="text-[#94A3B8] mx-2">&middot;</span>
                      <span className="font-mono text-xs text-cyan-accent">{hoveredCell.q}</span>
                    </p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: getScoreColor(hoveredCell.score) }}>
                      评分: {hoveredCell.score} &mdash; {getRiskLevel(hoveredCell.score).label}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 4 — Bubble Comparison Table                                */
/* ------------------------------------------------------------------ */

function BubbleComparisonTable() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const maxDrawdown = Math.max(...bubbleRows.map((r) => r.maxDrawdown))

  return (
    <section ref={ref} className="w-full bg-surface-dark py-20 px-4 md:px-6">
      <div className="max-w-[1000px] mx-auto">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
            历史泡沫对比
          </h2>
          <p className="font-mono text-xs text-[#94A3B8] mt-2">
            将当前AI泡沫置于历史坐标系中审视
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-white/5">
                  {['泡沫名称', '年份', '峰值涨幅', '峰值后跌幅', '恢复时间', 'CAPE峰值', '与当前对比'].map((h) => (
                    <th
                      key={h}
                      className="font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider text-left px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bubbleRows.map((row, idx) => (
                  <motion.tr
                    key={row.name}
                    className={cn(
                      'border-b border-white/5 transition-colors duration-200',
                      row.isCurrent
                        ? 'bg-warning-amber/10'
                        : 'hover:bg-white/[0.03]'
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: 0.3 + idx * 0.06,
                      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                    }}
                  >
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'font-body text-sm',
                          row.isCurrent ? 'font-bold text-warning-amber' : 'text-text-primary'
                        )}
                      >
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-[#94A3B8]">{row.year}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-text-primary">{row.peakGain}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(row.maxDrawdown / maxDrawdown) * 100}%`,
                              backgroundColor: row.isCurrent ? '#F59E0B' : '#EF4444',
                            }}
                          />
                        </div>
                        <span
                          className={cn(
                            'font-mono text-xs',
                            row.isCurrent ? 'text-warning-amber' : 'text-alert-red'
                          )}
                        >
                          {row.maxDrawdown > 0 ? `${row.maxDrawdown}%` : '?'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-[#94A3B8]">{row.recoveryTime}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs text-[#94A3B8]">{row.capePeak}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {row.comparisonDir === 'higher' && <ArrowUpRight size={14} className="text-alert-red" />}
                        {row.comparisonDir === 'lower' && <ArrowDownRight size={14} className="text-success-teal" />}
                        {row.comparisonDir === 'similar' && <Minus size={14} className="text-warning-amber" />}
                        <span
                          className={cn(
                            'font-mono text-[10px]',
                            row.comparisonDir === 'higher' && 'text-alert-red',
                            row.comparisonDir === 'lower' && 'text-success-teal',
                            row.comparisonDir === 'similar' && 'text-warning-amber',
                            row.comparisonDir === 'na' && 'text-[#94A3B8]',
                          )}
                        >
                          {row.comparison}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Section 5 — Scroll-Driven Timeline (GSAP)                          */
/* ------------------------------------------------------------------ */

function TimelineSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || !lineRef.current) return

    const ctx = gsap.context(() => {
      // Line grows with scroll
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 60%',
            end: 'bottom 60%',
            scrub: 1,
          },
        }
      )

      // Node animations
      const nodes = containerRef.current!.querySelectorAll('.timeline-node')
      nodes.forEach((node) => {
        gsap.fromTo(
          node,
          { scale: 0 },
          {
            scale: 1,
            duration: 0.4,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: node,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      })

      // Card slide-in animations
      const cards = containerRef.current!.querySelectorAll('.timeline-card')
      cards.forEach((card, i) => {
        const isLeft = i % 2 === 0
        gsap.fromTo(
          card,
          { x: isLeft ? -30 : 30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <section className="w-full bg-deep-navy py-20 px-4 md:px-6">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
            泡沫演进时间轴
          </h2>
          <p className="font-mono text-xs text-[#94A3B8] mt-2">
            AI泡沫预警指数的关键里程碑事件
          </p>
        </div>

        <div ref={containerRef} className="relative">
          {/* Center line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] md:-translate-x-px">
            <div className="w-full h-full border-l-2 border-dashed border-[#94A3B8]/30" />
            <div
              ref={lineRef}
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-accent via-warning-amber to-alert-red origin-top"
              style={{ transform: 'scaleY(0)' }}
            />
          </div>

          {/* Timeline events */}
          <div className="space-y-12 md:space-y-16">
            {timelineEvents.map((event, idx) => {
              const isLeft = idx % 2 === 0
              const risk = getRiskLevel(event.index)
              const isLast = idx === timelineEvents.length - 1
              return (
                <div
                  key={event.date}
                  className={cn(
                    'relative flex items-start',
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  )}
                >
                  {/* Node marker */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10">
                    <div
                      className={cn(
                        'timeline-node w-4 h-4 rounded-full border-2 border-white shadow-lg',
                        isLast && 'animate-pulse-glow'
                      )}
                      style={{ backgroundColor: risk.color }}
                    />
                  </div>

                  {/* Spacer for alignment */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Content card */}
                  <div
                    className={cn(
                      'timeline-card ml-10 md:ml-0 md:w-1/2',
                      isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'
                    )}
                  >
                    <div className="glass-card rounded-xl p-4 inline-block max-w-[320px]">
                      <div className={cn('flex items-center gap-2 mb-1', isLeft && 'md:flex-row-reverse')}>
                        <span className="font-mono text-xs text-cyan-accent">{event.date}</span>
                        <BarChart3 size={12} className="text-[#94A3B8]" />
                      </div>
                      <h3 className="font-body text-sm font-semibold text-text-primary mb-1">
                        {event.title}
                      </h3>
                      <p className="font-body text-[13px] text-[#94A3B8] leading-relaxed mb-2">
                        {event.description}
                      </p>
                      <div className={cn('flex items-center gap-1.5', isLeft && 'md:justify-end')}>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: risk.color }}
                        />
                        <span className="font-mono text-xs" style={{ color: risk.color }}>
                          {event.index.toFixed(1)} &middot; {risk.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Main History Page                                                  */
/* ------------------------------------------------------------------ */

export default function History() {
  return (
    <div className="min-h-[100dvh] bg-deep-navy">
      <PageHeader />
      <AreaChartSection />
      <HeatmapSection />
      <BubbleComparisonTable />
      <TimelineSection />
    </div>
  )
}
