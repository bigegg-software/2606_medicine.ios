import type {
  CommunityScreenReportDetail,
  FallPreventionModuleAction,
  FallPreventionWeekPlanItem,
  PilatesDimensionScore,
  PilatesResult,
} from '@/api/communityScreenReport';
import { FALL_EXERCISE_TYPE_LABEL, FALL_WEEKDAY_LABEL } from './fallHelpers';

const SCORE_MAX = 3;

/** 维度编码 → 展示标题 */
export const PILATES_DIMENSION_TITLE: Record<string, string> = {
  D1: 'D1 姿势与排列',
  D2: 'D2 侧向呼吸',
  D3: 'D3 核心激活与控制',
  D4: 'D4 柔韧与 ROM',
  D5: 'D5 力量与耐力',
  D6: 'D6 平衡与本体',
  D7: 'D7 动作质量与代偿',
  D8: 'D8 疼痛与功能',
};

/** 下一步与到店权益（接口未返回） */
export const PILATES_NEXT_STEP = {
  text: '到店完成『全套 8 维功能评估（D-Wall 客观量化）』，据此定制方案并由专业教练带练。',
  benefit: '到店权益: 99 元到店测评（全 8 维/D-Wall） + 赠1节私教康复体验课',
  redFlagText: '命中红旗症状，建议转介医疗机构评估，暂不生成店内运动处方。',
};

/** 备注免责（接口未返回） */
export const PILATES_REMARK_TEXT =
  '本评估为功能训练/健康提升参考，非医疗诊断；如有红旗症状（夜间静息痛 / 进行性麻木无力 / 外伤 / 发热 / 术后 / 体重下降等）请及时就医。得分越高越好；维度阈值均为建议初值·待校准。';

/** 处方 tip（接口未返回） */
export const PILATES_PRESCRIPTION_TIP =
  '说明：本卡为初筛版；到店完成『全套 8 维评估（D-Wall客观量化）』→ 定制普拉提方案并由专业教练带练';

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

function exerciseLabel(type?: string) {
  const key = text(type);
  return FALL_EXERCISE_TYPE_LABEL[key] || key || '--';
}

function dimensionTitle(dimension?: string) {
  const key = text(dimension).toUpperCase();
  return PILATES_DIMENSION_TITLE[key] || text(dimension, '--');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** 从详情中取出普拉提结果（兼容 reportInfo 嵌套） */
export function pickPilatesResult(
  data: CommunityScreenReportDetail | null | undefined,
): PilatesResult | null {
  if (!data) return null;
  if (data.pilatesResult) return data.pilatesResult;
  const reportInfo = asRecord(data.reportInfo);
  const nested = asRecord(reportInfo?.pilatesResult);
  if (nested) return nested as PilatesResult;
  return null;
}

function formatPilatesNrsText(result: PilatesResult | null | undefined): string {
  const user = asRecord(result?.userInfo);
  const fromUser = numOrNull(user?.nrs ?? user?.nrsScore ?? user?.painNrs);
  if (fromUser != null) {
    return `NRS ${fromUser}/10`;
  }
  const d8 = (result?.dimensionScores || []).find(
    item => text(item.dimension).toUpperCase() === 'D8',
  );
  const raw = `${text(d8?.result)} ${text(d8?.tip)}`;
  const matched =
    raw.match(/NRS\s*[：:.]?\s*(\d+(?:\.\d+)?)/i) ||
    raw.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (matched?.[1]) {
    return `NRS ${matched[1]}/10`;
  }
  return '';
}

export function formatPilatesProfile(result: PilatesResult | null | undefined) {
  const user = result?.userInfo;
  const name = text(user?.name, '--');
  const age = numOrNull(user?.age);
  const ageText = age != null ? `${age}岁` : '';
  const tag = text(user?.diagnosticLabel);
  const nrsText = formatPilatesNrsText(result);
  const redFlagText = result?.hasRedFlag ? '有红旗' : '无红旗';
  const metaText = [ageText, nrsText, redFlagText].filter(Boolean).join(' | ');
  const complaint = text(user?.primaryDiagnosis);
  const reportLabel = complaint
    ? `主诉：${complaint}`
    : result?.hasRedFlag
      ? '命中红旗症状'
      : '主诉：--';
  const triage = text(result?.triageEntry);
  return {
    name,
    tag,
    metaText,
    reportLabel,
    dateRangeText: triage ? `分诊入口：${triage}` : '分诊入口：--',
  };
}

/**
 * 结果列：只展示冒号后的值
 * - 「姿势与排列评估：3」→ 3
 * - 「NRS：9 已有诊断：是」→ 9、是
 */
function formatPilatesScoreResultValue(item: PilatesDimensionScore) {
  const raw = text(item.result);
  if (!raw) {
    return '--';
  }
  const parts = [...raw.matchAll(/[^：:\s]+[：:]\s*([^：:\s]+)/g)]
    .map(match => text(match[1]))
    .filter(Boolean);
  if (parts.length) {
    return parts.join('、');
  }
  return raw;
}

export function formatPilatesScoreRows(result: PilatesResult | null | undefined) {
  const rows = Array.isArray(result?.dimensionScores) ? result!.dimensionScores! : [];
  return rows.map((item: PilatesDimensionScore, index) => {
    const score = numOrNull(item.score);
    const visual = score == null ? 0 : Math.min(SCORE_MAX, Math.max(0, score));
    const resultFull = text(item.result);
    const resultValue = formatPilatesScoreResultValue(item);
    return {
      key: text(item.dimension) || `dim-${index}`,
      title: dimensionTitle(item.dimension),
      subtitle: text(item.tip),
      visual,
      /** 列表缩略：3 / 9、是 */
      result: resultValue,
      /** 弹窗全文：姿势与排列评估：3 / NRS：9 已有诊断：是 */
      resultFull: resultFull || resultValue,
      /** 有标签全文时，点击结果列可看完整内容 */
      resultClickable: Boolean(resultFull) && resultFull !== resultValue,
      score: score == null ? '--' : String(score),
      defect: Boolean(item.defect),
    };
  });
}

export function formatPilatesScoreTip(result: PilatesResult | null | undefined) {
  const rows = Array.isArray(result?.dimensionScores) ? result!.dimensionScores! : [];
  const total = rows.length || 8;
  const scored = rows.filter(item => numOrNull(item.score) != null).length;
  return `说明：本卡采集到 ${scored}/${total} 维。得分越高越好。`;
}

export function formatPilatesConclusion(result: PilatesResult | null | undefined) {
  const conclusion = result?.assessmentConclusion;
  const shortboards = Array.isArray(conclusion?.shortboards)
    ? conclusion!.shortboards!.map(item => text(item)).filter(Boolean)
    : [];
  const tierLevel = text(conclusion?.tierLevel, '--');
  const avgScore = numOrNull(conclusion?.avgScore);
  const avgText = avgScore == null ? '--' : String(avgScore);
  return {
    rows: [
      {
        label: '短板：',
        value: shortboards.length ? ` ${shortboards.join('、')}` : ' --',
      },
      {
        label: '综合分层：',
        value: ` ${tierLevel}（已采集维度均分 ${avgText}）`,
      },
    ],
    summaryText: text(conclusion?.conclusion, '--'),
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

export function formatPilatesPrescription(result: PilatesResult | null | undefined) {
  if (result?.hasRedFlag) {
    return null;
  }
  const advice = result?.preliminaryPrescriptionAdvice;
  if (!advice) {
    return null;
  }
  const direction = text(advice.prescriptionDirection) || text(advice.populationName);
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
    actionTitle: '动作建议（示例·居家免器械优先，到店精配）：',
    actionSuggestions: formatModuleActions(advice.moduleActionList),
    weekPlanTitle: '周计划骨架（模块级）：',
    weekPlan: formatWeekPlan(advice.weekPlanList),
    tipText: PILATES_PRESCRIPTION_TIP,
  };
}

export function formatPilatesNextStep(result: PilatesResult | null | undefined) {
  if (result?.hasRedFlag) {
    return {
      text: PILATES_NEXT_STEP.redFlagText,
      benefit: PILATES_NEXT_STEP.benefit,
    };
  }
  return {
    text: PILATES_NEXT_STEP.text,
    benefit: PILATES_NEXT_STEP.benefit,
  };
}

export function formatPilatesRemark(detail: CommunityScreenReportDetail | null | undefined) {
  const time = text(detail?.finishTime || detail?.createTime);
  return {
    timeText: time ? `生成时间：${time}` : '生成时间：--',
    text: PILATES_REMARK_TEXT,
  };
}

export function resolvePilatesScoreVisualWidth(visual: number, barWidth = 64) {
  const ratio = Math.min(SCORE_MAX, Math.max(0, visual)) / SCORE_MAX;
  return Math.round(barWidth * ratio);
}
