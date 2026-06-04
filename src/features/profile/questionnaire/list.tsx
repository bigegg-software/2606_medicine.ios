import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    QUESTIONNAIRE_TITLES,
    sortRecordsByTime,
    toHistoryItem,
    type AssessmentSummary,
    type HistoryItem,
} from './utils/helpers';

const QUESTIONNAIRE_LIST: {
    type: QuestionnaireType;
    title: string;
    duration: string;
}[] = [
    { type: 0, title: QUESTIONNAIRE_TITLES[0], duration: '5分钟' },
    { type: 1, title: QUESTIONNAIRE_TITLES[1], duration: '5分钟' },
    { type: 2, title: QUESTIONNAIRE_TITLES[2], duration: '5分钟' },
];

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
                getUserQuestionFrontList({ pageSize: 3, pageNum: 1 }),
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
        <SafeAreaView style={styles.container} edges={['bottom']}>
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
                <Text style={styles.sectionTitle}>评估问卷</Text>
                {QUESTIONNAIRE_LIST.map(item => {
                    const lastAssessment = lastAssessmentByType[item.type];
                    const hasLastAssessment = Boolean(lastAssessment?.date || lastAssessment?.result);
                    const statusStyle = styles[lastAssessment?.statusStyle ?? 'rowStatus'];

                    return (
                        <View key={item.type} style={styles.rowBox}>
                            <Flex justify="between">
                                <Text style={styles.rowTitle}>{item.title}</Text>
                                <Text style={styles.rowText}>预计时间：{item.duration}</Text>
                            </Flex>
                            <Flex justify="between" style={styles.btmBox}>
                                <View>
                                    {hasLastAssessment ? (
                                        <>
                                            {lastAssessment?.date ? (
                                                <Text style={styles.rowText}>上次评估：{lastAssessment.date}</Text>
                                            ) : null}
                                            {lastAssessment?.result ? (
                                                <Text style={statusStyle}>结果：{lastAssessment.result}</Text>
                                            ) : null}
                                        </>
                                    ) : (
                                        <Text style={styles.rowText}>暂无评估记录</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.startBtn}
                                    onPress={() => navigation.navigate('QuestionnairePage', { type: item.type })}>
                                    <Flex style={{ flex: 1 }} justify="center">
                                        <Text style={styles.startText}>开始评估</Text>
                                    </Flex>
                                </TouchableOpacity>
                            </Flex>
                        </View>
                    );
                })}

                <Flex justify="between">
                    <Text style={styles.sectionTitle}>评估历史</Text>
                    {!loading && historyList.length > 0 ? (
                        <TouchableOpacity onPress={() => navigation.navigate('QuestionnaireHistory')}>
                            <Text style={styles.moreText}>全部</Text>
                        </TouchableOpacity>
                    ) : null}
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
                                        <Text style={[styles.rowText, { marginTop: 6 }]}>评估时间：{item.date}</Text>
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
            </ScrollView>
        </SafeAreaView>
    );
}
