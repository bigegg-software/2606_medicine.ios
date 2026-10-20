import type {
  CommunityScreenReportDetail,
  FallPreventionItem,
  FallPreventionModuleAction,
  FallPreventionResult,
  FallPreventionRiskPointItem,
  FallPreventionWeekPlanItem,
} from '@/api/communityScreenReport';

/** 单条计分满分 0–3 */
export const FALL_ITEM_SCORE_MAX = 3;

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
  '本评估为功能训练/健康提升参考，非医疗诊断；如有红旗症状（夜间静息痛 / 进行性麻木无力 / 外伤 / 发热 / 术后/ 体重下降等）请及时就医。得分越高越好；';

/** 周计划下方 tip（接口未返回） */
export const FALL_PRESCRIPTION_TIP =
  '说明：本卡为初筛版；到店完成『全套 8 维评估（D-Wall客观量化）』→ 定制方案并由专业教练带练';

const CIRCLE_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪'];

function text(value: unknown, fallback = '') {
  const str = String(value ?? '').trim();
  return str || fallback;
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

/** S 满分 = Σ(单条满分 3 × 权重) */
export function resolveFallWeightedScoreMax(items?: FallPreventionItem[] | null) {
  if (!Array.isArray(items) || !items.length) {
    return 0;
  }
  return items.reduce((sum, item) => {
    const weight = numOrNull(item.weight) ?? 0;
    return sum + FALL_ITEM_SCORE_MAX * Math.max(0, weight);
  }, 0);
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
    dateRangeText: text(result?.objectiveDataDate)
      ? `客观数据日期：${text(result?.objectiveDataDate)}`
      : '客观数据日期：--',
  };
}

export function formatFallRiskResult(result: FallPreventionResult | null | undefined) {
  const grade = result?.riskGradeResult;
  const riskLevel = text(grade?.riskLevel);
  const scoreLevel = text(grade?.scoreLevel, '--');
  const gateLevel = text(grade?.gateLevel);
  const weighted = numOrNull(grade?.weightedScore);
  const subjective = numOrNull(grade?.subjectiveScore);
  const objective = numOrNull(grade?.objectiveScore);
  const disposal = text(grade?.disposalContent?.prescriptionDirection);
  const scoreMax = resolveFallWeightedScoreMax(result?.items);
  return {
    levelText: formatRiskLevel(riskLevel),
    rows: [
      {
        label: '得分级：',
        value: scoreLevel,
      },
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
    summaryText: [
      `最终分级 = max(门槛级, 得分级) = ${formatRiskLevel(riskLevel)}`,
      disposal ? `处置：${disposal}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export function formatFallItemScoreRows(result: FallPreventionResult | null | undefined) {
  const items = Array.isArray(result?.items) ? result!.items! : [];
  const grade = result?.riskGradeResult;
  const rows = items.map((item, index) => {
    const rawScore = numOrNull(item.rawScore);
    const weight = numOrNull(item.weight);
    const resultStr = text(item.resultStr);
    const clampedScore = Math.min(FALL_ITEM_SCORE_MAX, Math.max(0, rawScore ?? 0));
    return {
      key: `item-${item.no ?? index}-${item.itemKey || item.templateId || index}`,
      title: itemTitle(item),
      /** 问卷项用 resultStr（选项文案翻译）；测试项为测量值 */
      resultText: resultStr || '--',
      score: formatScore(rawScore),
      weight,
      barPercent: Math.round((clampedScore / FALL_ITEM_SCORE_MAX) * 100),
      isTotal: false,
      subtitle: '',
    };
  });
  rows.push({
    key: 'total',
    title: '合计',
    subtitle: 'S = Σ 计分×权重',
    resultText: '',
    score: formatScore(grade?.weightedScore),
    weight: null,
    barPercent: 0,
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
