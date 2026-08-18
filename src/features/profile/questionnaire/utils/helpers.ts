import moment from 'moment';
import type { ImageSourcePropType } from 'react-native';
import type {
    QuestionnaireType,
    QuestionOptionItem,
    UserQuestionAnswerItem,
    UserQuestionRecord,
} from '@/api/questionTemplate';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';

export type StatusStyleKey = 'rowStatus' | 'rowStatusWarn' | 'rowStatusOrange' | 'rowStatusError';

export type ScoreLevel = {
    result: string;
    statusStyle: StatusStyleKey;
};

export const ASSESSMENT_STATUS_ICONS: Record<StatusStyleKey, ImageSourcePropType> = {
    rowStatus: require('@/assets/images/questionnaire/icon1.png'),
    rowStatusWarn: require('@/assets/images/questionnaire/icon2.png'),
    rowStatusOrange: require('@/assets/images/questionnaire/icon3.png'),
    rowStatusError: require('@/assets/images/questionnaire/icon4.png'),
};

export function getAssessmentStatusIcon(statusStyle?: StatusStyleKey) {
    return ASSESSMENT_STATUS_ICONS[statusStyle ?? 'rowStatus'];
}

export const QUESTIONNAIRE_TITLES: Record<QuestionnaireType, string> = {
    0: '跌倒风险评估问卷',
    1: '日常生活能力评估',
    2: '营养风险评估',
    3: 'EQ-5D生活质量评估',
};

// 问卷列表配置，用于显示问卷列表和计算下次评估时间
export const QUESTIONNAIRE_CONFIG: ReadonlyArray<{
    type: QuestionnaireType;
    duration: string;
}> = [
        { type: 0, duration: '2-4分钟' },
        { type: 1, duration: '2-3分钟' },
        { type: 2, duration: '3-5分钟' },
        // { type: 3, duration: '1-2分钟' },
    ];

const ASSESSMENT_INTERVAL_MONTHS: Partial<Record<QuestionnaireType, number>> = {
    0: 3,
    1: 6,
    2: 3,
};

export function canStartAssessment(type: QuestionnaireType, lastDate?: string) {
    const months = ASSESSMENT_INTERVAL_MONTHS[type];
    if (months == null) return true;
    if (!lastDate) return true;
    const last = moment(lastDate);
    if (!last.isValid()) return true;
    return moment().isSameOrAfter(last.clone().add(months, 'months'), 'day');
}

export function getNextAssessmentDate(type: QuestionnaireType, lastDate?: string): string | undefined {
    const months = ASSESSMENT_INTERVAL_MONTHS[type];
    if (months == null || !lastDate) return undefined;
    const last = moment(lastDate);
    if (!last.isValid()) return undefined;
    const next = last.clone().add(months, 'months').startOf('day');
    if (moment().isSameOrAfter(next, 'day')) return undefined;
    return next.format('YYYY/MM/DD');
}

const MAX_SCORE_BY_TYPE: Partial<Record<QuestionnaireType, number>> = {
    0: 100,
    1: 60,
    2: 10,
};

function normalizeEq5dScore(score: number): number {
    const num = Number(score);
    if (!Number.isFinite(num)) return 0;
    if (num > 1) return num / 100;
    return num;
}

export function formatEq5dScore(score: number): string {
    const normalized = normalizeEq5dScore(score);
    if (!Number.isFinite(normalized)) return '--';
    return normalized.toFixed(2);
}

export const PROGRESS_COLORS: Record<StatusStyleKey, { ring: string; arc: string; text: string }> = {
    rowStatus: { ring: '#6D925E', arc: '#6D925E', text: '#6D925E' },
    rowStatusWarn: { ring: 'rgba(237,194,98,0.12)', arc: '#EDC262', text: '#EDC262' },
    rowStatusOrange: { ring: 'rgba(249,115,22,0.12)', arc: '#F97316', text: '#F97316' },
    rowStatusError: { ring: 'rgba(216,0,16,0.12)', arc: '#D80010', text: '#D80010' },
};

export function getScoreLevel(type: QuestionnaireType, score: number): ScoreLevel {
    const num = Number(score);
    if (!Number.isFinite(num)) {
        return { result: '--', statusStyle: 'rowStatus' };
    }
    switch (type) {
        case 0:
            if (num <= 24) return { result: '低风险', statusStyle: 'rowStatus' };
            if (num <= 49) return { result: '中风险', statusStyle: 'rowStatusWarn' };
            if (num <= 74) return { result: '较高风险', statusStyle: 'rowStatusOrange' };
            return { result: '高风险', statusStyle: 'rowStatusError' };
        case 1:
            if (num <= 5) return { result: '完全独立', statusStyle: 'rowStatus' };
            if (num <= 20) return { result: '轻度依赖', statusStyle: 'rowStatusWarn' };
            if (num <= 40) return { result: '中度依赖', statusStyle: 'rowStatusOrange' };
            return { result: '重度依赖', statusStyle: 'rowStatusError' };
        case 2:
            if (num <= 0) return { result: '低风险', statusStyle: 'rowStatus' };
            if (num <= 2) return { result: '轻度风险', statusStyle: 'rowStatusWarn' };
            if (num <= 4) return { result: '中度风险', statusStyle: 'rowStatusOrange' };
            return { result: '高风险', statusStyle: 'rowStatusError' };
        case 3: {
            const normalized = normalizeEq5dScore(num);
            if (normalized >= 0.9) return { result: '优秀', statusStyle: 'rowStatus' };
            if (normalized >= 0.8) return { result: '良好', statusStyle: 'rowStatus' };
            if (normalized >= 0.7) return { result: '一般', statusStyle: 'rowStatusWarn' };
            if (normalized >= 0.5) return { result: '需重点关注', statusStyle: 'rowStatusOrange' };
            return { result: '建议及时评估', statusStyle: 'rowStatusError' };
        }
        default:
            return { result: `${num}分`, statusStyle: 'rowStatus' };
    }
}

/** 各问卷状态档位（由差到好），用于计算进度百分比 */
export const SCORE_TIER_LABELS: Record<QuestionnaireType, readonly string[]> = {
    0: ['高风险', '较高风险', '中风险', '低风险'],
    1: ['重度依赖', '中度依赖', '轻度依赖', '完全独立'],
    2: ['高风险', '中度风险', '轻度风险', '低风险'],
    3: ['建议及时评估', '需重点关注', '一般', '良好', '优秀'],
};

/** 按当前状态档位计算进度：第 n 档 / 总档数 × 100，如 EQ-5D 良好为第 4/5 档 = 80% */
export function getScoreLevelProgressPercent(type: QuestionnaireType, score: number) {
    const num = Number(score);
    if (!Number.isFinite(num)) return 0;
    const { result } = getScoreLevel(type, num);
    const tiers = SCORE_TIER_LABELS[type];
    const index = tiers.indexOf(result);
    if (index < 0) return 0;
    return Math.round(((index + 1) / tiers.length) * 100);
}

export function formatAssessmentDate(record: UserQuestionRecord) {
    const raw = record.createTime || record.customerLocalDate;
    if (!raw) return '';
    const parsed = moment(raw);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : raw.split(' ')[0];
}

export function getRiskPercent(type: QuestionnaireType, score: number) {
    const num = Number(score);
    if (!Number.isFinite(num)) return 0;
    if (type === 3) {
        const normalized = normalizeEq5dScore(num);
        return Math.min(100, Math.round(normalized * 100));
    }
    const maxScore = MAX_SCORE_BY_TYPE[type] ?? 100;
    return Math.min(100, Math.round((num / maxScore) * 100));
}

export function sortOptions(options: QuestionOptionItem[] = []) {
    return [...options].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

export function isPercentRulerQuestion(templateId: number, questionType?: number) {
    return templateId === 6 && questionType === 3;
}

function getSelectedIndices(answer: string, questionType?: number) {
    if (questionType === 4) {
        return answer
            .split(',')
            .filter(Boolean)
            .map(item => Number(item))
            .filter(item => !Number.isNaN(item));
    }
    const index = Number(answer);
    return Number.isNaN(index) ? [] : [index];
}

export function isOptionSelected(optionIndex: number, answer: string, questionType?: number) {
    return getSelectedIndices(answer, questionType).includes(optionIndex);
}

export type ScoreTipContent = {
  /** 第一行：风险/能力概述 */
  summary: string;
  /** 第二行：建议 */
  advice: string;
};

const FALL_TIPS: Record<string, ScoreTipContent> = {
  低风险: {
    summary: '跌倒风险较低，日常生活基本安全。',
    advice: '保持适度运动，注意地面防滑，定期复测（3–6个月）。',
  },
  中风险: {
    summary: '存在一定跌倒隐患，夜间/行走/环境因素影响明显。',
    advice: '增加平衡训练（如太极、步行训练），夜间减少起床频率，家中安装防滑措施，建议每月评估一次。',
  },
  较高风险: {
    summary: '明显行动不稳定，多因素叠加风险。',
    advice: '建议使用辅助行走工具，家庭环境改造（扶手/防滑垫），建议家属陪护，咨询医生或康复师。',
  },
  高风险: {
    summary: '极易跌倒，多项高危因素存在。',
    advice: '强烈建议医疗评估，避免独立行走，使用轮椅/助行器，建立长期护理计划。',
  },
};

const ADL_TIPS: Record<string, ScoreTipContent> = {
  完全独立: {
    summary: '可独立完成全部日常生活，基本无需照护。',
    advice: '保持运动，定期健康评估（3–6个月）。',
  },
  轻度依赖: {
    summary: '个别生活项目需要帮助，整体生活基本自理。',
    advice: '加强平衡/力量训练，家庭适当辅助，定期复评（1–3个月）。',
  },
  中度依赖: {
    summary: '多项日常生活需要帮助，独立生活能力下降。',
    advice: '建议家属协助生活，进行康复训练，评估跌倒/护理风险。',
  },
  重度依赖: {
    summary: '基本无法独立生活，需长期照护。',
    advice: '专业护理支持，防跌倒与安全管理，长期照护计划。',
  },
};

const MUST_TIPS: Record<string, ScoreTipContent> = {
  低风险: {
    summary: '营养风险较低，暂无明显营养下降趋势。',
    advice: '保持均衡饮食，定期复测，关注体重变化。',
  },
  轻度风险: {
    summary: '存在轻微营养下降趋势。',
    advice: '增加蛋白质摄入，关注体重变化，每月复测。',
  },
  中度风险: {
    summary: '已出现明显营养摄入不足。',
    advice: '调整饮食结构，必要时营养补充剂，建议咨询医生/营养师。',
  },
  高风险: {
    summary: '明显营养不良风险。',
    advice: '尽快医疗评估，可能需要营养干预或治疗，密切监测体重变化。',
  },
};

export function getScoreTip(
  type: QuestionnaireType,
  scoreLevel: ScoreLevel,
): ScoreTipContent | null {
  const key = scoreLevel.result?.trim();
  if (!key || key === '--') return null;

  if (type === 0) return FALL_TIPS[key] ?? null;
  if (type === 1) return ADL_TIPS[key] ?? null;
  if (type === 2) return MUST_TIPS[key] ?? null;
  if (type === 3) {
    return {
      summary: `您的 EQ-5D 得分处于${key}区间。`,
      advice: '建议关注生活质量相关指标，必要时咨询专业医生。',
    };
  }
  return null;
}

export function parseHeightWeightAnswer(answer: string) {
    const [height = '', weight = ''] = answer.split(',');
    const heightNum = Number(height.trim());
    const weightNum = Number(weight.trim());
    if (!height.trim() || !weight.trim() || Number.isNaN(heightNum) || Number.isNaN(weightNum)) {
        return null;
    }
    return { height: heightNum, weight: weightNum };
}

export function calculateBmi(heightCm: number, weightKg: number) {
    if (!heightCm || !weightKg) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

export function formatHeightWeightDisplay(answer: string) {
    const parsed = parseHeightWeightAnswer(answer);
    if (!parsed) return null;
    const bmi = calculateBmi(parsed.height, parsed.weight);
    if (bmi == null || !Number.isFinite(bmi)) return null;
    return {
        heightText: `${parsed.height}cm`,
        weightText: `${parsed.weight}kg`,
        bmiText: bmi.toFixed(1),
    };
}

export function formatFillAnswer(item: UserQuestionAnswerItem) {
    const answer = item.answers?.[0]?.answer ?? '';
    const questionType = item.questions?.[0]?.type;
    if (questionType === 2 && answer) {
        const parsed = moment(answer);
        return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : answer;
    }
    if (questionType === 3) {
        const display = formatHeightWeightDisplay(answer);
        if (display) {
            return `身高 ${display.heightText} · 体重 ${display.weightText} · BMI ${display.bmiText}`;
        }
    }
    return answer;
}

export type HistoryItem = {
    id: string;
    title: string;
    date?: string;
    result?: string;
    statusStyle: StatusStyleKey;
};

export type AssessmentSummary = {
    id?: string;
    date?: string;
    result?: string;
    statusStyle: StatusStyleKey;
};

export function normalizeQuestionnaireType(
    type?: QuestionnaireType | string | number | null,
): QuestionnaireType | undefined {
    if (type == null || type === '') return undefined;
    const num = Number(type);
    if (!Number.isFinite(num)) return undefined;
    return num as QuestionnaireType;
}

function isListQuestionnaireType(type?: QuestionnaireType | string | number): type is QuestionnaireType {
    const normalized = normalizeQuestionnaireType(type);
    return normalized != null && QUESTIONNAIRE_CONFIG.some(item => item.type === normalized);
}

/** 历史列表：展示已配置标题的问卷类型（含未在首页卡片展示的） */
function isHistoryQuestionnaireType(type?: QuestionnaireType | string | number): type is QuestionnaireType {
    const normalized = normalizeQuestionnaireType(type);
    return normalized != null && QUESTIONNAIRE_TITLES[normalized] != null;
}

export function formatAssessmentResult(record: UserQuestionRecord): ScoreLevel | undefined {
    const type = normalizeQuestionnaireType(record.type);
    if (type == null || !isHistoryQuestionnaireType(type)) return undefined;
    if (record.score != null) return getScoreLevel(type, record.score);
    if (record.comments?.trim()) {
        return { result: record.comments.trim(), statusStyle: 'rowStatus' };
    }
    return undefined;
}

export function toAssessmentSummary(record: UserQuestionRecord): AssessmentSummary | undefined {
    const type = normalizeQuestionnaireType(record.type);
    if (type == null || !isHistoryQuestionnaireType(type)) return undefined;
    const date = formatAssessmentDate(record);
    const scoreLevel = formatAssessmentResult(record);
    if (!date && !scoreLevel) return undefined;
    return {
        id: record.id != null ? String(record.id) : undefined,
        date: date || undefined,
        result: scoreLevel?.result,
        statusStyle: scoreLevel?.statusStyle ?? 'rowStatus',
    };
}

export function toHistoryItem(record: UserQuestionRecord): HistoryItem | undefined {
    const type = normalizeQuestionnaireType(record.type);
    if (type == null || !isHistoryQuestionnaireType(type)) return undefined;
    const summary = toAssessmentSummary(record);
    if (!summary) return undefined;
    return {
        id: String(record.id ?? `${type}-${record.createTime ?? record.updateTime ?? Math.random()}`),
        title: QUESTIONNAIRE_TITLES[type],
        ...summary,
    };
}

export function sortRecordsByTime(records: UserQuestionRecord[]) {
    return [...records].sort((a, b) => {
        const timeA = moment(a.createTime || a.updateTime || a.customerLocalDate).valueOf();
        const timeB = moment(b.createTime || b.updateTime || b.customerLocalDate).valueOf();
        return timeB - timeA;
    });
}

export function buildLastAssessmentMap(records: UserQuestionRecord[]) {
    const next: Partial<Record<QuestionnaireType, AssessmentSummary>> = {};
    records.forEach(record => {
        const type = normalizeQuestionnaireType(record.type);
        if (type == null || !isListQuestionnaireType(type)) return;
        const summary = toAssessmentSummary(record);
        if (summary) next[type] = summary;
    });
    return next;
}

/** 兼容 frontList：rows 顶层，或 data / data.rows */
export function getUserQuestionListRecords(res: unknown): UserQuestionRecord[] {
    const rows = getResourceRows<UserQuestionRecord>(
        res as { code?: number; rows?: UserQuestionRecord[] },
    );
    if (rows.length > 0) return rows;

    const data = apiResourceData<UserQuestionRecord[] | { rows?: UserQuestionRecord[] }>(
        res as { code?: number; data?: UserQuestionRecord[] | { rows?: UserQuestionRecord[] } },
    );
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.rows)) return data.rows;
    return [];
}
