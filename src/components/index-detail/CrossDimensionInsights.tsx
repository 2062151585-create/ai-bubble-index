import { motion } from 'framer-motion'

interface Insight {
  title: string
  description: string
}

const insights: Insight[] = [
  {
    title: '三重悖论',
    description:
      '过度投资、极端估值、结构脆弱三重风险同时达到临界点，历史上罕见的三重叠加',
  },
  {
    title: '资本支出反馈循环',
    description:
      'capex放缓→收入miss→股价下跌→capex削减的负反馈已若隐若现',
  },
  {
    title: '"这次不同"双面性',
    description:
      'AI技术革命真实发生，但历史证明技术革命不能免疫估值回归规律',
  },
  {
    title: '散户-机构背离',
    description:
      '散户持续狂热（年度流入$302B）vs 机构持续撤离（巴菲特连续10季净卖出）',
  },
  {
    title: '全球AI两极化',
    description:
      '中美脱钩正在创造两个平行的AI生态系统，效率损失难以量化',
  },
  {
    title: '被动投资放大器',
    description:
      'ETF化是历史上从未有过的全新风险因素，下行时可能触发连锁被动卖出',
  },
  {
    title: '电力硬约束',
    description:
      '40%的AI项目受电力瓶颈制约，物理限制可能成为泡沫自然破裂的上限',
  },
  {
    title: '非线性临界特征',
    description:
      '指数从74→80分的过程中，泡沫破裂概率可能从30%跃升至60%，非线性跃变风险',
  },
]

function InsightRow({
  insight,
  index,
}: {
  insight: Insight
  index: number
}) {
  const isEven = index % 2 === 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="group"
    >
      <div
        className="flex items-start gap-5 py-6 px-4 md:px-6 transition-colors duration-200"
        style={{
          backgroundColor: isEven ? 'rgba(11, 17, 32, 0.6)' : 'rgba(21, 30, 50, 0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Number Badge */}
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: index * 0.1 + 0.2,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
        >
          <span className="font-mono-data text-base font-semibold text-warning-amber">
            {index + 1}
          </span>
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="font-body text-lg font-semibold text-text-primary mb-1.5 group-hover:text-warning-amber transition-colors duration-200">
            {insight.title}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function CrossDimensionInsights() {
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
            八大跨维度洞察
          </h2>
          <p className="font-mono-data text-xs text-text-secondary uppercase tracking-wider">
            超越单一指标的系统级风险信号
          </p>
        </motion.div>

        {/* Insights List */}
        <div className="rounded-xl overflow-hidden">
          {insights.map((insight, idx) => (
            <InsightRow key={insight.title} insight={insight} index={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}
