import type {
  CommunityScreenReportDetail,
  FallPreventionItem,
  FallPreventionModuleAction,
  FallPreventionResult,
  FallPreventionRiskPointItem,
  FallPreventionWeekPlanItem,
} from '@/api/communityScreenReport';

/** 单条计分理论上限（①⑥ 可达 3） */
export const FALL_ITEM_SCORE_MAX = 3;

/**
 * 分项计分规则（产品表 ①–⑪）
 * - choiceScores：问卷 choiceIndex → 计分
 * - maxScore：该条计分满分（用于进度条 / S 满值）
 * - weight：权重（① 跌倒史 ×2，其余 ×1）
 */
export const FALL_ITEM_SCORE_RULES: Record<
  number,
  {
    maxScore: number;
    weight: number;
    choiceScores?: number[];
  }
> = {
  1: { maxScore: 3, weight: 2, choiceScores: [0, 2, 3] },
  2: { maxScore: 2, weight: 1, choiceScores: [0, 1, 2] },
  3: { maxScore: 2, weight: 1, choiceScores: [0, 1, 2] },
  4: { maxScore: 2, weight: 1, choiceScores: [0, 2] },
  5: { maxScore: 2, weight: 1, choiceScores: [0, 1, 2] },
  6: { maxScore: 3, weight: 1, choiceScores: [0, 1, 3] },
  7: { maxScore: 2, weight: 1 },
  8: { maxScore: 2, weight: 1 },
  9: { maxScore: 2, weight: 1 },
  10: { maxScore: 2, weight: 1 },
  11: { maxScore: 1, weight: 1 },
};

export const FALL_EXERCISE_TYPE_LABEL: Record<string, string> = {
  cardio: '有氧',
  strength: '抗阻',
  flexibility: '柔韧',
  balance: '平衡',
};

export const FALL_WEEKDAY_LABEL: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};

/** 风险分级参照（产品固定文案，非接口字段） */
export const FALL_RISK_REF_ROWS = [
  {
    level: '低',
    criteria: 'S < 4\n（且未触发门槛）',
    action: '健康教育 + 预防性平衡与力量维持训练（可选 D-Wall）',
  },
  {
    level: '中',
    criteria: '4 ≤ S ≤ 9\n（或门槛=至少中）',
    action: '强化平衡 + 渐进抗阻 + 步态训练（到店 D-Wall）',
  },
  {
    level: '高',
    criteria: 'S ≥ 10 或 门槛触发（近 3 个月跌倒≥2 次）',
    action: '转介医疗机构（不在店内跟练）',
  },
] as const;

/** 下一步与到店权益（接口未返回，前端固定） */
export const FALL_NEXT_STEP = {
  text: '到店完成『全套 8 维功能评估（D-Wall 客观量化）』，据此定制方案并由专业教练带练。',
  benefit: '到店权益: 99 元到店测评（全 8 维/D-Wall） + 赠1节私教康复体验课',
  highRiskText: '属高度跌倒风险，建议转介医疗机构评估，暂不在店内跟练。',
};

/** 备注免责（接口未返回，前端固定） */
export const FALL_REMARK_TEXT =
  '备注：本报告为跌倒风险初筛参考，非医疗诊断；如出现红旗症状（夜间静息痛 / 进行性麻木无力 / 新发跌倒后受伤 / 意识障碍等）请及时就医，高风险者不自行训练。分级阈值均为建议初值·待校准。';

/** 周计划下方 tip（接口未返回） */
export const FALL_PRESCRIPTION_TIP =
  '说明：L1 为『方向 + 配比 + 剂量 + 模块级动作建议』；到店 D-Wall 后升级为 L2 精准方案（动作级·个体化剂量）。';

const CIRCLE_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪'];
function text(value: unknown, fallback = '') {
  const str = String(value ?? '').trim();
  return str || fallback;
}

/** 结果列：问卷按 choiceIndex 拆成「选项」+「2」，客观项直接展示 resultStr */
function formatFallItemResultParts(item: {
  source?: string;
  choiceIndex?: number;
  resultStr?: string;
}) {
  if (item.source === 'question') {
    const choiceIndex = numOrNull(item.choiceIndex);
    if (choiceIndex != null && choiceIndex >= 0) {
      return {
        resultLabel: '选项',
        // choiceIndex 为 0 基，展示从 1 起：选项1 / 选项2
        resultNum: String(choiceIndex + 1),
      };
    }
  }
  return {
    resultLabel: '',
    resultNum: text(item.resultStr, '--'),
  };
}

function numOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatScore(value: unknown) {
  const n = numOrNull(value);
  return n == null ? '--' : String(n);
}

function formatRiskLevel(level: string) {
  const raw = text(level);
  if (!raw) {
    return '--';
  }
  return raw.includes('风险') ? raw : `${raw}风险`;
}

function formatGateLevel(gateLevel: string) {
  const raw = text(gateLevel);
  if (!raw || raw === '低') {
    return '无';
  }
  return raw;
}

function exerciseLabel(type?: string) {
  const key = text(type);
  return FALL_EXERCISE_TYPE_LABEL[key] || key || '--';
}

function circleNo(no?: number | null) {
  if (no == null || no < 1) {
    return '';
  }
  return CIRCLE_NUMS[no - 1] || String(no);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** 从详情中取出防跌倒结果（兼容 reportInfo 嵌套） */
export function pickFallResult(
  data: CommunityScreenReportDetail | null | undefined,
): FallPreventionResult | null {
  if (!data) return null;
  if (data.fallPreventionResult) return data.fallPreventionResult;
  const reportInfo = asRecord(data.reportInfo);
  const nested = asRecord(reportInfo?.fallPreventionResult);
  if (nested) return nested as FallPreventionResult;
  return null;
}

/** 解析分项序号 ①–⑪（优先 no，其次名称 / itemKey） */
export function resolveFallItemNo(item: FallPreventionItem) {
  const no = numOrNull(item.no);
  if (no != null && no >= 1 && no <= 11) {
    return no;
  }
  const name = text(item.name);
  const key = text(item.itemKey).toLowerCase();
  if (name.includes('跌倒') || key.includes('fall')) {
    return 1;
  }
  if (name.includes('辅助') || name.includes('拐杖') || name.includes('助行') || name.includes('轮椅')) {
    return 2;
  }
  if (name.includes('稳定')) {
    return 3;
  }
  if (name.includes('医疗设备') || name.includes('输液') || name.includes('导尿')) {
    return 4;
  }
  if (name.includes('起夜') || name.includes('尿急')) {
    return 5;
  }
  if (name.includes('意识') || name.includes('注意力')) {
    return 6;
  }
  if (name.includes('步速') || name.includes('4米') || key.includes('gait') || key.includes('speed')) {
    return 7;
  }
  if (name.includes('TUG') || name.includes('起立行走') || key.includes('tug')) {
    return 8;
  }
  if (name.includes('坐站') || name.includes('起坐') || key.includes('sit')) {
    return 9;
  }
  if (
    name.includes('平衡') ||
    name.includes('Romberg') ||
    key.includes('balance') ||
    key.includes('romberg')
  ) {
    return 10;
  }
  if (name.includes('握力') || key.includes('grip')) {
    return 11;
  }
  return null;
}

export function resolveFallItemScoreMax(item: FallPreventionItem) {
  const no = resolveFallItemNo(item);
  if (no != null && FALL_ITEM_SCORE_RULES[no]) {
    return FALL_ITEM_SCORE_RULES[no].maxScore;
  }
  return FALL_ITEM_SCORE_MAX;
}

export function resolveFallItemWeight(item: FallPreventionItem) {
  const no = resolveFallItemNo(item);
  if (no != null && FALL_ITEM_SCORE_RULES[no]) {
    return FALL_ITEM_SCORE_RULES[no].weight;
  }
  return numOrNull(item.weight);
}

/** 客观测试：按测量值计分（⑦–⑩；⑪ 握力依赖性别，保留接口分） */
function resolveHealthTestRawScore(no: number, rawValue: number) {
  if (no === 7) {
    if (rawValue >= 1) {
      return 0;
    }
    if (rawValue >= 0.8) {
      return 1;
    }
    return 2;
  }
  if (no === 8) {
    if (rawValue < 10) {
      return 0;
    }
    if (rawValue >= 13.5) {
      return 2;
    }
    return 1;
  }
  if (no === 9) {
    if (rawValue < 12) {
      return 0;
    }
    if (rawValue <= 15) {
      return 1;
    }
    return 2;
  }
  if (no === 10) {
    if (rawValue >= 3) {
      return 0;
    }
    if (rawValue >= 2) {
      return 1;
    }
    return 2;
  }
  return null;
}

/** 按产品表重算计分；无法推算时回退接口 rawScore */
export function resolveFallItemRawScore(item: FallPreventionItem) {
  const no = resolveFallItemNo(item);
  const rule = no != null ? FALL_ITEM_SCORE_RULES[no] : null;
  const apiScore = numOrNull(item.rawScore);

  if (rule?.choiceScores) {
    const idx = numOrNull(item.choiceIndex);
    if (idx != null && idx >= 0 && idx < rule.choiceScores.length) {
      return rule.choiceScores[idx] ?? apiScore;
    }
  }

  if (no != null && no >= 7 && no <= 10) {
    const rawValue = numOrNull(item.rawValue);
    if (rawValue != null) {
      const scored = resolveHealthTestRawScore(no, rawValue);
      if (scored != null) {
        return scored;
      }
    }
  }

  return apiScore;
}

export function resolveFallItemWeightedScore(item: FallPreventionItem) {
  const rawScore = resolveFallItemRawScore(item);
  const weight = resolveFallItemWeight(item);
  if (rawScore != null && weight != null) {
    return rawScore * weight;
  }
  return numOrNull(item.weightedScore);
}

/** S 满分 = Σ(分项满分 × 权重) */
export function resolveFallWeightedScoreMax(items?: FallPreventionItem[] | null) {
  if (!Array.isArray(items) || !items.length) {
    return 0;
  }
  return items.reduce((sum, item) => {
    const weight = resolveFallItemWeight(item) ?? 0;
    return sum + resolveFallItemScoreMax(item) * Math.max(0, weight);
  }, 0);
}

function sumFallWeightedBySource(items: FallPreventionItem[]) {
  let subjective = 0;
  let objective = 0;
  let subjectiveCount = 0;
  let objectiveCount = 0;
  for (const item of items) {
    const weighted = resolveFallItemWeightedScore(item);
    if (weighted == null) {
      continue;
    }
    if (item.source === 'question') {
      subjective += weighted;
      subjectiveCount += 1;
    } else if (item.source === 'health_test') {
      objective += weighted;
      objectiveCount += 1;
    }
  }
  return {
    subjective: subjectiveCount ? subjective : null,
    objective: objectiveCount ? objective : null,
    total: subjectiveCount || objectiveCount ? subjective + objective : null,
  };
}

function itemTitle(item: FallPreventionItem) {
  const name = text(item.name, '未命名项目');
  const mark = circleNo(item.no);
  const prefix =
    item.source === 'question' ? '主观' : item.source === 'health_test' ? '客观' : '';
  if (prefix && mark) {
    return `${prefix} ${mark} ${name}`;
  }
  if (mark) {
    return `${mark} ${name}`;
  }
  return name;
}

export function formatFallProfile(result: FallPreventionResult | null | undefined) {
  const user = result?.userInfo;
  const name = text(user?.name, '--');
  const age = numOrNull(user?.age);
  const ageText = age != null ? `${age}岁` : '';
  const tag = text(user?.diagnosticLabel);
  const complaint = text(user?.primaryDiagnosis);
  const reportLabel = complaint ? `主诉：${complaint}` : '主诉：--';
  return {
    name,
    ageText,
    tag,
    reportLabel,
    dateRangeText: (() => {
      const date = text(result?.objectiveDataDate)
      if (!date) {
        return '客观数据日期：--'
      }
      // 展示为区间：开始 - 结束（当前接口仅返回单日时两端同日）
      if (date.includes(' - ') || date.includes('~')) {
        return `客观数据日期：${date}`
      }
      return `客观数据日期：${date} - ${date}`
    })(),
  };
}

export function formatFallRiskResult(result: FallPreventionResult | null | undefined) {
  const grade = result?.riskGradeResult;
  const riskLevel = text(grade?.riskLevel);
  const gateLevel = text(grade?.gateLevel);
  const items = Array.isArray(result?.items) ? result!.items! : [];
  const summed = sumFallWeightedBySource(items);
  const weighted = summed.total ?? numOrNull(grade?.weightedScore);
  const subjective = summed.subjective ?? numOrNull(grade?.subjectiveScore);
  const objective = summed.objective ?? numOrNull(grade?.objectiveScore);
  const scoreMax = resolveFallWeightedScoreMax(items);
  const date = text(result?.objectiveDataDate);
  let dateRangeText = '客观数据日期：--';
  if (date) {
    if (date.includes(' - ') || date.includes('~')) {
      dateRangeText = `客观数据日期：${date}`;
    } else {
      dateRangeText = `客观数据日期：${date} - ${date}`;
    }
  }
  return {
    levelText: formatRiskLevel(riskLevel),
    rows: [
      {
        label: '加权得分：',
        value: `S = ${weighted ?? '--'}（主观风险 ${subjective ?? '--'} + 客观测试 ${objective ?? '--'}）；`,
        subValue: scoreMax > 0 ? `S 满值 ≈ ${scoreMax}` : 'S 满值 ≈ --',
      },
      {
        label: '跌倒史门槛：',
        value: formatGateLevel(gateLevel),
      },
    ],
    /** 风险分级结果底部：客观数据日期区间 */
    summaryText: dateRangeText,
  };
}

export function formatFallItemScoreRows(result: FallPreventionResult | null | undefined) {
  const items = Array.isArray(result?.items) ? result!.items! : [];
  const scoreMax = resolveFallWeightedScoreMax(items);
  const summed = sumFallWeightedBySource(items);
  const totalWeighted = summed.total ?? 0;
  const rows = items.map((item, index) => {
    const rawScore = resolveFallItemRawScore(item);
    const weight = resolveFallItemWeight(item);
    const weighted = resolveFallItemWeightedScore(item);
    const maxScore = resolveFallItemScoreMax(item);
    const clampedScore = Math.min(maxScore, Math.max(0, rawScore ?? 0));
    const resultParts = formatFallItemResultParts(item);
    return {
      key: `item-${item.no ?? index}-${item.itemKey || item.templateId || index}`,
      title: itemTitle(item),
      resultLabel: resultParts.resultLabel,
      resultNum: resultParts.resultNum,
      score: formatScore(rawScore),
      weight,
      weighted: formatScore(weighted),
      barPercent: maxScore > 0 ? Math.round((clampedScore / maxScore) * 100) : 0,
      isTotal: false,
      subtitle: '',
    };
  });
  rows.push({
    key: 'total',
    title: '合计',
    subtitle: 'S = Σ 计分×权重',
    resultLabel: '',
    resultNum: '',
    score: '--',
    weight: null,
    weighted: formatScore(summed.total),
    barPercent:
      scoreMax > 0
        ? Math.round((Math.min(scoreMax, Math.max(0, totalWeighted)) / scoreMax) * 100)
        : 0,
    isTotal: true,
  });
  return rows;
}

function splitRiskPointText(item: FallPreventionRiskPointItem) {
  const full = text(item.text);
  if (full.includes('：')) {
    const idx = full.indexOf('：');
    return {
      label: full.slice(0, idx + 1),
      value: full.slice(idx + 1),
    };
  }
  const category = text(item.category);
  const title = text(item.title);
  const measure = text(item.measureResult);
  const rawScore = numOrNull(item.rawScore);
  const weight = numOrNull(item.weight);
  const label = category ? `${category}：` : '';
  const parts = [
    title,
    measure,
    rawScore != null ? `${rawScore} 分` : '',
    weight != null ? `（×${weight}）` : '',
  ].filter(Boolean);
  return {
    label,
    value: parts.join(' → ') || '--',
  };
}

export function formatFallRiskPoints(result: FallPreventionResult | null | undefined) {
  const points = Array.isArray(result?.riskPoint?.items) ? result!.riskPoint!.items! : [];
  const domains = Array.isArray(result?.riskPoint?.shortboardDomains)
    ? result!.riskPoint!.shortboardDomains!.map(item => text(item)).filter(Boolean)
    : [];
  const conclusion = text(result?.riskPoint?.conclusion);
  return {
    rows: points.map(splitRiskPointText),
    summaryText: conclusion
      ? conclusion.startsWith('一句话结论')
        ? conclusion
        : `一句话结论：${conclusion}`
      : domains.length
        ? `短板集中于：${domains.join('、')}`
        : '',
  };
}

function formatModuleActions(list?: FallPreventionModuleAction[] | null) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map(item => {
    const names = (item.actions || [])
      .map(action => text(action.exVideoName))
      .filter(Boolean);
    return {
      module: exerciseLabel(item.exerciseType),
      content: names.join('、') || '--',
    };
  });
}

function formatWeekPlan(list?: FallPreventionWeekPlanItem[] | null) {
  if (!Array.isArray(list) || !list.length) {
    return [];
  }
  const grouped = new Map<number, FallPreventionWeekPlanItem[]>();
  for (const item of list) {
    const day = Number(item.weekDay) || 0;
    const bucket = grouped.get(day) || [];
    bucket.push(item);
    grouped.set(day, bucket);
  }
  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, rows]) => ({
      module: FALL_WEEKDAY_LABEL[day] || `周${day}`,
      content: rows
        .map(row => {
          const label = exerciseLabel(row.exerciseType);
          const mins = numOrNull(row.durationMin);
          return mins != null ? `${label} ${mins}分钟` : label;
        })
        .join(' + '),
    }));
}

export function formatFallPrescription(result: FallPreventionResult | null | undefined) {
  const advice = result?.preliminaryPrescriptionAdvice;
  if (!advice) {
    return null;
  }
  const direction =
    text(result?.riskGradeResult?.disposalContent?.prescriptionDirection) ||
    text(advice.populationName);
  return {
    directionTitle: direction ? `方案方向：${direction}` : '方案方向：--',
    rows: [
      {
        label: '配比：',
        value: text(advice.ratio, '--'),
      },
      {
        label: '剂量(FITT-VP）：',
        value: text(advice.dosage, '--'),
      },
      {
        label: '起始难度：',
        value: text(advice.startDifficulty, '--'),
      },
    ],
    actionTitle: '动作建议（示例·居家免器械优先，到店精配）',
    actionSuggestions: formatModuleActions(advice.moduleActionList),
    weekPlanTitle: '周计划骨架（模块级）',
    weekPlan: formatWeekPlan(advice.weekPlanList),
    tipText: FALL_PRESCRIPTION_TIP,
  };
}

export function formatFallRemark(detail: CommunityScreenReportDetail | null | undefined) {
  const time = text(detail?.finishTime || detail?.createTime);
  return {
    timeText: time ? `生成时间：${time}` : '生成时间：--',
    text: FALL_REMARK_TEXT,
  };
}

export function formatFallNextStep(result: FallPreventionResult | null | undefined) {
  if (result?.riskGradeResult?.referMedical) {
    return {
      text: FALL_NEXT_STEP.highRiskText,
      benefit: FALL_NEXT_STEP.benefit,
    };
  }
  return {
    text: FALL_NEXT_STEP.text,
    benefit: FALL_NEXT_STEP.benefit,
  };
}
