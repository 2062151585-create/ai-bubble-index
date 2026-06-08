import { marqueeMetrics } from '@/data/bubbleData'

export default function MetricsMarquee() {
  const metricsText = marqueeMetrics
    .map((m) => `${m.label} ${m.value}`)
    .join('  |  ')

  return (
    <section className="w-full h-[60px] bg-surface-dark overflow-hidden marquee-container relative">
      {/* Gradient fades on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-surface-dark to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface-dark to-transparent z-10 pointer-events-none" />

      <div className="flex items-center h-full">
        <div className="marquee-content flex animate-marquee whitespace-nowrap">
          <span className="font-mono-data text-sm text-text-primary px-4">
            {metricsText}
            {'  |  '}
            {metricsText}
            {'  |  '}
            {metricsText}
            {'  |  '}
            {metricsText}
          </span>
          <span className="font-mono-data text-sm text-text-primary px-4">
            {metricsText}
            {'  |  '}
            {metricsText}
            {'  |  '}
            {metricsText}
            {'  |  '}
            {metricsText}
          </span>
        </div>
      </div>

      {/* Live dot indicator */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-success-teal animate-live-dot" />
        <span className="font-mono-data text-[9px] text-success-teal uppercase tracking-wider">
          Live
        </span>
      </div>
    </section>
  )
}
