/** 今日概览左侧：测量状态 + 时间，如 运动后(17:00) */
export function formatTodayOverviewLeftText(measurementStatus: string, time: string) {
    const status = measurementStatus?.trim() || '--';
    const clock = time?.trim();
    if (!clock || clock === '--') return status;
    return `${status}(${clock})`;
}
