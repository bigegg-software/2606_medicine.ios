import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import {
    getUserQuestionDetail,
    type UserQuestionAnswerItem,
    type UserQuestionDetailResult,
    type UserQuestionRecord,
} from '@/api/questionTemplate';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import { apiResourceData } from '@/src/utils/apiHelpers';
import {
    formatAssessmentDate,
    formatHeightWeightDisplay,
    getRiskPercent,
    getScoreLevel,
    isOptionSelected,
    PROGRESS_COLORS,
    QUESTIONNAIRE_TITLES,
    sortOptions,
} from './utils/helpers';

const PROGRESS_SIZE = 60;
const PROGRESS_STROKE = 4;

function renderQuestionBlock(item: UserQuestionAnswerItem, index: number) {
    const question = item.questions?.[0];
    const questionType = question?.type;
    const answer = item.answers?.[0]?.answer ?? '';
    const options = sortOptions(item.options);
    const questionTitle = question?.question?.trim() || `问题${index + 1}`;

    if (questionType === 3 || options.length === 0) {
        const heightWeightDisplay = questionType === 3 ? formatHeightWeightDisplay(answer) : null;
        return (
            <View key={`${item.templateId ?? index}`} style={[styles.detailBox, index > 0 && { marginTop: 8 }]}>
                <Text style={styles.detailMapTitle}>{index + 1}、{questionTitle}</Text>
                {heightWeightDisplay ? (
                    <>
                        <Flex style={[styles.detailMapItem, styles.detailMapItemActive]}>
                            <Text style={[styles.detailMapItemText, styles.detailMapItemTextActive]}>
                                身高: {heightWeightDisplay.heightText}
                            </Text>
                        </Flex>
                        <Flex style={[styles.detailMapItem, styles.detailMapItemActive]}>
                            <Text style={[styles.detailMapItemText, styles.detailMapItemTextActive]}>
                                体重: {heightWeightDisplay.weightText}
                            </Text>
                        </Flex>
                        <Flex style={[styles.detailMapItem, styles.detailMapItemActive]}>
                            <Text style={[styles.detailMapItemText, styles.detailMapItemTextActive]}>
                                BMI: {heightWeightDisplay.bmiText}
                            </Text>
                        </Flex>
                    </>
                ) : answer ? (
                    <Flex style={[styles.detailMapItem, styles.detailMapItemActive]}>
                        <Text style={[styles.detailMapItemText, styles.detailMapItemTextActive]}>{answer}</Text>
                    </Flex>
                ) : null}
            </View>
        );
    }

    return (
        <View key={`${item.templateId ?? index}`} style={[styles.detailBox, index > 0 && { marginTop: 8 }]}>
            <Text style={styles.detailMapTitle}>{index + 1}、{questionTitle}</Text>
            {options.map((option, optionIndex) => {
                const active = isOptionSelected(optionIndex, answer, questionType);
                return (
                    <Flex
                        key={`${item.templateId ?? index}-${optionIndex}`}
                        style={[styles.detailMapItem, active && styles.detailMapItemActive]}>
                        <Text style={[styles.detailMapItemText, active && styles.detailMapItemTextActive]}>
                            {option.desc ?? ''}
                        </Text>
                    </Flex>
                );
            })}
        </View>
    );
}

export default function QuestionnaireDetailPage({ route }: { route: { params: { id: string } } }) {
    const { id } = route.params;
    const [detail, setDetail] = useState<UserQuestionRecord | null>(null);
    const [loading, setLoading] = useState(true);

    const loadDetail = useCallback(async () => {
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

    const scoreLevel = useMemo(() => {
        if (detail?.type == null || detail.score == null) return undefined;
        return getScoreLevel(detail.type, detail.score);
    }, [detail]);

    const progressPercent = useMemo(() => {
        if (detail?.type == null || detail.score == null) return 0;
        return getRiskPercent(detail.type, detail.score);
    }, [detail]);

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

    if (loading) {
        return (
            <PageLayout style={styles.container}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </PageLayout>
        );
    }

    if (!detail) {
        return (
            <PageLayout style={styles.container}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <Text style={styles.rowText}>暂无问卷详情</Text>
                </Flex>
            </PageLayout>
        );
    }

    const title = detail.type != null ? QUESTIONNAIRE_TITLES[detail.type] : '评估问卷';
    const assessmentDate = formatAssessmentDate(detail);
    const questionsAnswer = detail.questionsAnswer ?? [];

    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.body}>
                <View style={styles.detailBox}>
                    <Flex justify="between" style={{ marginBottom: 12 }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={styles.detailTitle}>{title}</Text>
                            {assessmentDate ? (
                                <Text style={styles.detailTime}>评估时间: {assessmentDate}</Text>
                            ) : null}
                        </View>
                        {scoreLevel ? (
                            <View style={styles.progressRing}>
                                <Canvas style={styles.progressCanvas}>
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
                                <Text style={[styles.progressText, { color: progressColors.text }]}>
                                    {scoreLevel.result}
                                </Text>
                            </View>
                        ) : null}
                    </Flex>
                    <View style={styles.rowLine} />
                    {detail.score != null ? (
                        <>
                            <Flex justify="between" style={styles.rowTextBox}>
                                <Text style={styles.topText}>风险评分</Text>
                                <Text style={styles.topText}>{progressPercent}%</Text>
                            </Flex>
                            <Flex justify="between" style={styles.rowTextBox}>
                                <Text style={styles.topText}>总分</Text>
                                <Text style={styles.topText}>{detail.score}分</Text>
                            </Flex>
                        </>
                    ) : null}
                </View>

                {questionsAnswer.length > 0 ? (
                    <>
                        <Text style={styles.sectionTitle}>作答详情</Text>
                        {questionsAnswer.map((item, index) => renderQuestionBlock(item, index))}
                    </>
                ) : null}

                <Text style={styles.detailBottomText}>本结果仅为参考，不能替代专业医疗诊所建议</Text>
            </ScrollView>
        </PageLayout>
    );
}
