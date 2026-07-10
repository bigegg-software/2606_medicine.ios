import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import moment from 'moment';
import styles from '@/css/vitals/bloodPage';
import { readSelectionPixelX } from './detailChartSelection';
import type { BloodGlucosePoint } from '@/src/features/profile/components/BloodGlucoseChart';
import {
    BLOOD_SUGAR_STATUS_COLORS,
    buildBloodSugarStatus,
    mapBloodSugarLevelToChartStatus,
    type BloodSugarStatus,
} from '../helpers/bloodSugar';

export type BloodSugarPoint = Omit<BloodGlucosePoint, 'status'> & {
    status?: BloodSugarStatus;
    isHigh?: number;
    isLow?: number;
    statusLabel?: string;
    dayIndex?: number;
};

export type { BloodSugarStatus };
export type BloodSugarChartRange = 'today' | 'week' | 'month';

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
const GRID_BOTTOM_Y = CHART_HEIGHT - CHART_GRID.bottom;
const X_LABEL_TOP = GRID_BOTTOM_Y + Y_AXIS_LINE_EXTEND - 12;
const CHART_TOUCH_HEIGHT = CHART_HEIGHT - GRID_TOP_Y;
const HIDDEN_AXIS_LABEL = { show: false };
const TODAY_TICK_HOURS = [0, 6, 12, 18, 24];
const Y_AXIS_INTERVAL = 2;
const WEEK_DAY_COUNT = 7;
const WEEK_X_MAX = WEEK_DAY_COUNT;
const MONTH_DAY_COUNT = 30;
const MONTH_X_MAX = MONTH_DAY_COUNT;
const MONTH_TICK_INTERVAL = 5;
const WEEK_LABEL_DIVISOR = WEEK_DAY_COUNT - 1;
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

function buildYAxis(points: BloodSugarPoint[]) {
    const values = points.map(point => point.value).filter(value => value > 0);
    const peak = values.length ? Math.max(...values) : 7;
    const max = Math.max(
        Y_AXIS_INTERVAL * 4,
        Math.ceil((peak + 1) / Y_AXIS_INTERVAL) * Y_AXIS_INTERVAL,
    );

    return {
        ...Y_AXIS,
        max,
    };
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

const POINT_SHADOW = {
    shadowBlur: 3,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
};

function getPointStatus(point: BloodSugarPoint): BloodSugarStatus {
    if (point.statusLabel) {
        const fromLevel = mapBloodSugarLevelToChartStatus(point.statusLabel);
        if (fromLevel) return fromLevel;
    }
    if (point.status) return point.status;
    return buildBloodSugarStatus(point.value, point);
}

function getPointStyle(point: BloodSugarPoint) {
    return {
        color: BLOOD_SUGAR_STATUS_COLORS[getPointStatus(point)],
        borderColor: '#FFFFFF',
        borderWidth: 2,
        ...POINT_SHADOW,
    };
}

echarts.use([SkiaRenderer, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent]);

type Props = {
    range: BloodSugarChartRange;
    data?: BloodSugarPoint[];
    onPointChange?: (point: BloodSugarPoint | undefined) => void;
};

function mapTimeToTodayHourX(hour: number, minute = 0) {
    return hour + minute / 60;
}

function parsePointX(point: BloodSugarPoint) {
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
        { length: Math.floor((MONTH_DAY_COUNT - 1) / MONTH_TICK_INTERVAL) + 1 },
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

function getCategoryGridExtensionPositions(range: BloodSugarChartRange, labels: string[]) {
    if (range === 'month') {
        return getMonthAxisTicks(labels).map(tick => ({
            left: tick.left,
            dashed: tick.dashed,
        }));
    }

    if (range === 'week') {
        return Array.from({ length: WEEK_DAY_COUNT + 1 }, (_, index) => ({
            left: PLOT_LEFT + (index / WEEK_DAY_COUNT) * PLOT_WIDTH,
            dashed: index !== 0,
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
    range: BloodSugarChartRange,
    points: BloodSugarPoint[],
) {
    const validPoints = points.filter(point => point.value > 0);
    if (!validPoints.length) return null;

    const latest = [...validPoints].sort((a, b) => parsePointX(a) - parsePointX(b)).at(-1);
    return latest ? parsePointX(latest) : null;
}

function dataXToPixelLeft(
    range: BloodSugarChartRange,
    dataX: number,
    categoryCount: number,
) {
    const plotRight = PLOT_LEFT + PLOT_WIDTH;
    let left: number;

    if (range === 'today') {
        const clampedX = Math.max(0, Math.min(24, dataX));
        left = PLOT_LEFT + (clampedX / 24) * PLOT_WIDTH;
    } else if (range === 'week') {
        const clampedX = Math.max(0, Math.min(WEEK_X_MAX, dataX));
        left = PLOT_LEFT + (clampedX / WEEK_X_MAX) * PLOT_WIDTH;
    } else if (range === 'month') {
        const clampedX = Math.max(0, Math.min(MONTH_X_MAX, dataX));
        left = PLOT_LEFT + (clampedX / MONTH_X_MAX) * PLOT_WIDTH;
    } else {
        const clampedIndex = Math.max(0, Math.min(categoryCount - 1, dataX));
        left = PLOT_LEFT + ((clampedIndex + 0.5) / categoryCount) * PLOT_WIDTH;
    }

    return Math.max(PLOT_LEFT, Math.min(plotRight, left));
}

function buildSelectionMarkLine(
    range: BloodSugarChartRange,
    selectedDataX: number | null,
    labels: string[],
) {
    if (selectedDataX == null) return undefined;

    const xAxisValue = range === 'today' || range === 'week' || range === 'month'
        ? selectedDataX
        : labels[Math.round(selectedDataX)];

    if (range !== 'today' && range !== 'week' && range !== 'month' && !xAxisValue) return undefined;

    return {
        silent: true,
        symbol: ['none', 'none'],
        lineStyle: {
            color: SELECT_LINE_COLOR,
            width: 1,
        },
        label: { show: false },
        data: [{ xAxis: xAxisValue }],
        z: 1,
    };
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
    range: BloodSugarChartRange,
    points: BloodSugarPoint[],
    pixelX: number,
    categoryCount: number,
): number | null {
    const validEntries = points
        .filter(point => point.value > 0)
        .map(point => ({
            dataX: parsePointX(point),
            point,
        }));

    if (!validEntries.length) return null;

    const clampedPixelX = Math.max(PLOT_LEFT, Math.min(PLOT_LEFT + PLOT_WIDTH, pixelX));
    const touchDataX = range === 'today'
        ? ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * 24
        : range === 'week'
            ? ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * WEEK_X_MAX
            : range === 'month'
                ? ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * MONTH_X_MAX
                : ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * categoryCount - 0.5;

    return validEntries.reduce((nearest, entry) => {
        const currentDistance = Math.abs(entry.dataX - touchDataX);
        const nearestDistance = Math.abs(nearest.dataX - touchDataX);
        return currentDistance < nearestDistance ? entry : nearest;
    }).dataX;
}

function findPointAtDataX(
    range: BloodSugarChartRange,
    points: BloodSugarPoint[],
    dataX: number | null | undefined,
) {
    if (dataX == null) return undefined;

    const validPoints = points.filter(point => point.value > 0);
    if (!validPoints.length) return undefined;

    return validPoints.reduce((nearest, point) => {
        const currentDistance = Math.abs(parsePointX(point) - dataX);
        const nearestDistance = Math.abs(parsePointX(nearest) - dataX);
        return currentDistance < nearestDistance ? point : nearest;
    });
}

function isPointSelected(
    point: BloodSugarPoint,
    selectedDataX: number | null,
) {
    if (selectedDataX == null) return false;
    return Math.abs(parsePointX(point) - selectedDataX) < 0.001;
}

function buildScatterData(
    points: BloodSugarPoint[],
    selectedDataX: number | null,
) {
    return points
        .map(point => {
            if (point.value <= 0) return null;
            return {
                value: [parsePointX(point), point.value] as [number, number],
                name: point.hour,
                symbolSize: isPointSelected(point, selectedDataX) ? 14 : 12,
                itemStyle: getPointStyle(point),
            };
        })
        .filter(item => item != null);
}

function buildTodayOption(
    points: BloodSugarPoint[],
    selectedDataX: number | null,
) {
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
        yAxis: buildYAxis(points),
        series: [
            {
                name: 'glucose',
                type: 'scatter',
                clip: false,
                data: buildScatterData(points, selectedDataX),
                symbol: 'circle',
                markLine: buildSelectionMarkLine('today', selectedDataX, []),
                z: 10,
            },
        ],
    };
}

function buildWeekOption(
    points: BloodSugarPoint[],
    labels: string[],
    selectedDataX: number | null,
) {
    return {
        animation: false,
        tooltip: {
            show: false,
        },
        grid: CHART_GRID,
        xAxis: {
            type: 'value',
            min: 0,
            max: WEEK_X_MAX,
            interval: 1,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: HIDDEN_AXIS_LABEL,
            splitLine: GRID_SPLIT_LINE,
        },
        yAxis: buildYAxis(points),
        series: [
            {
                name: 'glucose',
                type: 'scatter',
                clip: false,
                data: buildScatterData(points, selectedDataX),
                symbol: 'circle',
                markLine: buildSelectionMarkLine('week', selectedDataX, labels),
                z: 10,
            },
        ],
    };
}

function buildMonthOption(
    points: BloodSugarPoint[],
    labels: string[],
    selectedDataX: number | null,
) {
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
        yAxis: buildYAxis(points),
        series: [
            {
                name: 'glucose',
                type: 'scatter',
                clip: false,
                data: buildScatterData(points, selectedDataX),
                symbol: 'circle',
                markLine: buildSelectionMarkLine('month', selectedDataX, labels),
                z: 10,
            },
        ],
    };
}

function getWeekAxisTicks(labels: string[]) {
    return labels.map((label, index) => ({
        index,
        label,
        left: PLOT_LEFT + (index / WEEK_LABEL_DIVISOR) * PLOT_WIDTH,
        dashed: index !== 0,
    }));
}

function WeekXAxisLabels({ labels }: { labels: string[] }) {
    return getWeekAxisTicks(labels).map(tick => (
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

const TODAY_DEMO_DATA: BloodSugarPoint[] = [
    { hour: '08:00', value: 7.2, x: 8, status: 'highRisk' },
    { hour: '12:30', value: 5.2, x: 12.5, status: 'normal' },
    { hour: '18:00', value: 6.8, x: 18, status: 'high' },
    { hour: '21:00', value: 3.5, x: 21, status: 'low' },
];

const WEEK_DEMO_DATA: BloodSugarPoint[] = getWeekLabels().flatMap((label, dayIndex) => {
    const values = [
        [5.1, 'normal'],
        [6.8, 'high'],
        [4.8, 'normal'],
        [7.2, 'highRisk'],
        [5.5, 'normal'],
        [3.4, 'low'],
        [5.9, 'normal'],
    ][dayIndex] as [number, BloodSugarStatus];
    return [{
        value: values[0],
        hour: '08:00',
        x: dayIndex + 0.33,
        dayIndex,
        status: values[1],
    }, {
        value: Number((values[0] + 0.4).toFixed(1)),
        hour: '18:00',
        x: dayIndex + 0.75,
        dayIndex,
        status: values[1] === 'normal' ? 'high' : values[1],
    }];
});

const MONTH_DEMO_DATA: BloodSugarPoint[] = getMonthLabels().flatMap((label, dayIndex) => {
    if (dayIndex % 5 === 0) return [];
    const value = Number((4.5 + (dayIndex % 7) * 0.4).toFixed(1));
    const status = buildBloodSugarStatus(value);
    return [{
        value,
        hour: '09:00',
        x: dayIndex + 0.35,
        dayIndex,
        status,
    }];
});

function getDefaultData(range: BloodSugarChartRange) {
    switch (range) {
        case 'week':
            return WEEK_DEMO_DATA;
        case 'month':
            return MONTH_DEMO_DATA;
        default:
            return TODAY_DEMO_DATA;
    }
}

export default function BloodSugarDetailChart({ range, data, onPointChange }: Props) {
    const skiaRef = useRef<any>(null);
    const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);
    const points = data ?? getDefaultData(range);
    const [selectedDataX, setSelectedDataX] = useState<number | null>(null);
    const [selectionPixelX, setSelectionPixelX] = useState<number | null>(null);
    const categoryLabels = useMemo(
        () => (range === 'week' ? getWeekLabels() : range === 'month' ? getMonthLabels() : []),
        [range],
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

    const option = useMemo(() => {
        if (range === 'today') {
            return buildTodayOption(points, selectedDataX);
        }
        if (range === 'month') {
            return buildMonthOption(points, categoryLabels, selectedDataX);
        }
        return buildWeekOption(points, categoryLabels, selectedDataX);
    }, [categoryLabels, data, points, range, selectedDataX]);

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
                    : <WeekXAxisLabels labels={categoryLabels} />}
            <ChartSelectionSlider
                thumbCenterX={displayPixelX}
                onSelectAtX={selectAtChartX}
            />
        </View>
    );
}
