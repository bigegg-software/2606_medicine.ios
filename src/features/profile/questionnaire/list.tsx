import React, { useCallback, useState } from 'react';
import { View, Image, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    getUserQuestionFrontList,
    getUserQuestionNewList,
    type QuestionnaireType,
    type UserQuestionNewListResult,
    type UserQuestionRecord,
} from '@/api/questionTemplate';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import { apiResourceData } from '@/src/utils/apiHelpers';
import {
    buildLastAssessmentMap,
    canStartAssessment,
    getAssessmentStatusIcon,
    getNextAssessmentDate,
    getUserQuestionListRecords,
    QUESTIONNAIRE_CONFIG,
    QUESTIONNAIRE_TITLES,
    sortRecordsByTime,
    toHistoryItem,
    type AssessmentSummary,
    type HistoryItem,
} from './utils/helpers';
import { MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/route/router';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';

export default function QuestionnaireListPage() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'QuestionnaireList'>>();
    const { readOnly, patientUserId, viewNavParams } = resolveFamilyReadOnlyView(route.params);
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
                getUserQuestionNewList(patientUserId ? { patientUserId } : undefined),
                getUserQuestionFrontList(
                    { pageSize: 20, pageNum: 1 },
                    patientUserId ? { patientUserId } : undefined,
                ),
            ]);
            const latestRecords =
                apiResourceData<UserQuestionRecord[]>(latestRes as unknown as UserQuestionNewListResult) ?? [];
            const historyRecords = getUserQuestionListRecords(historyRes);
            setLastAssessmentByType(buildLastAssessmentMap(latestRecords));
            setHistoryList(
                sortRecordsByTime(historyRecords)
                    .map(toHistoryItem)
                    .filter((item): item is HistoryItem => Boolean(item))
                    .slice(0, 3),
            );
        } catch {
            setLastAssessmentByType({});
            setHistoryList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [patientUserId]);

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
                                <Flex justify="between" align="center">
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.rowTitle}>{QUESTIONNAIRE_TITLES[item.type]}</Text>
                                        <Text style={styles.rowText}>预计时间：{item.duration}</Text>

                                    </View>
                                    {hasLastAssessment ? (
                                        <Image
                                            style={styles.timeIcon}
                                            source={require('@/assets/images/questionnaire/time.png')}
                                        />
                                    ) : readOnly ? null : (
                                        <TouchableOpacity
                                            style={styles.startBtn}
                                            onPress={() =>
                                                navigation.navigate('QuestionnairePage', { type: item.type })
                                            }>
                                            <Flex style={{ flex: 1 }} justify="center">
                                                <Text style={styles.startText}>{actionLabel}</Text>
                                            </Flex>
                                        </TouchableOpacity>
                                    )}

                                </Flex>
                                {hasLastAssessment ? (
                                    <>
                                        <View style={[styles.rowLine, { marginTop: 12 }]} />
                                        <Flex justify="between" align="center" style={styles.btmBox}>
                                            <TouchableOpacity
                                                style={{ flex: 1, marginRight: 8 }}
                                                activeOpacity={lastAssessment?.id ? 0.85 : 1}
                                                disabled={!lastAssessment?.id}
                                                onPress={() => {
                                                    if (!lastAssessment?.id) return;
                                                    navigation.navigate('QuestionnaireDetail', {
                                                        id: lastAssessment.id,
                                                        ...(viewNavParams ?? {}),
                                                    });
                                                }}>
                                                <Flex>
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
                                            </TouchableOpacity>
                                            {!readOnly ? (
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
                                            ) : lastAssessment?.id ? (
                                                <TouchableOpacity
                                                    activeOpacity={0.85}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    onPress={() =>
                                                        navigation.navigate('QuestionnaireDetail', {
                                                            id: lastAssessment.id ?? '',
                                                            ...(viewNavParams ?? {}),
                                                        })
                                                    }>
                                                    <MaterialIcons
                                                        name="chevron-right"
                                                        size={24}
                                                        color={AppTheme.textSecondary}
                                                    />
                                                </TouchableOpacity>
                                            ) : null}
                                        </Flex>
                                    </>
                                ) : null}
                                {!readOnly && !canStart && nextAssessmentDate ? (
                                    <Flex style={styles.nextAssessBox} align="center">
                                        <Image
                                            style={styles.nextAssessIcon}
                                            source={require('@/assets/images/questionnaire/icon_ts.png')}
                                        />
                                        <Text style={styles.nextAssessLabel}>下次评估时间：</Text>
                                        <Text style={styles.nextAssessDate}>{nextAssessmentDate}</Text>
                                    </Flex>
                                ) : null}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.infoBox}>
                    <Flex justify='between'>
                        <Text style={styles.sectionTitle}>评估历史</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('QuestionnaireHistory', viewNavParams)}>
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
                                onPress={() =>
                                    navigation.navigate('QuestionnaireDetail', {
                                        id: item.id,
                                        ...(viewNavParams ?? {}),
                                    })
                                }>
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
