import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { WearableDataItem } from '@/api/wearableData';
import styles from '@/css/vitals/bloodPage';
import {
    buildSleepStageTimeline,
    type SleepStageTimelineSegment,
} from '@/src/features/profile/components/sleepStageChartHelpers';
import { formatSleepStageBoundaryLabels } from '../helpers/sleep';

const SVG_WIDTH = 645;
const SVG_HEIGHT = 577;
const SVG_PLOT_HEIGHT = 496;
const SVG_TIME_HEIGHT = SVG_HEIGHT - SVG_PLOT_HEIGHT;
const SVG_Y_LABEL_WIDTH = 97;
const SVG_BAR_HEIGHT = 90;
const SVG_BAND_HEIGHT = 124;

const CHART_PADDING = 54;
const CHART_WIDTH = Dimensions.get('window').width - CHART_PADDING;
const CHART_HEIGHT = 260;
const Y_LABEL_WIDTH = Math.round((SVG_Y_LABEL_WIDTH / SVG_WIDTH) * CHART_WIDTH);
const PLOT_WIDTH = CHART_WIDTH - Y_LABEL_WIDTH;
const PLOT_HEIGHT = Math.round((SVG_PLOT_HEIGHT / SVG_HEIGHT) * CHART_HEIGHT);
const TIME_ROW_HEIGHT = CHART_HEIGHT - PLOT_HEIGHT;
const BAND_COUNT = 4;
const BAND_ROW_HEIGHT = PLOT_HEIGHT / BAND_COUNT;
const BAR_HEIGHT = BAND_ROW_HEIGHT * (SVG_BAR_HEIGHT / SVG_BAND_HEIGHT);
const CONNECTOR_WIDTH = 3;
const CONNECTOR_OVERLAP = 1;
const BAR_CORNER_RADIUS = Math.min(5, BAR_HEIGHT * 0.12);

const GRID_BORDER_COLOR = '#D4D5D9';
const GRID_LINE_COLOR = 'rgba(212, 213, 217, 0.4)';
const STAGE_Y_LABELS = ['清醒', '快速眼动', '浅睡', '深睡'];
const STAGE_LABEL_TOP = 6;
const TIME_LEFT_PADDING = 8;
const TIME_RIGHT_PADDING = Math.max(8, Math.round((17 / SVG_WIDTH) * CHART_WIDTH));
const VERTICAL_GRID_RATIOS = [0.25, 0.5, 0.75];

type Props = {
    item?: WearableDataItem;
};

function getBandRowTop(band: number) {
    return band * BAND_ROW_HEIGHT;
}

function getBarTop(band: number) {
    return getBandRowTop(band) + (BAND_ROW_HEIGHT - BAR_HEIGHT) / 2;
}

function getBarBorderRadius(width: number) {
    if (width <= BAR_HEIGHT * 0.85) {
        return Math.min(BAR_CORNER_RADIUS + 1, width / 2, BAR_HEIGHT / 2);
    }
    return BAR_CORNER_RADIUS;
}

function mergeAdjacentStages(segments: SleepStageTimelineSegment[]) {
    const merged: SleepStageTimelineSegment[] = [];

    segments.forEach(segment => {
        const last = merged[merged.length - 1];
        if (last && last.stage === segment.stage) {
            last.endMs = Math.max(last.endMs, segment.endMs);
            return;
        }
        merged.push({ ...segment });
    });

    return merged;
}

function msToX(ms: number, minStart: number, total: number) {
    return ((ms - minStart) / total) * PLOT_WIDTH;
}

type ConnectorItem = {
    key: string;
    left: number;
    top: number;
    height: number;
    width: number;
    fromColor: string;
    toColor: string;
};

type BarItem = {
    key: string;
    left: number;
    top: number;
    width: number;
    color: string;
    borderRadius: number;
};

function getConnectorVerticalRange(top: number, nextTop: number) {
    const upperTop = Math.min(top, nextTop);
    const lowerTop = Math.max(top, nextTop);
    return {
        top: upperTop + BAR_HEIGHT * 0.28,
        bottom: lowerTop + BAR_HEIGHT * 0.72,
    };
}

function buildChartItems(segments: SleepStageTimelineSegment[]) {
    if (!segments.length) {
        return { bars: [] as BarItem[], connectors: [] as ConnectorItem[] };
    }

    const minStart = segments[0].startMs;
    const maxEnd = Math.max(...segments.map(segment => segment.endMs));
    const total = maxEnd - minStart || 1;
    const bars: BarItem[] = [];
    const connectors: ConnectorItem[] = [];

    segments.forEach((segment, index) => {
        const prev = segments[index - 1];
        const next = segments[index + 1];
        const baseLeft = msToX(segment.startMs, minStart, total);
        const baseRight = msToX(segment.endMs, minStart, total);
        const extendLeft = prev && prev.band !== segment.band ? CONNECTOR_OVERLAP : 0;
        const extendRight = next && next.band !== segment.band ? CONNECTOR_OVERLAP : 0;
        const left = baseLeft - extendLeft;
        const width = Math.max(
            baseRight - baseLeft + extendLeft + extendRight,
            segment.stage === 'AWAKE' ? 2 : 3,
        );
        const top = getBarTop(segment.band);

        bars.push({
            key: `bar-${segment.stage}-${segment.startMs}`,
            left,
            top,
            width,
            color: segment.color,
            borderRadius: getBarBorderRadius(width),
        });

        if (!next || next.band === segment.band) return;

        const nextTop = getBarTop(next.band);
        const connectorRange = getConnectorVerticalRange(top, nextTop);
        const fromColor = top <= nextTop ? segment.color : next.color;
        const toColor = top <= nextTop ? next.color : segment.color;

        connectors.push({
            key: `connector-${index}-${segment.endMs}`,
            left: baseRight - CONNECTOR_WIDTH / 2,
            top: connectorRange.top,
            height: connectorRange.bottom - connectorRange.top,
            width: CONNECTOR_WIDTH,
            fromColor,
            toColor,
        });
    });

    return { bars, connectors };
}

function ChartVerticalGridLines() {
    return (
        <>
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 0,
                    height: CHART_HEIGHT,
                    borderLeftWidth: 1,
                    borderColor: GRID_BORDER_COLOR,
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 0,
                    height: CHART_HEIGHT,
                    borderLeftWidth: 1,
                    borderColor: GRID_BORDER_COLOR,
                }}
            />
            {VERTICAL_GRID_RATIOS.map(ratio => (
                <View
                    key={`v-${ratio}`}
                    pointerEvents="none"
                    style={{
                        position: 'absolute',
                        left: CHART_WIDTH * ratio,
                        top: 0,
                        width: 0,
                        height: CHART_HEIGHT,
                        borderLeftWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: GRID_LINE_COLOR,
                    }}
                />
            ))}
        </>
    );
}

function BodyHorizontalGridLines() {
    return (
        <>
            {Array.from({ length: BAND_COUNT + 1 }, (_, index) => {
                const top = index === BAND_COUNT ? PLOT_HEIGHT : getBandRowTop(index);
                return (
                    <View
                        key={`body-h-${index}`}
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: 0,
                            top,
                            width: CHART_WIDTH,
                            height: 0,
                            borderTopWidth: 1,
                            borderColor: GRID_BORDER_COLOR,
                        }}
                    />
                );
            })}
        </>
    );
}

function TimeBoundaryLabels({
    labels,
}: {
    labels: ReturnType<typeof formatSleepStageBoundaryLabels>;
}) {
    return (
        <>
            <View style={styles.sleepStageTimeBlock}>
                <Text style={styles.sleepStageTimeDate}>{labels.sleepDate}</Text>
                <Text style={styles.sleepStageTimeText}>{labels.sleepTime}</Text>
            </View>
            <View style={[styles.sleepStageTimeBlock, styles.sleepStageTimeBlockRight]}>
                <Text style={[styles.sleepStageTimeDate, styles.sleepStageTimeDateRight]}>
                    {labels.wakeDate}
                </Text>
                <Text style={[styles.sleepStageTimeText, styles.sleepStageTimeTextRight]}>
                    {labels.wakeTime}
                </Text>
            </View>
        </>
    );
}

export default function SleepStageDetailChart({ item }: Props) {
    const segments = useMemo(
        () => mergeAdjacentStages(buildSleepStageTimeline(item)),
        [item],
    );
    const { bars, connectors } = useMemo(() => buildChartItems(segments), [segments]);
    const boundaryLabels = useMemo(() => formatSleepStageBoundaryLabels(item), [item]);

    return (
        <View style={[styles.sleepStageDetailWrap, { width: CHART_WIDTH, height: CHART_HEIGHT }]}>
            <ChartVerticalGridLines />

            <View style={[styles.sleepStageDetailBody, { width: CHART_WIDTH, height: PLOT_HEIGHT }]}>
                <BodyHorizontalGridLines />

                <View style={[styles.sleepStageYLabels, { width: Y_LABEL_WIDTH, height: PLOT_HEIGHT }]}>
                    {STAGE_Y_LABELS.map((label, index) => (
                        <Text
                            key={label}
                            style={[
                                styles.sleepStageYLabel,
                                { top: getBandRowTop(index) + STAGE_LABEL_TOP },
                            ]}
                        >
                            {label}
                        </Text>
                    ))}
                </View>

                <View style={{ width: PLOT_WIDTH, height: PLOT_HEIGHT, position: 'relative' }}>
                    {connectors.map(entry => (
                        <LinearGradient
                            key={entry.key}
                            pointerEvents="none"
                            colors={[entry.fromColor, entry.toColor]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={{
                                position: 'absolute',
                                left: entry.left,
                                top: entry.top,
                                width: entry.width,
                                height: entry.height,
                                borderRadius: entry.width / 2,
                            }}
                        />
                    ))}
                    {bars.map(entry => (
                        <View
                            key={entry.key}
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                left: entry.left,
                                top: entry.top,
                                width: entry.width,
                                height: BAR_HEIGHT,
                                backgroundColor: entry.color,
                                borderRadius: entry.borderRadius,
                            }}
                        />
                    ))}
                    {!segments.length ? (
                        <View style={styles.sleepStageEmptyPlot} pointerEvents="none" />
                    ) : null}
                </View>
            </View>

            <View
                style={[
                    styles.sleepStageTimeRow,
                    {
                        width: CHART_WIDTH,
                        height: TIME_ROW_HEIGHT,
                        paddingLeft: TIME_LEFT_PADDING,
                        paddingRight: TIME_RIGHT_PADDING,
                    },
                ]}
            >
                <TimeBoundaryLabels labels={boundaryLabels} />
            </View>
        </View>
    );
}
