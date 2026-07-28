/** 今日用药副文案：30片·08:00 */
export function formatChronicMedicationDoseTimeText(doseText: string, time: string) {
    const dose = (doseText ?? '').split('，')[0]?.trim() || '--';
    const clock = time?.trim();
    if (!clock || clock === '--') return dose;
    return `${dose}·${clock}`;
}
