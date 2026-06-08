export interface Dimension {
  id: string
  name: string
  nameEn: string
  score: number
  weight: number
  riskLevel: 'safe' | 'caution' | 'warning' | 'alert' | 'extreme'
  riskLabel: string
  keyMetric: string
  description: string
}

export interface Scenario {
  id: string
  name: string
  nameEn: string
  probability: number
  description: string
  timeWindow: string
  color: string
  riskLevel: string
}

export interface CompanyValuation {
  ticker: string
  name: string
  marketCap: string
  peRatio: number
  psRatio: number
  ytdReturn: number
  riskLevel: string
}

export interface HistoricalBubble {
  name: string
  year: string
  peakIndex: number
  duration: string
  decline: string
  similarity: string
}

export interface MonthlyDataPoint {
  month: string
  index: number
}

export interface AdvisoryItem {
  level: string
  minScore: number
  maxScore: number
  color: string
  title: string
  actions: string[]
}

// Current index value
export const currentIndex = 73.2

// Last update time
export const lastUpdate = '2026年7月14日 14:32 CST'

// 8 dimensions data
export const dimensions: Dimension[] = [
  {
    id: 'valuation',
    name: '估值',
    nameEn: 'Valuation',
    score: 84,
    weight: 0.2,
    riskLevel: 'extreme',
    riskLabel: '极高',
    keyMetric: 'CAPE 40.7x（155年第三高）',
    description: '当前CAPE比率处于历史第三高位，远超长期均值。',
  },
  {
    id: 'capital-flow',
    name: '资金流向',
    nameEn: 'Capital Flow',
    score: 85,
    weight: 0.15,
    riskLevel: 'extreme',
    riskLabel: '极高',
    keyMetric: 'ETF年流入$1.28T创纪录',
    description: 'AI主题ETF资金流入创历史纪录，散户参与度极高。',
  },
  {
    id: 'infrastructure',
    name: '技术基础设施',
    nameEn: 'Infrastructure',
    score: 82,
    weight: 0.15,
    riskLevel: 'extreme',
    riskLabel: '极高',
    keyMetric: '电力瓶颈40%项目受阻',
    description: '数据中心电力供应紧张，40%新建项目面临延期。',
  },
  {
    id: 'sentiment',
    name: '市场情绪',
    nameEn: 'Sentiment',
    score: 78,
    weight: 0.15,
    riskLevel: 'alert',
    riskLabel: '高风险',
    keyMetric: 'CNN贪婪指数78',
    description: 'CNN恐惧贪婪指数处于极度贪婪区间。',
  },
  {
    id: 'market-structure',
    name: '市场结构',
    nameEn: 'Market Structure',
    score: 72,
    weight: 0.1,
    riskLevel: 'alert',
    riskLabel: '高风险',
    keyMetric: '前10大占比38%（50年最高）',
    description: '头部公司市值集中度达到50年最高水平。',
  },
  {
    id: 'fundamentals',
    name: '基本面',
    nameEn: 'Fundamentals',
    score: 61,
    weight: 0.1,
    riskLevel: 'warning',
    riskLabel: '警戒',
    keyMetric: '95%AI投资无ROI',
    description: '绝大多数AI相关企业尚未实现正向投资回报。',
  },
  {
    id: 'macro-policy',
    name: '宏观政策',
    nameEn: 'Macro Policy',
    score: 69,
    weight: 0.1,
    riskLevel: 'alert',
    riskLabel: '高风险',
    keyMetric: '财政赤字$1.8T',
    description: '美国财政赤字持续扩大，货币政策空间受限。',
  },
  {
    id: 'geopolitics',
    name: '地缘政治',
    nameEn: 'Geopolitics',
    score: 68,
    weight: 0.05,
    riskLevel: 'alert',
    riskLabel: '高风险',
    keyMetric: '中美脱钩深化',
    description: '中美技术脱钩趋势加剧，半导体出口管制升级。',
  },
]

// Risk level color mapping
export const riskLevelColors: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  safe: { bg: '#14B8A6', text: '#14B8A6', glow: 'rgba(20,184,166,0.5)', border: '#14B8A6' },
  caution: { bg: '#3B82F6', text: '#3B82F6', glow: 'rgba(59,130,246,0.5)', border: '#3B82F6' },
  warning: { bg: '#F59E0B', text: '#F59E0B', glow: 'rgba(245,158,11,0.5)', border: '#F59E0B' },
  alert: { bg: '#EF4444', text: '#EF4444', glow: 'rgba(239,68,68,0.5)', border: '#EF4444' },
  extreme: { bg: '#7F1D1D', text: '#EF4444', glow: 'rgba(127,29,29,0.6)', border: '#7F1D1D' },
}

// Risk level score ranges
export const riskLevelRanges = [
  { level: 'safe', label: '安全', min: 0, max: 40, color: '#14B8A6' },
  { level: 'caution', label: '注意', min: 40, max: 55, color: '#3B82F6' },
  { level: 'warning', label: '警戒', min: 55, max: 70, color: '#F59E0B' },
  { level: 'alert', label: '高风险', min: 70, max: 80, color: '#EF4444' },
  { level: 'extreme', label: '极高风险', min: 80, max: 100, color: '#7F1D1D' },
]

// Helper: get risk level from score
export function getRiskLevel(score: number) {
  if (score <= 40) return riskLevelRanges[0]
  if (score <= 55) return riskLevelRanges[1]
  if (score <= 70) return riskLevelRanges[2]
  if (score <= 80) return riskLevelRanges[3]
  return riskLevelRanges[4]
}

// Scenarios
export const scenarios: Scenario[] = [
  {
    id: 'pessimistic',
    name: '泡沫破裂',
    nameEn: 'Bubble Burst',
    probability: 45,
    description: '标普回调20-30%，纳斯达克40-60%',
    timeWindow: '2026H2-2027',
    color: '#EF4444',
    riskLevel: 'alert',
  },
  {
    id: 'baseline',
    name: '软着陆',
    nameEn: 'Soft Landing',
    probability: 25,
    description: '标普回调10-15%',
    timeWindow: '6-18个月',
    color: '#F59E0B',
    riskLevel: 'warning',
  },
  {
    id: 'optimistic',
    name: '生产率革命',
    nameEn: 'Productivity Revolution',
    probability: 15,
    description: '继续上涨20-30%',
    timeWindow: '18-36个月',
    color: '#14B8A6',
    riskLevel: 'safe',
  },
  {
    id: 'extreme',
    name: '系统性危机',
    nameEn: 'Systemic Crisis',
    probability: 15,
    description: '标普下跌40%+',
    timeWindow: '0-12个月',
    color: '#7F1D1D',
    riskLevel: 'extreme',
  },
]

// Key company valuations
export const companyValuations: CompanyValuation[] = [
  { ticker: 'NVDA', name: 'NVIDIA', marketCap: '$3.2T', peRatio: 72.5, psRatio: 35.2, ytdReturn: 145.3, riskLevel: 'extreme' },
  { ticker: 'MSFT', name: 'Microsoft', marketCap: '$3.1T', peRatio: 38.4, psRatio: 13.8, ytdReturn: 22.1, riskLevel: 'warning' },
  { ticker: 'GOOGL', name: 'Alphabet', marketCap: '$2.0T', peRatio: 28.6, psRatio: 6.4, ytdReturn: 35.7, riskLevel: 'caution' },
  { ticker: 'AMD', name: 'AMD', marketCap: '$280B', peRatio: 52.1, psRatio: 11.2, ytdReturn: 42.5, riskLevel: 'alert' },
  { ticker: 'TSLA', name: 'Tesla', marketCap: '$800B', peRatio: 68.3, psRatio: 8.9, ytdReturn: -15.2, riskLevel: 'alert' },
  { ticker: 'PLTR', name: 'Palantir', marketCap: '$120B', peRatio: 185.0, psRatio: 45.6, ytdReturn: 78.4, riskLevel: 'extreme' },
]

// Historical bubble comparison
export const historicalBubbles: HistoricalBubble[] = [
  { name: '郁金香狂热', year: '1634-1637', peakIndex: 85, duration: '3年', decline: '-95%', similarity: '中等' },
  { name: '南海泡沫', year: '1719-1720', peakIndex: 78, duration: '1年', decline: '-80%', similarity: '较高' },
  { name: '大萧条前', year: '1927-1929', peakIndex: 72, duration: '2年', decline: '-89%', similarity: '高' },
  { name: '日本泡沫', year: '1986-1989', peakIndex: 80, duration: '3年', decline: '-82%', similarity: '高' },
  { name: '互联网泡沫', year: '1997-2000', peakIndex: 88, duration: '3年', decline: '-78%', similarity: '极高' },
  { name: '次贷危机', year: '2006-2008', peakIndex: 65, duration: '2年', decline: '-57%', similarity: '中等' },
]

// Investment advisory by risk level
export const advisoryData: AdvisoryItem[] = [
  {
    level: 'safe',
    minScore: 0,
    maxScore: 40,
    color: '#14B8A6',
    title: 'AI敞口可适当增加',
    actions: [
      '可适度增加AI相关持仓至投资组合的30-40%',
      '关注基本面扎实的AI基础设施公司',
      '定期再平衡，锁定部分收益',
    ],
  },
  {
    level: 'caution',
    minScore: 40,
    maxScore: 55,
    color: '#3B82F6',
    title: '维持中性配置，精选个股',
    actions: [
      'AI持仓维持在投资组合的25-30%',
      '优先选择有实际收入和利润的AI公司',
      '设置止损线，防止回撤扩大',
    ],
  },
  {
    level: 'warning',
    minScore: 55,
    maxScore: 70,
    color: '#F59E0B',
    title: '降低AI敞口，增加防御',
    actions: [
      '将AI相关持仓降至投资组合的20-25%',
      '增配防御性资产：国债、黄金、公用事业',
      '减少高估值、无利润AI公司的敞口',
    ],
  },
  {
    level: 'alert',
    minScore: 70,
    maxScore: 80,
    color: '#EF4444',
    title: '大幅降低AI敞口，对冲风险',
    actions: [
      '将AI相关持仓降至投资组合的20%以下',
      '增配防御性资产：国债、黄金、公用事业',
      '考虑买入VIX看涨期权或纳斯达克100看跌期权进行对冲',
    ],
  },
  {
    level: 'extreme',
    minScore: 80,
    maxScore: 100,
    color: '#7F1D1D',
    title: '紧急减仓，全面避险',
    actions: [
      '将AI相关持仓降至投资组合的10%以下或清仓',
      '大幅增配国债、黄金、现金等避险资产',
      '积极使用期权对冲，考虑做空高估值标的',
    ],
  },
]

// Historical timeline data (monthly simulated data from 2020-2026)
export const historicalTimeline: MonthlyDataPoint[] = [
  { month: '2020-01', index: 32 },
  { month: '2020-02', index: 31 },
  { month: '2020-03', index: 28 },
  { month: '2020-04', index: 30 },
  { month: '2020-05', index: 32 },
  { month: '2020-06', index: 34 },
  { month: '2020-07', index: 35 },
  { month: '2020-08', index: 36 },
  { month: '2020-09', index: 37 },
  { month: '2020-10', index: 38 },
  { month: '2020-11', index: 40 },
  { month: '2020-12', index: 42 },
  { month: '2021-01', index: 44 },
  { month: '2021-02', index: 45 },
  { month: '2021-03', index: 46 },
  { month: '2021-04', index: 48 },
  { month: '2021-05', index: 47 },
  { month: '2021-06', index: 49 },
  { month: '2021-07', index: 50 },
  { month: '2021-08', index: 51 },
  { month: '2021-09', index: 50 },
  { month: '2021-10', index: 52 },
  { month: '2021-11', index: 54 },
  { month: '2021-12', index: 55 },
  { month: '2022-01', index: 56 },
  { month: '2022-02', index: 54 },
  { month: '2022-03', index: 50 },
  { month: '2022-04', index: 48 },
  { month: '2022-05', index: 46 },
  { month: '2022-06', index: 45 },
  { month: '2022-07', index: 47 },
  { month: '2022-08', index: 48 },
  { month: '2022-09', index: 47 },
  { month: '2022-10', index: 45 },
  { month: '2022-11', index: 48 },
  { month: '2022-12', index: 50 },
  { month: '2023-01', index: 51 },
  { month: '2023-02', index: 52 },
  { month: '2023-03', index: 53 },
  { month: '2023-04', index: 55 },
  { month: '2023-05', index: 56 },
  { month: '2023-06', index: 58 },
  { month: '2023-07', index: 60 },
  { month: '2023-08', index: 61 },
  { month: '2023-09', index: 62 },
  { month: '2023-10', index: 63 },
  { month: '2023-11', index: 64 },
  { month: '2023-12', index: 66 },
  { month: '2024-01', index: 67 },
  { month: '2024-02', index: 68 },
  { month: '2024-03', index: 70 },
  { month: '2024-04', index: 69 },
  { month: '2024-05', index: 71 },
  { month: '2024-06', index: 72 },
  { month: '2024-07', index: 73 },
  { month: '2024-08', index: 72 },
  { month: '2024-09', index: 74 },
  { month: '2024-10', index: 73 },
  { month: '2024-11', index: 75 },
  { month: '2024-12', index: 76 },
  { month: '2025-01', index: 77 },
  { month: '2025-02', index: 76 },
  { month: '2025-03', index: 78 },
  { month: '2025-04', index: 77 },
  { month: '2025-05', index: 79 },
  { month: '2025-06', index: 78 },
  { month: '2025-07', index: 80 },
  { month: '2025-08', index: 81 },
  { month: '2025-09', index: 80 },
  { month: '2025-10', index: 82 },
  { month: '2025-11', index: 81 },
  { month: '2025-12', index: 83 },
  { month: '2026-01', index: 82 },
  { month: '2026-02', index: 84 },
  { month: '2026-03', index: 83 },
  { month: '2026-04', index: 85 },
  { month: '2026-05', index: 84 },
  { month: '2026-06', index: 85 },
  { month: '2026-07', index: 73.2 },
]

// Marquee key metrics
export const marqueeMetrics = [
  { label: 'CAPE', value: '40.7x' },
  { label: '巴菲特指标', value: '333%' },
  { label: 'CNN贪婪指数', value: '78' },
  { label: 'ETF年流入', value: '$1.28T' },
  { label: '散户年流入', value: '$302B' },
  { label: '保证金/GDP', value: '4.09%' },
]

// Current advisory (based on current index of 73.2, which falls in alert range 70-80)
export const currentAdvisory = advisoryData.find(a => a.level === 'alert')!
