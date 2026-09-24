import React, { useMemo } from 'react';
import { Picker } from '@ant-design/react-native';
import { buildHourlyTimeSlots, type TimeSlotValue } from '../utils/timeSlotHelpers';

type Props = {
  value?: TimeSlotValue | null;
  onChange: (slot: TimeSlotValue | null) => void;
  children: React.ReactElement;
};

const ALL_SLOT_VALUE = '';

/** 全部时段：09:00–21:00 整点滚轮选择器 */
export default function TimeSlotFilterPicker({ value = null, onChange, children }: Props) {
  const slots = useMemo(() => buildHourlyTimeSlots(), []);

  const pickerData = useMemo(
    () => [
      { label: '全部时段', value: ALL_SLOT_VALUE },
      ...slots.map(item => ({
        label: item.label,
        value: item.label,
      })),
    ],
    [slots],
  );

  const pickerValue = [value?.label?.trim() || ALL_SLOT_VALUE];

  return (
    <Picker
      data={pickerData}
      cols={1}
      value={pickerValue}
      onOk={values => {
        const selected = String(values[0] ?? '').trim();
        if (!selected) {
          onChange(null);
          return;
        }
        const matched = slots.find(item => item.label === selected);
        onChange(matched ?? null);
      }}
    >
      {children}
    </Picker>
  );
}
