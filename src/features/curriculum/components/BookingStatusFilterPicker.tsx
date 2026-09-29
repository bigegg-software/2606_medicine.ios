import React, { useMemo } from 'react';
import { Picker } from '@ant-design/react-native';

/** '' 全部；3 已完成；4 缺席 */
export type BookingStatusFilterValue = '' | '3' | '4';

type Props = {
  value?: BookingStatusFilterValue;
  onChange: (status: BookingStatusFilterValue) => void;
  children: React.ReactElement;
};

const ALL_VALUE = '' as const;

const OPTIONS: { label: string; value: BookingStatusFilterValue }[] = [
  { label: '全部状态', value: ALL_VALUE },
  { label: '已完成', value: '3' },
  { label: '缺席', value: '4' },
];

export function bookingStatusFilterLabel(value?: BookingStatusFilterValue) {
  const matched = OPTIONS.find(item => item.value === (value ?? ALL_VALUE));
  return matched?.label || '全部状态';
}

/** 已完成列表状态筛选 */
export default function BookingStatusFilterPicker({
  value = ALL_VALUE,
  onChange,
  children,
}: Props) {
  const pickerData = useMemo(
    () => OPTIONS.map(item => ({ label: item.label, value: item.value })),
    [],
  );

  return (
    <Picker
      data={pickerData}
      cols={1}
      value={[value || ALL_VALUE]}
      onOk={values => {
        const selected = String(values[0] ?? '').trim() as BookingStatusFilterValue;
        if (selected === '3' || selected === '4') {
          onChange(selected);
          return;
        }
        onChange(ALL_VALUE);
      }}
    >
      {children}
    </Picker>
  );
}
