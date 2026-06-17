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
    toBloodPressureSeriesData,
} from '@/src/features/home/components/chartAxis';
import type { BloodPressurePoint } from '@/src/features/home/components/BloodPressureChart';

const CHART_WIDTH = Dimensions.get('window').width - 84;
const CHART_HEIGHT = 120;

echarts.use([SkiaRenderer, LineChart, ScatterChart, GridComponent, TooltipComponent]);

type Props = {
    data: BloodPressurePoint[];
    labels: string[];
};

function buildOption(points: BloodPressurePoint[], labels: string[]) {
    const { chartPoints, high: highData, low: lowData } = toBloodPressureSeriesData(points);
    const highScatter = buildIsolatedLineScatterData(highData);
    const lowScatter = buildIsolatedLineScatterData(lowData);

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
                const first = items[0] as { dataIndex?: number; name?: string; axisValueLabel?: string };
                const dataIndex = first?.dataIndex;
                const point = dataIndex != null ? chartPoints[dataIndex] : undefined;
                const title = point?.hour || first?.name || first?.axisValueLabel || '';
                if (point && point.high > 0 && point.low > 0) return `${title}\n血压 ${point.high}/${point.low}`;
                if (point && point.high > 0) return `${title}\n血压 ${point.high}`;
                if (point && point.low > 0) return `${title}\n血压 ${point.low}`;
                return title;
            },
        },
        grid: { top: 8, right: 8, bottom: 0, left: 36 },
        xAxis: buildChartXAxis(points, labels, false),
        yAxis: {
            type: 'value',
            min: 0,
            interval: 35,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { show: true, fontSize: 10, color: '#999999', margin: 4 },
            splitLine: { show: false },
        },
        series: [
            {
                name: 'low',
                type: 'line',
                smooth: true,
                connectNulls: false,
                showSymbol: false,
                data: lowData,
                lineStyle: { color: '#4F86EE', width: 2 },
                itemStyle: { color: '#4F86EE' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#4F86EE' },
                        { offset: 1, color: 'rgba(79,134,238,0)' },
                    ]),
                },
            },
            {
                name: 'high',
                type: 'line',
                smooth: true,
                connectNulls: false,
                showSymbol: false,
                data: highData,
                lineStyle: { color: '#FF8B07', width: 2 },
                itemStyle: { color: '#FF8B07' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#FF8B07' },
                        { offset: 1, color: 'rgba(255,139,7,0)' },
                    ]),
                },
            },
            {
                name: 'low-scatter',
                type: 'scatter',
                data: lowScatter,
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: '#4F86EE' },
                z: 10,
            },
            {
                name: 'high-scatter',
                type: 'scatter',
                data: highScatter,
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: '#FF8B07' },
                z: 10,
            },
        ],
    };
}

export default function ChronicBloodPressureChart({ data, labels }: Props) {
    const skiaRef = useRef<any>(null);
    const option = useMemo(() => buildOption(data, labels), [data, labels]);

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
