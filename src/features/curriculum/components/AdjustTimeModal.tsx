import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import { AppTheme } from '@/common/theme';
import styles from '@/css/curriculum/adjustTime';
import { reschedulePrivateBooking } from '../utils/courseSessionHelpers';
import {
  ADJUST_DATE_DAY_COUNT,
  buildAdjustDateItems,
  chunkAdjustTimeSlots,
  clampAdjustDateToWindow,
  fetchAdjustPrivateDateHasSet,
  fetchAdjustableSessions,
  isAdjustDateStripItemVisible,
  resolveAdjustDateStripScrollX,
  type AdjustTimeSlotItem,
} from '../utils/adjustTimeHelpers';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 原预约 id */
  bookingId?: string;
  /** 服务站 id */
  stationId?: string;
  /** 当前教练用户 id（仅展示该教练私教场次） */
  coachUserId?: string;
  /** 当前已预约场次 id（列表中置灰展示） */
  excludeSessionId?: string;
  /** 初始选中日期 yyyy-MM-dd */
  initialDate?: string;
  /** 初始时段起 HH:mm */
  initialStartTime?: string;
  /** 改约成功，回传新场次 id */
  onSuccess?: (newSessionId: string) => void;
};

/** 私教调整时间：最近 14 天日期条 + 时段选择（固定 private + 当前教练） */
export default function AdjustTimeModal({
  visible,
  onClose,
  bookingId,
  stationId,
  coachUserId,
  excludeSessionId,
  initialDate,
  initialStartTime,
  onSuccess,
}: Props) {
  const insets = useSafeAreaInsets();
  const dateStripRef = useRef<ScrollView>(null);
  const dateStripScrollXRef = useRef(0);
  const dateStripViewportWidthRef = useRef(0);
  /** 弹窗关闭后再展示的全局 Toast（避免被 Modal 挡住） */
  const pendingDismissToastRef = useRef<string | null>(null);
  const sheetToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sheetToast, setSheetToast] = useState('');
  const [dateItems, setDateItems] = useState(() =>
    buildAdjustDateItems(ADJUST_DATE_DAY_COUNT),
  );
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotKey, setSelectedSlotKey] = useState('');
  const [slots, setSlots] = useState<AdjustTimeSlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stripDateHasSet, setStripDateHasSet] = useState<Set<string>>(() => new Set());

  const currentSessionId = excludeSessionId?.trim() || '';
  const slotRows = useMemo(() => chunkAdjustTimeSlots(slots, 3), [slots]);

  const dateStripRange = useMemo(() => {
    if (dateItems.length === 0) return { startDate: '', endDate: '' };
    return {
      startDate: dateItems[0]?.key || '',
      endDate: dateItems[dateItems.length - 1]?.key || '',
    };
  }, [dateItems]);

  useEffect(() => {
    if (!visible) {
      setSheetToast('');
      if (sheetToastTimerRef.current) {
        clearTimeout(sheetToastTimerRef.current);
        sheetToastTimerRef.current = null;
      }
      return;
    }
    const nextItems = buildAdjustDateItems(ADJUST_DATE_DAY_COUNT);
    const date = clampAdjustDateToWindow(initialDate, ADJUST_DATE_DAY_COUNT);
    setDateItems(nextItems);
    setSelectedDate(date);
    setSelectedSlotKey('');
    setSlots([]);
    setStripDateHasSet(new Set());
    setSubmitting(false);
    setSheetToast('');
    dateStripScrollXRef.current = 0;
  }, [visible, initialDate]);

  /** 弹层内提示（全局 Toast 会被 RN Modal 盖住） */
  const showSheetToast = useCallback((msg: string, durationSec = 1.5) => {
    const text = String(msg ?? '').trim();
    if (!text) return;
    setSheetToast(text);
    if (sheetToastTimerRef.current) clearTimeout(sheetToastTimerRef.current);
    sheetToastTimerRef.current = setTimeout(() => {
      setSheetToast('');
      sheetToastTimerRef.current = null;
    }, durationSec * 1000);
  }, []);

  const loadStripDateHas = useCallback(async () => {
    const sid = stationId?.trim() || '';
    const coachId = coachUserId?.trim() || '';
    const { startDate, endDate } = dateStripRange;
    if (!visible || !sid || !coachId || !startDate || !endDate) return;
    try {
      const set = await fetchAdjustPrivateDateHasSet({
        stationId: sid,
        coachUserId: coachId,
        startDate,
        endDate,
      });
      setStripDateHasSet(set);
    } catch {
      setStripDateHasSet(new Set());
    }
  }, [visible, stationId, coachUserId, dateStripRange]);

  useEffect(() => {
    void loadStripDateHas();
  }, [loadStripDateHas]);

  const loadSlots = useCallback(
    async (date: string) => {
      const sid = stationId?.trim() || '';
      const coachId = coachUserId?.trim() || '';
      const day = date?.trim() || '';
      if (!sid || !coachId || !day) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      try {
        const list = await fetchAdjustableSessions({
          stationId: sid,
          coachUserId: coachId,
          sessionDate: day,
          currentSessionId,
        });
        setSlots(list);
        const start = initialStartTime?.trim() || '';
        const matchedSelectable = start
          ? list.find(
            item =>
              !item.disabled &&
              (item.startTime === start ||
                item.startTime.slice(0, 5) === start.slice(0, 5)),
          )
          : undefined;
        const currentSlot = currentSessionId
          ? list.find(item => item.sessionId === currentSessionId)
          : undefined;
        setSelectedSlotKey(prev => {
          if (matchedSelectable?.key) return matchedSelectable.key;
          if (prev && list.some(item => item.key === prev && !item.disabled)) {
            return prev;
          }
          // 仅当前已预约时默认不高亮可选；保持当前项可见但不作为提交选中
          if (currentSlot?.disabled && !matchedSelectable) return '';
          return '';
        });
      } catch {
        setSlots([]);
        setSelectedSlotKey('');
      } finally {
        setSlotsLoading(false);
      }
    },
    [stationId, coachUserId, currentSessionId, initialStartTime],
  );

  useEffect(() => {
    if (!visible || !selectedDate) return;
    void loadSlots(selectedDate);
  }, [visible, selectedDate, loadSlots]);

  /** 选中日变化时：仅当高亮项不在可视区才滚动 */
  useEffect(() => {
    if (!visible || !selectedDate) return;
    const index = dateItems.findIndex(item => item.key === selectedDate);
    if (index < 0) return;
    const timer = setTimeout(() => {
      const viewportWidth = dateStripViewportWidthRef.current;
      if (
        viewportWidth > 0 &&
        isAdjustDateStripItemVisible({
          index,
          scrollX: dateStripScrollXRef.current,
          viewportWidth,
        })
      ) {
        return;
      }
      const x = resolveAdjustDateStripScrollX(index);
      dateStripRef.current?.scrollTo({ x, animated: true });
    }, 60);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应选中变化
  }, [visible, selectedDate]);

  const handleSelectSlot = (slot: AdjustTimeSlotItem) => {
    if (slot.disabled) {
      if (slot.isCurrent) {
        showSheetToast('当前已预约时段，请选择其他时间');
      } else if (slot.isFull) {
        showSheetToast('该时段已满员');
      } else if (slot.isDeadline) {
        showSheetToast('该时段已截止报名');
      } else {
        showSheetToast('该时段不可选');
      }
      return;
    }
    setSelectedSlotKey(slot.key);
  };

  const handleConfirm = () => {
    if (submitting) return;
    const oldBookingId = bookingId?.trim() || '';
    if (!oldBookingId) {
      showSheetToast('请先预约后再调整时间');
      return;
    }
    const slot = slots.find(item => item.key === selectedSlotKey);
    if (!slot || slot.disabled) {
      showSheetToast('请选择时段');
      return;
    }
    const newSessionId = slot.sessionId?.trim() || '';
    if (!newSessionId) {
      showSheetToast('请选择时段');
      return;
    }
    if (currentSessionId && newSessionId === currentSessionId) {
      showSheetToast('请选择其他时段');
      return;
    }
    void (async () => {
      setSubmitting(true);
      try {
        const result = await reschedulePrivateBooking({
          oldBookingId,
          newSessionId,
        });
        if (!result.ok) {
          showSheetToast(result.msg || '调整失败');
          return;
        }
        // 成功提示放到弹窗关闭后，避免被 Modal 挡住
        pendingDismissToastRef.current = '调整成功';
        onClose();
        onSuccess?.(newSessionId);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const handleSheetDismissed = useCallback(() => {
    const msg = pendingDismissToastRef.current;
    pendingDismissToastRef.current = null;
    if (msg) Toast.show(msg, 1.5);
  }, []);

  const handleDateStripScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      dateStripScrollXRef.current = contentOffset.x;
      dateStripViewportWidthRef.current = layoutMeasurement.width;
    },
    [],
  );

  return (
    <BottomSheetModal visible={visible} onClose={onClose} onDismissed={handleSheetDismissed}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Flex justify="between" align="center" style={styles.header}>
          <Text style={styles.title}>选择时间</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Image
              style={styles.closeIcon}
              source={require('@/assets/images/schedule/close.png')}
            />
          </TouchableOpacity>
        </Flex>

        <View style={styles.panelBody}>
          <View style={styles.dateStripWrap} pointerEvents="box-none">
            <ScrollView
              ref={dateStripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContent}
              scrollEventThrottle={16}
              onScroll={handleDateStripScroll}
              onLayout={event => {
                dateStripViewportWidthRef.current = event.nativeEvent.layout.width;
              }}
            >
              {dateItems.map(item => {
                const active = item.key === selectedDate;
                const hasSession = stripDateHasSet.has(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    style={[styles.dateCell, active && styles.dateCellActive]}
                    onPress={() => setSelectedDate(item.key)}
                  >
                    <Text style={active ? styles.dateWeekdayActive : styles.dateWeekday}>
                      {item.weekdayLabel}
                    </Text>
                    <Text style={active ? styles.dateDayActive : styles.dateDay}>
                      {item.dayLabel}
                    </Text>
                    <View style={styles.dateDotWrap}>
                      {hasSession ? <View style={styles.dateDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.dashedLine} />

          <View style={styles.slotBody}>
            {slots.length > 0 ? (
              <View style={[styles.slotList, slotsLoading ? styles.slotListDimmed : null]}>
                {slotRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.slotRow}>
                    {row.map(slot => {
                      const active = !slot.disabled && slot.key === selectedSlotKey;
                      const disabled = Boolean(slot.disabled);
                      const isStatusSlot = Boolean(slot.isFull || slot.isDeadline);
                      const statusText = slot.isFull
                        ? '已满员'
                        : slot.isDeadline
                          ? '已截止'
                          : '';
                      const statusIcon = slot.isFull
                        ? require('@/assets/images/curriculum/bm.png')
                        : slot.isDeadline
                          ? require('@/assets/images/curriculum/time.png')
                          : null;
                      return (
                        <TouchableOpacity
                          key={slot.key}
                          activeOpacity={disabled ? 1 : 0.7}
                          disabled={slotsLoading || disabled}
                          style={[
                            styles.slotCell,
                            active && styles.slotCellActive,
                            disabled && !isStatusSlot && styles.slotCellDisabled,
                            isStatusSlot && styles.slotCellStatus,
                          ]}
                          onPress={() => handleSelectSlot(slot)}
                        >
                          <Text
                            style={[
                              active ? styles.slotTextActive : styles.slotText,
                              disabled && !isStatusSlot && styles.slotTextDisabled,
                              isStatusSlot && styles.slotTextStatus,
                            ]}
                          >
                            {slot.label}
                          </Text>
                          {statusText && statusIcon ? (
                            <Flex align="center" style={styles.slotStatusRow}>
                              <Image style={styles.slotStatusIcon} source={statusIcon} />
                              <Text style={styles.slotStatusText}>{statusText}</Text>
                            </Flex>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                    {row.length < 3
                      ? Array.from({ length: 3 - row.length }).map((_, i) => (
                        <View key={`pad-${rowIndex}-${i}`} style={styles.slotCellPlaceholder} />
                      ))
                      : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.slotEmpty}>
                {slotsLoading ? (
                  <ActivityIndicator color={AppTheme.primaryColor} />
                ) : (
                  <Text style={styles.slotEmptyText}>当日暂无可改约时段</Text>
                )}
              </View>
            )}
            {slotsLoading && slots.length > 0 ? (
              <View style={styles.slotLoadingOverlay} pointerEvents="none">
                <ActivityIndicator color={AppTheme.primaryColor} />
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.confirmBtnWrap, submitting && styles.confirmBtnDisabled]}
            disabled={submitting || slotsLoading}
            onPress={handleConfirm}
          >
            <LinearGradient
              colors={['#9BBD8E', '#6D925E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>确定</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {sheetToast ? (
          <View style={styles.toastHost} pointerEvents="none">
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>{sheetToast}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}
