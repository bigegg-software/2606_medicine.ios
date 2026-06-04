import moment from 'moment';
import type {
    QuestionnaireType,
    QuestionOptionItem,
    UserQuestionAnswerItem,
    UserQuestionRecord,
} from '@/api/questionTemplate';

export type StatusStyleKey = 'rowStatus' | 'rowStatusWarn' | 'rowStatusOrange' | 'rowStatusError';

export type ScoreLevel = {
    result: string;
    statusStyle: StatusStyleKey;
};

export const QUESTIONNAIRE_TITLES: Record<QuestionnaireType, string> = {
    0: '跌倒风险评估问卷',
    1: '日常生活能力评估',
    2: '营养风险评估',
    3: '认知功能评估',
};

const MAX_SCORE_BY_TYPE: Partial<Record<QuestionnaireType, number>> = {
    0: 100,
    1: 60,
    2: 10,
};

export const PROGRESS_COLORS: Record<StatusStyleKey, { ring: string; arc: string; text: string }> = {
    rowStatus: { ring: 'rgba(0,201,80,0.12)', arc: '#00C950', text: '#00C950' },
    rowStatusWarn: { ring: 'rgba(237,194,98,0.12)', arc: '#EDC262', text: '#EDC262' },
    rowStatusOrange: { ring: 'rgba(249,115,22,0.12)', arc: '#F97316', text: '#F97316' },
    rowStatusError: { ring: 'rgba(216,0,16,0.12)', arc: '#D80010', text: '#D80010' },
};

export function getScoreLevel(type: QuestionnaireType, score: number): ScoreLevel {
    switch (type) {
        case 0:
            if (score <= 24) return { result: '低风险', statusStyle: 'rowStatus' };
            if (score <= 49) return { result: '中风险', statusStyle: 'rowStatusWarn' };
            if (score <= 74) return { result: '较高风险', statusStyle: 'rowStatusOrange' };
            return { result: '高风险', statusStyle: 'rowStatusError' };
        case 1:
            if (score <= 5) return { result: '完全独立', statusStyle: 'rowStatus' };
            if (score <= 20) return { result: '轻度依赖', statusStyle: 'rowStatusWarn' };
            if (score <= 40) return { result: '中度依赖', statusStyle: 'rowStatusOrange' };
            return { result: '重度依赖', statusStyle: 'rowStatusError' };
        case 2:
            if (score <= 0) return { result: '低风险', statusStyle: 'rowStatus' };
            if (score <= 2) return { result: '轻度风险', statusStyle: 'rowStatusWarn' };
            if (score <= 4) return { result: '中度风险', statusStyle: 'rowStatusOrange' };
            return { result: '高风险', statusStyle: 'rowStatusError' };
        default:
            return { result: `${score}分`, statusStyle: 'rowStatus' };
    }
}

export function formatAssessmentDate(record: UserQuestionRecord) {
    const raw = record.createTime || record.customerLocalDate;
    if (!raw) return '';
    const parsed = moment(raw);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : raw.split(' ')[0];
}

export function getRiskPercent(type: QuestionnaireType, score: number) {
    const maxScore = MAX_SCORE_BY_TYPE[type] ?? 100;
    return Math.min(100, Math.round((score / maxScore) * 100));
}

export function sortOptions(options: QuestionOptionItem[] = []) {
    return [...options].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
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

export function getScoreTip(type: QuestionnaireType, scoreLevel: ScoreLevel) {
    if (type === 1) {
        return `您的得分处于${scoreLevel.result}区间，建议根据日常能力情况合理安排照护支持。`;
    }
    return `得分越高，风险越大。您的得分处于${scoreLevel.result}区间，建议关注相关健康指标。`;
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
    date?: string;
    result?: string;
    statusStyle: StatusStyleKey;
};

function isListQuestionnaireType(type?: QuestionnaireType): type is 0 | 1 | 2 {
    return type === 0 || type === 1 || type === 2;
}

export function formatAssessmentResult(record: UserQuestionRecord): ScoreLevel | undefined {
    const type = record.type;
    if (!isListQuestionnaireType(type)) return undefined;
    if (record.score != null) return getScoreLevel(type, record.score);
    if (record.comments?.trim()) {
        return { result: record.comments.trim(), statusStyle: 'rowStatus' };
    }
    return undefined;
}

export function toAssessmentSummary(record: UserQuestionRecord): AssessmentSummary | undefined {
    const type = record.type;
    if (!isListQuestionnaireType(type)) return undefined;
    const date = formatAssessmentDate(record);
    const scoreLevel = formatAssessmentResult(record);
    if (!date && !scoreLevel) return undefined;
    return {
        date: date || undefined,
        result: scoreLevel?.result,
        statusStyle: scoreLevel?.statusStyle ?? 'rowStatus',
    };
}

export function toHistoryItem(record: UserQuestionRecord): HistoryItem | undefined {
    const type = record.type;
    if (!isListQuestionnaireType(type)) return undefined;
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
        if (record.type == null) return;
        const summary = toAssessmentSummary(record);
        if (summary) next[record.type] = summary;
    });
    return next;
}
