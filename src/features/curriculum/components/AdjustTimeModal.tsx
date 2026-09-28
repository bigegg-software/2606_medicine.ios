import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import DietDatePickerModal from '@/src/features/nutrition/components/DietDatePickerModal';
import styles from '@/css/curriculum/adjustTime';
import {
  buildAdjustDateItems,
  buildAdjustTimeSlots,
  chunkAdjustTimeSlots,
  ensureAdjustDateInStrip,
} from '../utils/adjustTimeHelpers';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 初始选中日期 yyyy-MM-dd */
  initialDate?: string;
  /** 初始时段起 HH:mm */
  initialStartTime?: string;
};

/** 私教调整时间：日期横滑 + 时段网格 */
export default function AdjustTimeModal({
  visible,
  onClose,
  initialDate,
  initialStartTime,
}: Props) {
  const insets = useSafeAreaInsets();
  const [dateItems, setDateItems] = useState(() => buildAdjustDateItems());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotKey, setSelectedSlotKey] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);

  const slots = useMemo(() => buildAdjustTimeSlots(), []);
  const slotRows = useMemo(() => chunkAdjustTimeSlots(slots, 3), [slots]);

  useEffect(() => {
    if (!visible) return;
    const base = buildAdjustDateItems();
    const date =
      initialDate?.trim() ||
      base[0]?.key ||
      '';
    const nextItems = ensureAdjustDateInStrip(base, date);
    setDateItems(nextItems);
    setSelectedDate(date);
    const start = initialStartTime?.trim() || '';
    const matched = start
      ? slots.find(item => item.startTime === start || item.startTime.slice(0, 5) === start.slice(0, 5))
      : undefined;
    setSelectedSlotKey(matched?.key || '');
    setCalendarVisible(false);
  }, [visible, initialDate, initialStartTime, slots]);

  const handlePickCalendarDate = (date: string) => {
    const key = date?.trim() || '';
    if (!key) return;
    setDateItems(prev => ensureAdjustDateInStrip(prev, key));
    setSelectedDate(key);
    setCalendarVisible(false);
  };

  const handleSelectSlot = (slotKey: string) => {
    setSelectedSlotKey(slotKey);
  };

  const handleConfirm = () => {
    // TODO: 对接调整时间接口
  };

  return (
    <>
      <BottomSheetModal visible={visible} onClose={onClose}>
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

          <View style={styles.dateStripWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContent}
            >
              {dateItems.map(item => {
                const active = item.key === selectedDate;
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.allDateFloat}
              onPress={() => setCalendarVisible(true)}
            >
              <Text style={styles.allDateLabel}>全部</Text>
              <Image
                style={styles.allDateIcon}
                source={require('@/assets/images/nutrition/time.png')}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dashedLine} />

          <View style={styles.slotList}>
            {slotRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.slotRow}>
                {row.map(slot => {
                  const active = slot.key === selectedSlotKey;
                  return (
                    <TouchableOpacity
                      key={slot.key}
                      activeOpacity={0.7}
                      style={[styles.slotCell, active && styles.slotCellActive]}
                      onPress={() => handleSelectSlot(slot.key)}
                    >
                      <Text style={active ? styles.slotTextActive : styles.slotText}>
                        {slot.label}
                      </Text>
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

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.confirmBtn}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmBtnText}>确定</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      <DietDatePickerModal
        visible={calendarVisible}
        selectedDate={selectedDate}
        onClose={() => setCalendarVisible(false)}
        onSelect={handlePickCalendarDate}
      />
    </>
  );
}
