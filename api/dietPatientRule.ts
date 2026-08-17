import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';
import { withPatientUserIdHeaders } from '@/src/utils/apiHelpers';

export type DietRecommendedIntake = {
    category?: string;
    suggestion?: string;
};

export type DietRestriction = {
    item?: string;
    limitValue?: string;
};

export type DietMealFoodItem = {
    foodName?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    amount?: number;
    unit?: string;
};

export type DietMealItem = {
    day?: number | string;
    mealCategory?: number | string;
    foods?: string | string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    remark?: string;
    foodList?: DietMealFoodItem[];
};

export type DietPatientUserBaseInfo = {
    userId?: number | string;
    avatarOssId?: number;
    avatarOssUrl?: string;
    name?: string;
    gender?: string;
    age?: number;
    birthDate?: string;
    height?: number;
    weight?: number;
    primaryDiagnosis?: string;
    diagnosticLabel?: string;
    riskLevel?: number;
    dailyActivityLevel?: string;
};

export type NutritionMacronutrientRatios = {
    carbohydrates?: string;
    protein?: string;
    fat?: string;
};

export type NutritionIntakeResult = {
    base_total_calories?: number;
    diet_calories?: number;
    carbs_g?: number;
    protein_g?: number;
    fat_g?: number;
    diet_mode_code?: string;
    recommended_diet_applied?: string;
    macronutrient_ratios?: NutritionMacronutrientRatios;
};

export type NutritionMedicalReport = {
    risk_monitoring_plan?: string;
    medication_regimen_analysis?: string;
};

export type NutritionDietaryAdviceItem = {
    category?: string;
    advice_points?: string;
};

export type NutritionMacronutrientRecommendation = {
    nutrient_name?: string;
    recommended_remark?: string;
    recommended_foods?: string;
};

export type NutritionLifestyleReport = {
    strategy_and_goals?: string;
    energy_paragraph?: string;
    exercise_advice?: string;
    detailed_dietary_advice?: NutritionDietaryAdviceItem[];
    macronutrient_recommendations?: NutritionMacronutrientRecommendation[];
};

export type NutritionPersonReportResult = {
    medical_report?: NutritionMedicalReport;
    lifestyle_report?: NutritionLifestyleReport;
    nutrition_intake?: NutritionIntakeResult;
    recommended_diet?: string;
    diet_selection_reasoning?: string;
};

export type DietPatientRuleInfo = {
    dietPatientRuleId?: number;
    patientUserId?: number | string;
    patientUserName?: string;
    patientUserBaseInfo?: DietPatientUserBaseInfo;
    prescriptionName?: string;
    diagnosis?: string;
    diagnosticLabel?: string;
    dailyActivityLevel?: string;
    startDate?: string;
    endDate?: string;
    dietTemplateId?: number;
    energyPerKg?: number;
    proteinPerKg?: number;
    waterPerKg?: number;
    fatPercent?: number;
    proteinPercent?: number;
    carbsPercent?: number;
    recommendedIntake?: DietRecommendedIntake[];
    restrictions?: DietRestriction[];
    mealList?: DietMealItem[];
    precautions?: string;
    primaryHealthGoal?: string;
    secondaryHealthGoal?: string;
    dietaryPreferences?: string;
    nutritionPersonReportResult?: NutritionPersonReportResult;
    status?: number;
    stopReason?: string;
    targetCalories?: number;
    targetProtein?: number;
    targetWater?: number;
    targetCarbs?: number;
    targetFat?: number;
    version?: number;
    createBy?: number;
    createByName?: string;
    createTime?: string;
};

export type DietPatientRuleInfoResult = ApiResult<DietPatientRuleInfo>;

export const getInUseDietPatientRuleInfo = (
    options?: { patientUserId?: string | number | null },
) =>
    request.get<DietPatientRuleInfoResult>('/patient/dietPatientRule/getInUseInfo', {
        headers: withPatientUserIdHeaders(options?.patientUserId),
    });

/** 按指定日期查询用餐处方快照 */
export const getDietPatientRuleSnapshotByDate = (
    params: { customerLocalDate: string },
    options?: { patientUserId?: string | number | null },
) =>
    request.get<DietPatientRuleInfoResult>('/patient/dietPatientRule/getSnapshotByDate', {
        params,
        headers: withPatientUserIdHeaders(options?.patientUserId),
    });

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

export type DietAiMakeMealListPayload = {
    patientUserId: number | string;
    diagnosis?: string;
    energyPerKg?: number;
    proteinPerKg?: number;
    waterPerKg?: number;
    fatPercent?: number;
    carbsPercent?: number;
    recommendedIntake?: DietRecommendedIntake[];
    restrictions?: DietRestriction[];
};

export type DietAiMakeMealListData = {
    mealList?: DietMealItem[];
    precautions?: string;
};

export type DietAiMakeMealListResult = ApiResult<DietAiMakeMealListData>;

/** AI 一键生成周一到周日的餐食安排 */
export const postDietPatientRuleAiMakeMealList = (payload: DietAiMakeMealListPayload) =>
    request.post<DietAiMakeMealListResult>('/patient/dietPatientRule/aiMakeMealList', payload);

export type DietAiMakeOneDayMealResult = ApiResult<DietMealItem[]>;

/** AI 换一换：仅生成并更新指定星期（day）的餐食安排 */
export const getDietPatientRuleAiMakeOneDayMeal = (params: {
    dietPatientRuleId: string;
    day: number;
}) =>
    request.get<DietAiMakeOneDayMealResult>('/patient/dietPatientRule/aiMakeOneDayMeal', {
        params,
    });
