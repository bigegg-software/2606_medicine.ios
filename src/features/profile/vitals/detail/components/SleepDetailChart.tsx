import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import moment from 'moment';
import styles from '@/css/vitals/bloodPage';
import { readSelectionPixelX } from './detailChartSelection';
import type { SleepDetailPoint } from '../helpers/sleep';

export type SleepChartRange = 'today' | 'week' | 'month';

const BAR_COLOR = '#8F85F5';
const GOAL_MET_COLOR = '#542FC8';
const BAR_WIDTH = 10;
const MONTH_BAR_WIDTH = BAR_WIDTH / 2;

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
const Y_AXIS_INTERVAL = 2;
const MONTH_DAY_COUNT = 30;
const MONTH_X_MAX = MONTH_DAY_COUNT - 1;
const MONTH_TICK_INTERVAL = 5;
const Y_AXIS_LINE_EXTEND = 16;
const X_LABEL_LEFT_PADDING = 4;
const X_LABEL_WIDTH = 40;
const PLOT_LEFT = CHART_GRID.left;
const PLOT_WIDTH = CHART_WIDTH - CHART_GRID.left - CHART_GRID.right;
const GRID_TOP_Y = CHART_GRID.top;
const SELECT_LINE_COLOR = '#542FC8';
const GRID_BOTTOM_Y = CHART_HEIGHT - CHART_GRID.bottom;
const X_LABEL_TOP = GRID_BOTTOM_Y + Y_AXIS_LINE_EXTEND - 12;
const CHART_TOUCH_HEIGHT = CHART_HEIGHT - GRID_TOP_Y;
const HIDDEN_AXIS_LABEL = { show: false };
const SLIDER_THUMB_WIDTH = 37;
const SLIDER_THUMB_HEIGHT = 27;
const SLIDER_THUMB_TOP = 25;
const SLIDER_TRACK_HEIGHT = SLIDER_THUMB_TOP + SLIDER_THUMB_HEIGHT;
const SLIDER_BOTTOM_OFFSET = -32;

echarts.use([SkiaRenderer, BarChart, GridComponent, MarkLineComponent]);

type Props = {
    range: SleepChartRange;
    data?: SleepDetailPoint[];
    onPointChange?: (point: SleepDetailPoint | undefined) => void;
};

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

function isValidPoint(point: SleepDetailPoint) {
    return point.value > 0;
}

function getPointGoal(point: SleepDetailPoint) {
    return point.sleepGoalHours;
}

function getPeriodBarColor(point: SleepDetailPoint) {
    const goal = getPointGoal(point);
    if (goal != null && goal > 0 && point.value >= goal) {
        return GOAL_MET_COLOR;
    }
    return BAR_COLOR;
}

function buildYAxis(points: SleepDetailPoint[]) {
    const values = points.map(point => point.value).filter(value => value > 0);
    const peak = values.length ? Math.max(...values) : 8;
    const max = Math.max(
        Y_AXIS_INTERVAL * 4,
        Math.ceil(peak / Y_AXIS_INTERVAL) * Y_AXIS_INTERVAL,
    );

    return {
        type: 'value' as const,
        position: 'right' as const,
        min: 0,
        max,
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
}

function buildSelectionMarkLine(
    range: SleepChartRange,
    selectedDataX: number | null,
    labels: string[],
) {
    if (selectedDataX == null) return undefined;

    const xAxisValue = range === 'month'
        ? selectedDataX
        : range === 'today'
            ? labels[Math.round(selectedDataX)]
            : labels[Math.round(selectedDataX)];

    if (!xAxisValue && range !== 'month') return undefined;

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

function buildBarSeries(
    data: Array<{ value: number | number[]; name?: string; itemStyle?: { color: string; borderRadius: [number, number, number, number] } } | null>,
    markLine?: ReturnType<typeof buildSelectionMarkLine>,
    barWidth = BAR_WIDTH,
) {
    return [
        {
            type: 'bar',
            barWidth,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#542FC8' },
                    { offset: 1, color: 'rgba(84,47,200,0.35)' },
                ]),
                borderRadius: [2, 2, 0, 0],
            },
            data,
            markLine,
            z: 10,
        },
    ];
}

function buildPeriodBarDataItem(point: SleepDetailPoint, value: number | number[]) {
    if (!isValidPoint(point)) return null;
    return {
        value,
        name: point.hour,
        itemStyle: {
            color: getPeriodBarColor(point),
            borderRadius: [2, 2, 0, 0] as [number, number, number, number],
        },
    };
}

function getDefaultSelectedDataX(range: SleepChartRange, points: SleepDetailPoint[]) {
    let latestIndex = -1;
    points.forEach((point, index) => {
        if (isValidPoint(point)) {
            latestIndex = index;
        }
    });
    return latestIndex >= 0 ? latestIndex : null;
}

function dataXToPixelLeft(range: SleepChartRange, dataX: number, categoryCount: number) {
    const plotRight = PLOT_LEFT + PLOT_WIDTH;
    let left: number;

    if (range === 'month') {
        const clampedX = Math.max(0, Math.min(MONTH_X_MAX, dataX));
        left = PLOT_LEFT + (clampedX / MONTH_X_MAX) * PLOT_WIDTH;
    } else {
        const clampedIndex = Math.max(0, Math.min(categoryCount - 1, dataX));
        left = PLOT_LEFT + ((clampedIndex + 0.5) / categoryCount) * PLOT_WIDTH;
    }

    return Math.max(PLOT_LEFT, Math.min(plotRight, left));
}

function findNearestSelectableDataX(
    range: SleepChartRange,
    points: SleepDetailPoint[],
    pixelX: number,
    categoryCount: number,
): number | null {
    const validEntries = points
        .map((point, index) => ({ dataX: index, point }))
        .filter(({ point }) => isValidPoint(point));

    if (!validEntries.length) return null;

    const clampedPixelX = Math.max(PLOT_LEFT, Math.min(PLOT_LEFT + PLOT_WIDTH, pixelX));
    const touchDataX = range === 'month'
        ? ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * MONTH_X_MAX
        : ((clampedPixelX - PLOT_LEFT) / PLOT_WIDTH) * categoryCount - 0.5;

    return validEntries.reduce((nearest, entry) => {
        const currentDistance = Math.abs(entry.dataX - touchDataX);
        const nearestDistance = Math.abs(nearest.dataX - touchDataX);
        return currentDistance < nearestDistance ? entry : nearest;
    }).dataX;
}

function findPointAtDataX(points: SleepDetailPoint[], dataX: number | null | undefined) {
    if (dataX == null) return undefined;
    const index = Math.round(dataX);
    return points[index];
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

function getCategoryTickLeft(index: number, count: number) {
    if (index === 0) return PLOT_LEFT;
    if (index === count - 1) return PLOT_LEFT + PLOT_WIDTH;
    return PLOT_LEFT + ((index + 0.5) / count) * PLOT_WIDTH;
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

function getCategoryGridExtensionPositions(range: SleepChartRange, labels: string[]) {
    if (range === 'month') {
        return getMonthTickIndices().map(index => ({
            left: getMonthTickLeft(index),
            dashed: index !== 0,
        }));
    }

    const count = labels.length;
    return Array.from({ length: count + 1 }, (_, index) => ({
        left: PLOT_LEFT + (index / count) * PLOT_WIDTH,
        dashed: index !== 0 && index !== count,
    }));
}

function getSliderThumbLeft(thumbCenterX: number | null) {
    if (thumbCenterX == null) {
        return PLOT_LEFT - SLIDER_THUMB_WIDTH / 2;
    }

    const minLeft = PLOT_LEFT - SLIDER_THUMB_WIDTH / 2;
    const maxLeft = PLOT_LEFT + PLOT_WIDTH - SLIDER_THUMB_WIDTH / 2;
    return Math.max(minLeft, Math.min(thumbCenterX - SLIDER_THUMB_WIDTH / 2, maxLeft));
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

function MonthXAxisLabels({ labels }: { labels: string[] }) {
    return getMonthTickIndices().map(index => (
        <Text
            key={`${labels[index]}-${index}`}
            pointerEvents="none"
            style={[
                styles.chartXLabel,
                {
                    top: X_LABEL_TOP,
                    left: getMonthTickLeft(index) + X_LABEL_LEFT_PADDING,
                    textAlign: 'left',
                },
            ]}
        >
            {labels[index]}
        </Text>
    ));
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

function buildCategoryOption(
    points: SleepDetailPoint[],
    labels: string[],
    range: SleepChartRange,
    selectedDataX: number | null,
) {
    const barData = points.map(point => buildPeriodBarDataItem(point, point.value));

    return {
        animation: false,
        tooltip: { show: false },
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
        series: buildBarSeries(barData, buildSelectionMarkLine(range, selectedDataX, labels)),
    };
}

function buildMonthOption(
    points: SleepDetailPoint[],
    labels: string[],
    selectedDataX: number | null,
) {
    const barData = points.map((point, index) => buildPeriodBarDataItem(point, [index, point.value]));

    return {
        animation: false,
        tooltip: { show: false },
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
        series: buildBarSeries(
            barData,
            buildSelectionMarkLine('month', selectedDataX, labels),
            MONTH_BAR_WIDTH,
        ),
    };
}

export default function SleepDetailChart({
    range,
    data = [],
    onPointChange,
}: Props) {
    const skiaRef = useRef<any>(null);
    const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);
    const points = data;
    const [selectedDataX, setSelectedDataX] = useState<number | null>(null);
    const [selectionPixelX, setSelectionPixelX] = useState<number | null>(null);
    const categoryLabels = useMemo(() => {
        if (range === 'today') {
            return points.map(point => point.hour);
        }
        if (range === 'week') {
            return getWeekLabels();
        }
        if (range === 'month') {
            return getMonthLabels();
        }
        return [];
    }, [points, range]);

    useEffect(() => {
        setSelectedDataX(getDefaultSelectedDataX(range, points));
    }, [points, range]);

    const fallbackPixelX = useMemo(() => {
        if (selectedDataX == null) return null;
        return dataXToPixelLeft(range, selectedDataX, categoryLabels.length);
    }, [categoryLabels.length, range, selectedDataX]);

    const displayPixelX = selectionPixelX ?? fallbackPixelX;

    const selectedPoint = useMemo(
        () => findPointAtDataX(points, selectedDataX),
        [points, selectedDataX],
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

    const gridExtensionPositions = useMemo(
        () => getCategoryGridExtensionPositions(range, categoryLabels),
        [categoryLabels, range],
    );

    const option = useMemo(() => {
        if (range === 'month') {
            return buildMonthOption(points, categoryLabels, selectedDataX);
        }
        return buildCategoryOption(points, categoryLabels, range, selectedDataX);
    }, [categoryLabels, points, range, selectedDataX]);

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
            {range === 'month'
                ? <MonthXAxisLabels labels={categoryLabels} />
                : <CategoryXAxisLabels labels={categoryLabels} />}
            <ChartSelectionSlider
                thumbCenterX={displayPixelX}
                onSelectAtX={selectAtChartX}
            />
        </View>
    );
}
