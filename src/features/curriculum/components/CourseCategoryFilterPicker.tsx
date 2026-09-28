import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Picker } from '@ant-design/react-native';
import { DICT_TYPES, getDictDataByType, type DictDataItem } from '@/api/dict';
import { isResourceApiOk } from '@/src/utils/apiHelpers';

export type CourseCategoryFilterValue = {
  /** 字典值 course_category */
  courseCategory: string;
  /** 字典标签 */
  courseCategoryLabel: string;
};

type Props = {
  value?: CourseCategoryFilterValue | null;
  onChange: (category: CourseCategoryFilterValue | null) => void;
  children: React.ReactElement;
};

const ALL_VALUE = '';

function toDictOption(item: DictDataItem) {
  const value = item.dictValue != null ? String(item.dictValue).trim() : '';
  const label = item.dictLabel?.trim() || '';
  if (!value || !label) return null;
  return { label, value };
}

/** 全部课程分类：字典 course_category */
export default function CourseCategoryFilterPicker({
  value = null,
  onChange,
  children,
}: Props) {
  const [items, setItems] = useState<DictDataItem[]>([]);

  const loadDict = useCallback(async () => {
    try {
      const res = await getDictDataByType(DICT_TYPES.courseCategory);
      const dictRes = res as unknown as { code?: number; data?: DictDataItem[] };
      if (!isResourceApiOk(dictRes)) {
        setItems([]);
        return;
      }
      setItems(Array.isArray(dictRes.data) ? dictRes.data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void loadDict();
  }, [loadDict]);

  const pickerData = useMemo(
    () => [
      { label: '全部课程', value: ALL_VALUE },
      ...[...items]
        .sort((a, b) => (a.dictSort ?? 0) - (b.dictSort ?? 0))
        .map(toDictOption)
        .filter((item): item is { label: string; value: string } => item != null),
    ],
    [items],
  );

  const pickerValue = [value?.courseCategory?.trim() || ALL_VALUE];

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
        const matched = pickerData.find(item => item.value === selected);
        onChange({
          courseCategory: selected,
          courseCategoryLabel: matched?.label || selected,
        });
      }}
      onVisibleChange={open => {
        if (open) {
          void loadDict();
        }
      }}
    >
      {children}
    </Picker>
  );
}
