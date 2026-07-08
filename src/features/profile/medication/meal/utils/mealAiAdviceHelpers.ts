import type { UserBaseInfo } from '@/api/patient';
import type { DietPatientRuleInfo } from '@/api/dietPatientRule';
import type { MealDetailItem } from '@/api/mealDetail';

function toApiString(value: unknown): string {
    if (value == null) return '';
    return String(value);
}

function buildPatientUserBaseInfo(user?: UserBaseInfo | null) {
    if (!user) return undefined;
    return {
        userId: user.userId != null ? String(user.userId) : undefined,
        avatarOssId: user.avatarOssId,
        avatarOssUrl: user.avatarOssUrl,
        name: user.name,
        gender: user.gender,
        birthDate: user.birthDate,
        height: user.height != null ? String(user.height) : undefined,
        weight: user.weight != null ? String(user.weight) : undefined,
        bloodType: user.bloodType,
    };
}

function mapMealDetailForAiAdvice(item: MealDetailItem) {
    return {
        mealDetailId: item.mealDetailId != null ? String(item.mealDetailId) : undefined,
        userId: item.userId != null ? String(item.userId) : undefined,
        customerLocalDate: item.customerLocalDate ?? '',
        mealName: item.mealName ?? '',
        servingAmount: toApiString(item.servingAmount),
        servingUnit: toApiString(item.servingUnit),
        weight: toApiString(item.weight),
        mealCategory: item.mealCategory,
        calorie: toApiString(item.calorie),
        protein: toApiString(item.protein),
        fat: toApiString(item.fat),
        carbs: toApiString(item.carbs),
        fiber: toApiString(item.fiber),
        salt: toApiString(item.salt),
        waterIntake: toApiString(item.waterIntake),
        isWater: item.isWater ?? 0,
        othersNutrition: item.othersNutrition ?? {},
        ossId: item.ossId ?? null,
        ossUrl: item.ossUrl ?? null,
        timeStr: item.timeStr ?? '',
    };
}

export function buildDietAiAdviceParamJson(
    dietRule: DietPatientRuleInfo,
    mealList: MealDetailItem[],
    userInfo?: UserBaseInfo | null,
) {
    return {
        当前饮食处方: {
            ...dietRule,
            dietPatientRuleId: dietRule.dietPatientRuleId,
            patientUserId: dietRule.patientUserId != null ? String(dietRule.patientUserId) : undefined,
            patientUserBaseInfo:
                dietRule.patientUserBaseInfo ?? buildPatientUserBaseInfo(userInfo),
        },
        饮食记录: mealList.map(mapMealDetailForAiAdvice),
    };
}
