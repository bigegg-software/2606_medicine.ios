import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation } from '@react-navigation/native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { getUserQuestionDetail, type QuestionnaireType, type UserQuestionDetailResult, type UserQuestionRecord, } from '@/api/questionTemplate';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { getRiskPercent, getScoreLevel, getScoreTip, formatEq5dScore, PROGRESS_COLORS, } from './utils/helpers';

const PROGRESS_SIZE = 182;
const PROGRESS_STROKE = 14;

export default function QuestionnaireResultPage({
    route,
}: {
    route: { params: { id: string; type: QuestionnaireType } };
}) {
    const { id, type } = route.params;
    const navigation: any = useNavigation();
    const [detail, setDetail] = useState<UserQuestionRecord | null>(null);
    const [loading, setLoading] = useState(true);

    const loadDetail = useCallback(async () => {
        if (!id) {
            setDetail(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = (await getUserQuestionDetail(id)) as unknown as UserQuestionDetailResult;
            setDetail(apiResourceData<UserQuestionRecord>(res) ?? null);
        } catch {
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const questionnaireType = detail?.type ?? type;
    const scoreLevel = useMemo(() => {
        if (questionnaireType == null || detail?.score == null) return undefined;
        return getScoreLevel(questionnaireType, detail.score);
    }, [detail?.score, questionnaireType]);

    const progressPercent = useMemo(() => {
        if (questionnaireType == null || detail?.score == null) return 0;
        return getRiskPercent(questionnaireType, detail.score);
    }, [detail?.score, questionnaireType]);

    const progressColors = scoreLevel ? PROGRESS_COLORS[scoreLevel.statusStyle] : PROGRESS_COLORS.rowStatusWarn;

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
            (360 * progressPercent) / 100,
        );
        return path;
    }, [progressCenter, progressPercent, progressRadius]);

    const questionCount = detail?.questionsAnswer?.length ?? 0;
    const scoreTip =
        questionnaireType != null && scoreLevel ? getScoreTip(questionnaireType, scoreLevel) : '';

    if (loading) {
        return (
            <PageLayout style={styles.container}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.resultTitle}>风险评分</Text>
                <View style={styles.resultCanvasBox}>
                    <Canvas style={styles.resultCanvas}>
                        <Circle
                            cx={progressCenter}
                            cy={progressCenter}
                            r={progressRadius}
                            color={progressColors.ring}
                            style="stroke"
                            strokeWidth={PROGRESS_STROKE}
                        />
                        <Path
                            path={progressPath}
                            color={progressColors.arc}
                            style="stroke"
                            strokeWidth={PROGRESS_STROKE}
                            strokeCap="round"
                        />
                    </Canvas>
                    <View>
                        {scoreLevel ? (
                            <Text style={[styles.resultScore, { color: progressColors.text }]}>
                                {scoreLevel.result}
                            </Text>
                        ) : null}
                        <Text style={[styles.resultScore, { color: progressColors.text }]}>{progressPercent}%</Text>
                    </View>
                </View>
                <View style={styles.resultScoreBox}>
                    <Flex>
                        <View style={styles.scoreBox}>
                            <Text style={styles.resultScoreTitle}>题数</Text>
                            <Text style={styles.resultScoreValue}>{questionCount}题</Text>
                        </View>
                        <View style={styles.scoreBox}>
                            <Text style={styles.resultScoreTitle}>评分</Text>
                            <Text style={styles.resultScoreValue}>
                                {detail?.score != null
                                    ? questionnaireType === 3
                                        ? formatEq5dScore(detail.score)
                                        : `${detail.score}分`
                                    : '-'}
                            </Text>
                        </View>
                    </Flex>
                    {scoreTip ? (
                        <>
                            <Flex style={styles.rowLineBox}>
                                <View style={styles.rowLine} />
                            </Flex>
                            <Text style={styles.resultScoreTip}>{scoreTip}</Text>
                        </>
                    ) : null}
                </View>
                <Text style={styles.resultScoreTip}>本结果仅为参考，不能替代专业医疗诊所建议</Text>
                <TouchableOpacity
                    style={[styles.reEvaluateBtn, { marginTop: 100 }]}
                    onPress={() => navigation.navigate('QuestionnaireDetail', { id })}>
                    <Flex justify="center" align="center" style={{ flex: 1 }}>
                        <Text style={styles.reEvaluateBtnText}>查看详情</Text>
                    </Flex>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => navigation.goBack()}>
                    <Flex justify="center" align="center" style={{ flex: 1 }}>
                        <Text style={styles.nextBtnText}>返回列表</Text>
                    </Flex>
                </TouchableOpacity>
            </ScrollView>
        </PageLayout>
    );
}
