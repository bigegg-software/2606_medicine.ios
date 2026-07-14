import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    getUserQuestionFrontList,
    getUserQuestionNewList,
    type QuestionnaireType,
    type UserQuestionListResult,
    type UserQuestionNewListResult,
    type UserQuestionRecord,
} from '@/api/questionTemplate';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import { apiResourceData, getResourceRows } from '@/src/utils/apiHelpers';
import {
    buildLastAssessmentMap,
    canStartAssessment,
    getAssessmentStatusIcon,
    getNextAssessmentDate,
    QUESTIONNAIRE_CONFIG,
    QUESTIONNAIRE_TITLES,
    sortRecordsByTime,
    toHistoryItem,
    type AssessmentSummary,
    type HistoryItem,
} from './utils/helpers';
import { MaterialIcons } from '@expo/vector-icons';

export default function QuestionnaireListPage() {
    const navigation: any = useNavigation();
    const [lastAssessmentByType, setLastAssessmentByType] = useState<
        Partial<Record<QuestionnaireType, AssessmentSummary>>
    >({});
    const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const [latestRes, historyRes] = await Promise.all([
                getUserQuestionNewList(),
                getUserQuestionFrontList({ pageSize: 4, pageNum: 1 }),
            ]);
            const latestRecords =
                apiResourceData<UserQuestionRecord[]>(latestRes as unknown as UserQuestionNewListResult) ?? [];
            const historyRecords = getResourceRows(historyRes as unknown as UserQuestionListResult);
            setLastAssessmentByType(buildLastAssessmentMap(latestRecords));
            setHistoryList(
                sortRecordsByTime(historyRecords)
                    .map(toHistoryItem)
                    .filter((item): item is HistoryItem => Boolean(item)),
            );
        } catch {
            setLastAssessmentByType({});
            setHistoryList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    return (
        <PageLayout style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.body}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadData(true)}
                        colors={[AppTheme.primaryColor]}
                        tintColor={AppTheme.primaryColor}
                    />
                }>
                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>可用问卷</Text>
                    </Flex>

                    {QUESTIONNAIRE_CONFIG.map(item => {
                        const lastAssessment = lastAssessmentByType[item.type];
                        const hasLastAssessment = Boolean(lastAssessment?.date || lastAssessment?.result);
                        const canStart = canStartAssessment(item.type, lastAssessment?.date);
                        const nextAssessmentDate = getNextAssessmentDate(item.type, lastAssessment?.date);
                        const actionLabel = hasLastAssessment ? '重新评估' : '开始评估';

                        return (
                            <View key={item.type} style={styles.rowBox}>
                                <Flex justify='between'>
                                    <View>
                                        <Text style={styles.rowTitle}>{QUESTIONNAIRE_TITLES[item.type]}</Text>
                                        <Text style={styles.rowText}>预计时间：{item.duration}</Text>
                                        {!canStart && nextAssessmentDate ? (
                                            <Text style={styles.rowText}>下次可评估：{nextAssessmentDate}</Text>
                                        ) : null}
                                    </View>
                                    <Image style={styles.timeIcon} source={require('@/assets/images/questionnaire/time.png')} />
                                </Flex>
                                {hasLastAssessment ? (
                                    <>
                                        <View style={[styles.rowLine, { marginTop: 12 }]} />
                                        <Flex justify="between" align="center" style={styles.btmBox}>
                                            <Flex style={{ flex: 1, marginRight: 8 }}>
                                                <Image
                                                    style={styles.iconSize}
                                                    source={getAssessmentStatusIcon(lastAssessment?.statusStyle)}
                                                />
                                                <View style={{ marginLeft: 6, flexShrink: 1 }}>
                                                    {lastAssessment?.result ? (
                                                        <Text style={styles.rowTitleText}>{lastAssessment.result}</Text>
                                                    ) : null}
                                                    {lastAssessment?.date ? (
                                                        <Text style={styles.rowText}>上次评估：{lastAssessment.date}</Text>
                                                    ) : null}
                                                </View>
                                            </Flex>
                                            <TouchableOpacity
                                                style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
                                                disabled={!canStart}
                                                onPress={() => navigation.navigate('QuestionnairePage', { type: item.type })}>
                                                <Flex style={{ flex: 1 }} justify="center">
                                                    <Text style={[styles.startText, !canStart && styles.startTextDisabled]}>
                                                        {actionLabel}
                                                    </Text>
                                                </Flex>
                                            </TouchableOpacity>
                                        </Flex>
                                    </>
                                ) : (
                                    <Flex justify="end" style={styles.btmBox}>
                                        <TouchableOpacity
                                            style={styles.startBtn}
                                            onPress={() => navigation.navigate('QuestionnairePage', { type: item.type })}>
                                            <Flex style={{ flex: 1 }} justify="center">
                                                <Text style={styles.startText}>{actionLabel}</Text>
                                            </Flex>
                                        </TouchableOpacity>
                                    </Flex>
                                )}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>评估历史</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('QuestionnaireHistory')}>
                            <Flex>
                                <Text style={styles.more}>全部</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>


                    {loading && !refreshing ? (
                        <Flex justify="center" style={{ marginTop: 16, marginBottom: 8 }}>
                            <ActivityIndicator color={AppTheme.primaryColor} />
                        </Flex>
                    ) : historyList.length > 0 ? (
                        historyList.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.rowBox}
                                onPress={() => navigation.navigate('QuestionnaireDetail', { id: item.id })}>
                                <Flex justify="between">
                                    <View>
                                        <Text style={styles.rowTitle}>{item.title}</Text>
                                        {item.date ? (
                                            <Text style={styles.rowText}>评估时间：{item.date}</Text>
                                        ) : null}
                                    </View>
                                    {item.result ? (
                                        <Text style={styles[item.statusStyle]}>{item.result}</Text>
                                    ) : null}
                                </Flex>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.rowBox}>
                            <Text style={styles.rowText}>暂无评估历史</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </PageLayout>
    );
}
