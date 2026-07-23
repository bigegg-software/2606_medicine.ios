export type VitalInfoKey =
  | '血压'
  | '血糖'
  | '心率'
  | '睡眠'
  | '血氧'
  | '体温'
  | '步数'
  | '消耗'
  | '尿酸'
  | '血脂'
  | '体重';

export type VitalInfoLevel = {
  label: string;
  range: string;
};

export type VitalInfoTableRow = {
  /** 左侧大类，同组首行展示 */
  category?: string;
  label: string;
  systolic: string;
  diastolic: string;
};

export type VitalInfoSection = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type VitalInfoContent = {
  title: string;
  body: string;
  levels?: VitalInfoLevel[];
  table?: {
    headers: [string, string, string, string];
    rows: VitalInfoTableRow[];
  };
  sections?: VitalInfoSection[];
};

const VITAL_INFO_CONTENT: Record<VitalInfoKey, VitalInfoContent> = {
  血压: {
    title: '关于血压',
    body: '血液对血管壁的侧压力。收缩压是心脏挤血时的峰值压力，舒张压是心脏舒张时的最低压力。反映心脏泵血能力与血管弹性，是心血管健康的基础指标。',
    table: {
      headers: ['分类', '说明', '收缩压', '舒张压'],
      rows: [
        { category: '正常', label: '正常', systolic: '90–119', diastolic: '60–79' },
        { category: '正常', label: '正常高值', systolic: '120–139', diastolic: '或 80–89' },
        { category: '高血压', label: '轻度高血压', systolic: '140–159', diastolic: '或 90–99' },
        { category: '高血压', label: '中度高血压', systolic: '160–179', diastolic: '或 100–109' },
        { category: '高血压', label: '重度高血压', systolic: '≥180', diastolic: '或 ≥110' },
        { category: '低血压', label: '低血压', systolic: '<90', diastolic: '且/或 <60' },
      ],
    },
  },
  血糖: {
    title: '关于血糖',
    body: '血液中葡萄糖的浓度。来源于食物中的碳水化合物，由胰岛素调控进入细胞供能。反映糖代谢平衡状态，过高或过低均损害神经系统与各脏器功能。',
    sections: [
      {
        title: '空腹 / 餐前',
        headers: ['状态', '范围'],
        rows: [
          ['偏低', '＜3.9'],
          ['正常', '3.9～6.0'],
          ['偏高', '6.1～6.9'],
          ['高风险', '≥7.0'],
        ],
      },
      {
        title: '餐后2小时 / 餐后',
        headers: ['状态', '范围'],
        rows: [
          ['正常', '＜7.8'],
          ['偏高', '7.8～11.0'],
          ['高风险', '≥11.1'],
        ],
      },
      {
        title: '睡前',
        headers: ['睡前血糖', '判定', '含义'],
        rows: [
          ['< 5.6', '偏低', '夜间低血糖风险 ↑'],
          ['5.6 – 7.8', '正常', '安全区间'],
          ['7.9 – 10.0', '偏高', '夜间高血糖风险 ↑'],
          ['> 10.0', '高风险', '明显控制不佳'],
        ],
      },
      {
        title: '凌晨',
        headers: ['凌晨血糖', '判定', '含义'],
        rows: [
          ['< 3.9', '偏低', '重点报警'],
          ['3.9 – 5.6', '正常', '夜间安全'],
          ['5.7 – 7.0', '偏高', '夜间基础血糖偏高'],
          ['> 7.0', '高风险', '夜间持续高血糖'],
        ],
      },
    ],
  },
  心率: {
    title: '关于心率',
    body: '心脏每分钟搏动的频次。受交感神经与迷走神经双向调节，安静时偏慢表示泵血效率高。反映心脏自动节律性及自主神经功能的平衡状态。',
    levels: [
      { label: '偏低', range: '＜60 bpm 次/分' },
      { label: '正常', range: '60～100 bpm 次/分' },
      { label: '偏高', range: '＞100 bpm 次/分' },
    ],
  },
  睡眠: {
    title: '关于睡眠',
    body: '中枢神经系统主动调控的周期性静息状态，包含深睡（身体修复）和浅睡（记忆整理）。反映大脑恢复、免疫调节及内分泌平衡的综合质量。',
    levels: [
      { label: '85-100分', range: '睡眠质量 极佳' },
      { label: '75-84分', range: '睡眠质量 良好' },
      { label: '65-74分', range: '睡眠质量 一般' },
      { label: '55-64分', range: '睡眠质量 较差' },
      { label: '低于54分', range: '睡眠质量 差' },
    ],
  },
  血氧: {
    title: '关于血氧',
    body: '血液中氧合血红蛋白占全部血红蛋白的百分比。反映肺部的气体交换效率与血红蛋白的携氧能力，是判断呼吸循环系统供氧水平的关键参数。',
    sections: [
      {
        title: '参考标准',
        headers: ['范围', '状态', '含义'],
        rows: [
          ['≥ 95%', '正常', '血氧状态良好'],
          ['93%–94%', '偏低', '建议休息并持续观察'],
          ['90%–92%', '较低', '建议减少活动，必要时咨询医生'],
          ['< 90%', '异常偏低', '血氧过低，请及时就医'],
        ],
      },
    ],
  },
  体温: {
    title: '关于体温',
    body: '机体核心区域的温度，由下丘脑调节产热与散热平衡来维持。反映基础代谢强度和炎症反应状态，是筛查感染的核心生命体征之一。',
    levels: [
      { label: '正常', range: '36.0°C – 37.2°C' },
      { label: '偏高', range: '37.3°C – 37.9°C' },
      { label: '发热', range: '≥38.0°C' },
      { label: '偏低', range: '＜36.0°C' },
    ],
  },
  步数: {
    title: '关于步数',
    body: '通过传感器捕捉人体位移所累计的行走步数。反映日常体力活动的总量与移动频率，是评估骨骼肌功能、心肺耐力及社区活动半径的有效指标。',
  },
  消耗: {
    title: '关于消耗',
    body: '机体在基础代谢、食物消化和体力活动中所消耗的总热量。基础代谢占比最大，维持心跳呼吸等基本生命活动。反映全天能量平衡状态。',
  },
  尿酸: {
    title: '关于尿酸',
    body: '嘌呤代谢的终末产物，主要经肾脏随尿液排出。反映体内嘌呤代谢平衡及肾脏排泄功能。长期过高易形成尿酸盐结晶，沉积关节可致痛风性关节炎。',
    sections: [
      {
        title: '男',
        headers: ['分级', '状态', '范围'],
        rows: [
          ['正常', '正常', '208-420'],
          ['偏高', '偏高', '421-480'],
          ['高尿酸血症', '异常偏高', '＞480'],
        ],
      },
      {
        title: '女',
        headers: ['分级', '状态', '范围'],
        rows: [
          ['正常', '正常', '155-360'],
          ['偏高', '偏高', '361-420'],
          ['高尿酸血症', '异常偏高', '＞420'],
        ],
      },
    ],
  },
  血脂: {
    title: '关于血脂',
    body: '血液中脂肪类物质的总称，包含胆固醇与甘油三酯。低密度脂蛋白过多会沉积于血管壁形成斑块，高密度脂蛋白则有助于清除血管多余脂质。评估动脉粥样硬化风险的核心生物标志物。',
    sections: [
      {
        title: '总胆固醇（TC）',
        headers: ['分级', '状态', '范围'],
        rows: [
          ['正常', '正常', '＜5.2'],
          ['临界升高', '偏高', '5.2-6.2'],
          ['升高', '异常偏高', '≥6.2'],
        ],
      },
      {
        title: '低密度脂蛋白（LDL-C）',
        headers: ['分级', '状态', '范围'],
        rows: [
          ['理想', '正常', '＜3.4'],
          ['偏高', '偏高', '3.4-4.1'],
          ['高', '异常偏高', '≥4.1'],
        ],
      },
      {
        title: '高密度脂蛋白（HDL-C）',
        headers: ['分级', '状态', '范围'],
        rows: [
          ['正常', '正常', '≥1.0'],
          ['偏低', '偏低', '＜1.0'],
        ],
      },
      {
        title: '甘油三酯（TG）',
        headers: ['分级', '状态', '范围'],
        rows: [
          ['正常', '正常', '＜1.7'],
          ['临界升高', '偏高', '1.7-2.3'],
          ['升高', '异常偏高', '≥2.3'],
        ],
      },
    ],
  },
  体重: {
    title: '关于体重',
    body: '身体总质量，由肌肉、脂肪、骨骼和水分构成。反映能量摄入与消耗的长期平衡。体重过高增加关节与心血管负担，过低提示营养不良或肌少症风险，需关注变化趋势。',
  },
};

/** 首页「卡路里」对应消耗说明 */
const VITAL_INFO_ALIASES: Record<string, VitalInfoKey> = {
  卡路里: '消耗',
};

export function getVitalInfoContent(key: string): VitalInfoContent | null {
  const normalized = VITAL_INFO_ALIASES[key] ?? key;
  return VITAL_INFO_CONTENT[normalized as VitalInfoKey] ?? null;
}
