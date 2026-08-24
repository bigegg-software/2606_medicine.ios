import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import moment from 'moment';
import styles from '@/css/nutrition';
import {
    buildDietWeekDays,
    clampDateToPrescriptionRange,
    isCalendarDateInPrescriptionRange,
} from './utils/dietCalendarHelpers';
import { getDayMealEatDots, loadMealEatMapByYear, type MealEatMap } from './utils/dietMealEatHelpers';
import DietProgressRing from './DietProgressRing';
import DietDatePickerModal from './DietDatePickerModal';
import DietCheckInSuccessModal from './DietCheckInSuccessModal';
import {
    getDietPatientRuleAiMakeOneDayMeal,
    type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import {
    buildRecommendedMealSections,
    formatActualFoodMeta,
    type RecommendedMealSection,
} from './utils/dietMealHelpers';
import { fetchDietRuleForDate, loadDietRuleForDate } from './utils/dietRuleDateHelpers';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
import { deleteMealDetail, getTodayMealDetailList, type MealDetailItem } from '@/api/mealDetail';
import { getMealDetailByMealId, getMealListByDate, type MealRecordDetail, type MealRecordItem } from '@/api/meal';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { isUserBaseInfoComplete } from '@/src/features/profile/healthRecord/utils/profileCompletenessHelpers';
import CompleteProfileLink from '@/src/features/profile/healthRecord/components/CompleteProfileLink';
import {
    getFoodRecordsByCategory,
    isWaterRecord,
    sumCalories,
    sumProtein,
    toNumber,
} from '@/src/features/profile/medication/meal/utils/mealDetailHelpers';
import {
    getDietUserSignInfo,
    postDietUserSign,
    type DietUserSignInfo,
} from '@/api/dietUserSignInfo';
import { getDailyRecordStatusListByDateRange } from '@/api/dailyRecordStatus';
import {
    getDietHistorySignButtonLabel,
    getDietSignBlockedMessage,
    getDietSignButtonLabel,
} from './utils/dietSignHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
    dietRule?: DietPatientRuleInfo | null;
    onDietRuleChange?: (rule: DietPatientRuleInfo | null) => void;
    readOnly?: boolean;
    patientUserId?: string;
};

const CATEGORY_TO_MEAL_KEY: Record<number, string> = {
    1: 'breakfast',
    2: 'lunch',
    3: 'dinner',
    4: 'snack',
};

function DietListLine({ progress, color }: { progress: number; color: string }) {
    return (
        <Flex style={styles.dietListLine}>
            <Flex style={{ width: `${progress}%`, backgroundColor: color, height: 6, borderRadius: 3 }} />
        </Flex>
    );
}

async function loadMealDetailListForDate(
    customerLocalDate: string,
    options?: { patientUserId?: string | number | null },
): Promise<MealDetailItem[]> {
    const isToday = customerLocalDate === moment().format('YYYY-MM-DD');
    if (isToday) {
        try {
            const res = await getTodayMealDetailList(options);
            if (!isResourceApiOk(res as unknown as { code?: number })) return [];
            return apiResourceData<MealDetailItem[]>(res as unknown as { code?: number; data?: MealDetailItem[] }) ?? [];
        } catch {
            return [];
        }
    }

    try {
        const res = await getMealListByDate({ customerLocalDate }, options);
        if (!isResourceApiOk(res)) return [];

        const meals = (apiResourceData<MealRecordItem[]>(
            res as unknown as { code?: number; data?: MealRecordItem[] },
        ) ?? [])
            .filter(meal => {
                const category = meal.mealCategory ?? 0;
                return category >= 1 && category <= 4;
            })
            .sort((left, right) => (left.mealCategory ?? 0) - (right.mealCategory ?? 0));
        if (meals.length === 0) return [];

        const details = await Promise.all(
            meals.map(async meal => {
                if (meal.mealId == null || meal.mealId === '') return null;
                try {
                    const detailRes = await getMealDetailByMealId(String(meal.mealId), options);
                    if (!isResourceApiOk(detailRes)) return null;
                    return apiResourceData<MealRecordDetail>(
                        detailRes as unknown as { code?: number; data?: MealRecordDetail },
                    );
                } catch {
                    return null;
                }
            }),
        );

        return details.flatMap(detail => detail?.mealDetailList ?? []);
    } catch {
        return [];
    }
}

function RecommendedMealCard({
    section,
    actualCalories,
    actualFoods,
    onDeleteFood,
    showPhotoButton,
    showDeleteButton = true,
}: {
    section: RecommendedMealSection;
    actualCalories: number;
    actualFoods: MealDetailItem[];
    onDeleteFood: (item: MealDetailItem) => void;
    showPhotoButton: boolean;
    showDeleteButton?: boolean;
}) {
    const navigation = useNavigation<Nav>();
    const planCalories = section.planCalories > 0 ? Math.round(section.planCalories) : 0;
    const actualRounded = actualCalories > 0 ? Math.round(actualCalories) : 0;
    const caloriesText = actualRounded > 0 ? String(actualRounded) : '--';
    const planText = planCalories > 0 ? String(planCalories) : '--';
    const actualText = actualRounded > 0 ? String(actualRounded) : '--';
    const diff = actualRounded - planCalories;
    const diffText = planCalories > 0 || actualRounded > 0
        ? `${diff > 0 ? '+' : ''}${diff}kcal`
        : '--kcal';

    return (
        <View style={styles.calendarContent}>
            <Flex justify="between">
                <Flex>
                    <Image style={styles.dietListImage} source={section.icon} />
                    <Text style={styles.calendarContentTitle}>{section.title}</Text>
                </Flex>
                <Text style={styles.calendarContentSubtitle}>{section.planCaloriesText}</Text>
            </Flex>

            {section.foods.map(food => (
                <Flex key={food.key} style={styles.dietMapBox}>
                    <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default1.png')} />
                    <View style={styles.mapCenBox}>
                        <Text style={styles.mapTitle}>{food.foodName}</Text>
                        <Flex style={styles.mapCenBoxList}>
                            <Flex>
                                <View style={[styles.mapBor, { backgroundColor: '#0951AE' }]} />
                                <Text style={styles.mapText}>{food.proteinText}</Text>
                            </Flex>
                            <Flex>
                                <View style={[styles.mapBor, { backgroundColor: '#72A1C5' }]} />
                                <Text style={styles.mapText}>{food.carbsText}</Text>
                            </Flex>
                            <Flex>
                                <View style={[styles.mapBor, { backgroundColor: '#FB4550' }]} />
                                <Text style={styles.mapText}>{food.fatText}</Text>
                            </Flex>
                        </Flex>
                    </View>
                    <Flex direction="column" justify="between" align="end" style={{ height: '100%' }}>
                        <Text style={styles.mapValue}>{food.amountText}</Text>
                        <Text style={styles.mapValueText}>{food.caloriesText}</Text>
                    </Flex>
                </Flex>
            ))}

            {actualFoods.length > 0 ? (
                <View style={styles.actualEatBox}>
                    <Flex justify="between" align="center">
                        <Flex align="center">
                            <Image
                                style={styles.dietListImage}
                                source={require('@/assets/images/nutrition/icon_time.png')}
                            />
                            <Text style={styles.actualEatTitle}>实际吃了</Text>
                        </Flex>
                        <Text style={styles.actualEatValue}>
                            {caloriesText}
                            <Text style={styles.actualEatUnit}>kcal</Text>
                        </Text>
                    </Flex>

                    {actualFoods.map((food, index) => (
                        <Flex
                            key={`${food.mealDetailId ?? food.mealName ?? index}`}
                            style={styles.actualEatFoodRow}
                        >
                            <Image
                                style={styles.actualEatFoodImg}
                                source={
                                    food.ossUrl
                                        ? { uri: food.ossUrl }
                                        : require('@/assets/images/nutrition/default1.png')
                                }
                            />
                            <View style={styles.actualEatFoodInfo}>
                                <Text style={styles.actualEatFoodName} numberOfLines={1}>
                                    {food.mealName?.trim() || '食物'}
                                </Text>
                                <Text style={styles.actualEatFoodMeta}>{formatActualFoodMeta(food)}</Text>
                            </View>
                            {showDeleteButton ? (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => onDeleteFood(food)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Image
                                        style={styles.actualEatDelIcon}
                                        source={require('@/assets/images/nutrition/icon_del1.png')}
                                    />
                                </TouchableOpacity>
                            ) : null}
                        </Flex>
                    ))}

                    <Flex justify="between" align="center" style={styles.actualEatSummaryRow}>
                        <Text style={styles.actualEatSummaryText}>
                            计划 {planText} · 实际 {actualText}
                        </Text>
                        <Flex align="center" style={styles.actualEatDiffBadge}>
                            <Image
                                style={styles.navIcon}
                                source={require('@/assets/images/nutrition/kll.png')}
                            />
                            <Text style={styles.actualEatDiffText}>{diffText}</Text>
                        </Flex>
                    </Flex>
                </View>
            ) : null}

            {showPhotoButton ? (
                <TouchableOpacity
                    style={styles.btnBox}
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.navigate('MealRecognitionPage', {
                            mealCategory: section.category,
                        })
                    }
                >
                    <Flex style={{ flex: 1 }} justify="center">
                        <Image style={styles.btnImg} source={require('@/assets/images/nutrition/camera.png')} />
                        <Text style={styles.btnText}>拍照记录这一餐</Text>
                    </Flex>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

export default function DietPage({
    dietRule = null,
    onDietRuleChange,
    readOnly = false,
    patientUserId,
}: Props) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const user = useSelector((state: RootState) => state.user.info);
    const profileComplete = !readOnly && isUserBaseInfoComplete(user);
    const patientOpts = useMemo(
        () => (patientUserId ? { patientUserId } : undefined),
        [patientUserId],
    );
    const dietPatientRuleId = dietRule?.dietPatientRuleId;
    const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
    const [mealDetailList, setMealDetailList] = useState<MealDetailItem[]>([]);
    const [dayRule, setDayRule] = useState<DietPatientRuleInfo | null>(dietRule);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [signing, setSigning] = useState(false);
    const [signInfo, setSignInfo] = useState<DietUserSignInfo | null>(null);
    const [historySigned, setHistorySigned] = useState(false);
    const [checkInSuccessVisible, setCheckInSuccessVisible] = useState(false);
    const [eatMap, setEatMap] = useState<MealEatMap>({});
    const loadedEatYearsRef = useRef<Set<number>>(new Set());
    const loadingEatYearsRef = useRef<Set<number>>(new Set());
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
    const prescriptionStartDate = dietRule?.startDate?.trim() || dayRule?.startDate?.trim() || '';
    const prescriptionEndDate = dietRule?.endDate?.trim() || dayRule?.endDate?.trim() || '';
    const todayKey = moment().format('YYYY-MM-DD');
    const isPastSelected = selectedDate < todayKey;
    const isTodaySelected = selectedDate === todayKey;

    const recommendedSections = useMemo(
        () => buildRecommendedMealSections(dayRule?.mealList, selectedDate),
        [dayRule?.mealList, selectedDate],
    );
    const isBeforePrescriptionStart = useMemo(() => {
        if (!prescriptionStartDate) return false;
        const startDay = moment(prescriptionStartDate, ['YYYY-MM-DD', 'YYYY/MM/DD', moment.ISO_8601], true);
        if (!startDay.isValid()) return false;
        return moment(selectedDate, 'YYYY-MM-DD', true).isBefore(startDay, 'day');
    }, [prescriptionStartDate, selectedDate]);

    useEffect(() => {
        if (!prescriptionStartDate && !prescriptionEndDate) return;
        setSelectedDate(prev =>
            clampDateToPrescriptionRange(prev, prescriptionStartDate, prescriptionEndDate),
        );
    }, [prescriptionEndDate, prescriptionStartDate]);

    const signButtonLabel = useMemo(() => {
        if (isPastSelected) return getDietHistorySignButtonLabel(historySigned);
        return getDietSignButtonLabel(signInfo);
    }, [historySigned, isPastSelected, signInfo]);
    const signButtonIcon = isPastSelected && !historySigned
        ? require('@/assets/images/nutrition/icon_x.png')
        : require('@/assets/images/nutrition/wc.png');
    const signButtonDisabled = !isTodaySelected || Boolean(signInfo?.signedToday) || signing;
    const refreshDisabled = !isTodaySelected || Boolean(signInfo?.signedToday) || refreshing;

    const loadSignInfo = useCallback(async () => {
        try {
            const res = await getDietUserSignInfo(patientOpts);
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                setSignInfo(null);
                return;
            }
            setSignInfo(
                apiResourceData<DietUserSignInfo>(
                    res as unknown as { code?: number; data?: DietUserSignInfo },
                ) ?? null,
            );
        } catch {
            setSignInfo(null);
        }
    }, [patientOpts]);

    const loadHistorySignStatus = useCallback(async (date: string) => {
        try {
            const res = await getDailyRecordStatusListByDateRange(
                {
                    startDate: date,
                    endDate: date,
                },
                patientOpts,
            );
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                setHistorySigned(false);
                return;
            }
            const list = apiResourceData(
                res as unknown as { code?: number; data?: { customerLocalDate?: string; isDiet?: boolean }[] },
            ) ?? [];
            const item = list.find(row => row.customerLocalDate === date) ?? list[0];
            setHistorySigned(Boolean(item?.isDiet));
        } catch {
            setHistorySigned(false);
        }
    }, [patientOpts]);

    const loadDayData = useCallback(async (date: string, inUseRule: DietPatientRuleInfo | null) => {
        const [meals, rule] = await Promise.all([
            loadMealDetailListForDate(date, patientOpts),
            loadDietRuleForDate(date, inUseRule, {
                ...patientOpts,
                dietPatientRuleId: inUseRule?.dietPatientRuleId ?? dietPatientRuleId,
            }),
        ]);
        setMealDetailList(meals);
        setDayRule(rule);
    }, [dietPatientRuleId, patientOpts]);

    const ensureEatYearLoaded = useCallback(async (year: number, force = false) => {
        const currentYear = moment().year();
        if (!Number.isFinite(year) || year > currentYear) return;
        if (!force && (loadedEatYearsRef.current.has(year) || loadingEatYearsRef.current.has(year))) {
            return;
        }
        if (loadingEatYearsRef.current.has(year)) return;

        loadingEatYearsRef.current.add(year);
        try {
            const nextMap = await loadMealEatMapByYear(year, dietPatientRuleId, patientOpts);
            if (nextMap) {
                loadedEatYearsRef.current.add(year);
                setEatMap(prev => ({ ...prev, ...nextMap }));
            }
        } finally {
            loadingEatYearsRef.current.delete(year);
        }
    }, [dietPatientRuleId, patientOpts]);

    // 处方切换时清空餐次打点缓存
    useEffect(() => {
        loadedEatYearsRef.current.clear();
        loadingEatYearsRef.current.clear();
        setEatMap({});
    }, [dietPatientRuleId, patientUserId]);

    // 周切换 / 选中日跨年时懒加载餐次标记
    useEffect(() => {
        const years = new Set<number>();
        years.add(moment(selectedDate, 'YYYY-MM-DD').year());
        weekDays.forEach(day => years.add(moment(day.key, 'YYYY-MM-DD').year()));
        years.forEach(year => {
            void ensureEatYearLoaded(year);
        });
    }, [ensureEatYearLoaded, selectedDate, weekDays]);

    useFocusEffect(
        useCallback(() => {
            void loadDayData(selectedDate, dietRule);
            if (!readOnly) {
                void loadSignInfo();
            }
            if (selectedDate < moment().format('YYYY-MM-DD')) {
                void loadHistorySignStatus(selectedDate);
            } else {
                setHistorySigned(false);
            }
            // 回到页面时刷新可见周所在年的餐次点
            const years = new Set<number>();
            years.add(moment(selectedDate, 'YYYY-MM-DD').year());
            buildDietWeekDays(selectedDate).forEach(day => {
                years.add(moment(day.key, 'YYYY-MM-DD').year());
            });
            years.forEach(year => {
                loadedEatYearsRef.current.delete(year);
                void ensureEatYearLoaded(year, true);
            });
        }, [
            dietRule,
            ensureEatYearLoaded,
            loadDayData,
            loadHistorySignStatus,
            loadSignInfo,
            readOnly,
            selectedDate,
        ]),
    );

    const targetCalories = Number(dayRule?.targetCalories) || 0;
    const targetProtein = Number(dayRule?.targetProtein) || 0;
    const targetCarbs = Number(dayRule?.targetCarbs) || 0;
    const targetFat = Number(dayRule?.targetFat) || 0;

    const eatenCalories = useMemo(() => sumCalories(mealDetailList), [mealDetailList]);
    const eatenProtein = useMemo(() => sumProtein(mealDetailList), [mealDetailList]);
    const eatenCarbs = useMemo(
        () => mealDetailList.filter(item => !isWaterRecord(item)).reduce((sum, item) => sum + toNumber(item.carbs), 0),
        [mealDetailList],
    );
    const eatenFat = useMemo(
        () => mealDetailList.filter(item => !isWaterRecord(item)).reduce((sum, item) => sum + toNumber(item.fat), 0),
        [mealDetailList],
    );

    const remainCalories = Math.max(0, targetCalories - eatenCalories);
    const progressPercent = targetCalories > 0
        ? Math.min(100, Math.round((eatenCalories / targetCalories) * 100))
        : 0;
    const proteinProgress = targetProtein > 0
        ? Math.min(100, Math.round((eatenProtein / targetProtein) * 100))
        : 0;
    const carbsProgress = targetCarbs > 0
        ? Math.min(100, Math.round((eatenCarbs / targetCarbs) * 100))
        : 0;
    const fatProgress = targetFat > 0
        ? Math.min(100, Math.round((eatenFat / targetFat) * 100))
        : 0;

    const actualFoodsByCategory = useMemo(() => {
        const map: Record<number, MealDetailItem[]> = {};
        ([1, 2, 3, 4] as const).forEach(category => {
            const key = CATEGORY_TO_MEAL_KEY[category];
            map[category] = getFoodRecordsByCategory(mealDetailList, key);
        });
        return map;
    }, [mealDetailList]);

    const actualCaloriesByCategory = useMemo(() => {
        const map: Record<number, number> = {};
        ([1, 2, 3, 4] as const).forEach(category => {
            map[category] = sumCalories(actualFoodsByCategory[category] ?? []);
        });
        return map;
    }, [actualFoodsByCategory]);

    const onDeleteFood = useCallback((item: MealDetailItem) => {
        const name = item.mealName?.trim() || '该食物';
        Alert.alert('删除食物', `确定删除「${name}」吗？`, [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                    void (async () => {
                        try {
                            if (item.mealDetailId != null) {
                                const res = await deleteMealDetail(item.mealDetailId);
                                if (!isResourceApiOk(res as { code?: number })) {
                                    const r = res as { msg?: string; message?: string };
                                    Toast.info(r.msg ?? r.message ?? '删除失败');
                                    return;
                                }
                            }
                            setMealDetailList(prev =>
                                prev.filter(food => {
                                    if (item.mealDetailId != null) {
                                        return food.mealDetailId !== item.mealDetailId;
                                    }
                                    return food !== item;
                                }),
                            );
                            Toast.success('已删除', 1.5);
                        } catch {
                            Toast.info('网络错误，请稍后重试');
                        }
                    })();
                },
            },
        ]);
    }, []);

    const onPressDatePicker = () => {
        setDatePickerVisible(true);
    };

    const onPressCheckIn = useCallback(async () => {
        if (signing) return;
        if (selectedDate !== moment().format('YYYY-MM-DD')) {
            Toast.info(selectedDate > moment().format('YYYY-MM-DD')
                ? '未来日期不可打卡'
                : '历史日期不可打卡');
            return;
        }
        if (signInfo?.signedToday) {
            Toast.info('今日已打卡');
            return;
        }
        const blocked = getDietSignBlockedMessage(signInfo);
        if (blocked) {
            Toast.info(blocked);
            return;
        }

        setSigning(true);
        const loadingKey = Toast.loading('打卡中…', 0);
        try {
            const res = await postDietUserSign();
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                Toast.show(
                    (res as { msg?: string; message?: string })?.msg
                    || (res as { msg?: string; message?: string })?.message
                    || '打卡失败',
                );
                return;
            }
            const next = apiResourceData<DietUserSignInfo>(
                res as unknown as { code?: number; data?: DietUserSignInfo },
            ) ?? null;
            setSignInfo(next);
            setCheckInSuccessVisible(true);
        } catch {
            Toast.show('打卡失败');
        } finally {
            Toast.remove(loadingKey);
            setSigning(false);
        }
    }, [selectedDate, signInfo, signing]);

    const onPressRefresh = useCallback(async () => {
        if (selectedDate !== moment().format('YYYY-MM-DD')) {
            Toast.info(selectedDate > moment().format('YYYY-MM-DD')
                ? '未来日期不可换一换'
                : '历史日期不可换一换');
            return;
        }
        if (signInfo?.signedToday) {
            Toast.info('今日已打卡，不可换一换');
            return;
        }
        const ruleId = dayRule?.dietPatientRuleId ?? dietRule?.dietPatientRuleId;
        if (ruleId == null || String(ruleId).trim() === '') {
            Toast.show('暂无可用处方');
            return;
        }
        if (refreshing) return;

        setRefreshing(true);
        const loadingKey = Toast.loading('正在生成…', 0);
        try {
            const day = moment(selectedDate).isoWeekday();
            const res = await getDietPatientRuleAiMakeOneDayMeal({
                dietPatientRuleId: String(ruleId),
                day,
            });
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                const failRes = res as unknown as { msg?: string; message?: string };
                Toast.show(failRes?.msg || failRes?.message || '换一换失败');
                return;
            }

            const nextRule = await fetchDietRuleForDate(selectedDate, {
                ...patientOpts,
                dietPatientRuleId: ruleId,
            });
            if (!nextRule) {
                Toast.show('获取处方失败');
                return;
            }
            setDayRule(nextRule);
            onDietRuleChange?.(nextRule);
            Toast.success('已更新推荐餐食');
        } catch {
            Toast.show('换一换失败');
        } finally {
            Toast.remove(loadingKey);
            setRefreshing(false);
        }
    }, [
        dayRule?.dietPatientRuleId,
        dietRule?.dietPatientRuleId,
        onDietRuleChange,
        refreshing,
        selectedDate,
        signInfo?.signedToday,
        patientOpts,
    ]);

    if (!dietRule) {
        return (
            <View style={styles.emptyPrescription}>
                <Image
                    source={require('@/assets/images/nutrition/icon_yy_empty.png')}
                    style={styles.emptyPrescriptionIcon}
                />
                {readOnly || profileComplete ? (
                    <Text style={styles.emptyPrescriptionText}>
                        {readOnly ? '暂无营养处方' : '暂无营养处方，如需开方，请联系工作人员'}
                    </Text>
                ) : (
                    <Flex style={styles.emptyPrescriptionTextRow}>
                        <Text style={styles.emptyPrescriptionTextInline}>暂无营养处方，请先</Text>
                        <CompleteProfileLink color='#6D925E' textStyle={styles.emptyPrescriptionTextInline} />
                    </Flex>
                )}
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <DietDatePickerModal
                visible={datePickerVisible}
                selectedDate={selectedDate}
                onClose={() => setDatePickerVisible(false)}
                onSelect={setSelectedDate}
                patientUserId={patientUserId}
                dietPatientRuleId={dietPatientRuleId}
                selectableStartDate={prescriptionStartDate || null}
                selectableEndDate={prescriptionEndDate || null}
            />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingBottom: readOnly
                            ? 24
                            : 24 + 17 + 46 + Math.max(insets.bottom, 8),
                    },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Flex justify="between" style={styles.calendarBox}>
                    {weekDays.map(item => {
                        const isActive = item.key === selectedDate;
                        const selectable = isCalendarDateInPrescriptionRange(
                            item.key,
                            prescriptionStartDate,
                            prescriptionEndDate,
                        );
                        const mealDots = selectable ? getDayMealEatDots(eatMap[item.key]) : [];
                        return (
                            <TouchableOpacity
                                key={item.key}
                                activeOpacity={selectable ? 0.7 : 1}
                                disabled={!selectable}
                                style={[
                                    styles.calendarCol,
                                    isActive && selectable && styles.calendarColActive,
                                ]}
                                onPress={() => {
                                    if (!selectable) return;
                                    setSelectedDate(item.key);
                                }}
                            >
                                <Text
                                    style={[
                                        isActive && selectable
                                            ? styles.calendarTitleActive
                                            : styles.calendarTitle,
                                        !selectable && styles.calendarTitleDisabled,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                <Text
                                    style={[
                                        isActive && selectable
                                            ? styles.calendarSubtitleActive
                                            : styles.calendarSubtitle,
                                        !selectable && styles.calendarSubtitleDisabled,
                                    ]}
                                >
                                    {item.day}
                                </Text>
                                <View style={styles.calendarMealDotWrap}>
                                    {mealDots.map((color, index) => (
                                        <View
                                            key={`${item.key}-${color}-${index}`}
                                            style={[styles.calendarMealDot, { backgroundColor: color }]}
                                        />
                                    ))}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.calendarCol}
                        onPress={onPressDatePicker}
                    >
                        <Text style={styles.calendarTitle}>日期</Text>
                        <Image
                            style={styles.calendarImage}
                            source={require('@/assets/images/nutrition/time.png')}
                        />
                    </TouchableOpacity>
                </Flex>

                <View style={styles.calendarContent}>
                    <Text style={styles.calendarContentTitle}>今日营养目标</Text>
                    <Flex style={styles.calendarContentProgress}>
                        <Flex direction="column" style={styles.valueBox}>
                            <Text style={styles.valueTitle}>已摄入</Text>
                            <Text style={styles.valueText}>
                                {eatenCalories > 0 ? Math.round(eatenCalories) : '--'}
                            </Text>
                        </Flex>
                        <View style={styles.calendarContentProgressRing}>
                            <DietProgressRing progress={progressPercent} />
                            <View style={styles.calendarContentTitleBox}>
                                <Text style={styles.title1}>还可吃 (千卡)</Text>
                                <Text style={styles.title2}>
                                    {targetCalories > 0 ? Math.round(remainCalories) : '--'}
                                </Text>
                                <Text style={styles.title3}>
                                    推荐预算{targetCalories > 0 ? targetCalories : '--'}
                                </Text>
                            </View>
                        </View>
                        <Flex direction="column" style={styles.valueBox}>
                            <Text style={styles.valueTitle}>完成度</Text>
                            <Text style={styles.valueText}>
                                {targetCalories > 0 ? `${progressPercent}%` : '--'}
                            </Text>
                        </Flex>
                    </Flex>
                    <View style={styles.lineBox} />
                    <Flex justify="between" style={styles.dietListBox}>
                        <View style={styles.dietList}>
                            <Flex>
                                <Image
                                    style={styles.dietListImage}
                                    source={require('@/assets/images/nutrition/dbz.png')}
                                />
                                <Text style={styles.dietListText}>蛋白质</Text>
                            </Flex>
                            <DietListLine progress={proteinProgress} color="#0851ae" />
                            <Text style={styles.btmBox}>
                                {Math.round(eatenProtein)}
                                <Text style={styles.btmBoxText}>
                                    /{targetProtein > 0 ? `${Math.round(targetProtein)}g` : '--'}
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.dietList}>
                            <Flex>
                                <Image
                                    style={styles.dietListImage}
                                    source={require('@/assets/images/nutrition/ts.png')}
                                />
                                <Text style={styles.dietListText}>碳水</Text>
                            </Flex>
                            <DietListLine progress={carbsProgress} color="#72a1c5" />
                            <Text style={styles.btmBox}>
                                {Math.round(eatenCarbs)}
                                <Text style={styles.btmBoxText}>
                                    /{targetCarbs > 0 ? `${Math.round(targetCarbs)}g` : '--'}
                                </Text>
                            </Text>
                        </View>
                        <View style={styles.dietList}>
                            <Flex>
                                <Image
                                    style={styles.dietListImage}
                                    source={require('@/assets/images/nutrition/zf.png')}
                                />
                                <Text style={styles.dietListText}>脂肪</Text>
                            </Flex>
                            <DietListLine progress={fatProgress} color="#fb4550" />
                            <Text style={styles.btmBox}>
                                {Math.round(eatenFat)}
                                <Text style={styles.btmBoxText}>
                                    /{targetFat > 0 ? `${Math.round(targetFat)}g` : '--'}
                                </Text>
                            </Text>
                        </View>
                    </Flex>
                </View>

                {recommendedSections.length > 0 ? (
                    recommendedSections.map(section => (
                        <RecommendedMealCard
                            key={section.key}
                            section={section}
                            actualCalories={actualCaloriesByCategory[section.category] ?? 0}
                            actualFoods={actualFoodsByCategory[section.category] ?? []}
                            onDeleteFood={onDeleteFood}
                            showPhotoButton={!readOnly && isTodaySelected}
                            showDeleteButton={!readOnly && isTodaySelected}
                        />
                    ))
                ) : (
                    <View style={styles.calendarContent}>
                        <Text style={styles.calendarContentTitle}>今日推荐</Text>
                        <Text style={[styles.calendarContentSubtitle, { marginTop: 12 }]}>
                            {isBeforePrescriptionStart || !dayRule ? '暂无数据' : '暂无推荐餐食'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {!readOnly ? (
                <Flex
                    justify="between"
                    align="center"
                    style={[
                        styles.bottomBar,
                        { paddingBottom: Math.max(insets.bottom, 8) },
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.bottomBarButtonLeft,
                            signButtonDisabled && styles.bottomBarButtonLeftDisabled,
                        ]}
                        activeOpacity={0.7}
                        disabled={signButtonDisabled}
                        onPress={onPressCheckIn}
                    >
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image style={styles.btnImgSize} source={signButtonIcon} />
                            <Text style={styles.bottomBarButtonTextLeft}>{signButtonLabel}</Text>
                        </Flex>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.bottomBarButtonRight,
                            refreshDisabled && styles.bottomBarButtonRightDisabled,
                        ]}
                        activeOpacity={0.7}
                        disabled={refreshDisabled}
                        onPress={onPressRefresh}
                    >
                        <Flex justify="center" style={{ flex: 1 }}>
                            <Image
                                style={[
                                    styles.btnImgSize,
                                    refreshDisabled && styles.bottomBarButtonRightIconDisabled,
                                ]}
                                source={require('@/assets/images/nutrition/hyh.png')}
                            />
                            <Text
                                style={[
                                    styles.bottomBarButtonTextRight,
                                    refreshDisabled && styles.bottomBarButtonTextRightDisabled,
                                ]}
                            >
                                换一换
                            </Text>
                        </Flex>
                    </TouchableOpacity>
                </Flex>
            ) : null}

            <DietCheckInSuccessModal
                visible={checkInSuccessVisible}
                onClose={() => setCheckInSuccessVisible(false)}
            />
        </View>
    );
}
