import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getUserQuestionFrontList } from '@/api/questionTemplate';
import styles from '@/css/questionnaire/index';
import { AppTheme } from '@/common/theme';
import EmptyRecord from '@/src/components/EmptyRecord';
import {
    getUserQuestionListRecords,
    sortRecordsByTime,
    toHistoryItem,
    type HistoryItem,
} from './utils/helpers';

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
            const records = getUserQuestionListRecords(res);
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
            <PageLayout style={styles.container}>
                <Flex justify="center" style={{ flex: 1 }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </Flex>
            </PageLayout>
        );
    }

    return (
        <PageLayout style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[
                    styles.body,
                    historyList.length === 0 && styles.bodyEmpty,
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
                            style={[styles.rowBox, { backgroundColor: "#FFF" }]}
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
                    <View style={styles.emptyWrap}>
                        <EmptyRecord text="暂无评估历史" />
                    </View>
                )}
            </ScrollView>
        </PageLayout>
    );
}
