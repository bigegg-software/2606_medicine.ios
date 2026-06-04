import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getUserQuestionFrontList, type UserQuestionListResult } from '@/api/questionTemplate';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import { getResourceRows } from '@/src/utils/apiHelpers';
import NoData from '@/src/components/noData';
import { sortRecordsByTime, toHistoryItem, type HistoryItem } from './utils/helpers';

const PAGE_SIZE = 20;

export default function QuestionnaireHistoryPage() {
    const navigation: any = useNavigation();
    const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const res = await getUserQuestionFrontList({ pageSize: PAGE_SIZE, pageNum: 1 });
            const records = getResourceRows(res as unknown as UserQuestionListResult);
            setHistoryList(
                sortRecordsByTime(records)
                    .map(toHistoryItem)
                    .filter((item): item is HistoryItem => Boolean(item)),
            );
        } catch {
            setHistoryList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [loadHistory]),
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView
                contentContainerStyle={[
                    styles.body,
                    historyList.length === 0 && { flexGrow: 1, justifyContent: 'center' },
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadHistory(true)}
                        colors={[AppTheme.primaryColor]}
                        tintColor={AppTheme.primaryColor}
                    />
                }>
                {historyList.length > 0 ? (
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
                    <NoData text="暂无评估历史" />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
