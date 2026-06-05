import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Flex } from '@ant-design/react-native';
import moment from 'moment';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMedicalRecordInfo, type MedicalRecord } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/home/exercise';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import type { RootStackParamList } from '@/route/router';

const PROGRESS_SIZE = 48;
const PROGRESS_STROKE = 6;
const PROGRESS_VALUE = 67;
const BTN_BORDER_STROKE = 2;
const TASK_PROGRESS = 40;
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DASH_COUNT = 30;

type WeekDayItem = {
    date: moment.Moment;
    completed: boolean;
    done: number;
    total: number;
};

function buildCurrentWeekDays(): WeekDayItem[] {
    const weekStart = moment().startOf('week');
    const mockStats = [
        { completed: true, done: 3, total: 3 },
        { completed: false, done: 1, total: 3 },
        { completed: false, done: 0, total: 8 },
        { completed: true, done: 2, total: 2 },
        { completed: false, done: 2, total: 5 },
        { completed: false, done: 0, total: 3 },
        { completed: false, done: 0, total: 8 },
    ];

    return mockStats.map((item, index) => ({
        date: moment(weekStart).add(index, 'day'),
        ...item,
    }));
}

function WeekDayCell({ item }: { item: WeekDayItem }) {
    const isToday = item.date.isSame(moment(), 'day');
    const isFuture = item.date.isAfter(moment(), 'day');

    if (isToday) {
        return (
            <View style={styles.weekDayCell}>
                <View style={[styles.weekDayCircle, styles.weekDayToday]}>
                    <Text style={styles.weekDayBadgeText}>{item.date.date()}</Text>
                    <Text style={styles.weekDayTodayText}>今</Text>
                </View>
            </View>
        );
    }

    if (isFuture) {
        return (
            <View style={styles.weekDayCell}>
                <Text style={styles.weekDayPlainText}>{item.date.date()}</Text>
            </View>
        );
    }

    if (item.completed) {
        return (
            <View style={styles.weekDayCell}>
                <View style={[styles.weekDayCircle, styles.weekDayCompleted]}>
                    <Text style={styles.weekDayBadgeText}>✓</Text>
                </View>
            </View>
        );
    }

    if (item.total > 0) {
        return (
            <View style={styles.weekDayCell}>
                <View style={[styles.weekDayCircle, styles.weekDayIncomplete]}>
                    <Text style={styles.weekDayBadgeText}>
                        {item.done}/{item.total}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.weekDayCell}>
            <Text style={styles.weekDayPlainText}>{item.date.date()}</Text>
        </View>
    );
}

function makePillStrokePath(width: number, height: number, strokeWidth: number) {
    const inset = strokeWidth / 2;
    const innerW = width - strokeWidth;
    const innerH = height - strokeWidth;
    const radius = innerH / 2;
    const left = inset;
    const top = inset;
    const right = inset + innerW;
    const cxLeft = left + radius;
    const cxRight = right - radius;
    const path = Skia.Path.Make();

    // 从左上角起笔，顺时针沿边框绘制
    path.moveTo(cxLeft, top);
    path.lineTo(cxRight, top);
    path.addArc({ x: cxRight - radius, y: top, width: radius * 2, height: innerH }, -90, 180);
    path.lineTo(cxLeft, top + innerH);
    path.addArc({ x: left, y: top, width: radius * 2, height: innerH }, 90, 180);

    return path;
}

function ProgressBorderButton({
    progress,
    onPress,
    children,
}: {
    progress: number;
    onPress?: () => void;
    children: ReactNode;
}) {
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    const { trackPath, valuePath } = useMemo(() => {
        if (layout.width <= 0 || layout.height <= 0) {
            return { trackPath: null, valuePath: null };
        }

        const track = makePillStrokePath(layout.width, layout.height, BTN_BORDER_STROKE);
        const ratio = Math.min(Math.max(progress, 0), 100) / 100;
        if (ratio <= 0) {
            return { trackPath: track, valuePath: null };
        }

        const value = makePillStrokePath(layout.width, layout.height, BTN_BORDER_STROKE);
        value.trim(0, ratio, false);
        return { trackPath: track, valuePath: value };
    }, [layout, progress]);

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <View
                style={styles.progressBtnWrap}
                onLayout={event => {
                    const { width, height } = event.nativeEvent.layout;
                    setLayout({ width, height });
                }}>
                {trackPath && (
                    <Canvas style={styles.progressBtnCanvas} pointerEvents="none">
                        <Path
                            path={trackPath}
                            color="rgba(5,58,147,0.14)"
                            style="stroke"
                            strokeWidth={BTN_BORDER_STROKE}
                        />
                        {valuePath && (
                            <Path
                                path={valuePath}
                                color="#053A93"
                                style="stroke"
                                strokeWidth={BTN_BORDER_STROKE}
                                strokeCap="round"
                            />
                        )}
                    </Canvas>
                )}
                {children}
            </View>
        </TouchableOpacity>
    );
}

function DashedDivider() {
    return (
        <View style={styles.divider}>
            {Array.from({ length: DASH_COUNT }, (_, index) => (
                <View key={index} style={styles.dash} />
            ))}
        </View>
    );
}

function AutoScrollText({ children }: { children: string }) {
    const scrollRef = useRef<ScrollView>(null);
    const containerWidthRef = useRef(0);
    const contentWidthRef = useRef(0);
    const scrollXRef = useRef(0);
    const directionRef = useRef(1);
    const pauseUntilRef = useRef(0);
    const frameRef = useRef<number | null>(null);

    const stopScroll = useCallback(() => {
        if (frameRef.current != null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
    }, []);

    const startScroll = useCallback(() => {
        stopScroll();
        scrollXRef.current = 0;
        directionRef.current = 1;
        pauseUntilRef.current = Date.now() + 1200;
        scrollRef.current?.scrollTo({ x: 0, animated: false });

        const tick = () => {
            const maxScroll = contentWidthRef.current - containerWidthRef.current;
            if (maxScroll <= 1) {
                frameRef.current = null;
                return;
            }

            const now = Date.now();
            if (now >= pauseUntilRef.current) {
                scrollXRef.current += directionRef.current * 0.5;

                if (scrollXRef.current >= maxScroll) {
                    scrollXRef.current = maxScroll;
                    directionRef.current = -1;
                    pauseUntilRef.current = now + 1200;
                } else if (scrollXRef.current <= 0) {
                    scrollXRef.current = 0;
                    directionRef.current = 1;
                    pauseUntilRef.current = now + 1200;
                }

                scrollRef.current?.scrollTo({ x: scrollXRef.current, animated: false });
            }

            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
    }, [stopScroll]);

    const updateScroll = useCallback(() => {
        const maxScroll = contentWidthRef.current - containerWidthRef.current;
        if (maxScroll > 1) {
            startScroll();
        } else {
            stopScroll();
            scrollRef.current?.scrollTo({ x: 0, animated: false });
        }
    }, [startScroll, stopScroll]);

    useEffect(() => {
        updateScroll();
        return stopScroll;
    }, [children, updateScroll, stopScroll]);

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            nestedScrollEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={styles.medicalInfoValueScroll}
            onLayout={event => {
                containerWidthRef.current = event.nativeEvent.layout.width;
                updateScroll();
            }}
            onContentSizeChange={width => {
                contentWidthRef.current = width;
                updateScroll();
            }}>
            <Text style={[styles.medicalInfoValue, styles.medicalInfoValueText]} numberOfLines={1}>
                {children}
            </Text>
        </ScrollView>
    );
}

export default function ExercisePage() {
    const weekDays = useMemo(() => buildCurrentWeekDays(), []);

    const progressRadius = (PROGRESS_SIZE - PROGRESS_STROKE) / 2;
    const progressCenter = PROGRESS_SIZE / 2;
    const progressPath = useMemo(() => {
        const path = Skia.Path.Make();
        path.addArc(
            {
                x: progressCenter - progressRadius,
                y: progressCenter - progressRadius,
                width: progressRadius * 2,
                height: progressRadius * 2,
            },
            -90,
            (360 * PROGRESS_VALUE) / 100,
        );
        return path;
    }, [progressCenter, progressRadius]);


    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <View style={styles.medicalBox}>
                    <Flex justify='between'>
                        <Text style={[styles.medicalTitle, { marginTop: 0 }]}>高血压康复运动处方</Text>
                        <View style={styles.progressRing}>
                            <Canvas style={styles.progressCanvas}>
                                <Circle
                                    cx={progressCenter}
                                    cy={progressCenter}
                                    r={progressRadius}
                                    color="rgba(5,58,147,0.14)"
                                    style="stroke"
                                    strokeWidth={PROGRESS_STROKE}
                                />
                                <Path
                                    path={progressPath}
                                    color="#053A93"
                                    style="stroke"
                                    strokeWidth={PROGRESS_STROKE}
                                    strokeCap="round"
                                />
                            </Canvas>
                            <Text style={styles.progressText}>{PROGRESS_VALUE}%</Text>
                        </View>

                    </Flex>
                    <View style={styles.medicalInfoBox}>
                        <Flex>
                            <View style={[styles.medicalCol, styles.medicalColLeft]}>
                                <Text style={styles.medicalInfoTitle}>医生</Text>
                                <AutoScrollText>李建国（北京大学人民医院）</AutoScrollText>
                            </View>
                            <View style={styles.medicalCol}>
                                <Text style={styles.medicalInfoTitle}>时长</Text>
                                <Text style={styles.medicalInfoValue}>60分钟/次</Text>
                            </View>
                        </Flex>
                        <Flex style={styles.medicalLine}>
                            <View style={[styles.medicalCol, styles.medicalColLeft]}>
                                <Text style={styles.medicalInfoTitle}>周期</Text>
                                <AutoScrollText>2024-06-15至2024-06-28</AutoScrollText>
                            </View>
                            <View style={styles.medicalCol}>
                                <Text style={styles.medicalInfoTitle}>频率</Text>
                                <Text style={styles.medicalInfoValue}>每周4次</Text>
                            </View>
                        </Flex>
                    </View>
                </View>

                <Flex justify='between'>
                    <Text style={styles.medicalTitle}>今日任务</Text>
                    <Text style={styles.rightText}>进度40%</Text>
                </Flex>
                <View style={styles.medicalBox}>
                    <Flex justify='between' style={{ marginBottom: 6 }} >
                        <Text style={[styles.leftTitle, styles.leftTitleDel]}>任务名称</Text>
                        <Text style={styles.rightText}>时间：40分钟</Text>
                    </Flex>
                    <Flex justify='between' align="end">
                        <View>
                            <Text style={styles.leftText}>时长：弹力带训练5分钟</Text>
                            <Text style={styles.leftText}>项目：自重训练、弹力带训练</Text>
                        </View>
                        <ProgressBorderButton progress={TASK_PROGRESS}>
                            <Flex style={styles.medicalStatus}>
                                <Image style={styles.statusIcon} source={require('@/assets/images/home/start.png')} />
                                <Text style={styles.statusText}>开始</Text>
                            </Flex>
                        </ProgressBorderButton>
                    </Flex>
                </View>

                <View style={styles.medicalBox}>
                    <Flex justify='between' style={{ marginBottom: 6 }} >
                        <Text style={[styles.leftTitle, styles.leftTitleDel]}>任务名称</Text>
                        <Text style={styles.rightText}>时间：40分钟</Text>
                    </Flex>
                    <Flex justify='between' align="end">
                        <View>
                            <Text style={styles.leftText}>时长：弹力带训练5分钟</Text>
                            <Text style={styles.leftText}>项目：自重训练、弹力带训练</Text>
                        </View>
                        <Text style={styles.ywcText}>已完成</Text>
                    </Flex>
                </View>
                <Text style={styles.medicalTitle}>本周训练统计</Text>


                <View style={styles.medicalBox}>
                    <View style={styles.weekHead}>
                        {WEEK_LABELS.map(label => (
                            <Text key={label} style={styles.weekCell}>
                                {label}
                            </Text>
                        ))}
                    </View>
                    <DashedDivider />
                    <View style={styles.weekDayRow}>
                        {weekDays.map(item => (
                            <WeekDayCell key={item.date.format('YYYY-MM-DD')} item={item} />
                        ))}
                    </View>
                </View>
                <Flex style={styles.statRow}>
                    <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
                        <Text style={styles.statTitle}>训练次数</Text>
                        <Text style={styles.statValue}>12/15</Text>
                    </Flex>
                    <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
                        <Text style={styles.statTitle}>完成率</Text>
                        <Text style={styles.statValue}>80%</Text>
                    </Flex>
                    <Flex direction='column' style={[styles.medicalBox, styles.statBox]}>
                        <Text style={styles.statTitle}>累计时长</Text>
                        <Text style={styles.statValue}>45小时</Text>
                    </Flex>
                </Flex>

                <Flex justify='between'>
                    <Text style={styles.medicalTitle}>历史计划</Text>
                    <TouchableOpacity>
                        <Text style={styles.allBtn}>全部</Text>
                    </TouchableOpacity>
                </Flex>

                <View style={styles.medicalBox}>
                    <Flex justify='between'>
                        <View>
                            <Text style={[styles.medicalTitle, { marginTop: 0 }]}>下肢力量训练</Text>
                            <Text style={styles.leftText}>2025/10/01-2026/01/01</Text>
                        </View>

                        <View style={styles.progressRing}>
                            <Canvas style={styles.progressCanvas}>
                                <Circle
                                    cx={progressCenter}
                                    cy={progressCenter}
                                    r={progressRadius}
                                    color="rgba(5,58,147,0.14)"
                                    style="stroke"
                                    strokeWidth={PROGRESS_STROKE}
                                />
                                <Path
                                    path={progressPath}
                                    color="#053A93"
                                    style="stroke"
                                    strokeWidth={PROGRESS_STROKE}
                                    strokeCap="round"
                                />
                            </Canvas>
                            <Text style={styles.progressText}>{PROGRESS_VALUE}%</Text>
                        </View>
                    </Flex>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
