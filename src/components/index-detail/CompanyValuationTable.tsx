import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowRight, Minus } from 'lucide-react'

interface CompanyData {
  name: string
  ticker: string
  peTTM: string
  forwardPE: string
  peg: string
  riskLevel: string
  riskColor: string
  riskBg: string
  trend: 'up' | 'flat' | 'down'
  trendColor: string
}

const companies: CompanyData[] = [
  {
    name: '英伟达 NVIDIA',
    ticker: 'NVDA',
    peTTM: '31.4x',
    forwardPE: '23x',
    peg: '0.46',
    riskLevel: '合理偏高',
    riskColor: '#F59E0B',
    riskBg: 'rgba(245, 158, 11, 0.15)',
    trend: 'up',
    trendColor: '#06B6D4',
  },
  {
    name: '微软 Microsoft',
    ticker: 'MSFT',
    peTTM: '23-25x',
    forwardPE: '21x',
    peg: '1.0',
    riskLevel: '合理',
    riskColor: '#14B8A6',
    riskBg: 'rgba(20, 184, 166, 0.15)',
    trend: 'flat',
    trendColor: '#94A3B8',
  },
  {
    name: '谷歌 Alphabet',
    ticker: 'GOOGL',
    peTTM: '25-33x',
    forwardPE: '27x',
    peg: '0.85',
    riskLevel: '合理偏高',
    riskColor: '#F59E0B',
    riskBg: 'rgba(245, 158, 11, 0.15)',
    trend: 'flat',
    trendColor: '#94A3B8',
  },
  {
    name: 'AMD',
    ticker: 'AMD',
    peTTM: '135x',
    forwardPE: '45x',
    peg: '1.5',
    riskLevel: '泡沫',
    riskColor: '#EF4444',
    riskBg: 'rgba(239, 68, 68, 0.15)',
    trend: 'up',
    trendColor: '#06B6D4',
  },
  {
    name: '特斯拉 Tesla',
    ticker: 'TSLA',
    peTTM: '359x',
    forwardPE: '145x',
    peg: '5.0',
    riskLevel: '严重泡沫',
    riskColor: '#EF4444',
    riskBg: 'rgba(239, 68, 68, 0.15)',
    trend: 'up',
    trendColor: '#06B6D4',
  },
  {
    name: 'Palantir',
    ticker: 'PLTR',
    peTTM: '146-232x',
    forwardPE: '110x',
    peg: '8.0',
    riskLevel: '严重泡沫',
    riskColor: '#EF4444',
    riskBg: 'rgba(239, 68, 68, 0.15)',
    trend: 'up',
    trendColor: '#06B6D4',
  },
]

function TrendIcon({ trend, color }: { trend: CompanyData['trend']; color: string }) {
  if (trend === 'up') {
    return <ArrowUpRight className="w-4 h-4" style={{ color }} />
  }
  if (trend === 'flat') {
    return <ArrowRight className="w-4 h-4" style={{ color }} />
  }
  return <Minus className="w-4 h-4" style={{ color }} />
}

export default function CompanyValuationTable() {
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
            关键AI公司估值监测
          </h2>
          <p className="font-mono-data text-xs text-text-secondary uppercase tracking-wider">
            追踪AI产业链核心企业的估值水平
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          className="glass-card rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              {/* Header */}
              <thead>
                <tr
                  className="text-left"
                  style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}
                >
                  <th className="px-6 py-4 font-mono-data text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                    公司名称
                  </th>
                  <th className="px-4 py-4 font-mono-data text-[11px] font-medium text-text-secondary uppercase tracking-wider text-center">
                    PE(TTM)
                  </th>
                  <th className="px-4 py-4 font-mono-data text-[11px] font-medium text-text-secondary uppercase tracking-wider text-center">
                    Forward PE
                  </th>
                  <th className="px-4 py-4 font-mono-data text-[11px] font-medium text-text-secondary uppercase tracking-wider text-center">
                    PEG
                  </th>
                  <th className="px-4 py-4 font-mono-data text-[11px] font-medium text-text-secondary uppercase tracking-wider text-center">
                    风险等级
                  </th>
                  <th className="px-6 py-4 font-mono-data text-[11px] font-medium text-text-secondary uppercase tracking-wider text-right">
                    趋势
                  </th>
                </tr>
              </thead>
              {/* Body */}
              <tbody>
                {companies.map((company, idx) => (
                  <motion.tr
                    key={company.ticker}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: idx * 0.08,
                      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                    }}
                    className="group transition-all duration-200 hover:bg-white/[0.03]"
                    style={{
                      borderBottom:
                        idx < companies.length - 1
                          ? '1px solid rgba(255,255,255,0.05)'
                          : 'none',
                    }}
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ backgroundColor: company.riskColor }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {company.name}
                          </p>
                          <p className="font-mono-data text-[11px] text-text-secondary">
                            {company.ticker}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* PE TTM */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono-data text-sm text-text-primary">
                        {company.peTTM}
                      </span>
                    </td>
                    {/* Forward PE */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono-data text-sm text-text-primary">
                        {company.forwardPE}
                      </span>
                    </td>
                    {/* PEG */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-mono-data text-sm text-text-primary">
                        {company.peg}
                      </span>
                    </td>
                    {/* Risk Level */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-data font-medium"
                        style={{
                          backgroundColor: company.riskBg,
                          color: company.riskColor,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: company.riskColor,
                            boxShadow: `0 0 6px ${company.riskColor}`,
                          }}
                        />
                        {company.riskLevel}
                      </span>
                    </td>
                    {/* Trend */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <TrendIcon trend={company.trend} color={company.trendColor} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {companies.map((company, idx) => (
              <motion.div
                key={company.ticker}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
                className="p-4"
                style={{
                  borderBottom:
                    idx < companies.length - 1
                      ? '1px solid rgba(255,255,255,0.05)'
                      : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {company.name}
                    </p>
                    <p className="font-mono-data text-[11px] text-text-secondary">
                      {company.ticker}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-data font-medium"
                    style={{
                      backgroundColor: company.riskBg,
                      color: company.riskColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: company.riskColor,
                        boxShadow: `0 0 6px ${company.riskColor}`,
                      }}
                    />
                    {company.riskLevel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="font-mono-data text-[10px] text-text-secondary mb-0.5">
                      PE(TTM)
                    </p>
                    <p className="font-mono-data text-sm text-text-primary">
                      {company.peTTM}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono-data text-[10px] text-text-secondary mb-0.5">
                      Fwd PE
                    </p>
                    <p className="font-mono-data text-sm text-text-primary">
                      {company.forwardPE}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono-data text-[10px] text-text-secondary mb-0.5">
                      PEG
                    </p>
                    <p className="font-mono-data text-sm text-text-primary">
                      {company.peg}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono-data text-[10px] text-text-secondary">
                    趋势
                  </span>
                  <TrendIcon trend={company.trend} color={company.trendColor} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
