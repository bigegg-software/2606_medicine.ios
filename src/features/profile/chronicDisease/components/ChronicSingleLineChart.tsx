import React, { useEffect, useMemo, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import SkiaChart, { SkiaRenderer } from '@wuba/react-native-echarts/skiaChart';
import styles from '@/css/chronicDisease/detail';
import {
    buildChartXAxis,
    buildIsolatedLineScatterData,
    toChartValuePairs,
    type LineChartSeriesItem,
} from '../../components/chartAxis';
import type { LabeledValue } from '@/src/features/profile/vitals/vitalsHelpers';

const CHART_WIDTH = Dimensions.get('window').width - 84;
const CHART_HEIGHT = 120;

echarts.use([SkiaRenderer, LineChart, ScatterChart, GridComponent, TooltipComponent]);

type Props = {
    data: LabeledValue[];
    labels: string[];
    color: string;
    tooltipLabel: string;
    valueSuffix?: string;
};

function buildOption(
    points: LabeledValue[],
    labels: string[],
    color: string,
    tooltipLabel: string,
    valueSuffix = '',
) {
    const chartPoints = points.map(point => ({ hour: point.label, value: point.value, x: point.x }));
    const values = toChartValuePairs(chartPoints, value => value > 0) as LineChartSeriesItem[];
    const scatterData = buildIsolatedLineScatterData(values);

    return {
        animation: false,
        tooltip: {
            trigger: 'axis',
            triggerOn: 'click',
            confine: true,
            backgroundColor: 'rgba(51,51,51,0.9)',
            borderWidth: 0,
            padding: [4, 8],
            textStyle: { color: '#fff', fontSize: 10, lineHeight: 14 },
            formatter: (params: unknown) => {
                const items = Array.isArray(params) ? params : [params];
                const first = items[0] as { dataIndex?: number; name?: string; axisValueLabel?: string; value?: unknown };
                const title = first?.name || first?.axisValueLabel || '';
                const raw = first?.value;
                const value = Array.isArray(raw) ? raw[1] : raw;
                if (value == null || value === '') return title;
                return `${title}\n${tooltipLabel} ${value}${valueSuffix}`;
            },
        },
        grid: { top: 8, right: 8, bottom: 0, left: 36 },
        xAxis: buildChartXAxis(chartPoints, labels, false),
        yAxis: {
            type: 'value',
            scale: true,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { show: true, fontSize: 10, color: '#999999', margin: 4 },
            splitLine: { show: false },
        },
        series: [
            {
                type: 'line',
                smooth: true,
                connectNulls: false,
                showSymbol: false,
                data: values,
                lineStyle: { color, width: 2 },
                itemStyle: { color },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color },
                        { offset: 1, color: `${color}00` },
                    ]),
                },
            },
            {
                type: 'scatter',
                data: scatterData,
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color },
                z: 10,
            },
        ],
    };
}

export default function ChronicSingleLineChart({
    data,
    labels,
    color,
    tooltipLabel,
    valueSuffix,
}: Props) {
    const skiaRef = useRef<any>(null);
    const option = useMemo(
        () => buildOption(data, labels, color, tooltipLabel, valueSuffix),
        [data, labels, color, tooltipLabel, valueSuffix],
    );

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
        });
        return () => {
            cancelAnimationFrame(frame);
            chart?.dispose();
        };
    }, [option]);

    return (
        <View style={styles.chartBox}>
            <SkiaChart ref={skiaRef} style={styles.chart} />
        </View>
    );
}
