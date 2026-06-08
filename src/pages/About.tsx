import { useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  Radar,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  Calculator,
  Grid3X3,
  Upload,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  CircleDot,
  Cpu,
  TrendingUp,
  Brain,
  Layers,
  Globe,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

/* ──────────────────────── 8-dimension data per design spec ──────────────────────── */
const DIMENSIONS = [
  {
    num: '01',
    name: '估值',
    nameEn: 'Valuation',
    weight: 25,
    shortFormula: 'CAPE归一化 x0.35 + Buffett x0.3 + PS中位数 x0.2 + 小盘增长PS x0.15',
    formula: '估值 = min(100, (CAPE/45 x 35) + (Buffett/350 x 30) + (PS中位数/4 x 20) + (小盘增长PS/10 x 15))',
    sources: [
      { name: 'Shiller CAPE数据', url: 'https://shillerdata.com', freq: '月度', desc: '标普500周期调整市盈率' },
      { name: '美联储 Z.1 报告', url: 'https://fred.stlouisfed.org', freq: '季度', desc: '总市值/GDP' },
      { name: 'FactSet', url: 'https://factset.com', freq: '每日', desc: '市销率中位数' },
    ],
    backtest: '2000年预警准确率 94% · 2008年预警准确率 87%',
  },
  {
    num: '02',
    name: '资金流向',
    nameEn: 'Capital Flow',
    weight: 12,
    shortFormula: 'ETF流入/1.5T x0.3 + 散户流入/400B x0.25 + 保证金/GDP/5% x0.25 + 基金现金比倒数 x0.2',
    formula: '资金流 = min(100, (ETF流入/1.5T x 30) + (散户流入/400B x 25) + (保证金/GDP/5% x 25) + (基金现金比倒数 x 20))',
    sources: [
      { name: 'ETF.com 资金流向', url: 'https://etf.com', freq: '每日', desc: '全球ETF净流入' },
      { name: 'JPMorgan 散户流向', url: 'https://jpmorgan.com', freq: '每周', desc: '散户净买入数据' },
      { name: 'FINRA 保证金数据', url: 'https://finra.org', freq: '月度', desc: '保证金债务余额' },
    ],
    backtest: '2021年meme股预警准确率 89%',
  },
  {
    num: '03',
    name: '技术基础设施',
    nameEn: 'Infrastructure',
    weight: 10,
    shortFormula: '电力瓶颈% x0.35 + 台积电产能利用率/100 x0.25 + GPU交付周期/52周 x0.25 + 产能过剩指数 x0.15',
    formula: '技术 = min(100, (电力瓶颈% x 35) + (台积电产能利用率/100 x 25) + (GPU交付周期/52周 x 25) + (产能过剩指数 x 15))',
    sources: [
      { name: '麦肯锡全球研究院', url: 'https://mckinsey.com', freq: '季度', desc: 'AI电力需求报告' },
      { name: '台积电财报', url: 'https://tsmc.com', freq: '季度', desc: '产能利用率' },
      { name: 'Omdia', url: 'https://omdia.com', freq: '月度', desc: 'GPU供应链追踪' },
    ],
    backtest: '该维度为2024年新增，尚无完整回测周期',
  },
  {
    num: '04',
    name: '市场情绪',
    nameEn: 'Sentiment',
    weight: 15,
    shortFormula: 'CNN贪婪指数 x0.35 + 基金经理泡沫调查% x0.25 + 散户乐观% x0.25 + 媒体情绪比率/5 x0.15',
    formula: '情绪 = min(100, (CNN贪婪指数 x 0.35) + (基金经理泡沫调查% x 0.25) + (散户乐观% x 0.25) + (媒体情绪比率/5 x 15))',
    sources: [
      { name: 'CNN Fear & Greed', url: 'https://cnn.com', freq: '每日', desc: '综合情绪指数' },
      { name: 'BofA 基金经理调查', url: 'https://bankofamerica.com', freq: '月度', desc: '全球基金经理调研' },
      { name: 'AAII 散户情绪', url: 'https://aaii.com', freq: '每周', desc: '散户投资者情绪' },
    ],
    backtest: '2000年预警准确率 91% · 2021年预警准确率 85%',
  },
  {
    num: '05',
    name: '市场结构',
    nameEn: 'Market Structure',
    weight: 20,
    shortFormula: '前10大占比/50% x0.3 + HHI变化%/50 x0.25 + 被动投资%/70 x0.25 + 集中度风险 x0.2',
    formula: '结构 = min(100, (前10大占比/50% x 30) + (HHI变化%/50 x 25) + (被动投资%/70 x 25) + (集中度风险 x 20))',
    sources: [
      { name: 'Bloomberg', url: 'https://bloomberg.com', freq: '每日', desc: '市值集中度数据' },
      { name: 'CRSP', url: 'https://crsp.org', freq: '月度', desc: '赫芬达尔指数' },
      { name: 'S&P Dow Jones', url: 'https://spglobal.com', freq: '季度', desc: '主动/被动资产比例' },
    ],
    backtest: '该维度在历史泡沫中均有显著信号，综合回测准确率 88%',
  },
  {
    num: '06',
    name: '基本面',
    nameEn: 'Fundamentals',
    weight: 20,
    shortFormula: '(100-ROI企业%)/95 x0.3 + 投入产出比/15 x0.25 + AI收入占比%/30 x0.25 + 收入增长真实性 x0.2',
    formula: '基本面 = min(100, ((100-ROI企业%)/95 x 30) + (投入产出比/15 x 25) + (AI收入占比%/30 x 25) + (收入增长真实性 x 20))',
    sources: [
      { name: '企业财报 SEC EDGAR', url: 'https://sec.gov', freq: '季度', desc: 'S&P500企业AI capex与ROI数据' },
      { name: 'Gartner', url: 'https://gartner.com', freq: '半年度', desc: 'AI投入产出调研' },
      { name: '麦肯锡', url: 'https://mckinsey.com', freq: '季度', desc: 'AI采用率追踪' },
    ],
    backtest: '基本面维度通常在泡沫后期才发出信号，提前期较短但准确率极高(96%)',
  },
  {
    num: '07',
    name: '宏观政策',
    nameEn: 'Macro Policy',
    weight: 10,
    shortFormula: '核心PCE/4% x0.3 + 财政赤字/GDP/10% x0.25 + 政策利率偏离度 x0.25 + 政策不确定性指数/500 x0.2',
    formula: '宏观 = min(100, (核心PCE/4% x 30) + (财政赤字/GDP/10% x 25) + (政策利率偏离度 x 25) + (政策不确定性指数/500 x 20))',
    sources: [
      { name: 'FRED 经济数据', url: 'https://fred.stlouisfed.org', freq: '每日', desc: 'PCE、利率、赤字数据' },
      { name: 'CBO 预算数据', url: 'https://cbo.gov', freq: '月度', desc: '财政预测' },
      { name: 'EPU 政策不确定性', url: 'https://policyuncertainty.com', freq: '月度', desc: '全球经济政策不确定性指数' },
    ],
    backtest: '2008年预警准确率 90%',
  },
  {
    num: '08',
    name: '地缘政治',
    nameEn: 'Geopolitics',
    weight: 10,
    shortFormula: '中美脱钩指数 x0.35 + 台海风险评级/100 x0.3 + 市场份额变化%/30 x0.2 + 供应链集中度 x0.15',
    formula: '地缘 = min(100, (中美脱钩指数 x 0.35) + (台海风险评级/100 x 0.30) + (市场份额变化%/30 x 0.20) + (供应链集中度 x 0.15))',
    sources: [
      { name: '荣鼎咨询', url: 'https://rhg.com', freq: '月度', desc: '中美技术脱钩追踪' },
      { name: 'IISS 安全评估', url: 'https://iiss.org', freq: '季度', desc: '台海风险评级' },
      { name: 'Omdia 市场份额', url: 'https://omdia.com', freq: '季度', desc: 'AI芯片市场份额' },
    ],
    backtest: '该维度为2024年新增，以定性数据为主',
  },
]

/* ──────────────────────── Data pipeline nodes ──────────────────────── */
const PIPELINE_NODES = [
  {
    step: '1',
    title: '数据采集',
    desc: '从15+权威数据源自动抓取最新数据',
    time: '00:00 UTC',
    icon: Download,
    color: '#06B6D4',
  },
  {
    step: '2',
    title: '数据清洗',
    desc: '异常值检测、缺失值补全、标准化处理',
    time: '00:15 UTC',
    icon: Filter,
    color: '#06B6D4',
  },
  {
    step: '3',
    title: '维度评分',
    desc: '8维度独立评分计算与交叉验证',
    time: '00:30 UTC',
    icon: Calculator,
    color: '#F59E0B',
  },
  {
    step: '4',
    title: '综合计算',
    desc: '加权汇总生成AI-BWI综合指数',
    time: '00:45 UTC',
    icon: Grid3X3,
    color: '#F59E0B',
  },
  {
    step: '5',
    title: '发布更新',
    desc: '网站实时更新，推送通知订阅用户',
    time: '01:00 UTC',
    icon: Upload,
    color: '#14B8A6',
  },
]

/* ──────────────────────── Data source categories ──────────────────────── */
const DATA_CATEGORIES = [
  {
    name: '宏观经济数据',
    icon: Globe,
    sources: [
      { name: '美联储 FRED', url: 'https://fred.stlouisfed.org', freq: '每日' },
      { name: '美国经济分析局 BEA', url: 'https://bea.gov', freq: '月度' },
      { name: '国会预算办公室 CBO', url: 'https://cbo.gov', freq: '月度' },
      { name: '国际货币基金组织 IMF', url: 'https://imf.org', freq: '季度' },
    ],
  },
  {
    name: '市场数据',
    icon: TrendingUp,
    sources: [
      { name: 'Bloomberg Terminal', url: 'https://bloomberg.com', freq: '实时' },
      { name: 'FactSet', url: 'https://factset.com', freq: '每日' },
      { name: 'S&P Global', url: 'https://spglobal.com', freq: '季度' },
      { name: 'FINRA', url: 'https://finra.org', freq: '月度' },
    ],
  },
  {
    name: '情绪与调查数据',
    icon: Brain,
    sources: [
      { name: 'CNN Business', url: 'https://cnn.com', freq: '每日' },
      { name: 'Bank of America', url: 'https://bankofamerica.com', freq: '月度' },
      { name: 'AAII', url: 'https://aaii.com', freq: '每周' },
      { name: '耶鲁大学投资者信心', url: 'https://icr.yale.edu', freq: '月度' },
    ],
  },
  {
    name: '行业研究',
    icon: Layers,
    sources: [
      { name: 'McKinsey Global Institute', url: 'https://mckinsey.com', freq: '季度' },
      { name: 'Gartner', url: 'https://gartner.com', freq: '半年度' },
      { name: 'Omdia', url: 'https://omdia.com', freq: '季度' },
      { name: '荣鼎咨询 Rhodium Group', url: 'https://rhg.com', freq: '月度' },
    ],
  },
]

/* ──────────────────────── Tech stack tags ──────────────────────── */
const TECH_TAGS = [
  'Python · FastAPI · Redis · PostgreSQL',
  'React · TypeScript · TailwindCSS · Recharts',
  'AWS · Docker · GitHub Actions · Cloudflare',
]

/* ──────────────────────── Dimension icon mapping ──────────────────────── */
const DIM_ICONS: Record<string, typeof Cpu> = {
  '01': Cpu,
  '02': TrendingUp,
  '03': Layers,
  '04': Brain,
  '05': Grid3X3,
  '06': BarChart3,
  '07': Shield,
  '08': Globe,
}

/* ════════════════════════════════════════════════════════════════════════
   ABOUT PAGE COMPONENT
   ════════════════════════════════════════════════════════════════════════ */
export default function About() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('about-expanded-cards')
      return saved ? new Set(JSON.parse(saved)) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const toggleCard = useCallback((num: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(num)) {
        next.delete(num)
      } else {
        next.add(num)
      }
      try {
        localStorage.setItem('about-expanded-cards', JSON.stringify([...next]))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  /* ── GSAP scroll animations ── */
  useGSAP(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      /* Hero H1 fade-in */
      gsap.from('.about-hero-title', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
      })

      /* Hero subtitle + breadcrumb */
      gsap.from('.about-hero-text', {
        opacity: 0,
        y: 20,
        duration: 0.7,
        stagger: 0.1,
        delay: 0.2,
        ease: 'power3.out',
      })

      /* Radar decoration */
      gsap.from('.radar-circle', {
        scale: 0.5,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        delay: 0.3,
        ease: 'power3.out',
      })
      gsap.from('.radar-axis', {
        opacity: 0,
        rotation: 0,
        duration: 1.2,
        delay: 0.4,
        ease: 'power3.out',
      })

      /* Philosophy cards */
      gsap.from('.philosophy-card', {
        scrollTrigger: {
          trigger: '.philosophy-section',
          start: 'top 80%',
          once: true,
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      })

      /* Philosophy icons bounce */
      gsap.from('.philosophy-icon', {
        scrollTrigger: {
          trigger: '.philosophy-section',
          start: 'top 75%',
          once: true,
        },
        scale: 0,
        duration: 0.6,
        stagger: 0.15,
        delay: 0.6,
        ease: 'back.out(1.7)',
      })

      /* Methodology cards slide in from right */
      gsap.from('.method-card', {
        scrollTrigger: {
          trigger: '.methodology-section',
          start: 'top 80%',
          once: true,
        },
        x: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: 'power3.out',
      })

      /* Pipeline nodes */
      gsap.from('.pipeline-node', {
        scrollTrigger: {
          trigger: '.pipeline-section',
          start: 'top 80%',
          once: true,
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
      })

      /* Pipeline arrows */
      gsap.from('.pipeline-arrow', {
        scrollTrigger: {
          trigger: '.pipeline-section',
          start: 'top 75%',
          once: true,
        },
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        delay: 0.8,
        ease: 'power3.out',
      })

      /* Tech stat cards */
      gsap.from('.tech-stat-card', {
        scrollTrigger: {
          trigger: '.tech-section',
          start: 'top 80%',
          once: true,
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
      })

      /* Tech tags */
      gsap.from('.tech-tag', {
        scrollTrigger: {
          trigger: '.tech-section',
          start: 'top 70%',
          once: true,
        },
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.5,
        ease: 'power3.out',
      })

      /* Data source categories */
      gsap.from('.source-category', {
        scrollTrigger: {
          trigger: '.sources-section',
          start: 'top 80%',
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      })

      /* Disclaimer */
      gsap.from('.disclaimer-block', {
        scrollTrigger: {
          trigger: '.disclaimer-block',
          start: 'top 90%',
          once: true,
        },
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="w-full">
      {/* ═══════════════════════════════════════════
          1. HERO HEADER
          ═══════════════════════════════════════════ */}
      <section className="relative w-full bg-deep-navy overflow-hidden" style={{ minHeight: '40vh' }}>
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px)',
          }}
        />

        <div className="relative max-w-[1200px] mx-auto px-4 md:px-6 pt-24 pb-16 flex flex-col md:flex-row items-center gap-8">
          {/* Left: text */}
          <div className="flex-1 md:w-[65%]">
            <p className="about-hero-text font-mono-data text-xs text-text-secondary tracking-wider mb-3">
              首页 / 关于方法论
            </p>
            <h1 className="about-hero-title font-display text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
              关于 AI-BWI
            </h1>
            <p className="about-hero-text text-text-secondary max-w-[560px] leading-relaxed">
              AI泡沫预警指数（AI Bubble Warning Index）是一个多维度量化风险评估系统，旨在为投资者提供AI行业泡沫风险的实时监测与预警
            </p>
          </div>

          {/* Right: radar decoration */}
          <div className="relative w-[240px] h-[240px] flex items-center justify-center md:w-[35%]">
            {/* Concentric circles */}
            {[240, 180, 120].map((d, i) => (
              <div
                key={d}
                className="radar-circle absolute rounded-full border"
                style={{
                  width: d,
                  height: d,
                  borderColor: `rgba(6, 182, 212, ${0.15 - i * 0.03})`,
                }}
              />
            ))}
            {/* Axes */}
            <div
              className="radar-axis absolute inset-0"
              style={{
                background: `
                  linear-gradient(0deg, transparent 49.5%, rgba(6,182,212,0.08) 49.5%, rgba(6,182,212,0.08) 50.5%, transparent 50.5%),
                  linear-gradient(90deg, transparent 49.5%, rgba(6,182,212,0.08) 49.5%, rgba(6,182,212,0.08) 50.5%, transparent 50.5%)
                `,
                transform: 'rotate(45deg)',
              }}
            />
            {/* Center pulsing dot */}
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-4 w-4 rounded-full bg-cyan-accent opacity-40 animate-ping" style={{ animationDuration: '3s' }} />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-accent" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. DESIGN PHILOSOPHY
          ═══════════════════════════════════════════ */}
      <section className="philosophy-section w-full py-20 md:py-24">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary text-center mb-12">
            设计哲学
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Multi-dimensional */}
            <div className="philosophy-card glass-card rounded-xl p-6 min-h-[220px] flex flex-col">
              <div className="philosophy-icon w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                <Radar className="w-6 h-6 text-cyan-accent" />
              </div>
              <h3 className="font-body text-lg font-semibold text-text-primary mb-3">
                多维而非单点
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                AI泡沫是一个复杂的系统现象，无法用单一指标（如PE或CAPE）完整捕捉。我们构建8维度评估框架，从估值、资金流、技术、情绪、结构、基本面、宏观、地缘八个角度交叉验证，确保评估的全面性和鲁棒性。
              </p>
            </div>

            {/* Card 2: Data-driven */}
            <div className="philosophy-card glass-card rounded-xl p-6 min-h-[220px] flex flex-col">
              <div className="philosophy-icon w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                <BarChart3 className="w-6 h-6 text-cyan-accent" />
              </div>
              <h3 className="font-body text-lg font-semibold text-text-primary mb-3">
                量化而非猜测
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                每个维度的评分都基于可验证的公开数据，经过标准化处理后映射到0-100分区间。权重体系经过历史回测优化，确保在2000年互联网泡沫和2008年金融危机等历史场景中能及时发出预警信号。
              </p>
            </div>

            {/* Card 3: Forward-looking */}
            <div className="philosophy-card glass-card rounded-xl p-6 min-h-[220px] flex flex-col">
              <div className="philosophy-icon w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                <RefreshCw className="w-6 h-6 text-cyan-accent" />
              </div>
              <h3 className="font-body text-lg font-semibold text-text-primary mb-3">
                动态而非静态
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                市场每天都在变化，指数也必须每天更新。我们的数据管道自动从15+个权威数据源抓取最新数据，每日凌晨(UTC)自动重新计算全部分数和综合指数，确保用户看到的永远是最新的风险评估。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. EIGHT-DIMENSION METHODOLOGY
          ═══════════════════════════════════════════ */}
      <section className="methodology-section w-full py-20 md:py-24 bg-surface-dark">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary text-center mb-2">
            八维度计算方法论
          </h2>
          <p className="text-center text-sm text-text-secondary mb-10">
            每个维度的评分逻辑、数据源与权重说明
          </p>

          <div className="flex flex-col gap-4">
            {DIMENSIONS.map((dim) => {
              const isExpanded = expandedCards.has(dim.num)
              const DimIcon = DIM_ICONS[dim.num]
              return (
                <div
                  key={dim.num}
                  className="method-card glass-card rounded-lg overflow-hidden transition-all duration-300"
                >
                  {/* Collapsed header */}
                  <button
                    onClick={() => toggleCard(dim.num)}
                    className="w-full flex items-center gap-3 px-4 py-4 md:px-5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Number + Icon */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-data text-sm text-cyan-accent w-8">
                        {dim.num}
                      </span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(6, 182, 212, 0.08)' }}>
                        <DimIcon className="w-4 h-4 text-cyan-accent" />
                      </div>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-base font-semibold text-text-primary">
                          {dim.name}
                        </span>
                        <span
                          className="font-mono-data text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}
                        >
                          权重 {dim.weight}%
                        </span>
                      </div>
                    </div>

                    {/* Short formula (desktop) */}
                    <div className="hidden lg:block flex-1 max-w-[400px]">
                      <span className="font-mono-data text-[11px] text-text-secondary truncate block">
                        {dim.shortFormula}
                      </span>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-text-secondary shrink-0 transition-transform duration-300',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* Expanded content */}
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-out',
                      isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1 border-t border-white/5">
                        {/* Formula block */}
                        <div className="bg-deep-navy rounded-md p-3 mb-4 font-mono-data text-[13px] text-text-primary leading-relaxed overflow-x-auto">
                          <span className="text-cyan-accent">$ </span>
                          {dim.formula}
                        </div>

                        {/* Data sources */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-text-primary mb-2">数据源</p>
                          <div className="flex flex-col gap-2">
                            {dim.sources.map((s) => (
                              <div key={s.name} className="flex items-start gap-2">
                                <CircleDot className="w-3 h-3 text-cyan-accent mt-1 shrink-0" />
                                <div>
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-text-primary hover:text-cyan-accent transition-colors inline-flex items-center gap-1"
                                  >
                                    {s.name}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <span className="font-mono-data text-[10px] text-cyan-accent ml-2">
                                    {s.freq}
                                  </span>
                                  <p className="text-xs text-text-secondary">{s.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Backtest */}
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-text-secondary" />
                          <span className="font-mono-data text-xs text-text-secondary">
                            {dim.backtest}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. DATA PIPELINE FLOW
          ═══════════════════════════════════════════ */}
      <section className="pipeline-section w-full py-20 md:py-24">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary text-center mb-2">
            数据自动更新管道
          </h2>
          <p className="text-center text-sm text-text-secondary mb-12">
            从数据采集到指数发布的全自动化流程
          </p>

          {/* Pipeline flow - horizontal on desktop, vertical on mobile */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-0 max-w-[900px] mx-auto">
            {PIPELINE_NODES.map((node, i) => {
              const NodeIcon = node.icon
              const isLast = i === PIPELINE_NODES.length - 1
              return (
                <div key={node.step} className="flex items-center">
                  {/* Node card */}
                  <div
                    className={cn(
                      'pipeline-node flex flex-col items-center text-center w-[140px] py-4 px-2 rounded-lg transition-all duration-300',
                      hoveredNode === node.step && 'bg-white/5 scale-105',
                      hoveredNode !== null && hoveredNode !== node.step && 'opacity-50'
                    )}
                    onMouseEnter={() => setHoveredNode(node.step)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                        isLast && 'animate-pulse'
                      )}
                      style={{ background: `${node.color}15` }}
                    >
                      <NodeIcon className="w-6 h-6" style={{ color: node.color }} />
                    </div>
                    {/* Step number */}
                    <span className="font-mono-data text-[10px] mb-1" style={{ color: node.color }}>
                      {node.step}
                    </span>
                    {/* Title */}
                    <span className="text-sm font-semibold text-text-primary mb-1">
                      {node.title}
                    </span>
                    {/* Description */}
                    <span className="text-[11px] text-text-secondary leading-tight mb-2">
                      {node.desc}
                    </span>
                    {/* Time */}
                    <span className="font-mono-data text-[11px] text-cyan-accent">
                      {node.time}
                    </span>
                  </div>

                  {/* Arrow between nodes */}
                  {!isLast && (
                    <div className="pipeline-arrow hidden md:flex items-center justify-center px-1">
                      <ChevronRight className="w-5 h-5 text-text-secondary/30" />
                    </div>
                  )}
                  {!isLast && (
                    <div className="pipeline-arrow flex md:hidden items-center justify-center py-1">
                      <ChevronDown className="w-5 h-5 text-text-secondary/30" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. TECHNICAL ARCHITECTURE
          ═══════════════════════════════════════════ */}
      <section className="tech-section w-full py-16 md:py-20 bg-deep-navy">
        <div className="max-w-[900px] mx-auto px-4 md:px-6">
          <h3 className="font-display text-2xl font-semibold text-text-primary text-center mb-10">
            技术能力与更新频率
          </h3>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { num: '15+', label: '数据源接入' },
              { num: '< 1h', label: '全流程更新耗时' },
              { num: '99.9%', label: '系统可用性' },
              { num: 'Daily', label: '每日自动更新' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="tech-stat-card glass-card rounded-lg p-4 flex flex-col items-center justify-center text-center"
                style={{ height: 120 }}
              >
                <span className="font-display text-3xl text-cyan-accent mb-2">
                  {stat.num}
                </span>
                <span className="text-[13px] text-text-secondary">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Tech tags */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {TECH_TAGS.map((tag) => (
              <span
                key={tag}
                className="tech-tag font-mono-data text-xs rounded-full px-4 py-2"
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  color: 'rgba(6, 182, 212, 0.7)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. DATA SOURCES
          ═══════════════════════════════════════════ */}
      <section className="sources-section w-full py-16 md:py-20">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6">
          <h3 className="font-display text-2xl font-semibold text-text-primary text-center mb-10">
            数据来源与合作伙伴
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DATA_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon
              return (
                <div key={cat.name} className="source-category glass-card rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CatIcon className="w-4 h-4 text-cyan-accent" />
                    <span className="text-sm font-semibold text-text-primary">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cat.sources.map((s) => (
                      <div key={s.name} className="flex items-center justify-between">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-text-secondary hover:text-cyan-accent transition-colors inline-flex items-center gap-1"
                        >
                          {s.name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="font-mono-data text-[10px] text-cyan-accent">
                          {s.freq}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Disclaimer */}
          <div className="disclaimer-block max-w-[700px] mx-auto mt-16 text-center relative">
            {/* Decorative side lines */}
            <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

            <div className="px-6">
              <p className="text-xs text-text-secondary leading-relaxed">
                <span className="text-warning-amber font-semibold mr-1">⚠ 免责声明：</span>
                AI-BWI指数及其相关分析仅供参考和教育目的，不构成任何投资建议。指数评分基于公开数据和统计模型，不保证预测准确性。投资者应根据自身情况做出独立判断，必要时咨询专业投资顾问。过往表现不代表未来结果。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
