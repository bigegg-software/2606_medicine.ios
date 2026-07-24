import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ViewToken,
} from 'react-native';
import moment from 'moment';
import styles, { DIET_DATE_PICKER_SHEET_HEIGHT } from '@/css/nutrition/dietDatePicker';
import {
  DIET_WEEK_LABELS,
  buildDietMonthCells,
  buildDietMonthKeys,
  getDietMonthWeekCount,
  shiftDietMonthKeys,
  type DietCalendarDayCell,
} from './utils/dietCalendarHelpers';

type Props = {
  visible: boolean;
  selectedDate: string;
  onClose: () => void;
  onSelect: (date: string) => void;
};

const INITIAL_BEFORE = 8;
const INITIAL_AFTER = 8;
const MONTH_EXTEND_COUNT = 6;
const EXTEND_EDGE = 2;
const MONTH_LABEL_HEIGHT = 49; // 24 title + 25 gap
const DAY_ROW_HEIGHT = 44;

const cellCache = new Map<string, DietCalendarDayCell[]>();
const heightCache = new Map<string, number>();

function getMonthCells(monthKey: string) {
  const cached = cellCache.get(monthKey);
  if (cached) return cached;
  const cells = buildDietMonthCells(monthKey);
  cellCache.set(monthKey, cells);
  return cells;
}

function getMonthHeight(monthKey: string) {
  const cached = heightCache.get(monthKey);
  if (cached != null) return cached;
  const height = MONTH_LABEL_HEIGHT + getDietMonthWeekCount(monthKey) * DAY_ROW_HEIGHT;
  heightCache.set(monthKey, height);
  return height;
}

function sumMonthHeights(keys: string[], start = 0, end = keys.length) {
  let total = 0;
  for (let index = start; index < end; index += 1) {
    total += getMonthHeight(keys[index]);
  }
  return total;
}

type MonthSectionProps = {
  monthKey: string;
  selectedDate: string;
  todayKey: string;
  onSelect: (date: string) => void;
};

const MonthSection = memo(function MonthSection({
  monthKey,
  selectedDate,
  todayKey,
  onSelect,
}: MonthSectionProps) {
  const cells = getMonthCells(monthKey);
  const weekCount = cells.length / 7;

  return (
    <View style={[styles.monthBlock, { height: getMonthHeight(monthKey) }]}>
      <Text style={styles.monthLabel}>{monthKey}</Text>
      {Array.from({ length: weekCount }, (_, rowIndex) => {
        const row = cells.slice(rowIndex * 7, rowIndex * 7 + 7);
        return (
          <View key={`${monthKey}-r${rowIndex}`} style={styles.dayRow}>
            {row.map(cell => {
              if (!cell.inCurrentMonth) {
                return <View key={cell.key} style={styles.dayCell} />;
              }
              const selected = cell.key === selectedDate;
              const isToday = cell.key === todayKey;
              return (
                <Pressable
                  key={cell.key}
                  style={styles.dayCell}
                  onPress={() => onSelect(cell.key)}
                >
                  <View
                    style={[
                      styles.dayInner,
                      selected && styles.dayInnerSelected,
                      !selected && isToday && styles.dayInnerToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                        !selected && isToday && styles.dayTextToday,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
});

export default function DietDatePickerModal({
  visible,
  selectedDate,
  onClose,
  onSelect,
}: Props) {
  const listRef = useRef<FlatList<string>>(null);
  const extendingRef = useRef(false);
  const listReadyRef = useRef(false);
  const scrollOffsetRef = useRef(0);
  const headerMonthRef = useRef(moment(selectedDate).format('YYYY-MM'));
  const monthKeysLenRef = useRef(INITIAL_BEFORE + INITIAL_AFTER + 1);
  const monthKeysRef = useRef<string[]>([]);
  const [monthKeys, setMonthKeys] = useState(() =>
    buildDietMonthKeys(selectedDate, INITIAL_BEFORE, INITIAL_AFTER),
  );
  const [headerMonth, setHeaderMonth] = useState(() => headerMonthRef.current);
  const [listEpoch, setListEpoch] = useState(0);
  const [listReady, setListReady] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(DIET_DATE_PICKER_SHEET_HEIGHT)).current;
  const hasOpenedRef = useRef(false);
  const todayKey = useMemo(() => moment().format('YYYY-MM-DD'), []);

  monthKeysLenRef.current = monthKeys.length;
  monthKeysRef.current = monthKeys;
  listReadyRef.current = listReady;

  const openTargetOffset = useMemo(
    () => sumMonthHeights(monthKeys, 0, INITIAL_BEFORE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listEpoch],
  );

  const startOpenAnimation = useCallback(() => {
    overlayAnim.setValue(0);
    sheetAnim.setValue(DIET_DATE_PICKER_SHEET_HEIGHT);
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayAnim, sheetAnim]);

  useEffect(() => {
    if (visible) {
      hasOpenedRef.current = true;
      const month = moment(selectedDate).format('YYYY-MM');
      const keys = buildDietMonthKeys(selectedDate, INITIAL_BEFORE, INITIAL_AFTER);
      const offset = sumMonthHeights(keys, 0, INITIAL_BEFORE);
      headerMonthRef.current = month;
      scrollOffsetRef.current = offset;
      setHeaderMonth(month);
      setMonthKeys(keys);
      setListReady(false);
      listReadyRef.current = false;
      setModalMounted(true);
      setListEpoch(prev => prev + 1);
      return;
    }

    if (!hasOpenedRef.current) return;

    setListReady(false);
    listReadyRef.current = false;
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: DIET_DATE_PICKER_SHEET_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setModalMounted(false);
    });
  }, [overlayAnim, selectedDate, sheetAnim, visible]);

  useEffect(() => {
    if (!visible || !modalMounted || listEpoch === 0) return;

    let cancelled = false;
    const offset = sumMonthHeights(monthKeysRef.current, 0, INITIAL_BEFORE);

    const reveal = () => {
      if (cancelled) return;
      listRef.current?.scrollToOffset({ offset, animated: false });
      scrollOffsetRef.current = offset;
      setListReady(true);
      listReadyRef.current = true;
      startOpenAnimation();
    };

    // Wait until list is laid out, then jump to selected month before showing
    const timer = setTimeout(reveal, 16);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [listEpoch, modalMounted, startOpenAnimation, visible]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 60,
  }).current;

  const handleViewableItemsChanged = useRef((info: { viewableItems: ViewToken[] }) => {
    if (!listReadyRef.current) return;

    const { viewableItems } = info;
    const first = viewableItems.find(item => item.isViewable && typeof item.item === 'string');
    if (first?.item) {
      const month = String(first.item);
      if (headerMonthRef.current !== month) {
        headerMonthRef.current = month;
        setHeaderMonth(month);
      }
    }

    const indexes = viewableItems
      .map(item => item.index)
      .filter((index): index is number => typeof index === 'number');
    if (indexes.length === 0 || extendingRef.current) return;

    const minIndex = Math.min(...indexes);
    const maxIndex = Math.max(...indexes);
    const total = monthKeysLenRef.current;

    if (minIndex <= EXTEND_EDGE) {
      extendingRef.current = true;
      const nextKeys = shiftDietMonthKeys(monthKeysRef.current, 'before', MONTH_EXTEND_COUNT);
      const prependHeight = sumMonthHeights(nextKeys, 0, MONTH_EXTEND_COUNT);
      setMonthKeys(nextKeys);
      const nextOffset = scrollOffsetRef.current + prependHeight;
      scrollOffsetRef.current = nextOffset;
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: nextOffset, animated: false });
        extendingRef.current = false;
      });
      return;
    }

    if (maxIndex >= total - 1 - EXTEND_EDGE) {
      extendingRef.current = true;
      setMonthKeys(prev => shiftDietMonthKeys(prev, 'after', MONTH_EXTEND_COUNT));
      setTimeout(() => {
        extendingRef.current = false;
      }, 80);
    }
  }).current;

  const handleSelect = useCallback((date: string) => {
    onSelect(date);
    onClose();
  }, [onClose, onSelect]);

  const getItemLayout = useCallback((data: ArrayLike<string> | null | undefined, index: number) => {
    const keys = data ? Array.from(data as ArrayLike<string>) : monthKeysRef.current;
    const length = getMonthHeight(keys[index] ?? keys[0]);
    const offset = sumMonthHeights(keys as string[], 0, index);
    return { length, offset, index };
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<string>) => (
    <MonthSection
      monthKey={item}
      selectedDate={selectedDate}
      todayKey={todayKey}
      onSelect={handleSelect}
    />
  ), [handleSelect, selectedDate, todayKey]);

  const keyExtractor = useCallback((item: string) => item, []);

  return (
    <Modal visible={modalMounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlayRoot}>
        <Animated.View style={[styles.overlayBg, { opacity: overlayAnim }]} pointerEvents="none" />
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>日期选择</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Image
                  style={styles.closeIcon}
                  source={require('@/assets/images/schedule/close.png')}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.monthText}>{headerMonth}</Text>
            <View style={styles.weekRow}>
              {DIET_WEEK_LABELS.map(label => (
                <View key={label} style={styles.weekCell}>
                  <Text style={styles.weekText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.headerDivider} />

          {modalMounted ? (
            <FlatList
              key={`diet-cal-${listEpoch}`}
              ref={listRef}
              style={[styles.list, !listReady && styles.listHidden]}
              data={monthKeys}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              initialScrollIndex={INITIAL_BEFORE}
              getItemLayout={getItemLayout}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              removeClippedSubviews={false}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              onScrollToIndexFailed={() => {
                listRef.current?.scrollToOffset({
                  offset: openTargetOffset,
                  animated: false,
                });
              }}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
