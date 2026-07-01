let shouldResetMealInput = false;

export function markMealInputForReset() {
    shouldResetMealInput = true;
}

export function consumeMealInputReset() {
    if (!shouldResetMealInput) return false;
    shouldResetMealInput = false;
    return true;
}
