export type DetailChartRange = 'today' | 'week' | 'month';

export function getSelectionAxisValue(
    range: DetailChartRange,
    selectedDataX: number,
    _labels: string[],
) {
    if (range === 'today' || range === 'month') return selectedDataX;
    return Math.round(selectedDataX);
}

export function readSelectionPixelX(
    chart: { convertToPixel: (...args: any[]) => any } | null | undefined,
    range: DetailChartRange,
    selectedDataX: number | null,
    labels: string[],
    fallbackPixelX: number | null,
) {
    if (selectedDataX == null) return null;
    if (!chart) return fallbackPixelX;

    try {
        const axisValue = getSelectionAxisValue(range, selectedDataX, labels);
        const pixel = chart.convertToPixel({ xAxisIndex: 0 }, axisValue);
        if (typeof pixel === 'number' && Number.isFinite(pixel)) return pixel;
        if (Array.isArray(pixel) && Number.isFinite(pixel[0])) return pixel[0];
    } catch {
        // use fallback below
    }

    return fallbackPixelX;
}
