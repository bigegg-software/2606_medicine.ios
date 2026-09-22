import type { SpecialPlanItem } from '@/api/specialPlan';

const DEFAULT_SCHEME_NAME = '阜外 My Health 方案';

const PLAN_INTRO_META = [
  {
    key: 'coreConcept' as const,
    title: '核心理念',
    icon: require('@/assets/images/exercise/icon1.png'),
  },
  {
    key: 'suitableCrowd' as const,
    title: '适合人群',
    icon: require('@/assets/images/exercise/icon2.png'),
  },
  {
    key: 'interventionContent' as const,
    title: '干预内容',
    icon: require('@/assets/images/exercise/icon3.png'),
  },
  {
    key: 'basis' as const,
    title: '依据',
    icon: require('@/assets/images/exercise/icon4.png'),
  },
];

/** 计划标签：英文逗号拆成 · 连接展示 */
export function formatSpecialPlanTags(planTags?: string | null): string {
  if (!planTags?.trim()) return '';
  return planTags
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .join('·');
}

export function formatSpecialPlanSubtitle(item: SpecialPlanItem): string {
  const fromTags = formatSpecialPlanTags(item.planTags);
  if (fromTags) return fromTags;
  return item.applicableCrowd?.trim() || '';
}

export function formatSpecialPlanSchemeName(item: SpecialPlanItem): string {
  return item.schemeName?.trim() || DEFAULT_SCHEME_NAME;
}

export function getSpecialPlanCoverSource(item: SpecialPlanItem) {
  const url = item.coverOssUrl?.trim();
  if (url) return { uri: url };
  return require('@/assets/images/exercise/dtls.png');
}

export function getSpecialPlanTopCoverSource(item: SpecialPlanItem) {
  const url = item.coverOssUrl?.trim();
  if (url) return { uri: url };
  return require('@/assets/images/exercise/slt.png');
}

export function formatSpecialPlanPrice(price?: number | null): string {
  if (price == null || Number.isNaN(Number(price))) return '--';
  const num = Number(price);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

export type SpecialPlanIntroDisplayItem = {
  key: string;
  title: string;
  content: string;
  icon: number;
};

export function buildSpecialPlanIntroItems(
  item: SpecialPlanItem | null | undefined,
): SpecialPlanIntroDisplayItem[] {
  const intro = item?.planIntro;
  if (!intro) return [];
  return PLAN_INTRO_META.flatMap(meta => {
    const content = intro[meta.key]?.trim();
    if (!content) return [];
    return [{ key: meta.key, title: meta.title, content, icon: meta.icon }];
  });
}

export type SpecialPlanServiceFlowDisplayItem = {
  key: string;
  title: string;
  subtitle: string;
  /** 从 01 起的步骤编号 */
  stepNo: string;
};

export function buildSpecialPlanServiceFlowItems(
  item: SpecialPlanItem | null | undefined,
): SpecialPlanServiceFlowDisplayItem[] {
  const steps = item?.serviceProcess;
  if (!Array.isArray(steps) || steps.length === 0) return [];
  return steps.flatMap((step, index) => {
    const title = step.title?.trim() || '';
    const subtitle = step.content?.trim() || '';
    if (!title && !subtitle) return [];
    return [
      {
        key: `step-${index}`,
        title,
        subtitle,
        stepNo: String(index + 1).padStart(2, '0'),
      },
    ];
  });
}
