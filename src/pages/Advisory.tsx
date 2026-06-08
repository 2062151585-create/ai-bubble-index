import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import {
  Umbrella, CheckSquare, Square, ChevronDown, History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  currentIndex,
  getRiskLevel,
} from '@/data/bubbleData'

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
interface StrategyAction {
  label: string
  priority: 'P1' | 'P2' | 'P3'
  checked: boolean
}

interface Strategy {
  id: string
  number: string
  title: string
  description: string
  actions: StrategyAction[]
  effect: string
}

interface AssetAllocation {
  name: string
  value: number
  color: string
}

interface BacktestRow {
  date: string
  prevLevel: string
  prevScore: number
  newLevel: string
  newScore: number
  trigger: string
  perf30d: string
  perf90d: string
  direction: 'upgrade' | 'downgrade'
}

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */
const RISK_LEVELS = [
  { level: 'safe', label: '安全', min: 0, max: 40, color: '#14B8A6', emoji: '🟢', shortAdvice: '重仓AI龙头，积极布局' },
  { level: 'caution', label: '注意', min: 40, max: 55, color: '#3B82F6', emoji: '🟡', shortAdvice: '适度配置，关注风险' },
  { level: 'warning', label: '警戒', min: 55, max: 70, color: '#F59E0B', emoji: '🟠', shortAdvice: '减仓AI，增加现金和避险' },
  { level: 'alert', label: '高风险', min: 70, max: 80, color: '#EF4444', emoji: '🔴', shortAdvice: '大幅降低AI敞口，对冲风险' },
  { level: 'extreme', label: '极高风险', min: 80, max: 100, color: '#7F1D1D', emoji: '⚫', shortAdvice: '清仓AI，持有现金和国债' },
]

const STRATEGIES: Record<string, Strategy[]> = {
  alert: [
    {
      id: 'reduce-ai',
      number: '01',
      title: '降低AI敞口',
      description: '系统性削减AI相关持仓至组合20%以下，优先减持估值最高、基本面最弱的标的。',
      actions: [
        { label: '将英伟达持仓减半或设30%止损线', priority: 'P1', checked: false },
        { label: '清仓PEG > 3的纯AI概念股', priority: 'P1', checked: false },
        { label: 'AMD仓位降至观察仓位(<3%)', priority: 'P2', checked: false },
        { label: '卖出Palantir和特斯拉的投机性头寸', priority: 'P2', checked: false },
      ],
      effect: '降低组合AIBeta暴露约60%',
    },
    {
      id: 'defensive',
      number: '02',
      title: '增配防御性资产',
      description: '将释放的资金配置到负相关或低相关的防御性资产中，构建组合的安全垫。',
      actions: [
        { label: '增配10年期美国国债至组合20%', priority: 'P1', checked: false },
        { label: '增配黄金ETF(GLD)至组合10%', priority: 'P1', checked: false },
        { label: '配置公用事业板块ETF(XLU) 5%', priority: 'P2', checked: false },
        { label: '建立现金储备至组合15%', priority: 'P3', checked: false },
      ],
      effect: '提升组合夏普比率 0.3-0.5',
    },
    {
      id: 'hedge',
      number: '03',
      title: '建立对冲头寸',
      description: '使用衍生品工具为组合购买"保险"，在大幅回调时获得正收益 offset 股票损失。',
      actions: [
        { label: '买入QQQ 3个月看跌期权(行权价-10%)', priority: 'P1', checked: false },
        { label: '买入VIX看涨期权(目标VIX 35+)', priority: 'P1', checked: false },
        { label: '卖出标普500远期合约对冲20%仓位', priority: 'P2', checked: false },
        { label: '配置做空型ETF(SQQQ) 2%组合作为尾部保险', priority: 'P3', checked: false },
      ],
      effect: '在20%回调情景下保护组合损失至<8%',
    },
  ],
  safe: [
    {
      id: 'accumulate',
      number: '01',
      title: '积极布局AI龙头',
      description: '当前风险较低，适合增加AI相关优质资产配置，把握长期增长机会。',
      actions: [
        { label: '增加AI龙头持仓至组合35-40%', priority: 'P1', checked: false },
        { label: '关注基本面扎实的AI基础设施公司', priority: 'P1', checked: false },
        { label: '定期再平衡，锁定部分收益', priority: 'P2', checked: false },
        { label: '关注估值合理的细分赛道龙头', priority: 'P2', checked: false },
      ],
      effect: '把握AI革命长期增长红利',
    },
    {
      id: 'core-hold',
      number: '02',
      title: '核心持仓策略',
      description: '建立以优质AI公司为核心的长期持仓组合，注重基本面研究。',
      actions: [
        { label: '建立MSFT、GOOGL等巨头核心仓位', priority: 'P1', checked: false },
        { label: '配置NVDA等硬件龙头，注意估值纪律', priority: 'P1', checked: false },
        { label: '关注AI应用层高成长性公司', priority: 'P2', checked: false },
        { label: '保留15%现金用于回调加仓', priority: 'P3', checked: false },
      ],
      effect: '构建长期AI核心资产组合',
    },
    {
      id: 'diversify',
      number: '03',
      title: '适度分散配置',
      description: '在聚焦AI的同时，保持适当分散以降低单一赛道集中度风险。',
      actions: [
        { label: '科技宽基持仓维持25-30%', priority: 'P1', checked: false },
        { label: '配置15%价值股平衡组合风格', priority: 'P2', checked: false },
        { label: '持有10%黄金作为组合保险', priority: 'P3', checked: false },
        { label: '定期检查组合集中度风险', priority: 'P2', checked: false },
      ],
      effect: '平衡增长与稳定性',
    },
  ],
  caution: [
    {
      id: 'selective',
      number: '01',
      title: '精选个股策略',
      description: '维持中性AI配置，严格筛选有实际收入和利润的标的。',
      actions: [
        { label: 'AI持仓维持在组合的25-30%', priority: 'P1', checked: false },
        { label: '优先选择有实际收入和利润的AI公司', priority: 'P1', checked: false },
        { label: '设置止损线，防止回撤扩大', priority: 'P2', checked: false },
        { label: '关注估值安全边际', priority: 'P2', checked: false },
      ],
      effect: '保持AI exposure 同时控制风险',
    },
    {
      id: 'balance',
      number: '02',
      title: '平衡配置',
      description: '在AI与防御性资产之间保持平衡，关注宏观经济变化。',
      actions: [
        { label: '国债配置提高至10-15%', priority: 'P1', checked: false },
        { label: '黄金配置提高至10%', priority: 'P2', checked: false },
        { label: '增加价值股配置至20%', priority: 'P2', checked: false },
        { label: '建立5-10%现金储备', priority: 'P3', checked: false },
      ],
      effect: '提升组合防御性',
    },
    {
      id: 'monitor',
      number: '03',
      title: '密切监控',
      description: '增加监控频率，关注可能导致风险等级上升的触发因素。',
      actions: [
        { label: '每周评估AI指数变化', priority: 'P1', checked: false },
        { label: '关注美联储政策动向', priority: 'P1', checked: false },
        { label: '监控AI企业财报季数据', priority: 'P2', checked: false },
        { label: '跟踪散户情绪指标', priority: 'P3', checked: false },
      ],
      effect: '及时预警风险升级',
    },
  ],
  warning: [
    {
      id: 'reduce-warning',
      number: '01',
      title: '降低AI敞口',
      description: '风险等级上升，系统性降低AI相关持仓，锁定部分收益。',
      actions: [
        { label: '将AI相关持仓降至20-25%', priority: 'P1', checked: false },
        { label: '减持高估值、无利润AI公司', priority: 'P1', checked: false },
        { label: '设置更紧的止损线', priority: 'P2', checked: false },
        { label: '降低杠杆和保证金使用', priority: 'P2', checked: false },
      ],
      effect: '降低组合beta暴露40%',
    },
    {
      id: 'defensive-warning',
      number: '02',
      title: '增配防御性资产',
      description: '将释放资金配置到负相关或低相关的防御性资产中。',
      actions: [
        { label: '增配国债至组合15%', priority: 'P1', checked: false },
        { label: '增配黄金至组合15%', priority: 'P1', checked: false },
        { label: '配置公用事业板块5%', priority: 'P2', checked: false },
        { label: '建立现金储备至组合15%', priority: 'P2', checked: false },
      ],
      effect: '提升组合夏普比率 0.2-0.4',
    },
    {
      id: 'hedge-warning',
      number: '03',
      title: '初步对冲',
      description: '建立初步的对冲头寸，为可能的进一步风险升级做准备。',
      actions: [
        { label: '买入QQQ价外看跌期权保护核心持仓', priority: 'P1', checked: false },
        { label: '配置少量VIX看涨期权', priority: 'P2', checked: false },
        { label: '研究做空ETF工具', priority: 'P3', checked: false },
        { label: '评估组合最大可承受回撤', priority: 'P2', checked: false },
      ],
      effect: '在15%回调情景下保护损失至<10%',
    },
  ],
  extreme: [
    {
      id: 'evacuate',
      number: '01',
      title: '清仓AI持仓',
      description: '风险极高，立即大幅降低AI相关持仓至最低水平或清仓。',
      actions: [
        { label: '将AI持仓降至10%以下或清仓', priority: 'P1', checked: false },
        { label: '立即设置并执行严格止损', priority: 'P1', checked: false },
        { label: '退出所有杠杆和保证金头寸', priority: 'P1', checked: false },
        { label: '优先保留流动性最好的持仓', priority: 'P2', checked: false },
      ],
      effect: '消除主要下跌风险源',
    },
    {
      id: 'safe-haven',
      number: '02',
      title: '全面避险',
      description: '大幅增配国债、黄金、现金等避险资产，构建防御阵地。',
      actions: [
        { label: '大幅增配国债至组合30%', priority: 'P1', checked: false },
        { label: '大幅增配黄金至组合25%', priority: 'P1', checked: false },
        { label: '现金储备提高至20%', priority: 'P1', checked: false },
        { label: '配置防御性价值股15%', priority: 'P2', checked: false },
      ],
      effect: '构建高防御性组合',
    },
    {
      id: 'active-hedge',
      number: '03',
      title: '积极对冲',
      description: '积极使用衍生品对冲，考虑做空高估值标的获取绝对收益。',
      actions: [
        { label: '大幅买入VIX看涨期权', priority: 'P1', checked: false },
        { label: '配置SQQQ 5%组合作为对冲', priority: 'P1', checked: false },
        { label: '考虑做空高估值纯AI概念股', priority: 'P2', checked: false },
        { label: '买入指数看跌期权保护剩余仓位', priority: 'P1', checked: false },
      ],
      effect: '在30%回调情景下保护损失至<5%',
    },
  ],
}

const ASSET_ALLOCATIONS: Record<string, AssetAllocation[]> = {
  safe: [
    { name: 'AI股票', value: 40, color: '#EF4444' },
    { name: '科技宽基', value: 25, color: '#1E3A8A' },
    { name: '价值股', value: 15, color: '#06B6D4' },
    { name: '国债', value: 5, color: '#14B8A6' },
    { name: '黄金', value: 5, color: '#F59E0B' },
    { name: '现金', value: 10, color: '#94A3B8' },
  ],
  caution: [
    { name: 'AI股票', value: 30, color: '#EF4444' },
    { name: '科技宽基', value: 20, color: '#1E3A8A' },
    { name: '价值股', value: 20, color: '#06B6D4' },
    { name: '国债', value: 10, color: '#14B8A6' },
    { name: '黄金', value: 10, color: '#F59E0B' },
    { name: '现金', value: 10, color: '#94A3B8' },
  ],
  warning: [
    { name: 'AI股票', value: 20, color: '#EF4444' },
    { name: '科技宽基', value: 15, color: '#1E3A8A' },
    { name: '价值股', value: 20, color: '#06B6D4' },
    { name: '国债', value: 15, color: '#14B8A6' },
    { name: '黄金', value: 15, color: '#F59E0B' },
    { name: '现金', value: 15, color: '#94A3B8' },
  ],
  alert: [
    { name: 'AI股票', value: 15, color: '#EF4444' },
    { name: '科技宽基', value: 15, color: '#1E3A8A' },
    { name: '价值股', value: 20, color: '#06B6D4' },
    { name: '国债', value: 20, color: '#14B8A6' },
    { name: '黄金', value: 15, color: '#F59E0B' },
    { name: '现金', value: 15, color: '#94A3B8' },
  ],
  extreme: [
    { name: 'AI股票', value: 5, color: '#EF4444' },
    { name: '科技宽基', value: 5, color: '#1E3A8A' },
    { name: '价值股', value: 15, color: '#06B6D4' },
    { name: '国债', value: 30, color: '#14B8A6' },
    { name: '黄金', value: 25, color: '#F59E0B' },
    { name: '现金', value: 20, color: '#94A3B8' },
  ],
}

const BACKTEST_DATA: BacktestRow[] = [
  { date: '2026.06.15', prevLevel: '高风险', prevScore: 76.5, newLevel: '高风险', newScore: 73.2, trigger: 'DeepSeek冲击', perf30d: '-2.3%', perf90d: '待观察', direction: 'downgrade' },
  { date: '2026.01.10', prevLevel: '高风险', prevScore: 71.2, newLevel: '高风险', newScore: 78.5, trigger: '电力危机报道', perf30d: '-4.1%', perf90d: '-8.7%', direction: 'upgrade' },
  { date: '2025.09.20', prevLevel: '高风险', prevScore: 68.4, newLevel: '高风险', newScore: 71.3, trigger: '美联储降息落地', perf30d: '+1.2%', perf90d: '+3.5%', direction: 'upgrade' },
  { date: '2025.03.05', prevLevel: '警戒', prevScore: 69.1, newLevel: '高风险', newScore: 72.1, trigger: 'xAI融资$60B', perf30d: '+2.8%', perf90d: '-1.2%', direction: 'upgrade' },
  { date: '2024.12.15', prevLevel: '警戒', prevScore: 62.5, newLevel: '警戒', newScore: 68.9, trigger: '万亿市值扩容', perf30d: '+3.1%', perf90d: '+5.4%', direction: 'upgrade' },
  { date: '2024.06.10', prevLevel: '警戒', prevScore: 65.8, newLevel: '警戒', newScore: 58.2, trigger: '英伟达拆股回调', perf30d: '-1.5%', perf90d: '+2.1%', direction: 'downgrade' },
]

const EASING = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ──────────────────────────────────────────────
   Animated Number Component
   ────────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Number((eased * value).toFixed(1)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return <span ref={ref}>{display.toFixed(1)}</span>
}

/* ──────────────────────────────────────────────
   Custom Pie Tooltip
   ────────────────────────────────────────────── */
function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0]
  return (
    <div className="glass-card rounded-lg px-3 py-2 border border-white/10">
      <p className="font-mono-data text-sm font-medium" style={{ color: p.payload.color }}>
        {p.name}: {p.value}%
      </p>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Main Advisory Page
   ────────────────────────────────────────────── */
export default function Advisory() {
  const currentRisk = getRiskLevel(currentIndex)
  const [selectedLevel, setSelectedLevel] = useState(currentRisk.level)
  const [strategies, setStrategies] = useState<Strategy[]>(STRATEGIES[currentRisk.level] || STRATEGIES.alert)
  const [portfolioSize, setPortfolioSize] = useState(100)
  const [aiExposure, setAiExposure] = useState(45)
  const [hedgeBudget, setHedgeBudget] = useState(3)
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null)

  // Sync strategies when level changes
  useEffect(() => {
    setStrategies(STRATEGIES[selectedLevel] || STRATEGIES.alert)
  }, [selectedLevel])

  const toggleAction = useCallback((strategyIdx: number, actionIdx: number) => {
    setStrategies(prev => {
      const next = [...prev]
      const s = { ...next[strategyIdx], actions: [...next[strategyIdx].actions] }
      s.actions[actionIdx] = { ...s.actions[actionIdx], checked: !s.actions[actionIdx].checked }
      next[strategyIdx] = s
      return next
    })
  }, [])

  const currentLevelData = RISK_LEVELS.find(l => l.level === selectedLevel) || RISK_LEVELS[3]
  const currentAlloc = ASSET_ALLOCATIONS[selectedLevel] || ASSET_ALLOCATIONS.alert

  const hedgeCost = Math.round(portfolioSize * 10000 * hedgeBudget / 100)
  const putCost = Math.round(hedgeCost * 0.5)
  const vixCost = Math.round(hedgeCost * 0.33)
  const shortCost = Math.round(hedgeCost * 0.17)
  const protectedDD = Math.round(25 - hedgeBudget * 4.3)

  return (
    <div className="min-h-[100dvh] pt-16">
      {/* ═══════════════════════════════════════════
          1. PAGE HEADER
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-[40vh] flex items-center bg-deep-navy overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-alert-red/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-warning-amber/10 blur-[100px]" />
        </div>
        <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-6 py-10 md:py-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left — Title */}
            <motion.div
              className="lg:w-[60%]"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: EASING }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono-data text-xs text-text-secondary uppercase tracking-wider">
                  首页
                </span>
                <span className="text-text-secondary/40">/</span>
                <span className="font-mono-data text-xs text-cyan-accent uppercase tracking-wider">
                  投资建议
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
                投资建议中心
              </h1>
              <p className="text-text-secondary text-base max-w-xl leading-relaxed">
                基于AI-BWI指数的量化投资策略，将风险信号转化为可执行的行动方案
              </p>
            </motion.div>

            {/* Right — Status Card */}
            <motion.div
              className="lg:w-[40%]"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASING }}
            >
              <div className="glass-hero-card rounded-xl p-6">
                <span className="font-mono-data text-[10px] text-text-secondary uppercase tracking-wider">
                  当前风险等级
                </span>
                <div className="flex items-center gap-3 mt-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-alert-red animate-pulse" />
                  <span className="font-display text-2xl md:text-3xl font-bold text-warning-amber text-glow-amber">
                    {currentLevelData.label === '高风险' ? '高风险' : currentLevelData.label}
                  </span>
                </div>
                <div className="font-mono-data text-xl text-warning-amber mb-3">
                  <AnimatedNumber value={currentIndex} /> / 100
                </div>
                <p className="text-text-secondary text-sm mb-5">
                  建议大幅降低AI敞口，对冲风险
                </p>
                {/* Progress bar */}
                <div className="relative">
                  <div className="progress-bar-track w-full">
                    <motion.div
                      className="progress-bar-fill h-full rounded-sm"
                      style={{
                        background: 'linear-gradient(90deg, #F59E0B, #EF4444)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${currentIndex}%` }}
                      transition={{ duration: 1.2, ease: EASING, delay: 0.3 }}
                    />
                  </div>
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-warning-amber border-2 border-white shadow-glow-amber"
                    style={{ left: `${currentIndex}%`, marginLeft: '-6px' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.6, delay: 1.4, ease: 'easeOut' }}
                  />
                  {/* Threshold line at 80 */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-alert-red/60"
                    style={{ left: '80%' }}
                  >
                    <span className="absolute -top-4 -translate-x-1/2 font-mono-data text-[9px] text-alert-red">
                      80
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. RISK LEVEL NAVIGATION BAR
          ═══════════════════════════════════════════ */}
      <section className="w-full bg-surface-dark py-6">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {RISK_LEVELS.map((level, i) => {
              const isActive = selectedLevel === level.level
              return (
                <motion.button
                  key={level.level}
                  className={cn(
                    'flex-1 relative glass-card rounded-lg p-4 text-left transition-all duration-300 cursor-pointer',
                    isActive && 'ring-2',
                    isActive && selectedLevel === 'safe' && 'ring-[#14B8A6] bg-[#14B8A6]/10',
                    isActive && selectedLevel === 'caution' && 'ring-[#3B82F6] bg-[#3B82F6]/10',
                    isActive && selectedLevel === 'warning' && 'ring-[#F59E0B] bg-[#F59E0B]/10',
                    isActive && selectedLevel === 'alert' && 'ring-[#EF4444] bg-[#EF4444]/10',
                    isActive && selectedLevel === 'extreme' && 'ring-[#7F1D1D] bg-[#7F1D1D]/10',
                    !isActive && 'hover:-translate-y-[3px] hover:border-opacity-40'
                  )}
                  style={{
                    borderColor: isActive ? level.color : undefined,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASING, delay: i * 0.08 }}
                  onClick={() => setSelectedLevel(level.level)}
                  whileHover={!isActive ? { y: -3 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Top color bar */}
                  <div
                    className={cn('absolute top-0 left-0 right-0 rounded-t-lg transition-all', isActive ? 'h-2' : 'h-1')}
                    style={{ backgroundColor: level.color }}
                  />
                  <div className="flex items-center gap-2 mt-2 mb-1">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${level.color}30` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: level.color }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {level.label}
                    </span>
                  </div>
                  <span className="font-mono-data text-[11px] text-text-secondary block mb-1">
                    {level.min} - {level.max}
                  </span>
                  <span className="text-[11px] text-text-secondary/70 truncate block">
                    {level.shortAdvice}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. CURRENT LEVEL ADVICE — Strategy Cards
          ═══════════════════════════════════════════ */}
      <section className="max-w-[1000px] mx-auto px-4 md:px-6 py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASING }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentLevelData.color }} />
            <h2 className="font-display text-2xl md:text-4xl font-semibold text-text-primary">
              {currentLevelData.label}区间策略
              <span className="text-text-secondary text-lg md:text-2xl ml-2">
                ({currentLevelData.min}-{currentLevelData.max})
              </span>
            </h2>
          </div>
          <p className="text-text-secondary text-sm mb-10 ml-5">
            指数处于{currentLevelData.label}区间时的系统性防御策略
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {strategies.map((strategy, si) => (
              <motion.div
                key={`${selectedLevel}-${strategy.id}`}
                className="glass-card rounded-xl p-6 min-h-[320px] flex flex-col"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: EASING, delay: si * 0.15 }}
              >
                {/* Strategy header */}
                <motion.span
                  className="font-mono-data text-[11px] text-cyan-accent tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: si * 0.15 + 0.2 }}
                >
                  STRATEGY {strategy.number}
                </motion.span>
                <motion.h3
                  className="font-display text-xl font-semibold text-text-primary mt-1 mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: si * 0.15 + 0.3 }}
                >
                  {strategy.title}
                </motion.h3>
                <motion.p
                  className="text-text-secondary text-sm leading-relaxed mb-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: si * 0.15 + 0.4 }}
                >
                  {strategy.description}
                </motion.p>

                {/* Action checklist */}
                <div className="flex-1 space-y-3">
                  {strategy.actions.map((action, ai) => (
                    <motion.div
                      key={ai}
                      className="flex items-start gap-3 cursor-pointer group"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: si * 0.15 + 0.5 + ai * 0.1 }}
                      onClick={() => toggleAction(si, ai)}
                    >
                      <motion.div
                        className="mt-0.5 flex-shrink-0"
                        whileTap={{ scale: 1.3 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        {action.checked ? (
                          <CheckSquare className="w-4 h-4 text-cyan-accent" />
                        ) : (
                          <Square className="w-4 h-4 text-text-secondary/50 group-hover:text-text-secondary" />
                        )}
                      </motion.div>
                      <span
                        className={cn(
                          'text-sm transition-all duration-300',
                          action.checked
                            ? 'text-text-secondary/50 line-through'
                            : 'text-text-primary'
                        )}
                      >
                        {action.label}
                      </span>
                      <span
                        className={cn(
                          'font-mono-data text-[10px] px-1.5 py-0.5 rounded flex-shrink-0',
                          action.priority === 'P1' && 'bg-alert-red/20 text-alert-red',
                          action.priority === 'P2' && 'bg-warning-amber/20 text-warning-amber',
                          action.priority === 'P3' && 'bg-cyan-accent/20 text-cyan-accent',
                        )}
                      >
                        {action.priority}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Effect */}
                <motion.div
                  className="mt-5 pt-4 border-t border-white/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: si * 0.15 + 0.9 }}
                >
                  <span className="text-[11px] text-text-secondary/70">
                    预期效果:
                  </span>
                  <span className="text-[11px] text-success-teal ml-2">
                    {strategy.effect}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. HEDGING CONFIGURATOR
          ═══════════════════════════════════════════ */}
      <section className="w-full bg-deep-navy py-16 md:py-20">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASING }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Umbrella className="w-5 h-5 text-cyan-accent" />
              <h2 className="font-display text-2xl md:text-4xl font-semibold text-text-primary">
                对冲策略配置器
              </h2>
            </div>
            <p className="text-text-secondary text-sm">
              根据您的组合规模和对冲预算，生成定制化对冲方案
            </p>
          </motion.div>

          {/* Config Panel */}
          <motion.div
            className="glass-card rounded-xl p-6 md:p-8 max-w-[800px] mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASING, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Portfolio Size */}
              <div>
                <label className="font-mono-data text-[10px] text-text-secondary uppercase tracking-wider block mb-3">
                  组合总规模 ($万)
                </label>
                <div className="font-mono-data text-lg text-cyan-accent mb-3">
                  {(portfolioSize * 10).toLocaleString()}万
                </div>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={portfolioSize}
                  onChange={e => setPortfolioSize(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, #06B6D4 ${(portfolioSize - 10) / 990 * 100}%, rgba(255,255,255,0.1) ${(portfolioSize - 10) / 990 * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="font-mono-data text-[9px] text-text-secondary/50">100万</span>
                  <span className="font-mono-data text-[9px] text-text-secondary/50">1亿</span>
                </div>
              </div>

              {/* AI Exposure */}
              <div>
                <label className="font-mono-data text-[10px] text-text-secondary uppercase tracking-wider block mb-3">
                  当前AI敞口 (%)
                </label>
                <div className="font-mono-data text-lg text-warning-amber mb-3">
                  {aiExposure}%
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={aiExposure}
                  onChange={e => setAiExposure(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, #F59E0B ${aiExposure}%, rgba(255,255,255,0.1) ${aiExposure}%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="font-mono-data text-[9px] text-text-secondary/50">0%</span>
                  <span className="font-mono-data text-[9px] text-text-secondary/50">100%</span>
                </div>
              </div>

              {/* Hedge Budget */}
              <div>
                <label className="font-mono-data text-[10px] text-text-secondary uppercase tracking-wider block mb-3">
                  对冲预算 (%)
                </label>
                <div className="font-mono-data text-lg text-success-teal mb-3">
                  {hedgeBudget}%
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={hedgeBudget}
                  onChange={e => setHedgeBudget(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(90deg, #14B8A6 ${(hedgeBudget - 1) / 9 * 100}%, rgba(255,255,255,0.1) ${(hedgeBudget - 1) / 9 * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="font-mono-data text-[9px] text-text-secondary/50">1%</span>
                  <span className="font-mono-data text-[9px] text-text-secondary/50">10%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            className="glass-card rounded-xl p-6 md:p-8 max-w-[1000px] mx-auto mt-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASING, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-text-primary">
                推荐对冲方案
              </h3>
              <span className="font-mono-data text-[11px] text-warning-amber">
                基于当前{currentLevelData.label}等级 ({currentIndex})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[
                {
                  title: '指数期权对冲',
                  amount: putCost,
                  pct: '1.5%',
                  desc: `买入QQQ 3个月价外10%看跌期权`,
                  effect: `可保护约30%的AI敞口损失`,
                  color: '#1E3A8A',
                },
                {
                  title: 'VIX保险',
                  amount: vixCost,
                  pct: '1.0%',
                  desc: `买入VIX 25看涨期权`,
                  effect: `在恐慌性抛售中提供尾部保护`,
                  color: '#7F1D1D',
                },
                {
                  title: '做空ETF',
                  amount: shortCost,
                  pct: '0.5%',
                  desc: `配置SQQQ 2%组合权重`,
                  effect: `每日对冲纳斯达克波动`,
                  color: '#EF4444',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  className="rounded-lg p-4 border border-white/5"
                  style={{ backgroundColor: 'rgba(21,30,50,0.5)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, ease: EASING }}
                >
                  <h4 className="font-display text-base font-semibold text-text-primary mb-2">
                    {item.title}
                  </h4>
                  <div className="font-mono-data text-xl mb-1" style={{ color: item.color }}>
                    ${(item.amount).toLocaleString()}
                  </div>
                  <div className="font-mono-data text-[10px] text-text-secondary mb-3">
                    {item.pct} of AUM
                  </div>
                  <p className="text-text-secondary text-xs mb-2">{item.desc}</p>
                  <p className="text-success-teal text-xs">{item.effect}</p>
                </motion.div>
              ))}
            </div>

            {/* Summary bar */}
            <div className="rounded-lg p-4 border border-white/5" style={{ backgroundColor: 'rgba(21,30,50,0.8)' }}>
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                <div className="font-mono-data text-sm text-text-primary">
                  <span className="text-text-secondary mr-2">总对冲成本:</span>
                  ${hedgeCost.toLocaleString()}/年
                  <span className="text-text-secondary ml-2">({hedgeBudget}% of AUM)</span>
                </div>
                <div className="font-mono-data text-sm text-success-teal">
                  <span className="text-text-secondary mr-2">预期最大回撤保护:</span>
                  从 25% 降至 {protectedDD}%
                </div>
                <div className="font-mono-data text-sm text-cyan-accent">
                  <span className="text-text-secondary mr-2">成本效益比:</span>
                  1:{(25 / hedgeBudget).toFixed(1)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. ASSET ALLOCATION SIMULATOR
          ═══════════════════════════════════════════ */}
      <section className="max-w-[1000px] mx-auto px-4 md:px-6 py-16 md:py-20">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASING }}
        >
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon className="w-5 h-5 text-cyan-accent" />
            <h2 className="font-display text-2xl md:text-4xl font-semibold text-text-primary">
              资产配置模拟器
            </h2>
          </div>
          <p className="text-text-secondary text-sm ml-7">
            不同风险等级下的推荐资产配置比例
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-8">
          {RISK_LEVELS.map(level => {
            const isActive = selectedLevel === level.level
            return (
              <button
                key={level.level}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer',
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-text-secondary bg-white/5 hover:bg-white/10 hover:text-text-primary border border-white/10'
                )}
                style={isActive ? { backgroundColor: level.color } : {}}
                onClick={() => setSelectedLevel(level.level)}
              >
                <span className="mr-1">{level.label}</span>
                <span className="font-mono-data text-[10px] opacity-70">
                  {level.min}-{level.max}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content: Pie chart + allocation list */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          layout
          transition={{ duration: 0.5, ease: EASING }}
        >
          {/* Left — Pie Chart */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, ease: EASING }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={currentAlloc}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setHoveredAsset(currentAlloc[index]?.name || null)}
                  onMouseLeave={() => setHoveredAsset(null)}
                >
                  {currentAlloc.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                      style={{
                        filter: hoveredAsset === entry.name ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                        transform: hoveredAsset === entry.name ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-lg font-semibold text-text-primary">
                {currentLevelData.label}
              </span>
              {hoveredAsset && (
                <motion.span
                  className="font-mono-data text-sm mt-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {currentAlloc.find(a => a.name === hoveredAsset)?.value}%
                </motion.span>
              )}
            </div>
          </motion.div>

          {/* Right — Allocation list */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {currentAlloc.map((asset, i) => (
                <motion.div
                  key={`${selectedLevel}-${asset.name}`}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASING }}
                >
                  <span className="text-sm text-text-primary w-20 flex-shrink-0">
                    {asset.name}
                  </span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden bg-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: asset.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${asset.value}%` }}
                      transition={{ duration: 0.6, ease: EASING, delay: i * 0.05 + 0.2 }}
                    />
                  </div>
                  <span
                    className="font-mono-data text-sm w-10 text-right flex-shrink-0"
                    style={{ color: asset.color }}
                  >
                    {asset.value}%
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          6. HISTORICAL STRATEGY BACKTEST
          ═══════════════════════════════════════════ */}
      <section className="w-full bg-surface-dark py-12 md:py-16">
        <div className="max-w-[900px] mx-auto px-4 md:px-6">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASING }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <History className="w-5 h-5 text-cyan-accent" />
              <h3 className="font-display text-xl md:text-2xl font-semibold text-text-primary">
                历史策略回测
              </h3>
            </div>
            <p className="text-text-secondary text-sm">
              本系统过往风险等级调整与后续市场表现
            </p>
          </motion.div>

          <motion.div
            className="overflow-x-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASING, delay: 0.1 }}
          >
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-mono-data text-[11px] text-text-secondary uppercase tracking-wider font-medium">
                    日期
                  </th>
                  <th className="text-left py-3 px-4 font-mono-data text-[11px] text-text-secondary uppercase tracking-wider font-medium">
                    调整前等级
                  </th>
                  <th className="text-left py-3 px-4 font-mono-data text-[11px] text-text-secondary uppercase tracking-wider font-medium">
                    调整后等级
                  </th>
                  <th className="text-left py-3 px-4 font-mono-data text-[11px] text-text-secondary uppercase tracking-wider font-medium">
                    触发原因
                  </th>
                  <th className="text-right py-3 px-4 font-mono-data text-[11px] text-text-secondary uppercase tracking-wider font-medium">
                    30天表现
                  </th>
                  <th className="text-right py-3 px-4 font-mono-data text-[11px] text-text-secondary uppercase tracking-wider font-medium">
                    90天表现
                  </th>
                </tr>
              </thead>
              <tbody>
                {BACKTEST_DATA.map((row, i) => (
                  <motion.tr
                    key={row.date}
                    className={cn(
                      'border-b border-white/5 h-12 transition-colors hover:bg-white/[0.03]',
                      row.direction === 'upgrade' && 'border-l-[3px] border-l-alert-red',
                      row.direction === 'downgrade' && 'border-l-[3px] border-l-success-teal',
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: EASING }}
                  >
                    <td className="py-3 px-4 font-mono-data text-xs text-text-primary">
                      {row.date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono-data text-xs" style={{ color: getRiskLevel(row.prevScore).color }}>
                        {row.prevLevel} {row.prevScore}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono-data text-xs" style={{ color: getRiskLevel(row.newScore).color }}>
                        {row.newLevel} {row.newScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-text-primary">
                      {row.trigger}
                    </td>
                    <td className={cn(
                      'py-3 px-4 font-mono-data text-xs text-right',
                      row.perf30d.startsWith('+') ? 'text-success-teal' : 'text-alert-red'
                    )}>
                      {row.perf30d}
                    </td>
                    <td className={cn(
                      'py-3 px-4 font-mono-data text-xs text-right',
                      row.perf90d === '待观察'
                        ? 'text-text-secondary'
                        : row.perf90d.startsWith('+')
                          ? 'text-success-teal'
                          : 'text-alert-red'
                    )}>
                      {row.perf90d}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCROLL HINT
          ═══════════════════════════════════════════ */}
      <div className="w-full bg-deep-navy py-8">
        <motion.div
          className="flex flex-col items-center justify-center text-text-secondary/30"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Local icon components (no emoji)
   ────────────────────────────────────────────── */
function PieChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}
