import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { dimensions, riskLevelColors } from '@/data/bubbleData'

interface DimensionMetric {
  name: string
  value: string
  description: string
}

interface DimensionDetail {
  id: string
  metrics: DimensionMetric[]
}

const dimensionDetails: DimensionDetail[] = [
  {
    id: 'valuation',
    metrics: [
      { name: 'CAPE（周期调整市盈率）', value: '40.7x', description: '155年历史中第三高，仅次于2000年互联网泡沫' },
      { name: '巴菲特指标', value: '333%', description: '创历史新高，超过2000年和2021年峰值' },
      { name: '市销率中位数', value: '3.2x', description: '处于历史95%分位' },
      { name: '小型增长股市销率', value: '8.5x', description: '接近泡沫区间' },
    ],
  },
  {
    id: 'capital-flow',
    metrics: [
      { name: 'ETF年度流入', value: '$1.28T', description: '创历史纪录，超过2021年' },
      { name: '散户年度流入', value: '$302B', description: 'meme股以来最高水平' },
      { name: '保证金债务/GDP', value: '4.09%', description: '接近历史极值' },
      { name: '共同基金现金比率', value: '3.8%', description: '接近历史最低' },
    ],
  },
  {
    id: 'infrastructure',
    metrics: [
      { name: 'AI电力瓶颈项目', value: '40%', description: '数据中心扩建受电网容量限制' },
      { name: '台积电先进工艺产能利用率', value: '92%', description: '接近满载' },
      { name: 'GPU交付周期', value: '36-48周', description: '供应严重紧张' },
      { name: '数据中心产能过剩风险指标', value: '65/100', description: '需关注规划与实际需求差距' },
    ],
  },
  {
    id: 'sentiment',
    metrics: [
      { name: 'CNN贪婪/恐惧指数', value: '78', description: '极度贪婪区间' },
      { name: '认为AI是泡沫的基金经理', value: '54%', description: '机构与散户观点显著背离' },
      { name: '散户情绪调查乐观比例', value: '68%', description: '处于历史高位' },
      { name: '媒体正面报道/负面报道比率', value: '4.2:1', description: '过度乐观信号' },
    ],
  },
  {
    id: 'market-structure',
    metrics: [
      { name: '前10大股票市值占比', value: '38%', description: '50年最高集中度' },
      { name: '赫芬达尔指数(HHI)同比变化', value: '+30%', description: '市场垄断程度快速上升' },
      { name: '被动投资占比', value: '58%', description: '持续创历史新高' },
      { name: '集中度风险评分', value: '71/100', description: '结构性脆弱性显著' },
    ],
  },
  {
    id: 'fundamentals',
    metrics: [
      { name: 'AI投资产生正ROI的企业比例', value: '5%', description: '绝大多数尚未实现回报' },
      { name: '平均投入产出比', value: '11.6:1', description: '资本效率偏低' },
      { name: 'AI收入占比>10%的企业', value: '12%', description: '商业化仍处于早期' },
      { name: '收入增长真实性评分', value: '72/100', description: '收入真实但效率存疑' },
    ],
  },
  {
    id: 'macro-policy',
    metrics: [
      { name: '核心PCE通胀', value: '3.2%', description: '粘滞不下，高于目标' },
      { name: '财政赤字', value: '$1.8T', description: '持续扩大' },
      { name: '美联储政策利率预期', value: 'Q4降息', description: '降息推迟，紧缩周期延长' },
      { name: '政策不确定性指数', value: '285', description: '处于高位波动' },
    ],
  },
  {
    id: 'geopolitics',
    metrics: [
      { name: '中美AI技术脱钩指数', value: '72/100', description: '技术脱钩持续深化' },
      { name: '台海风险评级', value: 'elevated', description: '地缘政治不确定性高企' },
      { name: 'DeepSeek冲击后市场份额变化', value: '-15%', description: '供应链格局发生显著变化' },
      { name: '供应链多元化指数', value: '45/100', description: '高度集中，替代能力有限' },
    ],
  },
]

function AccordionCard({
  dim,
  detail,
  index,
}: {
  dim: (typeof dimensions)[0]
  detail: DimensionDetail
  index: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const colors = riskLevelColors[dim.riskLevel]

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="mb-2"
    >
      <div
        className="glass-card rounded-lg overflow-hidden transition-all duration-300"
        style={{
          background: isOpen ? 'rgba(11, 17, 32, 0.9)' : undefined,
        }}
      >
        {/* Header - always visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left group"
        >
          {/* Left side */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className="font-mono-data text-sm text-cyan-accent shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-body text-base font-semibold text-text-primary">
                  {dim.name}
                </h3>
                <span className="font-mono-data text-[10px] text-text-secondary shrink-0">
                  权重 {(dim.weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 shrink-0 ml-4">
            <span
              className="font-display text-xl font-semibold"
              style={{ color: colors.text }}
            >
              {dim.score}
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono-data font-medium"
              style={{
                backgroundColor: `${colors.bg}33`,
                color: colors.text,
                border: `1px solid ${colors.border}44`,
              }}
            >
              {dim.riskLabel}
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            </motion.div>
          </div>
        </button>

        {/* Progress bar */}
        <div className="h-[3px] bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-r-full"
            style={{ backgroundColor: colors.text }}
            initial={{ width: 0 }}
            whileInView={{ width: `${dim.score}%` }}
            viewport={{ once: true }}
            transition={{
              duration: 1,
              delay: index * 0.1 + 0.3,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
          />
        </div>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-3">
                <div className="space-y-3">
                  {detail.metrics.map((metric, mIdx) => (
                    <motion.div
                      key={metric.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: mIdx * 0.05,
                        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                      }}
                      className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-secondary mb-0.5">
                          {metric.name}
                        </p>
                        <p className="text-[11px] text-text-secondary/60 leading-relaxed">
                          {metric.description}
                        </p>
                      </div>
                      <span className="font-mono-data text-lg font-medium text-text-primary shrink-0">
                        {metric.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-white/5">
                  <span className="text-cyan-accent text-sm cursor-pointer hover:underline transition-all duration-200">
                    查看历史趋势 &rarr;
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function DimensionAccordion() {
  return (
    <section className="w-full py-20">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-text-primary mb-2">
            维度详情指标
          </h2>
          <p className="font-mono-data text-xs text-text-secondary uppercase tracking-wider">
            点击维度卡片展开查看完整指标数据
          </p>
        </motion.div>

        {/* Accordion List */}
        <div>
          {dimensions.map((dim, idx) => {
            const detail = dimensionDetails.find((d) => d.id === dim.id)
            if (!detail) return null
            return (
              <AccordionCard key={dim.id} dim={dim} detail={detail} index={idx} />
            )
          })}
        </div>
      </div>
    </section>
  )
}
