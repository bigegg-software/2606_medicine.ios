import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import moment from 'moment';
import styles from '@/css/vitals/bloodPage';
import { readSelectionPixelX } from './detailChartSelection';
export type WeightDetailPoint = {
    hour: string;
    min: number;
    max: number;
    x?: number;
    dataTime?: string;
    customerLocalDate?: string;
    statusLabel?: string;
    bmi?: number;
};

export type WeightChartRange = 'today' | 'week' | 'month';

const LINE_COLOR = '#6D925E';
const POINT_SHADOW = {
    shadowBlur: 3,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
};
const POINT_STYLE = {
    color: LINE_COLOR,
    borderColor: '#FFFFFF',
    borderWidth: 1,
    ...POINT_SHADOW,
};

const CHART_PADDING = 54;
const CHART_WIDTH = Dimensions.get('window').width - CHART_PADDING;
const CHART_HEIGHT = 260;
const GRID_LINE_COLOR = 'rgba(212, 213, 217, 0.4)';
const GRID_BORDER_COLOR = '#D4D5D9';
const GRID_SPLIT_LINE = {
    show: true,
    lineStyle: { color: GRID_LINE_COLOR, width: 1, type: 'dashed' as const },
};
const CHART_GRID = {
    top: 16,
    right: 36,
    bottom: 40,
    left: 8,
    show: true,
    borderColor: GRID_BORDER_COLOR,
    borderWidth: 1,
};
const Y_AXIS_LINE_EXTEND = 16;
const X_LABEL_LEFT_PADDING = 4;
const X_LABEL_WIDTH = 40;
const PLOT_LEFT = CHART_GRID.left;
const PLOT_WIDTH = CHART_WIDTH - CHART_GRID.left - CHART_GRID.right;
const GRID_TOP_Y = CHART_GRID.top;
const SELECT_LINE_COLOR = '#6D925E';
const SAFETY_LINE_COLOR = '#EE9C44';
const GRID_BOTTOM_Y = CHART_HEIGHT - CHART_GRID.bottom;
const X_LABEL_TOP = GRID_BOTTOM_Y + Y_AXIS_LINE_EXTEND - 12;
const CHART_TOUCH_HEIGHT = CHART_HEIGHT - GRID_TOP_Y;
const HIDDEN_AXIS_LABEL = { show: false };
const TODAY_TICK_HOURS = [0, 6, 12, 18, 24];
const Y_AXIS_INTERVAL = 2;
const MONTH_DAY_COUNT = 30;
const MONTH_X_MAX = MONTH_DAY_COUNT - 1;
const MONTH_TICK_INTERVAL = 5;
const SLIDER_THUMB_WIDTH = 37;
const SLIDER_THUMB_HEIGHT = 27;
const SLIDER_THUMB_TOP = 25;
const SLIDER_TRACK_HEIGHT = SLIDER_THUMB_TOP + SLIDER_THUMB_HEIGHT;
const SLIDER_BOTTOM_OFFSET = -32;

function getSliderThumbLeft(thumbCenterX: number | null) {
    if (thumbCenterX == null) {
        return PLOT_LEFT - SLIDER_THUMB_WIDTH / 2;
    }

    const minLeft = PLOT_LEFT - SLIDER_THUMB_WIDTH / 2;
    const maxLeft = PLOT_LEFT + PLOT_WIDTH - SLIDER_THUMB_WIDTH / 2;
    return Math.max(minLeft, Math.min(thumbCenterX - SLIDER_THUMB_WIDTH / 2, maxLeft));
}

function ChartSelectionSlider({
    thumbCenterX,
    onSelectAtX,
}: {
    thumbCenterX: number | null;
    onSelectAtX: (chartX: number) => void;
}) {
    const sliderGesture = useMemo(() => {
        const tap = Gesture.Tap()
            .onEnd(event => {
                runOnJS(onSelectAtX)(event.x);
            });

        const pan = Gesture.Pan()
            .activeOffsetX([-2, 2])
            .failOffsetY([-20, 20])
            .onStart(event => {
                runOnJS(onSelectAtX)(event.x);
            })
            .onUpdate(event => {
                runOnJS(onSelectAtX)(event.x);
            });

        return Gesture.Exclusive(pan, tap);
    }, [onSelectAtX]);

    const thumbLeft = getSliderThumbLeft(thumbCenterX);

    return (
        <GestureDetector gesture={sliderGesture}>
            <Animated.View
                style={[
                    styles.chartSliderTrack,
                    {
                        width: CHART_WIDTH,
                        height: SLIDER_TRACK_HEIGHT,
                        bottom: SLIDER_BOTTOM_OFFSET,
                    },
                ]}
            >
                <View
                    pointerEvents="none"
                    style={[
                        styles.chartSliderThumb,
                        {
                            left: thumbLeft,
                            top: SLIDER_THUMB_TOP,
                        },
                    ]}
                >
                    <Image
                        source={require('@/assets/images/vitals/hk.png')}
                        style={{
                            width: SLIDER_THUMB_WIDTH,
                            height: SLIDER_THUMB_HEIGHT,
                        }}
                    />
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

function buildYAxis(points: WeightDetailPoint[]) {
    const values = points.flatMap(point => [point.min, point.max]).filter(value => value > 0);
    const peak = values.length ? Math.max(...values) : 70;
    const floor = values.length ? Math.min(...values) : 50;
    const min = Math.max(0, Math.floor((floor - 2) / Y_AXIS_INTERVAL) * Y_AXIS_INTERVAL);
    const max = Math.max(
        min + Y_AXIS_INTERVAL * 4,
        Math.ceil((peak + 2) / Y_AXIS_INTERVAL) * Y_AXIS_INTERVAL,
    );

    return {
        ...Y_AXIS,
        min,
        max,
    };
}

type YAxisBuilder = (points: WeightDetailPoint[]) => {
    min: number;
    max: number;
    interval: number;
};

function resolveYAxis(points: WeightDetailPoint[], yAxisBuilder?: YAxisBuilder) {
    if (yAxisBuilder) {
        return {
            ...Y_AXIS,
            ...yAxisBuilder(points),
        };
    }
    return buildYAxis(points);
}

const Y_AXIS = {
    type: 'value' as const,
    position: 'right' as const,
    min: 0,
    interval: Y_AXIS_INTERVAL,
    axisTick: { show: false },
    axisLine: { show: false },
    axisLabel: {
        show: true,
        fontSize: 10,
        color: '#999999',
        margin: 8,
    },
    splitLine: GRID_SPLIT_LINE,
};

function isValidPoint(point: WeightDetailPoint) {
    return point.min > 0 && point.max > 0 && point.max >= point.min;
}

function getWeightChartValue(point: WeightDetailPoint) {
    const value = point.min === point.max
        ? point.min
        : (point.min + point.max) / 2;
    return Number(value.toFixed(1));
}

function formatWeightChartLabel(point: WeightDetailPoint) {
    if (point.min === point.max) return point.min.toFixed(1);
    return `${point.min.toFixed(1)}-${point.max.toFixed(1)}`;
}

echarts.use([SkiaRenderer, LineChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent]);

type Props = {
    range: WeightChartRange;
    data?: WeightDetailPoint[];
    onPointChange?: (point: WeightDetailPoint | undefined) => void;
    categoryLabels?: string[];
    yAxisBuilder?: YAxisBuilder;
    safetyLineY?: number;
    safetyLineLabel?: string;
};

function mapTimeToTodayHourX(hour: number, minute = 0) {
    return hour + minute / 60;
}

function parsePointX(point: WeightDetailPoint) {
    if (point.x != null) return point.x;
    if (!point.hour) return 0;
    const [hourText, minuteText] = point.hour.split(':');
    return mapTimeToTodayHourX(Number(hourText) || 0, Number(minuteText) || 0);
}

function getWeekLabels() {
    return Array.from({ length: 7 }, (_, index) =>
        moment()
            .subtract(6 - index, 'days')
            .format('M/D'),
    );
}

function getMonthLabels() {
    return Array.from({ length: 30 }, (_, index) =>
        moment()
            .subtract(29 - index, 'days')
            .format('M/D'),
    );
}

function formatTodayAxisLabel(hour: number) {
    return `${String(hour).padStart(2, '0')}:00`;
}

function getVisibleCategoryTickIndices(total: number) {
    if (total <= 10) {
        return Array.from({ length: total }, (_, index) => index);
    }

    const interval = Math.floor(total / 6);
    return Array.from({ length: total }, (_, index) => index).filter(
        index => index === 0 || index === total - 1 || index % interval === 0,
    );
}

function shouldShowCategoryLabel(index: number, total: number) {
    return getVisibleCategoryTickIndices(total).includes(index);
}

function getMonthTickIndices() {
    return Array.from(
        { length: Math.floor(MONTH_X_MAX / MONTH_TICK_INTERVAL) + 1 },
        (_, index) => index * MONTH_TICK_INTERVAL,
    );
}

function getMonthTickLeft(index: number) {
    return PLOT_LEFT + (index / MONTH_X_MAX) * PLOT_WIDTH;
}

type MonthAxisTick = {
    index: number;
    label: string;
    left: number;
    dashed: boolean;
};

function getMonthAxisTicks(labels: string[]): MonthAxisTick[] {
    return getMonthTickIndices().map(index => ({
        index,
        label: labels[index],
        left: getMonthTickLeft(index),
        dashed: index !== 0,
    }));
}

function getCategoryTickLeft(index: number, count: number) {
    if (index === 0) return PLOT_LEFT;
    if (index === count - 1) return PLOT_LEFT + PLOT_WIDTH;
    return PLOT_LEFT + ((index + 0.5) / count) * PLOT_WIDTH;
}

function getTodayGridLinePositions() {
    return TODAY_TICK_HOURS.map((hour) => ({
        left: PLOT_LEFT + (hour / 24) * PLOT_WIDTH,
        dashed: hour !== 0 && hour !== 24,
    }));
}

function getCategoryGridExtensionPositions(range: WeightChartRange, labels: string[]) {
    if (range === 'month') {
        return getMonthAxisTicks(labels).map(tick => ({
            left: tick.left,
            dashed: tick.dashed,
        }));
    }

    const count = labels.length;
    return Array.from({ length: count + 1 }, (_, index) => ({
        left: PLOT_LEFT + (index / count) * PLOT_WIDTH,
        dashed: index !== 0 && index !== count,
    }));
}

function ChartGridExtensionLines({ positions }: { positions: Array<{ left: number; dashed: boolean }> }) {
    return positions.map((position, index) => (
        <View
            key={`grid-extend-${index}`}
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: position.left,
                top: GRID_BOTTOM_Y,
                width: 0,
                height: Y_AXIS_LINE_EXTEND,
                borderLeftWidth: 1,
                borderStyle: position.dashed ? 'dashed' : 'solid',
                borderColor: position.dashed ? GRID_LINE_COLOR : GRID_BORDER_COLOR,
            }}
        />
    ));
}

function getDefaultSelectedDataX(
    range: WeightChartRange,
    points: WeightDetailPoint[],
) {
    const validPoints = points.filter(isValidPoint);
    if (!validPoints.length) return null;

    if (range === 'today') {
        const latest = [...validPoints].sort((a, b) => parsePointX(a) - parsePointX(b)).at(-1);
        return latest ? parsePointX(latest) : null;
    }

    let latestIndex = -1;
    points.forEach((point, index) => {
        if (isValidPoint(point)) {
            latestIndex = index;
        }
    });
    return latestIndex >= 0 ? latestIndex : null;
}

function dataXToPixelLeft(
    range: WeightChartRange,
    dataX: number,
    categoryCount: number,
) {
    const plotRight = PLOT_LEFT + PLOT_WIDTH;
    let left: number;

    if (range === 'today') {
        const clampedX = Math.max(0, Math.min(24, dataX));
        left = PLOT_LEFT + (clampedX / 24) * PLOT_WIDTH;
    } else if (range === 'month') {
        const clampedX = Math.max(0, Math.min(MONTH_X_MAX, dataX));
        left = PLOT_LEFT + (clampedX / MONTH_X_MAX) * PLOT_WIDTH;
    } else {
        const clampedIndex = Math.max(0, Math.min(categoryCount - 1, dataX));
        left = PLOT_LEFT + ((clampedIndex + 0.5) / categoryCount) * PLOT_WIDTH;
    }

    return Math.max(PLOT_LEFT, Math.min(plotRight, left));
}

function buildCombinedMarkLine(
    range: WeightChartRange,
    selectedDataX: number | null,
    labels: string[],
    safetyLineY?: number,
) {
    const data: Array<Record<string, unknown>> = [];

    if (selectedDataX != null) {
        const xAxisValue = range === 'today' || range === 'month'
            ? selectedDataX
            : Math.round(selectedDataX);

        data.push({
            xAxis: xAxisValue,
            lineStyle: {
                color: SELECT_LINE_COLOR,
                width: 1,
            },
            label: { show: false },
        });
    }

    if (safetyLineY != null) {
        data.push({
            yAxis: safetyLineY,
            lineStyle: {
                color: SAFETY_LINE_COLOR,
                width: 3,
                type: 'dashed',
            },
            label: { show: false },
        });
    }

    if (!data.length) return undefined;

    return {
        silent: true,
        symbol: ['none', 'none'],
        data,
        z: 1,
    };
}

function getSafetyLineLabelTop(yMin: number, yMax: number, safetyLineY: number) {
    const plotHeight = GRID_BOTTOM_Y - GRID_TOP_Y;
    if (yMax <= yMin) return GRID_TOP_Y;

    const lineTop = GRID_TOP_Y + ((yMax - safetyLineY) / (yMax - yMin)) * plotHeight;
    return Math.max(GRID_TOP_Y, lineTop - 22);
}

function getCategoryPointPixelX(index: number, count: number) {
    return PLOT_LEFT + ((index + 0.5) / count) * PLOT_WIDTH;
}

function TodayXAxisLabels() {
    return TODAY_TICK_HOURS.map((hour) => {
        const isLast = hour === 24;
        const tickLeft = PLOT_LEFT + (hour / 24) * PLOT_WIDTH;

        if (isLast) {
            return (
                <Text
                    key={hour}
                    pointerEvents="none"
                    style={[
                        styles.chartXLabel,
                        {
                            top: X_LABEL_TOP,
                            right: CHART_GRID.right,
                            width: X_LABEL_WIDTH,
                            textAlign: 'right',
                        },
                    ]}
                >
                    {formatTodayAxisLabel(hour)}
                </Text>
            );
        }

        return (
            <Text
                key={hour}
                pointerEvents="none"
                style={[
                    styles.chartXLabel,
                    {
                        top: X_LABEL_TOP,
                        left: tickLeft + X_LABEL_LEFT_PADDING,
                        textAlign: 'left',
                    },
                ]}
            >
                {formatTodayAxisLabel(hour)}
            </Text>
        );
    });
}

function MonthXAxisLabels({ labels }: { labels: string[] }) {
    return getMonthAxisTicks(labels).map(tick => (
        <Text
            key={`${tick.label}-${tick.index}`}
            pointerEvents="none"
            style={[
                styles.chartXLabel,
                {
                    top: X_LABEL_TOP,
                    left: tick.left + X_LABEL_LEFT_PADDING,
                    textAlign: 'left',
                },
            ]}
        >
            {tick.label}
        </Text>
    ));
}

function CategoryXAxisLabels({ labels }: { labels: string[] }) {
    return labels.map((label, index) => {
        if (!shouldShowCategoryLabel(index, labels.length)) return null;

        const isFirst = index === 0;
        const isLast = index === labels.length - 1;
        const tickLeft = getCategoryTickLeft(index, labels.length);

        if (isLast) {
            return (
                <Text
                    key={`${label}-${index}`}
                    pointerEvents="none"
                    style={[
                        styles.chartXLabel,
                        {
                            top: X_LABEL_TOP,
                            right: CHART_GRID.right,
                            width: X_LABEL_WIDTH,
                            textAlign: 'right',
                        },
                    ]}
                >
                    {label}
                </Text>
            );
        }

        return (
            <Text
                key={`${label}-${index}`}
                pointerEvents="none"
                style={[
                    styles.chartXLabel,
                    {
                        top: X_LABEL_TOP,
                        left: (isFirst ? PLOT_LEFT : tickLeft) + X_LABEL_LEFT_PADDING,
                        textAlign: 'left',
                    },
                ]}
            >
                {label}
            </Text>
        );
    });
}

function findNearestSelectableDataX(
    range: WeightChartRange,
    points: WeightDetailPoint[],
    pixelX: number,
    categoryCount: number,
): number | null {
    const validEntries = points
        .map((point, index) => ({
            dataX: range === 'today' ? parsePointX(point) : index,
            point,
        }))
        .filter(({ point }) => isValidPoint(point));

    if (!validEntries.length) return null;

    const clampedPixelX = Math.max(PLOT_LEFT, Math.min(PLOT_LEFT + PLOT_WIDTH, pixelX));

    if (range === 'today') {
        const touchDataX = ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * 24;
        return validEntries.reduce((nearest, entry) => {
            const currentDistance = Math.abs(entry.dataX - touchDataX);
            const nearestDistance = Math.abs(nearest.dataX - touchDataX);
            return currentDistance < nearestDistance ? entry : nearest;
        }).dataX;
    }

    if (range === 'month') {
        const touchDataX = ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * MONTH_X_MAX;
        return validEntries.reduce((nearest, entry) => {
            const currentDistance = Math.abs(entry.dataX - touchDataX);
            const nearestDistance = Math.abs(nearest.dataX - touchDataX);
            return currentDistance < nearestDistance ? entry : nearest;
        }).dataX;
    }

    const count = Math.max(categoryCount, points.length, 1);
    return validEntries.reduce((nearest, entry) => {
        const currentDistance = Math.abs(getCategoryPointPixelX(entry.dataX, count) - clampedPixelX);
        const nearestDistance = Math.abs(getCategoryPointPixelX(nearest.dataX, count) - clampedPixelX);
        return currentDistance < nearestDistance ? entry : nearest;
    }).dataX;
}

function findPointAtDataX(
    range: WeightChartRange,
    points: WeightDetailPoint[],
    dataX: number | null | undefined,
) {
    if (dataX == null) return undefined;

    if (range === 'today') {
        return points.find(point => Math.abs(parsePointX(point) - dataX) < 0.001);
    }

    const index = Math.round(dataX);
    return points[index];
}

function isPointSelected(
    range: WeightChartRange,
    point: WeightDetailPoint,
    index: number,
    selectedDataX: number | null,
) {
    if (selectedDataX == null) return false;
    if (range === 'today') {
        return Math.abs(parsePointX(point) - selectedDataX) < 0.001;
    }
    if (range === 'month') {
        return index === Math.round(selectedDataX);
    }
    return index === Math.round(selectedDataX);
}

function buildTodayScatterData(
    points: WeightDetailPoint[],
    range: WeightChartRange,
    selectedDataX: number | null,
) {
    return points
        .map((point, index) => {
            if (!isValidPoint(point)) return null;
            return {
                value: [parsePointX(point), getWeightChartValue(point)] as [number, number],
                name: point.hour,
                symbolSize: isPointSelected(range, point, index, selectedDataX) ? 8 : 6,
            };
        })
        .filter(item => item != null);
}

function buildCategoryScatterData(
    points: WeightDetailPoint[],
    range: WeightChartRange,
    selectedDataX: number | null,
) {
    return points
        .map((point, index) => {
            if (!isValidPoint(point)) return null;
            return {
                value: [index, getWeightChartValue(point)] as [number, number],
                name: point.hour,
                symbolSize: isPointSelected(range, point, index, selectedDataX) ? 8 : 6,
            };
        })
        .filter(item => item != null);
}

function buildMonthScatterData(
    points: WeightDetailPoint[],
    selectedDataX: number | null,
) {
    return points
        .map((point, index) => {
            if (!isValidPoint(point)) return null;
            return {
                value: [index, getWeightChartValue(point)] as [number, number],
                name: point.hour,
                symbolSize: isPointSelected('month', point, index, selectedDataX) ? 8 : 6,
            };
        })
        .filter(item => item != null);
}

type MarkLineConfig = ReturnType<typeof buildCombinedMarkLine>;

function buildWeightLineSeries(
    lineData: Array<{ value: [number, number] | [string, number] | number; name?: string } | null>,
    markLine?: MarkLineConfig,
) {
    return {
        name: 'weight-line',
        type: 'line' as const,
        smooth: true,
        connectNulls: true,
        showSymbol: false,
        data: lineData,
        lineStyle: { color: LINE_COLOR, width: 2 },
        itemStyle: { color: LINE_COLOR },
        markLine,
        z: 5,
    };
}

function buildWeightScatterSeries(
    scatterData: Array<{ value: [number, number] | [string, number]; name?: string; symbolSize: number } | null>,
    markLine?: MarkLineConfig,
) {
    return {
        name: 'weight-scatter',
        type: 'scatter' as const,
        data: scatterData,
        symbol: 'circle',
        itemStyle: POINT_STYLE,
        markLine,
        z: 10,
    };
}

function buildTodayOption(
    points: WeightDetailPoint[],
    selectedDataX: number | null,
    yAxisBuilder?: YAxisBuilder,
    safetyLineY?: number,
) {
    const markLine = buildCombinedMarkLine('today', selectedDataX, [], safetyLineY);
    return {
        animation: false,
        tooltip: {
            show: false,
        },
        grid: CHART_GRID,
        xAxis: {
            type: 'value',
            min: 0,
            max: 24,
            interval: 6,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: HIDDEN_AXIS_LABEL,
            splitLine: GRID_SPLIT_LINE,
        },
        yAxis: resolveYAxis(points, yAxisBuilder),
        series: [
            buildWeightLineSeries(
                points.map(point => (
                    isValidPoint(point)
                        ? { value: [parsePointX(point), getWeightChartValue(point)] as [number, number], name: point.hour }
                        : null
                )),
                markLine,
            ),
            buildWeightScatterSeries(
                buildTodayScatterData(points, 'today', selectedDataX),
                markLine,
            ),
        ],
    };
}

function buildMonthOption(
    points: WeightDetailPoint[],
    labels: string[],
    selectedDataX: number | null,
    yAxisBuilder?: YAxisBuilder,
    safetyLineY?: number,
) {
    const markLine = buildCombinedMarkLine('month', selectedDataX, labels, safetyLineY);
    return {
        animation: false,
        tooltip: {
            show: false,
        },
        grid: CHART_GRID,
        xAxis: {
            type: 'value',
            min: 0,
            max: MONTH_X_MAX,
            interval: MONTH_TICK_INTERVAL,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: HIDDEN_AXIS_LABEL,
            splitLine: GRID_SPLIT_LINE,
        },
        yAxis: resolveYAxis(points, yAxisBuilder),
        series: [
            buildWeightLineSeries(
                points.map((point, index) => (
                    isValidPoint(point)
                        ? { value: [index, getWeightChartValue(point)] as [number, number], name: point.hour }
                        : null
                )),
                markLine,
            ),
            buildWeightScatterSeries(
                buildMonthScatterData(points, selectedDataX),
                markLine,
            ),
        ],
    };
}

function buildCategoryOption(
    points: WeightDetailPoint[],
    labels: string[],
    range: WeightChartRange,
    selectedDataX: number | null,
    yAxisBuilder?: YAxisBuilder,
    safetyLineY?: number,
) {
    const markLine = buildCombinedMarkLine(range, selectedDataX, labels, safetyLineY);
    return {
        animation: false,
        tooltip: {
            show: false,
        },
        grid: CHART_GRID,
        xAxis: {
            type: 'category',
            data: labels,
            boundaryGap: true,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: HIDDEN_AXIS_LABEL,
            splitLine: GRID_SPLIT_LINE,
        },
        yAxis: resolveYAxis(points, yAxisBuilder),
        series: [
            buildWeightLineSeries(
                points.map(point => (
                    isValidPoint(point)
                        ? { value: getWeightChartValue(point), name: point.hour }
                        : null
                )),
                markLine,
            ),
            buildWeightScatterSeries(
                buildCategoryScatterData(points, range, selectedDataX),
                markLine,
            ),
        ],
    };
}

export default function WeightDetailChart({ range, data, onPointChange, categoryLabels: categoryLabelsProp, yAxisBuilder, safetyLineY, safetyLineLabel }: Props) {
    const skiaRef = useRef<any>(null);
    const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);
    const points = data ?? [];
    const [selectedDataX, setSelectedDataX] = useState<number | null>(null);
    const [selectionPixelX, setSelectionPixelX] = useState<number | null>(null);
    const categoryLabels = useMemo(
        () => categoryLabelsProp ?? (range === 'week' ? getWeekLabels() : range === 'month' ? getMonthLabels() : []),
        [categoryLabelsProp, range],
    );

    useEffect(() => {
        setSelectedDataX(getDefaultSelectedDataX(range, points));
    }, [points, range]);

    const fallbackPixelX = useMemo(() => {
        if (selectedDataX == null) return null;
        return dataXToPixelLeft(range, selectedDataX, categoryLabels.length);
    }, [categoryLabels.length, range, selectedDataX]);

    const displayPixelX = selectionPixelX ?? fallbackPixelX;

    const selectedPoint = useMemo(
        () => findPointAtDataX(range, points, selectedDataX),
        [points, range, selectedDataX],
    );

    useEffect(() => {
        onPointChange?.(selectedPoint);
    }, [onPointChange, selectedPoint]);

    const selectAtChartX = useCallback((chartX: number) => {
        const nearestDataX = findNearestSelectableDataX(
            range,
            points,
            chartX,
            categoryLabels.length,
        );
        if (nearestDataX == null) return;
        setSelectedDataX(nearestDataX);
    }, [categoryLabels.length, points, range]);

    const selectAtPlotX = useCallback((plotX: number) => {
        selectAtChartX(PLOT_LEFT + plotX);
    }, [selectAtChartX]);

    const chartGesture = useMemo(() => {
        const tap = Gesture.Tap()
            .onEnd(event => {
                runOnJS(selectAtPlotX)(event.x);
            });

        const pan = Gesture.Pan()
            .activeOffsetX([-4, 4])
            .failOffsetY([-12, 12])
            .onStart(event => {
                runOnJS(selectAtPlotX)(event.x);
            })
            .onUpdate(event => {
                runOnJS(selectAtPlotX)(event.x);
            });

        return Gesture.Exclusive(pan, tap);
    }, [selectAtPlotX]);

    const gridExtensionPositions = useMemo(() => {
        if (range === 'today') {
            return getTodayGridLinePositions();
        }
        return getCategoryGridExtensionPositions(range, categoryLabels);
    }, [categoryLabels, range]);

    const yAxisConfig = useMemo(
        () => resolveYAxis(points, yAxisBuilder),
        [points, yAxisBuilder],
    );

    const safetyLineLabelTop = useMemo(() => {
        if (safetyLineY == null) return null;
        return getSafetyLineLabelTop(yAxisConfig.min, yAxisConfig.max, safetyLineY);
    }, [safetyLineY, yAxisConfig.max, yAxisConfig.min]);

    const option = useMemo(() => {
        if (range === 'today') {
            return buildTodayOption(points, selectedDataX, yAxisBuilder, safetyLineY);
        }
        if (range === 'month') {
            return buildMonthOption(points, categoryLabels, selectedDataX, yAxisBuilder, safetyLineY);
        }
        return buildCategoryOption(points, categoryLabels, 'week', selectedDataX, yAxisBuilder, safetyLineY);
    }, [categoryLabels, data, points, range, selectedDataX, safetyLineY, yAxisBuilder]);

    useEffect(() => {
        let chart: ReturnType<typeof echarts.init> | undefined;
        const frame = requestAnimationFrame(() => {
            if (!skiaRef.current) return;

            chart = echarts.init(skiaRef.current, 'light', {
                renderer: 'skia' as 'canvas',
                width: CHART_WIDTH,
                height: CHART_HEIGHT,
            });
            chart.setOption(option);
            chartRef.current = chart;
            requestAnimationFrame(() => {
                setSelectionPixelX(readSelectionPixelX(
                    chart,
                    range,
                    selectedDataX,
                    categoryLabels,
                    fallbackPixelX,
                ));
            });
        });

        return () => {
            cancelAnimationFrame(frame);
            chart?.dispose();
            chartRef.current = null;
        };
    }, [categoryLabels, fallbackPixelX, option, range, selectedDataX]);

    return (
        <View style={styles.chartBox}>
            <SkiaChart
                ref={skiaRef}
                style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
            />
            <GestureDetector gesture={chartGesture}>
                <Animated.View
                    style={{
                        position: 'absolute',
                        left: PLOT_LEFT,
                        top: GRID_TOP_Y,
                        width: PLOT_WIDTH,
                        height: CHART_TOUCH_HEIGHT,
                        zIndex: 15,
                    }}
                />
            </GestureDetector>
            <ChartGridExtensionLines positions={gridExtensionPositions} />
            {range === 'today'
                ? <TodayXAxisLabels />
                : range === 'month'
                    ? <MonthXAxisLabels labels={categoryLabels} />
                    : <CategoryXAxisLabels labels={categoryLabels} />}
            <ChartSelectionSlider
                thumbCenterX={displayPixelX}
                onSelectAtX={selectAtChartX}
            />
            {safetyLineY != null && safetyLineLabel && safetyLineLabelTop != null ? (
                <Text
                    pointerEvents="none"
                    style={[
                        styles.chartSafetyLineLabel,
                        {
                            top: safetyLineLabelTop,
                            left: PLOT_LEFT,
                            width: PLOT_WIDTH,
                            textAlign: 'right',
                        },
                    ]}
                >
                    {safetyLineLabel}
                </Text>
            ) : null}
        </View>
    );
}
