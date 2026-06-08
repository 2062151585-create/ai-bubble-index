import { lastUpdate } from '@/data/bubbleData'

export default function Footer() {
  return (
    <footer className="w-full bg-deep-navy border-t border-white/5">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Disclaimer */}
          <div className="flex-1">
            <p className="font-mono-data text-xs text-text-secondary leading-relaxed">
              <span className="text-warning-amber font-semibold mr-2">免责声明：</span>
              本指数仅供参考，不构成投资建议。投资有风险，决策需谨慎。
            </p>
          </div>

          {/* Data Sources */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <span className="font-mono-data text-[10px] text-text-secondary uppercase tracking-wider">
                数据来源
              </span>
              <div className="flex items-center gap-2">
                {['CNN', 'Bloomberg', 'FRED', 'Yahoo Finance'].map((source) => (
                  <span
                    key={source}
                    className="font-mono-data text-[10px] text-text-secondary/60 bg-white/5 px-2 py-1 rounded"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-2">
              <span className="font-mono-data text-[10px] text-text-secondary uppercase tracking-wider">
                最后更新
              </span>
              <span className="font-mono-data text-[10px] text-success-teal">
                {lastUpdate}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="font-mono-data text-[10px] text-text-secondary/40">
            AI Bubble Warning Index (AI-BWI) &copy; {new Date().getFullYear()}
          </p>
          <p className="font-mono-data text-[10px] text-text-secondary/40">
            Built with React 19 + Three.js + Recharts
          </p>
        </div>
      </div>
    </footer>
  )
}
