import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import * as echarts from 'echarts/core';
import { BarChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import moment from 'moment';
import styles from '@/css/vitals/bloodPage';
import {
    BLOOD_OXYGEN_NORMAL_THRESHOLD,
    getBloodOxygenPointColor,
} from '../helpers/bloodOxygen';
import { readSelectionPixelX } from './detailChartSelection';
export type BloodOxygenPoint = {
    hour: string;
    min: number;
    max: number;
    x?: number;
};

export type BloodOxygenChartRange = 'today' | 'week' | 'month';

const OXYGEN_THRESHOLD = BLOOD_OXYGEN_NORMAL_THRESHOLD;
const COLOR_ABOVE_THRESHOLD = '#6D925E';
const COLOR_BELOW_THRESHOLD = '#EE9C44';
const BAR_WIDTH = 10;
const MONTH_BAR_WIDTH = BAR_WIDTH / 2;
const BAR_STACK = 'bloodOxygenRange';

const INVISIBLE_BAR_STYLE = {
    color: 'rgba(0,0,0,0)',
    borderColor: 'rgba(0,0,0,0)',
    borderWidth: 0,
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
const GRID_BOTTOM_Y = CHART_HEIGHT - CHART_GRID.bottom;
const X_LABEL_TOP = GRID_BOTTOM_Y + Y_AXIS_LINE_EXTEND - 12;
const CHART_TOUCH_HEIGHT = CHART_HEIGHT - GRID_TOP_Y;
const HIDDEN_AXIS_LABEL = { show: false };
const TODAY_TICK_HOURS = [0, 6, 12, 18, 24];
const Y_AXIS_INTERVAL = 5;
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

function buildYAxis(points: BloodOxygenPoint[]) {
    const values = points.flatMap(point => [point.min, point.max]).filter(value => value > 0);
    const floor = values.length ? Math.min(...values) : 90;
    const min = Math.max(80, Math.floor((floor - 2) / Y_AXIS_INTERVAL) * Y_AXIS_INTERVAL);

    return {
        ...Y_AXIS,
        min,
        max: 100,
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

function isValidPoint(point: BloodOxygenPoint) {
    return point.min > 0 && point.max > 0 && point.max >= point.min;
}

function getOxygenChartValue(point: BloodOxygenPoint) {
    return point.min === point.max
        ? point.min
        : Math.round((point.min + point.max) / 2);
}

function isTodayPointSelected(point: BloodOxygenPoint, selectedDataX: number | null) {
    if (selectedDataX == null) return false;
    return Math.abs(parsePointX(point) - selectedDataX) < 0.001;
}

function getBelowSegmentHeight(min: number, max: number) {
    if (min >= OXYGEN_THRESHOLD) return 0;
    return Math.min(max, OXYGEN_THRESHOLD) - min;
}

function getAboveSegmentHeight(min: number, max: number) {
    if (max <= OXYGEN_THRESHOLD) return 0;
    return max - Math.max(min, OXYGEN_THRESHOLD);
}

function buildIntervalCapSeries(
    points: BloodOxygenPoint[],
    getX: (point: BloodOxygenPoint, index: number) => number,
    barWidth = BAR_WIDTH,
) {
    const capData: Array<{
        value: [number, number];
        symbolSize: [number, number];
        itemStyle: { color: string };
    }> = [];

    points.forEach((point, index) => {
        if (!isValidPoint(point)) return;
        const x = getX(point, index);
        capData.push(
            {
                value: [x, point.min],
                symbolSize: [barWidth, 3],
                itemStyle: { color: point.min >= OXYGEN_THRESHOLD ? COLOR_ABOVE_THRESHOLD : COLOR_BELOW_THRESHOLD },
            },
            {
                value: [x, point.max],
                symbolSize: [barWidth, 3],
                itemStyle: { color: point.max > OXYGEN_THRESHOLD ? COLOR_ABOVE_THRESHOLD : COLOR_BELOW_THRESHOLD },
            },
        );
    });

    return {
        type: 'scatter',
        symbol: 'rect',
        data: capData,
        z: 15,
    };
}

function buildCombinedMarkLine(
    range: BloodOxygenChartRange,
    selectedDataX: number | null,
    labels: string[],
) {
    const data: Array<Record<string, unknown>> = [
        {
            yAxis: OXYGEN_THRESHOLD,
            lineStyle: {
                color: COLOR_ABOVE_THRESHOLD,
                opacity: 0.6,
                width: 3,
                type: 'dashed',
            },
            label: { show: false },
        },
    ];

    if (selectedDataX != null) {
        const xAxisValue = range === 'today' || range === 'month'
            ? selectedDataX
            : labels[Math.round(selectedDataX)];

        if (range === 'today' || xAxisValue) {
            data.unshift({
                xAxis: xAxisValue,
                lineStyle: {
                    color: SELECT_LINE_COLOR,
                    width: 1,
                },
                label: { show: false },
            });
        }
    }

    return {
        silent: true,
        symbol: ['none', 'none'],
        data,
        z: 1,
    };
}

function buildRangeBarSeries(
    baseData: Array<{ value: number | number[]; name?: string } | null>,
    belowData: Array<{ value: number | number[]; name?: string } | null>,
    aboveData: Array<{ value: number | number[]; name?: string } | null>,
    capSeries: Record<string, unknown>,
    markLine?: ReturnType<typeof buildCombinedMarkLine>,
    barWidth = BAR_WIDTH,
) {
    return [
        {
            name: 'base',
            type: 'bar',
            stack: BAR_STACK,
            silent: true,
            barWidth,
            itemStyle: INVISIBLE_BAR_STYLE,
            emphasis: { disabled: true },
            data: baseData,
            z: 5,
        },
        {
            name: 'below',
            type: 'bar',
            stack: BAR_STACK,
            barWidth,
            itemStyle: {
                color: COLOR_BELOW_THRESHOLD,
                borderRadius: [2, 2, 0, 0],
            },
            data: belowData,
            z: 10,
        },
        {
            name: 'above',
            type: 'bar',
            stack: BAR_STACK,
            barWidth,
            itemStyle: {
                color: COLOR_ABOVE_THRESHOLD,
                borderRadius: [2, 2, 0, 0],
            },
            data: aboveData,
            markLine,
            z: 10,
        },
        capSeries,
    ];
}

echarts.use([SkiaRenderer, BarChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent]);

type Props = {
    range: BloodOxygenChartRange;
    data?: BloodOxygenPoint[];
    onPointChange?: (point: BloodOxygenPoint | undefined) => void;
};

function mapTimeToTodayHourX(hour: number, minute = 0) {
    return hour + minute / 60;
}

function parsePointX(point: BloodOxygenPoint) {
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

function getCategoryGridExtensionPositions(range: BloodOxygenChartRange, labels: string[]) {
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
    range: BloodOxygenChartRange,
    points: BloodOxygenPoint[],
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
    range: BloodOxygenChartRange,
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
    range: BloodOxygenChartRange,
    points: BloodOxygenPoint[],
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
    const touchDataX = range === 'today'
        ? ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * 24
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
    range: BloodOxygenChartRange,
    points: BloodOxygenPoint[],
    dataX: number | null | undefined,
) {
    if (dataX == null) return undefined;

    if (range === 'today') {
        return points.find(point => Math.abs(parsePointX(point) - dataX) < 0.001);
    }

    const index = Math.round(dataX);
    return points[index];
}

function buildTodayScatterData(
    points: BloodOxygenPoint[],
    selectedDataX: number | null,
) {
    return points
        .map(point => {
            if (!isValidPoint(point)) return null;
            const value = getOxygenChartValue(point);
            return {
                value: [parsePointX(point), value] as [number, number],
                name: point.hour,
                symbolSize: isTodayPointSelected(point, selectedDataX) ? 10 : 8,
                itemStyle: { color: getBloodOxygenPointColor(value) },
            };
        })
        .filter(item => item != null);
}

function buildCategoryBarSeries(
    points: BloodOxygenPoint[],
    range: BloodOxygenChartRange,
    labels: string[],
    selectedDataX: number | null,
) {
    const baseData = points.map(point => (
        isValidPoint(point)
            ? { value: point.min, name: point.hour }
            : null
    ));
    const belowData = points.map(point => (
        isValidPoint(point)
            ? { value: getBelowSegmentHeight(point.min, point.max), name: point.hour }
            : null
    ));
    const aboveData = points.map(point => (
        isValidPoint(point)
            ? { value: getAboveSegmentHeight(point.min, point.max), name: point.hour }
            : null
    ));

    return buildRangeBarSeries(
        baseData,
        belowData,
        aboveData,
        buildIntervalCapSeries(points, (_, index) => index),
        buildCombinedMarkLine(range, selectedDataX, labels),
    );
}

function buildMonthBarSeries(
    points: BloodOxygenPoint[],
    labels: string[],
    selectedDataX: number | null,
) {
    const baseData = points.map((point, index) => (
        isValidPoint(point)
            ? { value: [index, point.min], name: point.hour }
            : null
    ));
    const belowData = points.map((point, index) => (
        isValidPoint(point)
            ? { value: [index, getBelowSegmentHeight(point.min, point.max)], name: point.hour }
            : null
    ));
    const aboveData = points.map((point, index) => (
        isValidPoint(point)
            ? { value: [index, getAboveSegmentHeight(point.min, point.max)], name: point.hour }
            : null
    ));

    return buildRangeBarSeries(
        baseData,
        belowData,
        aboveData,
        buildIntervalCapSeries(points, (_, index) => index, MONTH_BAR_WIDTH),
        buildCombinedMarkLine('month', selectedDataX, labels),
        MONTH_BAR_WIDTH,
    );
}

function buildTodayOption(
    points: BloodOxygenPoint[],
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
                name: 'oxygen',
                type: 'scatter',
                data: buildTodayScatterData(points, selectedDataX),
                symbol: 'circle',
                markLine: buildCombinedMarkLine('today', selectedDataX, []),
                z: 10,
            },
        ],
    };
}

function buildMonthOption(
    points: BloodOxygenPoint[],
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
        series: buildMonthBarSeries(points, labels, selectedDataX),
    };
}

function buildCategoryOption(
    points: BloodOxygenPoint[],
    labels: string[],
    range: BloodOxygenChartRange,
    selectedDataX: number | null,
) {
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
        yAxis: buildYAxis(points),
        series: buildCategoryBarSeries(points, range, labels, selectedDataX),
    };
}

const TODAY_DEMO_DATA: BloodOxygenPoint[] = [
    { hour: '08:00', min: 95, max: 100, x: 8 },
    { hour: '12:00', min: 92, max: 98, x: 12 },
    { hour: '18:00', min: 88, max: 94, x: 18 },
];

const WEEK_DEMO_DATA: BloodOxygenPoint[] = getWeekLabels().map((label, index) => {
    const ranges = [
        [95, 100],
        [92, 98],
        [90, 96],
        [93, 99],
        [88, 94],
        [96, 100],
        [94, 97],
    ] as const;
    const [min, max] = ranges[index];
    return { hour: label, min, max };
});

const MONTH_DEMO_DATA: BloodOxygenPoint[] = getMonthLabels().map((label, index) => {
    if (index % 5 === 0) {
        return { hour: label, min: 0, max: 0 };
    }
    const min = 88 + (index % 6);
    const max = Math.min(100, min + 4 + (index % 3));
    return { hour: label, min, max };
});

function getDefaultData(range: BloodOxygenChartRange) {
    switch (range) {
        case 'week':
            return WEEK_DEMO_DATA;
        case 'month':
            return MONTH_DEMO_DATA;
        default:
            return TODAY_DEMO_DATA;
    }
}

export default function BloodOxygenDetailChart({ range, data, onPointChange }: Props) {
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
        return buildCategoryOption(points, categoryLabels, 'week', selectedDataX);
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
                    : <CategoryXAxisLabels labels={categoryLabels} />}
            <ChartSelectionSlider
                thumbCenterX={displayPixelX}
                onSelectAtX={selectAtChartX}
            />
        </View>
    );
}
