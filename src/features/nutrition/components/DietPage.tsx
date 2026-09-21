import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, DeviceEventEmitter } from 'react-native';
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
import MealRefreshPeriodPickerModal, {
    type MealRefreshPeriodKey,
} from './MealRefreshPeriodPickerModal';
import {
    getAiMakeOneDayMealRemainCount,
    postAiMakeMealDayV2,
    type DietMealDayItem,
    type DietPatientRuleInfo,
} from '@/api/dietPatientRule';
import {
    buildRecommendedMealSectionsFromDay,
    formatActualFoodMeta,
    formatMealApproxCalories,
    formatMealMacroGrams,
    type RecommendedMealSection,
} from './utils/dietMealHelpers';
import { loadDietRuleForDate } from './utils/dietRuleDateHelpers';
import {
    applyMealDayForDateToRule,
    DIET_MEAL_DAY_ARCHIVE_REFRESH_EVENT,
    isMealRefreshPeriodAsync,
    resolveMealRefreshDateRange,
} from './utils/mealRefreshPeriodHelpers';
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
    patientUserId,
}: {
    section: RecommendedMealSection;
    actualCalories: number;
    actualFoods: MealDetailItem[];
    onDeleteFood: (item: MealDetailItem) => void;
    showPhotoButton: boolean;
    showDeleteButton?: boolean;
    patientUserId?: string;
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
            <Flex justify='between' align='center'>
                <Flex>
                    <Image style={styles.dietListImage} source={section.icon} />
                    <Text style={styles.calendarContentTitle}>{section.title}</Text>
                </Flex>
                <Text style={styles.mealMacroApprox} numberOfLines={1}>
                    {formatMealApproxCalories(section.planCalories)}
                </Text>
            </Flex>
            <Flex justify="between" align="center" style={styles.mealMacroRow}>
                <Flex align="center" style={styles.mealMacroItem}>
                    <Image
                        style={styles.mealMacroIcon}
                        source={require('@/assets/images/nutrition/dbz.png')}
                    />
                    <Text style={styles.mealMacroText}>
                        蛋白质{formatMealMacroGrams(section.protein)}g
                    </Text>
                </Flex>
                <Flex align="center" style={styles.mealMacroItem}>
                    <Image
                        style={styles.mealMacroIcon}
                        source={require('@/assets/images/nutrition/ts.png')}
                    />
                    <Text style={styles.mealMacroText}>
                        碳水{formatMealMacroGrams(section.carbs)}g
                    </Text>
                </Flex>
                <Flex align="center" style={styles.mealMacroItem}>
                    <Image
                        style={styles.mealMacroIcon}
                        source={require('@/assets/images/nutrition/zf.png')}
                    />
                    <Text style={styles.mealMacroText}>
                        脂肪{formatMealMacroGrams(section.fat)}g
                    </Text>
                </Flex>

            </Flex>
            <View style={styles.mealMacroDashWrap}>
                <View style={styles.mealMacroDash} />
            </View>

            {section.foods.length > 0 ? (
                <Flex align="start" style={styles.dietMapBox}>
                    <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default1.png')} />
                    <View style={styles.mapCenBox}>
                        {section.foods.map((food, index) => (
                            <Flex
                                key={food.key}
                                justify="between"
                                align="center"
                                style={index > 0 ? styles.mapFoodRow : undefined}
                            >
                                <Flex align="center" style={styles.mapTitleRow}>
                                    <View style={styles.mapBor} />
                                    <Text style={styles.mapTitle} numberOfLines={1}>{food.foodName}</Text>
                                </Flex>
                                <Text style={styles.mapValue}>{food.amountText}</Text>
                            </Flex>
                        ))}
                    </View>
                </Flex>
            ) : null}

            <View style={styles.mealMacroDashWrap}>
                <View style={styles.mealMacroDash} />
            </View>

            <Flex justify="end" style={styles.mealActionRow}>
                <TouchableOpacity
                    style={styles.mealActionRecipeBtn}
                    activeOpacity={0.7}
                    onPress={() => { }}
                >
                    <Text style={styles.mealActionRecipeText}>查看做法</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.mealActionRefreshBtn}
                    activeOpacity={0.7}
                    onPress={() => { }}
                >
                    <Flex justify="center" align="center">
                        <Image
                            style={styles.mealActionRefreshIcon}
                            source={require('@/assets/images/nutrition/hyh.png')}
                        />
                        <Text style={styles.mealActionRefreshText}>换一换</Text>
                    </Flex>
                </TouchableOpacity>
            </Flex>

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
                        <TouchableOpacity
                            key={`${food.mealDetailId ?? food.mealName ?? index}`}
                            style={styles.actualEatFoodRow}
                            activeOpacity={food.mealDetailId ? 0.7 : 1}
                            onPress={() => {
                                if (food.mealDetailId == null) return;
                                navigation.navigate('MealRecordDetailPage', {
                                    mealDetailId: String(food.mealDetailId),
                                    ...(patientUserId ? { patientUserId } : {}),
                                });
                            }}
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
                        </TouchableOpacity>
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
    const [dayRule, setDayRule] = useState<DietPatientRuleInfo | null>(() =>
        dietRule ? { ...dietRule, mealList: [] } : null,
    );
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshRemainCount, setRefreshRemainCount] = useState<number | null>(null);
    const [refreshPeriodVisible, setRefreshPeriodVisible] = useState(false);
    const [signing, setSigning] = useState(false);
    const [signInfo, setSignInfo] = useState<DietUserSignInfo | null>(null);
    const [historySigned, setHistorySigned] = useState(false);
    const [checkInSuccessVisible, setCheckInSuccessVisible] = useState(false);
    const [eatMap, setEatMap] = useState<MealEatMap>({});
    const loadedEatYearsRef = useRef<Set<number>>(new Set());
    const loadingEatYearsRef = useRef<Set<number>>(new Set());
    const waitingMealRefreshRef = useRef(false);
    const mealRefreshRangeRef = useRef<{ startDate: string; endDate: string } | null>(null);
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);
    const prescriptionStartDate = dietRule?.startDate?.trim() || dayRule?.startDate?.trim() || '';
    const prescriptionEndDate = dietRule?.endDate?.trim() || dayRule?.endDate?.trim() || '';
    const todayKey = moment().format('YYYY-MM-DD');
    const isPastSelected = selectedDate < todayKey;
    const isTodaySelected = selectedDate === todayKey;

    const recommendedSections = useMemo(
        () => buildRecommendedMealSectionsFromDay(dayRule?.mealList),
        [dayRule?.mealList],
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
    const refreshDisabled = !isTodaySelected
        || Boolean(signInfo?.signedToday)
        || refreshing
        || (refreshRemainCount != null && refreshRemainCount <= 0);

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

    const loadRefreshRemainCount = useCallback(async () => {
        try {
            const res = await getAiMakeOneDayMealRemainCount(patientOpts);
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                setRefreshRemainCount(null);
                return;
            }
            const raw = apiResourceData(res as unknown as { code?: number; data?: number });
            const count = Number(raw);
            setRefreshRemainCount(Number.isFinite(count) ? Math.max(0, Math.floor(count)) : null);
        } catch {
            setRefreshRemainCount(null);
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
                void loadRefreshRemainCount();
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
            loadRefreshRemainCount,
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

    const onPressRefresh = useCallback(() => {
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
        if (refreshRemainCount != null && refreshRemainCount <= 0) {
            Toast.info('今日换一换次数已用完');
            return;
        }
        const ruleId = dayRule?.dietPatientRuleId ?? dietRule?.dietPatientRuleId;
        if (ruleId == null || String(ruleId).trim() === '') {
            Toast.show('暂无可用处方');
            return;
        }
        if (refreshing) return;
        setRefreshPeriodVisible(true);
    }, [
        dayRule?.dietPatientRuleId,
        dietRule?.dietPatientRuleId,
        refreshing,
        refreshRemainCount,
        selectedDate,
        signInfo?.signedToday,
    ]);

    const applyMealDayListLocally = useCallback((mealDayList: DietMealDayItem[] | undefined) => {
        if (!mealDayList?.length) return;
        const base = dayRule ?? dietRule;
        if (!base) return;
        // 仅更新当日展示，不回写父级周模板 mealList
        setDayRule(applyMealDayForDateToRule(base, mealDayList, selectedDate));
    }, [dayRule, dietRule, selectedDate]);

    const finishMealRefresh = useCallback(async (options?: { fromAsync?: boolean }) => {
        await loadDayData(selectedDate, dietRule);
        void loadRefreshRemainCount();
        waitingMealRefreshRef.current = false;
        mealRefreshRangeRef.current = null;
        setRefreshing(false);
        if (options?.fromAsync) {
            Toast.success('食谱已更新');
        }
    }, [dietRule, loadDayData, loadRefreshRemainCount, selectedDate]);

    const onConfirmRefreshPeriod = useCallback(async (period: MealRefreshPeriodKey) => {
        setRefreshPeriodVisible(false);
        const ruleId = String(dayRule?.dietPatientRuleId ?? dietRule?.dietPatientRuleId ?? '').trim();
        if (!ruleId) {
            Toast.show('暂无可用处方');
            return;
        }
        if (refreshing) return;

        const range = resolveMealRefreshDateRange(period, {
            prescriptionEndDate: prescriptionEndDate || undefined,
        });
        mealRefreshRangeRef.current = range;
        setRefreshing(true);
        const loadingKey = Toast.loading('请稍后…', 0);
        try {
            const res = await postAiMakeMealDayV2(
                {
                    dietPatientRuleId: ruleId,
                    startDate: range.startDate,
                    endDate: range.endDate,
                },
                patientOpts,
            );
            if (!isResourceApiOk(res as unknown as { code?: number })) {
                Toast.show(
                    (res as { msg?: string; message?: string })?.msg
                    ?? (res as { msg?: string; message?: string })?.message
                    ?? '换一换失败',
                );
                waitingMealRefreshRef.current = false;
                mealRefreshRangeRef.current = null;
                setRefreshing(false);
                return;
            }
            const data = apiResourceData(
                res as unknown as {
                    code?: number;
                    data?: { async?: boolean; mealDayList?: DietMealDayItem[] };
                },
            );
            // 仅「今天」同步；本周 / 本周及下周一律异步（不看日期是否退化为单日）
            if (isMealRefreshPeriodAsync(period)) {
                waitingMealRefreshRef.current = true;
                void loadRefreshRemainCount();
                setRefreshing(false);
                Toast.info('食谱生成中，生成完成后将为您发送通知提醒');
                return;
            }
            applyMealDayListLocally(data?.mealDayList);
            void loadRefreshRemainCount();
            waitingMealRefreshRef.current = false;
            mealRefreshRangeRef.current = null;
            setRefreshing(false);
            Toast.success('已更新食谱');
        } catch {
            Toast.show('换一换失败');
            waitingMealRefreshRef.current = false;
            mealRefreshRangeRef.current = null;
            setRefreshing(false);
        } finally {
            Toast.remove(loadingKey);
        }
    }, [
        applyMealDayListLocally,
        dayRule?.dietPatientRuleId,
        dietRule?.dietPatientRuleId,
        loadRefreshRemainCount,
        patientOpts,
        prescriptionEndDate,
        refreshing,
    ]);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener(DIET_MEAL_DAY_ARCHIVE_REFRESH_EVENT, () => {
            if (!waitingMealRefreshRef.current) return;
            void finishMealRefresh({ fromAsync: true });
        });
        return () => {
            sub.remove();
        };
    }, [finishMealRefresh]);

    useEffect(() => {
        if (!refreshing || !waitingMealRefreshRef.current) return;
        const timer = setTimeout(() => {
            if (!waitingMealRefreshRef.current) return;
            void finishMealRefresh({ fromAsync: true });
        }, 120_000);
        return () => clearTimeout(timer);
    }, [finishMealRefresh, refreshing]);

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
                        paddingBottom: 24
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

                <Text style={styles.dayTitle}>今天这样吃，身体更轻松</Text>
                <Text style={styles.daySubtitle}>控糖平衡 · 优质蛋白 · 高纤维主食</Text>

                {/* <View style={styles.calendarContent}>
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
                </View> */}

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
                            patientUserId={patientUserId}
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

                <TouchableOpacity>
                    <Flex justify='center' style={styles.mealActionCameraBox}>
                        <Image style={styles.mealActionCameraIcon} source={require('@/assets/images/exercise/camara.png')} />
                        <Text style={styles.mealActionCameraText}>拍照记录今日饮食</Text>
                    </Flex>
                </TouchableOpacity>

                <Flex justify="center" align="center" style={styles.planListFooter}>
                    <View style={styles.planListFooterLine} />
                    <Text style={styles.planListFooterText}>选对适合自己的，是身体变好的开端</Text>
                    <View style={styles.planListFooterLine} />
                </Flex>
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
            <MealRefreshPeriodPickerModal
                visible={refreshPeriodVisible}
                onCancel={() => setRefreshPeriodVisible(false)}
                onConfirm={onConfirmRefreshPeriod}
            />
        </View>
    );
}
