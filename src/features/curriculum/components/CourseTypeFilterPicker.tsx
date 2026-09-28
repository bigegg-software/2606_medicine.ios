import React, { useMemo } from 'react';
import { Picker } from '@ant-design/react-native';
import type { CourseSessionType } from '@/api/courseSession';

export type CourseTypeFilterValue = CourseSessionType | '';

type Props = {
  value?: CourseTypeFilterValue;
  onChange: (courseType: CourseTypeFilterValue) => void;
  children: React.ReactElement;
};

const ALL_VALUE = '';

const OPTIONS: { label: string; value: CourseTypeFilterValue }[] = [
  { label: '全部课程', value: ALL_VALUE },
  { label: '私教课', value: 'private' },
  { label: '集体课', value: 'group' },
  { label: '线上课', value: 'online' },
];

export function courseTypeFilterLabel(value?: CourseTypeFilterValue) {
  const matched = OPTIONS.find(item => item.value === (value ?? ALL_VALUE));
  return matched?.label || '全部课程';
}

/** 全部课程类型筛选 */
export default function CourseTypeFilterPicker({
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
        const selected = String(values[0] ?? '').trim() as CourseTypeFilterValue;
        onChange(selected || ALL_VALUE);
      }}
    >
      {children}
    </Picker>
  );
}
