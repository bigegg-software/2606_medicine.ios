import type {
  QuestionOptionItem,
  QuestionTemplate,
  QuestionnaireType,
  UserQuestionAnswerItem,
} from '@/api/questionTemplate';

export type HealthInfoOptionGroupItem = {
  option: QuestionOptionItem;
  /** 在 sortQuestionOptions 后的下标，用于作答 */
  index: number;
};

export type HealthInfoOptionGroup = {
  category: string;
  items: HealthInfoOptionGroupItem[];
};

/** 用户健康信息问卷 type=4 */
export const HEALTH_INFO_QUESTIONNAIRE_TYPE: QuestionnaireType = 4;

function text(value: unknown) {
  return String(value ?? '').trim();
}

function toIdString(value: unknown) {
  const id = text(value);
  return id || '';
}

export function getHealthInfoTemplateKey(template: QuestionTemplate | null | undefined) {
  return toIdString(template?.templateId ?? template?.id);
}

export function sortHealthInfoOptions(options: QuestionOptionItem[] = []) {
  return [...options].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

/** C2 诊断名称：按 category 分组，保留排序后的原始下标 */
export function groupOptionsByCategory(options: QuestionOptionItem[]): HealthInfoOptionGroup[] {
  const groups: HealthInfoOptionGroup[] = [];
  const indexByCategory = new Map<string, number>();

  options.forEach((option, index) => {
    const category = text(option.category);
    const existing = indexByCategory.get(category);
    if (existing == null) {
      indexByCategory.set(category, groups.length);
      groups.push({ category, items: [{ option, index }] });
      return;
    }
    groups[existing]?.items.push({ option, index });
  });

  return groups;
}

function getQuestionTitle(template: QuestionTemplate | null | undefined) {
  return text(template?.questionOption?.questions?.[0]?.question);
}

/** 在选项中按文案匹配（优先精确，其次以目标文案开头，如「无」「有」） */
export function findOptionIndexByDesc(
  template: QuestionTemplate | null | undefined,
  desc: string,
) {
  const options = sortHealthInfoOptions(template?.questionOption?.options);
  const target = text(desc);
  const exact = options.findIndex(item => text(item.desc) === target);
  if (exact >= 0) return exact;
  return options.findIndex((item) => {
    const label = text(item.desc);
    return label === target || label.startsWith(target);
  });
}

export function resolveHealthInfoA1Index(templates: QuestionTemplate[]) {
  const byTitle = templates.findIndex(item => getQuestionTitle(item).includes('是否有疼痛'));
  if (byTitle >= 0) return byTitle;
  const byId = templates.findIndex(item => getHealthInfoTemplateKey(item) === '1');
  return byId >= 0 ? byId : 0;
}

export function resolveHealthInfoC1Index(templates: QuestionTemplate[]) {
  const byTitle = templates.findIndex((item) => {
    const title = getQuestionTitle(item);
    return title.includes('明确诊断') || title.includes('是否已就医');
  });
  if (byTitle >= 0) return byTitle;
  return templates.findIndex(item => getHealthInfoTemplateKey(item) === '16');
}

export function resolveHealthInfoC2Index(templates: QuestionTemplate[]) {
  const byTitle = templates.findIndex(item => getQuestionTitle(item).includes('诊断名称'));
  if (byTitle >= 0) return byTitle;
  const byId = templates.findIndex(item => getHealthInfoTemplateKey(item) === '17');
  if (byId >= 0) return byId;
  const c1 = resolveHealthInfoC1Index(templates);
  return c1 >= 0 && c1 + 1 < templates.length ? c1 + 1 : -1;
}

/** A1 选「无」 */
export function isHealthInfoNoPain(
  templates: QuestionTemplate[],
  answers: Record<string, string>,
) {
  const a1Index = resolveHealthInfoA1Index(templates);
  const a1 = templates[a1Index];
  if (!a1) return false;
  const key = getHealthInfoTemplateKey(a1);
  const answer = text(answers[key]);
  if (!answer) return false;
  const noneIndex = findOptionIndexByDesc(a1, '无');
  if (noneIndex < 0) return answer === '0';
  return answer === String(noneIndex);
}

/** C1 选「有」 */
export function isHealthInfoHasDiagnosis(
  templates: QuestionTemplate[],
  answers: Record<string, string>,
) {
  const c1Index = resolveHealthInfoC1Index(templates);
  const c1 = c1Index >= 0 ? templates[c1Index] : null;
  if (!c1) return false;
  const key = getHealthInfoTemplateKey(c1);
  const answer = text(answers[key]);
  if (!answer) return false;
  const hasIndex = findOptionIndexByDesc(c1, '有');
  if (hasIndex < 0) return answer === '0';
  return answer === String(hasIndex);
}

/**
 * 题目是否应跳过：
 * - A1=无：跳过 A1 之后、C1 之前（A2–A7、B1–B8）
 * - C1≠有：跳过 C2
 */
export function isHealthInfoQuestionSkipped(
  index: number,
  templates: QuestionTemplate[],
  answers: Record<string, string>,
) {
  if (index < 0 || index >= templates.length) return true;
  const a1Index = resolveHealthInfoA1Index(templates);
  const c1Index = resolveHealthInfoC1Index(templates);
  const c2Index = resolveHealthInfoC2Index(templates);

  if (isHealthInfoNoPain(templates, answers)) {
    if (index > a1Index && (c1Index < 0 || index < c1Index)) {
      return true;
    }
  }

  if (c2Index >= 0 && index === c2Index) {
    return !isHealthInfoHasDiagnosis(templates, answers);
  }

  return false;
}

export function resolveHealthInfoNextIndex(
  currentIndex: number,
  templates: QuestionTemplate[],
  answers: Record<string, string>,
) {
  let next = currentIndex + 1;
  while (next < templates.length && isHealthInfoQuestionSkipped(next, templates, answers)) {
    next += 1;
  }
  return next;
}

export function resolveHealthInfoPrevIndex(
  currentIndex: number,
  templates: QuestionTemplate[],
  answers: Record<string, string>,
) {
  let prev = currentIndex - 1;
  while (prev >= 0 && isHealthInfoQuestionSkipped(prev, templates, answers)) {
    prev -= 1;
  }
  return prev;
}

/** 清空因跳转而不再作答的题目答案 */
export function clearHealthInfoSkippedAnswers(
  templates: QuestionTemplate[],
  answers: Record<string, string>,
) {
  const next = { ...answers };
  let changed = false;
  templates.forEach((template, index) => {
    if (!isHealthInfoQuestionSkipped(index, templates, answers)) return;
    const key = getHealthInfoTemplateKey(template);
    if (text(next[key])) {
      next[key] = '';
      changed = true;
    }
  });
  return changed ? next : answers;
}

export function isHealthInfoRequiredAnswered(
  templates: QuestionTemplate[],
  answers: Record<string, string>,
) {
  if (!templates.length) return true;
  return templates.every((template, index) => {
    if (isHealthInfoQuestionSkipped(index, templates, answers)) return true;
    return Boolean(text(answers[getHealthInfoTemplateKey(template)]));
  });
}

/** 详情回放：将已答记录转成跳题规则可用的模板/答案结构 */
export function mapHealthInfoAnswerItemsToSkipContext(items: UserQuestionAnswerItem[]) {
  const templates: QuestionTemplate[] = items.map((item) => {
    const questionText = text(item.questions?.[0]?.question);
    return {
      templateId: item.templateId,
      id: item.templateId,
      questionOption: {
        options: item.options,
        questions: [{
          type: item.questions?.[0]?.type,
          question: questionText,
        }],
      },
    };
  });
  const answers: Record<string, string> = {};
  items.forEach((item) => {
    const key = toIdString(item.templateId);
    if (!key) return;
    answers[key] = text(item.answers?.[0]?.answer);
  });
  return { templates, answers };
}

/** 详情作答列表：按跳题规则过滤后重编号 */
export function filterHealthInfoVisibleAnswerItems(items: UserQuestionAnswerItem[]) {
  const skipContext = mapHealthInfoAnswerItemsToSkipContext(items);
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) =>
      !isHealthInfoQuestionSkipped(index, skipContext.templates, skipContext.answers),
    )
    .map(({ item }) => item);
}

/** Record<number,string> ↔ 跳题规则用的 string key map */
export function toHealthInfoAnswerMap(answers: Record<number, string>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(answers).forEach(([key, value]) => {
    out[String(key)] = String(value ?? '');
  });
  return out;
}

export function fromHealthInfoAnswerMap(answers: Record<string, string>): Record<number, string> {
  const out: Record<number, string> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const num = Number(key);
    if (!Number.isFinite(num)) return;
    out[num] = value;
  });
  return out;
}

/** 用户健康信息问卷 A3：疼痛 NRS 0–10 滑动题 */
export function isNrsPainSliderQuestion(
  templateId: string | number,
  questionType?: number,
  questionnaireType?: QuestionnaireType,
) {
  return questionnaireType === 4 && String(templateId) === '3' && questionType === 3;
}
