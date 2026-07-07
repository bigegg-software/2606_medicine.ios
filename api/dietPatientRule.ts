import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

export type DietRecommendedIntake = {
    category?: string;
    suggestion?: string;
};

export type DietRestriction = {
    item?: string;
    limitValue?: string;
};

export type DietMealItem = {
    day?: number;
    mealCategory?: number;
    foods?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    remark?: string;
};

export type DietPatientRuleInfo = {
    dietPatientRuleId?: number;
    patientUserId?: number | string;
    patientUserName?: string;
    patientUserBaseInfo?: Record<string, unknown>;
    prescriptionName?: string;
    diagnosis?: string;
    startDate?: string;
    endDate?: string;
    dietTemplateId?: number;
    energyPerKg?: number;
    proteinPerKg?: number;
    waterPerKg?: number;
    fatPercent?: number;
    carbsPercent?: number;
    recommendedIntake?: DietRecommendedIntake[];
    restrictions?: DietRestriction[];
    mealList?: DietMealItem[];
    precautions?: string;
    status?: number;
    stopReason?: string;
    targetCalories?: number;
    targetProtein?: number;
    targetWater?: number;
    targetCarbs?: number;
    targetFat?: number;
    createBy?: number;
    createByName?: string;
    createTime?: string;
};

export type DietPatientRuleInfoResult = ApiResult<DietPatientRuleInfo>;

export const getInUseDietPatientRuleInfo = () =>
    request.get<DietPatientRuleInfoResult>('/patient/dietPatientRule/getInUseInfo');

export type DietAiAdviceData = {
    aiAdvice?: string[];
    paramsMd5?: string;
    cached?: boolean;
};

export type DietAiAdviceResult = ApiResult & {
    data?: DietAiAdviceData;
};

export const postDietPatientRuleAiAdvice = (paramJson: Record<string, unknown>) =>
    request.post<DietAiAdviceResult>('/patient/dietPatientRule/aiAdvice', { paramJson });
