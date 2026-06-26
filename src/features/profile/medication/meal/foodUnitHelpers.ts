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

export type FoodUnitValue = (typeof FOOD_UNIT_LABELS)[number];

export const FOOD_UNITS = FOOD_UNIT_LABELS.map(label => ({
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

const LEGACY_UNIT_MAP: Record<number, FoodUnitValue> = {
    1: FOOD_UNIT.portion,
    2: FOOD_UNIT.gram,
    3: FOOD_UNIT.bowl,
    4: FOOD_UNIT.pack,
    5: FOOD_UNIT.cup,
};

export function resolveFoodUnitValue(
    servingUnit?: number | string,
    unit?: string,
): FoodUnitValue {
    if (unit && FOOD_UNITS.some(item => item.value === unit)) {
        return unit as FoodUnitValue;
    }
    if (typeof servingUnit === 'string') {
        return FOOD_UNITS.some(item => item.value === servingUnit)
            ? (servingUnit as FoodUnitValue)
            : DEFAULT_UNIT;
    }
    if (typeof servingUnit === 'number') {
        return LEGACY_UNIT_MAP[servingUnit] ?? DEFAULT_UNIT;
    }
    return DEFAULT_UNIT;
}

export function isGramUnit(unitValue: string) {
    return unitValue === FOOD_UNIT.gram;
}
