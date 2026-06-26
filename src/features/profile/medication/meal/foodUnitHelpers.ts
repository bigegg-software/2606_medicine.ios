export const FOOD_UNIT_LABELS = [
    '克',
    '个',
    '块',
    '条',
    '片',
    '份',
    '碗',
    '毫升',
    '杯',
    '勺',
    '瓶',
    '盒',
    '包',
    '撮',
    '盘',
] as const;

export type FoodUnitOption = {
    label: string;
    value: string;
};

export type FoodUnitValue = string;

export const FOOD_UNITS: FoodUnitOption[] = FOOD_UNIT_LABELS.map(label => ({
    label,
    value: label,
}));

export const FOOD_UNIT = {
    gram: FOOD_UNIT_LABELS[0],
    portion: FOOD_UNIT_LABELS[5],
    bowl: FOOD_UNIT_LABELS[6],
    cup: FOOD_UNIT_LABELS[8],
    pack: FOOD_UNIT_LABELS[12],
} as const;

const DEFAULT_UNIT = FOOD_UNIT.portion;

const LEGACY_UNIT_MAP: Record<number, string> = {
    1: FOOD_UNIT.portion,
    2: FOOD_UNIT.gram,
    3: FOOD_UNIT.bowl,
    4: FOOD_UNIT.pack,
    5: FOOD_UNIT.cup,
};

function normalizeFoodUnit(unit?: string) {
    const normalized = unit?.trim();
    return normalized || undefined;
}

function isKnownFoodUnit(unit: string) {
    return (FOOD_UNIT_LABELS as readonly string[]).includes(unit);
}

/** AI 识别单位不在预设列表时，将其插入到单位选项第一位。 */
export function buildFoodUnitOptions(recognizedUnit?: string): FoodUnitOption[] {
    const normalized = normalizeFoodUnit(recognizedUnit);
    if (!normalized || isKnownFoodUnit(normalized)) {
        return FOOD_UNITS;
    }
    return [{ label: normalized, value: normalized }, ...FOOD_UNITS];
}

export function resolveFoodUnitValue(
    servingUnit?: number | string,
    unit?: string,
): FoodUnitValue {
    const normalizedUnit = normalizeFoodUnit(unit);
    if (normalizedUnit) {
        return normalizedUnit;
    }
    if (typeof servingUnit === 'string') {
        const normalizedServingUnit = normalizeFoodUnit(servingUnit);
        return normalizedServingUnit ?? DEFAULT_UNIT;
    }
    if (typeof servingUnit === 'number') {
        return LEGACY_UNIT_MAP[servingUnit] ?? DEFAULT_UNIT;
    }
    return DEFAULT_UNIT;
}

export function isGramUnit(unitValue: string) {
    return unitValue === FOOD_UNIT.gram;
}
