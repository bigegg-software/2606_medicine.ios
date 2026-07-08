import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Flex, Picker, Toast } from '@ant-design/react-native';
import moment, { type Moment } from 'moment';
import { getInUseDietPatientRuleInfo, type DietPatientRuleInfo } from '@/api/dietPatientRule';
import { addMealDetailList, getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { AppTheme } from '@/common/theme';
import styles from '@/css/medication/deal/water';
import { LinearGradient } from 'expo-linear-gradient';
import PageLayout from '@/src/components/PageLayout';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import { getDietRuleSummary } from '@/src/features/profile/medication/meal/utils/dietRuleHelpers';
import { getWaterSummary, sumWaterIntake } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import WaterCup from './components/WaterCup';

function buildWaterMealPayload(waterIntake: number, timeStr: string) {
    return {
        mealDetailList: [
            {
                mealName: '饮水',
                servingAmount: waterIntake,
                servingUnit: 1,
                weight: waterIntake,
                mealCategory: -1,
                calorie: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
                fiber: 0,
                salt: 0,
                waterIntake,
                isWater: 1,
                othersNutrition: {} as Record<string, never>,
                timeStr,
            },
        ],
        timeStr,
    };
}

const WATER_ADJUST_STEP = 50;

const TIME_PICKER_DATA = [
    Array.from({ length: 24 }, (_, hour) => ({
        label: String(hour).padStart(2, '0'),
        value: hour,
    })),
    Array.from({ length: 60 }, (_, minute) => ({
        label: String(minute).padStart(2, '0'),
        value: minute,
    })),
];

function parseTimeValue(time: string): [number, number] {
    const parsed = moment(time, 'HH:mm', true);
    return parsed.isValid() ? [parsed.hour(), parsed.minute()] : [moment().hour(), moment().minute()];
}

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DASH_COUNT = 30;

function DashedDivider() {
    return (
        <View style={styles.divider}>
            {Array.from({ length: DASH_COUNT }, (_, index) => (
                <View key={index} style={styles.dash} />
            ))}
        </View>
    );
}

function buildCurrentWeekDays(): { date: Moment }[] {
    const weekStart = moment().startOf('week');
    return Array.from({ length: 7 }, (_, index) => ({
        date: moment(weekStart).add(index, 'day'),
    }));
}

function WaterWeekCalendar() {
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const weekDays = useMemo(() => buildCurrentWeekDays(), []);

    return (
        <View style={styles.waterCalendar}>
            <View style={styles.weekHead}>
                {WEEK_LABELS.map(label => (
                    <View key={label} style={styles.weekCell}>
                        <Text style={styles.weekCellText}>{label}</Text>
                    </View>
                ))}
            </View>

            <DashedDivider />

            <View style={styles.weekGrid}>
                {weekDays.map(day => {
                    const dateKey = day.date.format('YYYY-MM-DD');
                    const isSelected = selectedDate === dateKey;
                    const isToday = day.date.isSame(moment(), 'day');

                    return (
                        <TouchableOpacity
                            disabled={!isToday}
                            key={dateKey}
                            activeOpacity={0.7}
                            style={styles.dayCell}
                            onPress={() => setSelectedDate(dateKey)}>
                            <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                                <Text style={isSelected ? styles.dayTextSelected : styles.dayText}>
                                    {isToday ? '今' : day.date.date()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const QUICK_ADD_OPTIONS = [100, 200, 250, 500, 750];

function getQuickAddItemStyle(index: number, total: number) {
    const isFirst = index === 0;
    const isLast = index === total - 1;
    return [
        styles.quickAddItem,
        isFirst && styles.quickAddItemFirst,
        !isLast && styles.quickAddItemGap,
        isLast && styles.quickAddItemLast,
    ];
}

export default function MealWaterPage() {
    const navigation: any = useNavigation();
    const [waterVolume, setWaterVolume] = useState('');
    const [recordTime, setRecordTime] = useState(() => moment().format('HH:mm'));
    const [submitting, setSubmitting] = useState(false);
    const [targetWater, setTargetWater] = useState<number>();
    const [todayWaterMl, setTodayWaterMl] = useState(0);

    const previewWaterSummary = useMemo(() => {
        const inputMl = Number(waterVolume) || 0;
        return getWaterSummary(todayWaterMl + inputMl, targetWater);
    }, [targetWater, todayWaterMl, waterVolume]);

    const loadWaterData = useCallback(async () => {
        try {
            const [ruleRes, todayRes] = await Promise.all([
                getInUseDietPatientRuleInfo(),
                getTodayMealDetailList(),
            ]);
            const rule = apiResourceData<DietPatientRuleInfo>(ruleRes as unknown as ApiResult<DietPatientRuleInfo>);
            const todayList = apiResourceData<MealDetailItem[]>(todayRes as unknown as ApiResult<MealDetailItem[]>) ?? [];
            setTargetWater(getDietRuleSummary(rule ?? null).targetWater);
            setTodayWaterMl(sumWaterIntake(todayList));
        } catch {
            setTargetWater(undefined);
            setTodayWaterMl(0);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadWaterData();
        }, [loadWaterData]),
    );

    const submitWaterIntake = useCallback(
        async (amount: number) => {
            if (!Number.isFinite(amount) || amount <= 0) {
                Toast.fail('请输入有效饮水量', 1.5);
                return;
            }

            setSubmitting(true);
            try {
                const res = await addMealDetailList(buildWaterMealPayload(amount, recordTime));
                if (!isResourceApiOk(res as { code?: number; msg?: string })) {
                    Toast.fail((res as { code?: number; msg?: string })?.msg || '保存失败', 1.5);
                    return;
                }
                Toast.success('保存成功', 1.5);
                navigation.goBack();
            } catch {
                Toast.fail('保存失败', 1.5);
            } finally {
                setSubmitting(false);
            }
        },
        [navigation, recordTime],
    );

    const handleSave = useCallback(() => {
        const amount = Number(waterVolume);
        void submitWaterIntake(amount);
    }, [submitWaterIntake, waterVolume]);

    const handleAdjustVolume = useCallback((delta: number) => {
        setWaterVolume(prev => {
            const current = Number(prev) || 0;
            return String(Math.max(0, current + delta));
        });
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={submitting}
                    style={{ marginRight: 16 }}>
                    {submitting ? (
                        <ActivityIndicator size="small" color={AppTheme.primaryColor} />
                    ) : (
                        <Text style={{ color: AppTheme.primaryColor, fontSize: 16 }}>保存</Text>
                    )}
                </TouchableOpacity>
            ),
        });
    }, [handleSave, navigation, submitting]);

    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            <ScrollView
                contentContainerStyle={styles.body}
                showsHorizontalScrollIndicator={false}>
                <WaterWeekCalendar />

                <Flex justify="between" style={styles.recordTime}>
                    <Text style={styles.recordTimeTitle}>记录时间</Text>
                    <Picker
                        data={TIME_PICKER_DATA}
                        cols={2}
                        cascade={false}
                        value={parseTimeValue(recordTime)}
                        onOk={values => {
                            const hour = String(Number(values[0])).padStart(2, '0');
                            const minute = String(Number(values[1])).padStart(2, '0');
                            setRecordTime(`${hour}:${minute}`);
                        }}>
                        <TouchableOpacity activeOpacity={0.7}>
                            <Flex>
                                <Text style={styles.recordTimeValue}>{recordTime}</Text>
                                <Image
                                    style={styles.recordImg}
                                    source={require('@/assets/images/medication/meal/timeImg.png')}
                                />
                            </Flex>
                        </TouchableOpacity>
                    </Picker>
                </Flex>

                <View style={styles.waterInputBoxContainer}>
                    <View style={styles.waterInputBox}>
                        <TextInput
                            style={styles.waterInput}
                            value={waterVolume}
                            onChangeText={setWaterVolume}
                            placeholder="0"
                            placeholderTextColor="#999999"
                            keyboardType="numeric"
                            returnKeyType="done"
                        />
                    </View>
                    <View style={styles.waterInputUnitWrap}>
                        <Text style={styles.waterInputUnit}>ml</Text>
                    </View>
                </View>
                <Flex justify='center' style={styles.lineBoxWrap}>
                    <Text style={styles.lineBoxText}>今日完成：{previewWaterSummary.percent}%</Text>
                    <View style={styles.lineBox} />
                    <Text style={styles.lineBoxText}>剩余{previewWaterSummary.remainingMl}ml</Text>
                </Flex>

                <View style={styles.cupScene}>
                    <View style={styles.cupBackgroundWrap} pointerEvents="none">
                        <Image
                            style={styles.cupBackground}
                            source={require('@/assets/images/medication/meal/back.png')}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={styles.cupForeground}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.cupAdjustBtnLeft}
                            onPress={() => handleAdjustVolume(-WATER_ADJUST_STEP)}>
                            <Image
                                style={styles.cupAdjustBtnImg}
                                source={require('@/assets/images/medication/meal/jian.png')}
                            />
                        </TouchableOpacity>
                        <WaterCup fillPercent={previewWaterSummary.percent} />
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.cupAdjustBtnRight}
                            onPress={() => handleAdjustVolume(WATER_ADJUST_STEP)}>
                            <Image
                                style={styles.cupAdjustBtnImg}
                                source={require('@/assets/images/medication/meal/jia.png')}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.quickAddText}>快速添加</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {QUICK_ADD_OPTIONS.map((amount, index) => (
                        <TouchableOpacity
                            key={`${amount}-${index}`}
                            activeOpacity={0.7}
                            disabled={submitting}
                            onPress={() => setWaterVolume(String(amount))}>
                            <LinearGradient
                                colors={['#D5E6FF', '#FFFFFF']}
                                locations={[0, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0.55, y: 0.55 }}
                                style={getQuickAddItemStyle(index, QUICK_ADD_OPTIONS.length)}>
                                <Text style={styles.quickAddItemText}>{amount}</Text>
                                <Text style={styles.quickAddUnit}>ml</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </ScrollView>
        </PageLayout>
    );
}
