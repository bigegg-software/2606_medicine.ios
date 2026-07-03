import React, { useCallback, useRef, useState } from 'react';
import {
    ScrollView,
    Image,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/route/router';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import type { QuestionnaireType, UserQuestionRecord } from '@/api/questionTemplate';
import {
    listExUserQuestions,
} from '@/api/exUserQuestion';
import { getInUseExPatientRuleInfo } from '@/api/schedule';
import { apiResourceData, getResourceRows, isResourceApiOk } from '@/src/utils/apiHelpers';
import { AppTheme } from '@/common/theme';
import styles from '@/css/schedule/testingPage';
import { formatRecordDate, getRecordCountText } from './testingHelpers';
import {
    formatEq5dSelfHealthScore,
    getQuestionnaireScoreLevel,
    getQuestionnaireStatusColors,
} from './questionnaireHelpers';
import { QUESTIONNAIRE_TITLES } from '@/src/features/profile/questionnaire/utils/helpers';

const PAGE_SIZE = 10;

function sortQuestionnaireRecordsByTime(records: UserQuestionRecord[]) {
    return [...records].sort((a, b) => {
        const timeA = new Date(a.createTime ?? a.updateTime ?? 0).getTime();
        const timeB = new Date(b.createTime ?? b.updateTime ?? 0).getTime();
        return timeB - timeA;
    });
}

export default function QuestionnaireTestingRecordPage() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'QuestionnaireTestingRecordPage'>>();
    const questionnaireType = route.params?.questionnaireType;
    const userId = useSelector(
        (state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId,
    );
    const testName = route.params?.title?.trim()
        || (questionnaireType != null ? QUESTIONNAIRE_TITLES[questionnaireType] : '评估记录');

    const [records, setRecords] = useState<UserQuestionRecord[]>([]);
    const [recordTotal, setRecordTotal] = useState(0);
    const [pageNum, setPageNum] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const exPatientRuleIdRef = useRef<string | number | undefined>(undefined);
    const hasMoreRef = useRef(false);
    const loadingMoreRef = useRef(false);
    const pageNumRef = useRef(1);

    const fetchPage = useCallback(async (page: number, mode: 'initial' | 'refresh' | 'loadMore') => {
        if (questionnaireType == null) {
            setRecords([]);
            setRecordTotal(0);
            hasMoreRef.current = false;
            setLoading(false);
            setRefreshing(false);
            return;
        }

        if (mode === 'loadMore') {
            if (loadingMoreRef.current || !hasMoreRef.current) return;
            loadingMoreRef.current = true;
            setLoadingMore(true);
        } else if (mode === 'initial') {
            setLoading(true);
        } else if (mode === 'refresh') {
            setRefreshing(true);
        }

        try {
            if (!exPatientRuleIdRef.current) {
                const prescriptionRes = await getInUseExPatientRuleInfo();
                if (!isResourceApiOk(prescriptionRes)) {
                    if (mode !== 'loadMore') {
                        setRecords([]);
                        setRecordTotal(0);
                    }
                    hasMoreRef.current = false;
                    return;
                }
                const prescription = apiResourceData<{ exPatientRuleId?: string | number }>(prescriptionRes as any);
                const ruleId = prescription?.exPatientRuleId;
                if (ruleId == null) {
                    if (mode !== 'loadMore') {
                        setRecords([]);
                        setRecordTotal(0);
                    }
                    hasMoreRef.current = false;
                    return;
                }
                exPatientRuleIdRef.current = ruleId;
            }

            const ruleId = exPatientRuleIdRef.current;
            if (ruleId == null) return;

            const queryParams = {
                exPatientRuleId: ruleId,
                type: questionnaireType,
                userId,
            };

            const listRes = await listExUserQuestions({
                ...queryParams,
                pageNum: page,
                pageSize: PAGE_SIZE,
            });

            if (isResourceApiOk(listRes as any)) {
                const rows = sortQuestionnaireRecordsByTime(getResourceRows(listRes as any));
                const total = Number((listRes as { total?: number }).total ?? 0);
                const nextTotal = Number.isFinite(total) ? total : rows.length;

                if (mode === 'loadMore') {
                    setRecords(prev => {
                        const merged = sortQuestionnaireRecordsByTime([...prev, ...rows]);
                        hasMoreRef.current = merged.length < nextTotal;
                        return merged;
                    });
                } else {
                    setRecords(rows);
                    hasMoreRef.current = rows.length < nextTotal;
                }

                setRecordTotal(nextTotal);
                setPageNum(page);
                pageNumRef.current = page;
            } else if (mode !== 'loadMore') {
                setRecords([]);
                setRecordTotal(0);
                hasMoreRef.current = false;
            }
        } catch {
            if (mode !== 'loadMore') {
                setRecords([]);
                setRecordTotal(0);
            }
            hasMoreRef.current = false;
        } finally {
            setLoading(false);
            setRefreshing(false);
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [questionnaireType, userId]);

    const loadMore = useCallback(() => {
        void fetchPage(pageNumRef.current + 1, 'loadMore');
    }, [fetchPage]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
        if (nearBottom) {
            loadMore();
        }
    }, [loadMore]);

    const navigateToDetail = useCallback((record: UserQuestionRecord) => {
        if (record.id == null) return;
        navigation.navigate('QuestionnaireDetail', { id: String(record.id) });
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            exPatientRuleIdRef.current = undefined;
            void fetchPage(1, 'initial');
        }, [fetchPage]),
    );

    return (
        <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
            <View style={styles.page}>
                <ScrollView
                    style={styles.body}
                    contentContainerStyle={styles.scroll}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchPage(1, 'refresh')}
                            colors={[AppTheme.primaryColor]}
                            tintColor={AppTheme.primaryColor}
                        />
                    }
                    onScroll={handleScroll}
                    scrollEventThrottle={200}>
                    <View style={[styles.infoBox, { marginTop: 0 }]}>
                        <Flex justify='between'>
                            <Text style={styles.infoTitle}>{testName}</Text>
                            <Text style={styles.infoAllText}>{getRecordCountText(recordTotal)}</Text>
                        </Flex>
                        <View style={styles.infoRecordBox}>
                            {loading && !refreshing ? (
                                <Flex justify='center' style={styles.infoRecordItem}>
                                    <ActivityIndicator color={AppTheme.primaryColor} />
                                </Flex>
                            ) : records.length > 0 && questionnaireType != null ? (
                                records.map((record, index) => {
                                    const scoreLevel = getQuestionnaireScoreLevel(questionnaireType, record.score);
                                    const statusColors = getQuestionnaireStatusColors(scoreLevel);
                                    return (
                                        <TouchableOpacity
                                            key={String(record.id ?? record.createTime ?? index)}
                                            activeOpacity={0.7}
                                            disabled={record.id == null}
                                            onPress={() => navigateToDetail(record)}>
                                            <Flex
                                                justify='between'
                                                align='start'
                                                style={[
                                                    styles.infoRecordItem,
                                                    { paddingVertical: 12 },
                                                    index > 0 ? { marginTop: 12 } : null,
                                                ]}>
                                                <Flex>
                                                    <Image
                                                        style={styles.infoRecordImg}
                                                        source={require('@/assets/images/schedule/order.png')}
                                                    />
                                                    <View>
                                                        <Text style={styles.infoRecordText}>健康指数测评</Text>
                                                        {questionnaireType === 3 ? (
                                                            <Text style={[styles.infoRecordTime, { marginTop: 6 }]}>
                                                                自我健康评分:{formatEq5dSelfHealthScore(record)}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </Flex>
                                                <Flex direction="column" align="end">
                                                    <Flex style={[
                                                        styles.infoRecordStatus,
                                                        { borderColor: statusColors.text, alignSelf: 'flex-end' },
                                                    ]}>
                                                        <Text style={[
                                                            styles.infoRecordStatusText,
                                                            { color: statusColors.text },
                                                        ]}>
                                                            {scoreLevel?.result ?? '--'}
                                                        </Text>
                                                    </Flex>
                                                    <Text style={[styles.infoRecordTime, { marginTop: 6, textAlign: 'right' }]}>
                                                        {formatRecordDate(record.createTime)}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Flex justify='center' style={styles.infoRecordItem}>
                                    <Text style={styles.infoItemText}>暂无评估记录</Text>
                                </Flex>
                            )}
                            {loadingMore ? (
                                <Flex justify='center' style={{ paddingVertical: 12 }}>
                                    <ActivityIndicator color={AppTheme.primaryColor} size="small" />
                                </Flex>
                            ) : null}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </PageLayout>
    );
}
