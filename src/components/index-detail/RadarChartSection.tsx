import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { dimensions, riskLevelColors } from '@/data/bubbleData'
import type { Dimension } from '@/data/bubbleData'

const radarData = dimensions.map((d) => ({
  dimension: d.name,
  fullMark: 100,
  score: d.score,
  raw: d,
}))

function getScoreColor(score: number) {
  if (score <= 40) return '#14B8A6'
  if (score <= 55) return '#3B82F6'
  if (score <= 70) return '#F59E0B'
  if (score <= 80) return '#EF4444'
  return '#7F1D1D'
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      raw: Dimension
    }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload.raw
  const colors = riskLevelColors[data.riskLevel]

  return (
    <div className="glass-card rounded-lg p-3 min-w-[180px]">
      <p className="font-display text-sm font-semibold text-text-primary mb-1">
        {data.name}
      </p>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors.text,
            boxShadow: `0 0 6px ${colors.glow}`,
          }}
        />
        <span className="font-mono-data text-xs" style={{ color: colors.text }}>
          {data.riskLabel} {data.score}
        </span>
      </div>
      <p className="font-mono-data text-[10px] text-text-secondary">
        权重 {(data.weight * 100).toFixed(0)}%
      </p>
      <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">
        {data.keyMetric}
      </p>
    </div>
  )
}

export default function RadarChartSection() {
  const [hoveredDim, setHoveredDim] = useState<string | null>(null)

  const handleMouseEnter = useCallback((dimName: string) => {
    setHoveredDim(dimName)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredDim(null)
  }, [])

  return (
    <section className="w-full bg-surface-dark py-20">
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
            八大维度雷达图
          </h2>
          <p className="font-mono-data text-xs text-text-secondary uppercase tracking-wider">
            悬停顶点查看详细数据 · 点击图例筛选维度
          </p>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          className="relative w-full flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="w-full max-w-[700px] h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="75%"
                data={radarData}
              >
                <PolarGrid
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={1}
                  radialLines={true}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickCount={5}
                  axisLine={false}
                />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                    const isHovered = hoveredDim === payload.value
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isHovered ? '#06B6D4' : '#94A3B8'}
                        fontSize={isHovered ? 13 : 11}
                        fontFamily="Inter, sans-serif"
                        fontWeight={isHovered ? 600 : 400}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        {payload.value}
                      </text>
                    )
                  }}
                />
                <Radar
                  name="指数评分"
                  dataKey="score"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="#F59E0B"
                  fillOpacity={0.2}
                  dot={({ cx, cy, payload }: { cx: number; cy: number; payload: { dimension: string } }) => {
                    const isHovered = hoveredDim === payload.dimension
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 8 : 5}
                        fill="#F59E0B"
                        stroke="#0B1120"
                        strokeWidth={2}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      />
                    )
                  }}
                  activeDot={false}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          {dimensions.map((dim) => {
            const color = getScoreColor(dim.score)
            const isHovered = hoveredDim === dim.name
            return (
              <motion.div
                key={dim.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: isHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${isHovered ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                }}
                onMouseEnter={() => handleMouseEnter(dim.name)}
                onMouseLeave={handleMouseLeave}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-text-secondary font-body">
                  {dim.name}
                </span>
                <span className="font-mono-data text-[10px]" style={{ color }}>
                  {dim.score}
                </span>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
