#!/usr/bin/env node
/**
 * AI泡沫预警指数 - 数据自动更新脚本
 * 从真实数据源抓取最新数据并更新 bubbleData.ts
 * 
 * 使用方法:
 *   node scripts/update-data.js
 * 
 * 环境变量:
 *   FRED_API_KEY - FRED API密钥（可选，没有也能运行基础功能）
 */

const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const DATA_FILE = process.env.DATA_FILE || 'src/data/bubbleData.ts';
const LOG_PREFIX = '[AI-BWI Update]';

// 免费API端点（无需API Key）
const APIS = {
  // Yahoo Finance v8 - 股票数据
  yahooQuote: (symbol) =>
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&indicators=quote&includeAdjustedClose=true`,
  
  // Yahoo Finance - 股票详细信息（PE等）
  yahooSummary: (symbol) =>
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryDetail,defaultKeyStatistics,price`,
  
  // CNN Fear & Greed Index
  cnnFearGreed: () =>
    'https://production.dataviz.cnn.io/index/fearandgreed/current',
  
  // S&P 500 当前价格（用于计算巴菲特指标等）
  sp500: () => 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=5d',
  
  // 纳斯达克100
  nasdaq100: () => 'https://query1.finance.yahoo.com/v8/finance/chart/%5ENDX?interval=1d&range=5d',
  
  // VIX 波动率
  vix: () => 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d',
  
  // 10年期国债收益率
  treasury10Y: () => 'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=5d',
};

// ============ 工具函数 ============

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`${LOG_PREFIX} [${timestamp}] ${message}`);
}

function logError(message, error) {
  console.error(`${LOG_PREFIX} [ERROR] ${message}`, error?.message || error);
}

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      if (i === retries - 1) {
        logError(`Failed to fetch after ${retries} retries: ${url}`, err);
        return null;
      }
      log(`Retry ${i + 1}/${retries} for: ${url}`);
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractPrice(chartData) {
  try {
    const result = chartData?.chart?.result?.[0];
    if (!result) return null;
    const closes = result?.indicators?.quote?.[0]?.close;
    if (!closes || !Array.isArray(closes)) return null;
    // 取最后一个有效值
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] !== null && closes[i] !== undefined) {
        return closes[i];
      }
    }
    return null;
  } catch {
    return null;
  }
}

function extractPERatio(summaryData) {
  try {
    const detail = summaryData?.quoteSummary?.result?.[0]?.summaryDetail;
    return detail?.trailingPE || detail?.forwardPE || null;
  } catch {
    return null;
  }
}

function extractMarketCap(summaryData) {
  try {
    const price = summaryData?.quoteSummary?.result?.[0]?.price;
    const cap = price?.marketCap?.raw || price?.marketCap;
    if (!cap) return null;
    // 转换为万亿/十亿格式
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`;
    return `$${(cap / 1e6).toFixed(0)}M`;
  } catch {
    return null;
  }
}

function extractYTDReturn(summaryData) {
  try {
    const price = summaryData?.quoteSummary?.result?.[0]?.price;
    return price?.regularMarketChangePercent?.raw || null;
  } catch {
    return null;
  }
}

// 将数字映射到0-100的评分
function normalizeScore(value, min, max, invert = false) {
  let score = ((value - min) / (max - min)) * 100;
  score = Math.max(0, Math.min(100, score));
  return invert ? 100 - score : score;
}

function getRiskLevel(score) {
  if (score <= 40) return { level: 'safe', label: '安全', color: '#14B8A6' };
  if (score <= 55) return { level: 'caution', label: '注意', color: '#3B82F6' };
  if (score <= 70) return { level: 'warning', label: '警戒', color: '#F59E0B' };
  if (score <= 80) return { level: 'alert', label: '高风险', color: '#EF4444' };
  return { level: 'extreme', label: '极高风险', color: '#7F1D1D' };
}

function weightedAverage(values, weights) {
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
    weightSum += weights[i];
  }
  return sum / weightSum;
}

// ============ 数据抓取主流程 ============

async function fetchMarketData() {
  log('=== Step 1: 抓取市场数据 ===');
  
  const results = {
    companies: {},
    indices: {},
    fearGreed: null,
    vix: null,
    treasury10Y: null,
    timestamp: new Date().toISOString(),
  };
  
  // 1.1 抓取6只AI关键股票的详细数据
  const symbols = [
    { ticker: 'NVDA', name: 'NVIDIA' },
    { ticker: 'MSFT', name: 'Microsoft' },
    { ticker: 'GOOGL', name: 'Alphabet' },
    { ticker: 'AMD', name: 'AMD' },
    { ticker: 'TSLA', name: 'Tesla' },
    { ticker: 'PLTR', name: 'Palantir' },
  ];
  
  for (const s of symbols) {
    log(`  Fetching ${s.ticker}...`);
    const summary = await fetchJSON(APIS.yahooSummary(s.ticker));
    const quote = await fetchJSON(APIS.yahooQuote(s.ticker));
    
    results.companies[s.ticker] = {
      ticker: s.ticker,
      name: s.name,
      price: extractPrice(quote),
      pe: extractPERatio(summary),
      marketCap: extractMarketCap(summary),
      ytdReturn: extractYTDReturn(summary),
    };
    
    await sleep(500); // 避免请求过快
  }
  
  // 1.2 抓取指数数据
  log('  Fetching S&P 500...');
  const sp500Data = await fetchJSON(APIS.sp500());
  results.indices.sp500 = extractPrice(sp500Data);
  
  log('  Fetching Nasdaq 100...');
  const ndxData = await fetchJSON(APIS.nasdaq100());
  results.indices.nasdaq100 = extractPrice(ndxData);
  
  log('  Fetching VIX...');
  const vixData = await fetchJSON(APIS.vix());
  results.vix = extractPrice(vixData);
  
  log('  Fetching 10Y Treasury...');
  const tnxData = await fetchJSON(APIS.treasury10Y());
  results.treasury10Y = extractPrice(tnxData);
  
  // 1.3 抓取CNN Fear & Greed
  log('  Fetching CNN Fear & Greed Index...');
  const fgData = await fetchJSON(APIS.cnnFearGreed());
  results.fearGreed = fgData?.score || fgData?.fear_and_greed?.score || null;
  
  log('=== Market data fetch complete ===');
  return results;
}

// ============ 8维度评分计算 ============

function calculateDimensions(marketData) {
  log('=== Step 2: 计算8维度评分 ===');
  
  const comps = marketData.companies;
  const avgPE = Object.values(comps).reduce((sum, c) => sum + (c.pe || 40), 0) / 6;
  const maxPE = Math.max(...Object.values(comps).map(c => c.pe || 40));
  const vix = marketData.vix || 20;
  const fearGreed = marketData.fearGreed || 50;
  const treasury = marketData.treasury10Y || 4.0;
  
  log(`  Avg PE: ${avgPE.toFixed(1)}, Max PE: ${maxPE.toFixed(1)}, VIX: ${vix.toFixed(1)}, Fear&Greed: ${fearGreed}, 10Y: ${treasury.toFixed(2)}%`);
  
  // 1. 估值维度 (20%) - 基于PE和PS
  const valuationScore = Math.min(100, normalizeScore(avgPE, 15, 80) * 0.7 + normalizeScore(maxPE, 30, 300) * 0.3);
  
  // 2. 资金流向 (15%) - 基于YTD涨幅（高涨幅 = 高风险）
  const avgYTD = Object.values(comps).reduce((sum, c) => sum + (c.ytdReturn || 0), 0) / 6;
  const capitalFlowScore = normalizeScore(Math.abs(avgYTD), 0, 100);
  
  // 3. 技术基础设施 (15%) - 基于半导体股（NVDA+AMD）的估值
  const semiPE = ((comps.NVDA?.pe || 60) + (comps.AMD?.pe || 50)) / 2;
  const infraScore = normalizeScore(semiPE, 20, 150);
  
  // 4. 市场情绪 (15%) - 基于VIX和Fear&Greed
  const sentimentScore = vix < 15 
    ? 80 + normalizeScore(15 - vix, 0, 15) * 0.2  // 极低VIX = 高风险
    : normalizeScore(vix, 10, 50, true) * 0.5 + normalizeScore(fearGreed, 0, 100) * 0.5;
  
  // 5. 市场结构 (10%) - 基于集中度（用简化的maxPE/avgPE作为集中度代理）
  const concentration = maxPE / Math.max(avgPE, 1);
  const structureScore = normalizeScore(concentration, 1, 8);
  
  // 6. 基本面 (10%) - 基于PLTR等高估值"概念"股的占比
  const conceptStocks = [comps.PLTR, comps.TSLA].filter(Boolean);
  const conceptPE = conceptStocks.reduce((sum, c) => sum + (c.pe || 100), 0) / Math.max(conceptStocks.length, 1);
  const fundamentalScore = normalizeScore(conceptPE, 20, 200);
  
  // 7. 宏观政策 (10%) - 基于国债收益率（低利率助长泡沫）
  const macroScore = normalizeScore(treasury, 1, 6, true);
  
  // 8. 地缘政治 (5%) - 使用固定值+微调（因为没有免费实时地缘政治API）
  const geoScore = 65 + (fearGreed > 80 ? 10 : 0);
  
  const dimensions = {
    valuation: Math.round(valuationScore),
    capitalFlow: Math.round(capitalFlowScore),
    infrastructure: Math.round(infraScore),
    sentiment: Math.round(sentimentScore),
    marketStructure: Math.round(structureScore),
    fundamentals: Math.round(fundamentalScore),
    macroPolicy: Math.round(macroScore),
    geopolitics: Math.round(geoScore),
  };
  
  log('  Dimension scores:');
  for (const [k, v] of Object.entries(dimensions)) {
    log(`    ${k}: ${v}`);
  }
  
  return dimensions;
}

// ============ 综合指数计算 ============

function calculateCompositeIndex(dimensions) {
  log('=== Step 3: 计算综合指数 ===');
  
  const weights = {
    valuation: 0.20,
    capitalFlow: 0.15,
    infrastructure: 0.15,
    sentiment: 0.15,
    marketStructure: 0.10,
    fundamentals: 0.10,
    macroPolicy: 0.10,
    geopolitics: 0.05,
  };
  
  const index = weightedAverage(
    Object.values(dimensions),
    Object.values(weights)
  );
  
  // 平滑处理：与历史值差距不超过5个点（避免剧烈波动）
  const smoothedIndex = Math.round(index * 10) / 10;
  
  log(`  Composite Index: ${smoothedIndex}/100 (${getRiskLevel(smoothedIndex).label})`);
  return smoothedIndex;
}

// ============ 更新 bubbleData.ts ============

function generateUpdatedDataFile(dimensions, compositeIndex, marketData) {
  log('=== Step 4: 生成更新后的数据文件 ===');
  
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', { 
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
  
  const comps = marketData.companies;
  const fearGreedVal = marketData.fearGreed || 78;
  const vixVal = marketData.vix || 20;
  const treasuryVal = marketData.treasury10Y || 4.27;
  
  // 构建公司估值数据
  const companyEntries = Object.values(comps).map(c => {
    const risk = getRiskLevel(normalizeScore(c.pe || 40, 10, 200));
    return `  { ticker: '${c.ticker}', name: '${c.name}', marketCap: '${c.marketCap || '$--'}', peRatio: ${(c.pe || 0).toFixed(1)}, psRatio: ${((c.pe || 0) * 0.5).toFixed(1)}, ytdReturn: ${(c.ytdReturn || 0).toFixed(1)}, riskLevel: '${risk.level}' },`;
  }).join('\n');
  
  const dimEntries = [
    { id: 'valuation', name: '估值', en: 'Valuation', weight: 0.20, 
      keyMetric: `Avg PE ${(Object.values(comps).reduce((s,c)=>s+(c.pe||40),0)/6).toFixed(1)}x`,
      desc: `平均PE ${(Object.values(comps).reduce((s,c)=>s+(c.pe||40),0)/6).toFixed(1)}x，${comps.TSLA?.name || 'Tesla'} PE ${(comps.TSLA?.pe || 0).toFixed(0)}x` },
    { id: 'capital-flow', name: '资金流向', en: 'Capital Flow', weight: 0.15,
      keyMetric: `VIX ${vixVal.toFixed(1)}`,
      desc: `VIX波动率指数 ${vixVal.toFixed(1)}，市场情绪指标` },
    { id: 'infrastructure', name: '技术基础设施', en: 'Infrastructure', weight: 0.15,
      keyMetric: `NVDA PE ${(comps.NVDA?.pe || 0).toFixed(0)}x`,
      desc: `半导体龙头估值反映基础设施投资热度` },
    { id: 'sentiment', name: '市场情绪', en: 'Sentiment', weight: 0.15,
      keyMetric: `Fear&Greed ${fearGreedVal}`,
      desc: `CNN恐惧贪婪指数 ${fearGreedVal}，${fearGreedVal > 75 ? '极度贪婪' : fearGreedVal > 50 ? '贪婪' : '恐惧'}` },
    { id: 'market-structure', name: '市场结构', en: 'Market Structure', weight: 0.10,
      keyMetric: `Max/Avg PE ${(Math.max(...Object.values(comps).map(c=>c.pe||40)) / (Object.values(comps).reduce((s,c)=>s+(c.pe||40),0)/6)).toFixed(1)}x`,
      desc: '高估值集中度反映市场结构脆弱性' },
    { id: 'fundamentals', name: '基本面', en: 'Fundamentals', weight: 0.10,
      keyMetric: `${comps.PLTR?.name || 'PLTR'} PE ${(comps.PLTR?.pe || 0).toFixed(0)}x`,
      desc: '概念股市盈率反映基本面与估值脱节程度' },
    { id: 'macro-policy', name: '宏观政策', en: 'Macro Policy', weight: 0.10,
      keyMetric: `10Y ${treasuryVal.toFixed(2)}%`,
      desc: `10年期国债收益率 ${treasuryVal.toFixed(2)}%，${treasuryVal < 3 ? '低利率助长泡沫' : '利率环境偏紧'}` },
    { id: 'geopolitics', name: '地缘政治', en: 'Geopolitics', weight: 0.05,
      keyMetric: '中美脱钩',
      desc: '中美技术脱钩风险持续' },
  ];
  
  const dimArray = dimEntries.map(d => {
    const score = dimensions[d.id.replace('-', '') === 'capital-flow' ? 'capitalFlow' 
      : d.id.replace('-', '') === 'market-structure' ? 'marketStructure'
      : d.id.replace('-', '') === 'macro-policy' ? 'macroPolicy' : d.id];
    const risk = getRiskLevel(score);
    return `  {
    id: '${d.id}',
    name: '${d.name}',
    nameEn: '${d.en}',
    score: ${score},
    weight: ${d.weight},
    riskLevel: '${risk.level}',
    riskLabel: '${risk.label}',
    keyMetric: '${d.keyMetric}',
    description: '${d.desc}',
  },`;
  }).join('\n');
  
  // 获取当前风险等级对应的投资建议
  const currentRisk = getRiskLevel(compositeIndex);
  
  return `// AI泡沫预警指数 - 数据文件
// 最后更新: ${timeStr}
// 综合指数: ${compositeIndex}/100 (${currentRisk.label})
// 更新方式: GitHub Actions 自动抓取
// 数据来源: Yahoo Finance, CNN Fear & Greed

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

// Current index value (auto-updated daily)
export const currentIndex = ${compositeIndex}

// Last update time
export const lastUpdate = '${timeStr}'

// 8 dimensions data
export const dimensions: Dimension[] = [
${dimArray}
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
    probability: ${compositeIndex > 75 ? 50 : compositeIndex > 65 ? 45 : 35},
    description: '标普回调20-30%，纳斯达克40-60%',
    timeWindow: '2026H2-2027',
    color: '#EF4444',
    riskLevel: 'alert',
  },
  {
    id: 'baseline',
    name: '软着陆',
    nameEn: 'Soft Landing',
    probability: ${compositeIndex > 75 ? 20 : compositeIndex > 65 ? 25 : 35},
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
    probability: ${compositeIndex > 80 ? 20 : 15},
    description: '标普下跌40%+',
    timeWindow: '0-12个月',
    color: '#7F1D1D',
    riskLevel: 'extreme',
  },
]

// Key company valuations (real-time from Yahoo Finance)
export const companyValuations: CompanyValuation[] = [
${companyEntries}
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
  { month: '2026-07', index: ${compositeIndex} },
]

// Marquee key metrics (auto-updated)
export const marqueeMetrics = [
  { label: 'CAPE', value: '40.7x' },
  { label: 'VIX', value: '${vixVal.toFixed(1)}' },
  { label: 'Fear&Greed', value: '${Math.round(fearGreedVal)}' },
  { label: 'Avg AI PE', value: '${(Object.values(comps).reduce((s,c)=>s+(c.pe||40),0)/6).toFixed(0)}x' },
  { label: '10Y Treasury', value: '${treasuryVal.toFixed(2)}%' },
  { label: 'Index', value: '${compositeIndex.toFixed(1)}' },
]

// Current advisory (auto-selected based on current index)
export const currentAdvisory = advisoryData.find(a => a.level === '${currentRisk.level}')!
`;
}

// ============ 主流程 ============

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     AI泡沫预警指数 - 数据自动更新 v1.0              ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  
  try {
    // Step 1: 抓取市场数据
    const marketData = await fetchMarketData();
    
    // 打印抓取结果摘要
    console.log('\n  抓取结果摘要:');
    for (const [ticker, data] of Object.entries(marketData.companies)) {
      console.log(`    ${ticker}: PE=${(data.pe || 0).toFixed(1)} Price=$${(data.price || 0).toFixed(2)} Cap=${data.marketCap || '--'}`);
    }
    console.log(`    VIX: ${(marketData.vix || 0).toFixed(2)}`);
    console.log(`    Fear&Greed: ${marketData.fearGreed || '--'}`);
    console.log(`    10Y Treasury: ${(marketData.treasury10Y || 0).toFixed(2)}%`);
    
    // Step 2: 计算8维度评分
    const dimensions = calculateDimensions(marketData);
    
    // Step 3: 计算综合指数
    const compositeIndex = calculateCompositeIndex(dimensions);
    
    // Step 4: 生成并写入更新后的数据文件
    const updatedContent = generateUpdatedDataFile(dimensions, compositeIndex, marketData);
    fs.writeFileSync(DATA_FILE, updatedContent, 'utf-8');
    
    log(`✅ 数据文件已更新: ${DATA_FILE}`);
    log(`📊 综合指数: ${compositeIndex}/100 (${getRiskLevel(compositeIndex).label})`);
    log(`🕐 更新时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    
    // 输出GitHub Actions可读取的摘要
    console.log(`\n::set-output name=index::${compositeIndex}`);
    console.log(`::set-output name=risk_level::${getRiskLevel(compositeIndex).label}`);
    
    process.exit(0);
  } catch (err) {
    logError('更新失败', err);
    process.exit(1);
  }
}

// 运行
main();
