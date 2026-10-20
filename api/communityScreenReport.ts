import request from '@/utils/axios';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

/** 报告类型：防跌倒 / 普拉提 */
export const COMMUNITY_SCREEN_REPORT_TYPE = {
  fallPrevention: 'fall_prevention',
  pilates: 'pilates',
} as const;

export type CommunityScreenReportType = 'fall_prevention' | 'pilates' | string;

/** 生成状态：0.待生成 1.成功 2.失败 */
export type CommunityScreenReportStatus = 0 | 1 | 2 | number;

export type FallPreventionUserInfo = {
  userId?: string | number;
  name?: string;
  age?: number;
  primaryDiagnosis?: string;
  diagnosticLabel?: string;
};

export type FallPreventionDisposalContent = {
  prescriptionDirection?: string;
};

export type FallPreventionRiskGradeResult = {
  riskLevel?: string;
  weightedScore?: number;
  subjectiveScore?: number;
  objectiveScore?: number;
  scoreLevel?: string;
  gateLevel?: string;
  referMedical?: boolean;
  disposalContent?: FallPreventionDisposalContent | null;
};

export type FallPreventionItem = {
  no?: number;
  name?: string;
  source?: string;
  templateId?: string | number;
  choiceIndex?: number;
  itemKey?: string;
  recordId?: string | number;
  rawValue?: number;
  objValue?: Record<string, unknown> | null;
  resultStr?: string;
  rawScore?: number | null;
  weight?: number | null;
  weightedScore?: number | null;
};

export type FallPreventionRiskPointItem = {
  category?: string;
  title?: string;
  measureResult?: string;
  rawScore?: number;
  weight?: number;
  text?: string;
};

export type FallPreventionRiskPoint = {
  items?: FallPreventionRiskPointItem[];
  shortboardDomains?: string[];
  conclusion?: string;
};

export type FallPreventionAction = {
  exVideoName?: string;
};

export type FallPreventionModuleAction = {
  exerciseType?: string;
  actions?: FallPreventionAction[];
};

export type FallPreventionWeekPlanItem = {
  weekDay?: number;
  exerciseType?: string;
  durationMin?: number;
};

export type FallPreventionPrescriptionAdvice = {
  populationCode?: string;
  populationName?: string;
  ratio?: string;
  dosage?: string;
  startDifficulty?: string;
  moduleActionList?: FallPreventionModuleAction[];
  weekPlanList?: FallPreventionWeekPlanItem[];
};

export type FallPreventionResult = {
  riskGradeResult?: FallPreventionRiskGradeResult | null;
  userInfo?: FallPreventionUserInfo | null;
  questionId?: string | number;
  objectiveDataDate?: string;
  items?: FallPreventionItem[];
  riskPoint?: FallPreventionRiskPoint | null;
  preliminaryPrescriptionAdvice?: FallPreventionPrescriptionAdvice | null;
};

export type PilatesUserInfo = {
  userId?: string | number;
  name?: string;
  age?: number;
  primaryDiagnosis?: string;
  diagnosticLabel?: string;
};

export type PilatesDimensionScore = {
  dimension?: string;
  result?: string;
  score?: number | null;
  tip?: string;
  defect?: boolean;
};

export type PilatesAssessmentConclusion = {
  shortboards?: string[];
  tierLevel?: string;
  avgScore?: number;
  conclusion?: string;
};

export type PilatesPrescriptionAdvice = {
  populationCode?: string;
  populationName?: string;
  prescriptionDirection?: string;
  ratio?: string;
  dosage?: string;
  startDifficulty?: string;
  focusRegionBlocks?: string[];
  allRegion?: boolean;
  moduleActionList?: FallPreventionModuleAction[];
  weekPlanList?: FallPreventionWeekPlanItem[];
};

export type PilatesResult = {
  userInfo?: PilatesUserInfo | null;
  triageEntry?: string;
  hasRedFlag?: boolean;
  questionId?: string | number;
  defectDimensions?: string[];
  dimensionScores?: PilatesDimensionScore[];
  assessmentConclusion?: PilatesAssessmentConclusion | null;
  preliminaryPrescriptionAdvice?: PilatesPrescriptionAdvice | null;
};

export type CommunityScreenReport = {
  reportId?: number | string;
  userId?: number | string;
  coachUserId?: number | string;
  reportType?: CommunityScreenReportType;
  reportTypeLabel?: string;
  status?: CommunityScreenReportStatus;
  finishTime?: string;
  createTime?: string;
  updateTime?: string;
  fallPreventionResult?: FallPreventionResult | null;
  pilatesResult?: PilatesResult | null;
  reportInfo?: Record<string, unknown> | null;
};

export type CommunityScreenReportDetail = CommunityScreenReport;

export type CommunityScreenReportListParams = {
  userId?: string | number;
  /** fall_prevention / pilates，空为全部 */
  reportType?: string;
  /** 0.待生成 1.成功 2.失败 */
  status?: number;
  pageSize?: number;
  pageNum?: number;
};

export type CommunityScreenReportListResult = {
  code?: number;
  msg?: string;
  total?: number;
  rows?: CommunityScreenReport[];
};

/** 分页查询本人社区初筛报告列表 */
export const listCommunityScreenReport = (
  params?: CommunityScreenReportListParams,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<CommunityScreenReportListResult>('/patient/communityScreenReport/list', {
    params,
    headers: withPatientUserIdHeaders(options?.patientUserId),
  });

/** 查询社区初筛报告详情 */
export const getCommunityScreenReportInfo = (
  reportId: string | number,
  options?: { patientUserId?: string | number | null },
) =>
  request.get<{ code?: number; msg?: string; data?: CommunityScreenReportDetail }>(
    '/patient/communityScreenReport/getInfo',
    {
      params: { reportId: String(reportId) },
      headers: withPatientUserIdHeaders(options?.patientUserId),
    },
  );
