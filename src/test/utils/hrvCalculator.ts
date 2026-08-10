/**
 * HRV指标计算工具
 * 基于RR间隔数据计算核心HRV指标
 */

/**
 * 计算RMSSD指标 (Root Mean Square of Successive Differences)
 * 这是反映副交感神经活动最敏感的指标之一
 * @param rrs RR间隔数组 (单位: 毫秒)
 * @returns RMSSD值
 */
export function calculateRMSSD(rrs: number[]): number | null {
  // 检查数据是否足够计算
  if (!rrs || rrs.length < 2) {
    return null;
  }

  let sumSquaredDifferences = 0;
  for (let i = 1; i < rrs.length; i++) {
    const diff = rrs[i] - rrs[i - 1];
    sumSquaredDifferences += diff * diff;
  }

  const rmssd = Math.sqrt(sumSquaredDifferences / (rrs.length - 1));
  return Math.round(rmssd * 100) / 100; // 保留两位小数
}

/**
 * 计算SDNN指标 (Standard Deviation of NN intervals)
 * 反映整体心率变异性
 * @param rrs RR间隔数组 (单位: 毫秒)
 * @returns SDNN值
 */
export function calculateSDNN(rrs: number[]): number | null {
  // 检查数据是否足够计算
  if (!rrs || rrs.length < 2) {
    return null;
  }

  // 计算平均值
  const mean = rrs.reduce((sum, value) => sum + value, 0) / rrs.length;

  // 计算方差
  let sumSquaredDifferences = 0;
  for (const rr of rrs) {
    const diff = rr - mean;
    sumSquaredDifferences += diff * diff;
  }

  // 计算标准差
  const sdnn = Math.sqrt(sumSquaredDifferences / rrs.length);
  return Math.round(sdnn * 100) / 100; // 保留两位小数
}

/**
 * 计算平均RR间隔
 * @param rrs RR间隔数组 (单位: 毫秒)
 * @returns 平均RR间隔值
 */
export function calculateMeanRR(rrs: number[]): number | null {
  if (!rrs || rrs.length === 0) {
    return null;
  }

  const sum = rrs.reduce((acc, value) => acc + value, 0);
  const meanRR = sum / rrs.length;
  return Math.round(meanRR * 100) / 100; // 保留两位小数
}

/**
 * 计算心率变异性指标集合
 * 包含RMSSD、SDNN和平均RR三个核心指标
 * @param rrs RR间隔数组 (单位: 毫秒)
 * @returns HRV指标对象
 */
export function calculateHRVIndices(rrs: number[]): {
  rmssd: number | null;
  sdnn: number | null;
  meanRR: number | null;
} {
  return {
    rmssd: calculateRMSSD(rrs),
    sdnn: calculateSDNN(rrs),
    meanRR: calculateMeanRR(rrs)
  };
}

/**
 * 计算PPI数据的HRV指标
 * @param ppIntervals PPI间隔数组 (单位: 毫秒)
 * @returns HRV指标对象
 */
export function calculatePPIBasedHRV(ppIntervals: number[]): {
  rmssd: number | null;
  sdnn: number | null;
  meanRR: number | null;
} {
  // PPI数据可以直接作为RR间隔使用
  return calculateHRVIndices(ppIntervals);
}

export default {
  calculateRMSSD,
  calculateSDNN,
  calculateMeanRR,
  calculateHRVIndices,
  calculatePPIBasedHRV
};
