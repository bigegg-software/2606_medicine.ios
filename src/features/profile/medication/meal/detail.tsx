import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { AppTheme } from '@/common/theme';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import styles from '@/css/medication/deal/detail';
import PageLayout from '@/src/components/PageLayout';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import { formatDietNumber, getDietRuleSummary } from './dietRuleHelpers';

export default function MealDetailPage() {
    const [loading, setLoading] = useState(true);
    const [rule, setRule] = useState<DietPatientRuleInfo | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getInUseDietPatientRuleInfo();
            setRule(apiResourceData(res as unknown as ApiResult<DietPatientRuleInfo>) ?? null);
        } catch {
            setRule(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    if (loading) {
        return (
            <PageLayout style={styles.container} contentStyle={styles.pageBody}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={AppTheme.primaryColor} />
                </View>
            </PageLayout>
        );
    }

    if (!rule) {
        return (
            <PageLayout style={styles.container} contentStyle={styles.pageBody}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#999', fontSize: 14 }}>暂无营养处方</Text>
                </View>
            </PageLayout>
        );
    }

    const summary = getDietRuleSummary(rule);

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            <ScrollView contentContainerStyle={styles.body}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Flex direction="column" justify="between" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/rl.png')} />
                        <Text style={styles.mealTitle}>{formatDietNumber(summary.targetCalories, '千卡')}</Text>
                        <Text style={styles.mealText}>总热量</Text>
                    </Flex>
                    <Flex direction="column" justify="between" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/dbz.png')} />
                        <Text style={styles.mealTitle}>{formatDietNumber(summary.targetProtein, '克')}</Text>
                        <Text style={styles.mealText}>蛋白质</Text>
                    </Flex>
                    <Flex direction="column" justify="between" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/ts.png')} />
                        <Text style={styles.mealTitle}>{formatDietNumber(summary.carbsPercent, '%')}</Text>
                        <Text style={styles.mealText}>碳水化合物</Text>
                    </Flex>
                    <Flex direction="column" justify="between" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/shui.png')} />
                        <Text style={styles.mealTitle}>{formatDietNumber(summary.targetWater, '毫升')}</Text>
                        <Text style={styles.mealText}>饮水</Text>
                    </Flex>
                    <Flex direction="column" justify="between" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/zf.png')} />
                        <Text style={styles.mealTitle}>{formatDietNumber(summary.fatPercent, '%')}</Text>
                        <Text style={styles.mealText}>脂肪</Text>
                    </Flex>
                </ScrollView>

                <Text style={styles.sectionTitle}>推荐摄入</Text>
                <View style={styles.medicationBox}>
                    {summary.recommendedIntake.length > 0 ? (
                        summary.recommendedIntake.map((item, index) => (
                            <Flex
                                key={`${item.category}-${index}`}
                                justify="between"
                                style={[styles.mealRow, index === 0 && { marginTop: 0 }]}>
                                <Text style={styles.mealLeft}>{item.category || '--'}</Text>
                                <Text style={styles.mealRight}>{item.suggestion || '--'}</Text>
                            </Flex>
                        ))
                    ) : (
                        <Text style={styles.mealRight}>暂无推荐摄入</Text>
                    )}
                </View>

                <Text style={styles.sectionTitle}>限制项</Text>
                <View style={styles.medicationBox}>
                    {summary.restrictions.length > 0 ? (
                        summary.restrictions.map((item, index) => (
                            <Flex
                                key={`${item.item}-${index}`}
                                justify="between"
                                style={[styles.mealRow, index === 0 && { marginTop: 0 }]}>
                                <Text style={styles.mealLeft}>{item.item || '--'}</Text>
                                <Text style={styles.mealRight}>{item.limitValue || '--'}</Text>
                            </Flex>
                        ))
                    ) : (
                        <Text style={styles.mealRight}>暂无限制项</Text>
                    )}
                </View>

                {summary.precautions.length > 0 ? (
                    <View style={[styles.medicationBox, { marginTop: 0 }]}>
                        <Flex>
                            <Image source={require('@/assets/images/medication/icon.png')} style={styles.cfIcon} />
                            <Text style={styles.cfIconText}>注意事项</Text>
                        </Flex>
                        <View style={styles.suggestBox}>
                            {summary.precautions.map((item, index) => (
                                <View key={`${item}-${index}`}>
                                    <Text style={styles.aiSuggest}>
                                        {summary.precautions.length > 1 ? `${index + 1}. ` : ''}
                                        {item}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </PageLayout>
    );
}
