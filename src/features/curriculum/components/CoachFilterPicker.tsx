import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Toast, Picker } from '@ant-design/react-native';
import {
  getCourseSessionCoachList,
  type CourseSessionCoachItem,
  type CourseSessionType,
} from '@/api/courseSession';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export type CoachFilterValue = {
  coachUserId: string;
  coachRealName: string;
};

type Props = {
  stationId?: string;
  courseType?: CourseSessionType;
  value?: CoachFilterValue | null;
  onChange: (coach: CoachFilterValue | null) => void;
  children: React.ReactElement;
};

const ALL_COACH_VALUE = '';

function formatCoachName(item: CourseSessionCoachItem) {
  return item.coachRealName?.trim() || '未命名教练';
}

function toCoachUserId(item: CourseSessionCoachItem) {
  return item.coachUserId != null ? String(item.coachUserId).trim() : '';
}

/** 全部老师：Ant Design 滚轮选择器 */
export default function CoachFilterPicker({
  stationId,
  courseType = 'private',
  value = null,
  onChange,
  children,
}: Props) {
  const [coaches, setCoaches] = useState<CourseSessionCoachItem[]>([]);

  const loadCoaches = useCallback(async () => {
    const id = stationId != null ? String(stationId).trim() : '';
    if (!id) {
      setCoaches([]);
      return;
    }
    try {
      const res = await getCourseSessionCoachList({
        stationId: id,
        courseType,
      });
      if (!isResourceApiOk(res)) {
        setCoaches([]);
        return;
      }
      const list = apiResourceData(res);
      setCoaches(Array.isArray(list) ? list : []);
    } catch {
      setCoaches([]);
    }
  }, [courseType, stationId]);

  useEffect(() => {
    void loadCoaches();
  }, [loadCoaches]);

  const pickerData = useMemo(
    () => [
      { label: '全部老师', value: ALL_COACH_VALUE },
      ...coaches
        .map(item => {
          const coachUserId = toCoachUserId(item);
          if (!coachUserId) return null;
          return {
            label: formatCoachName(item),
            value: coachUserId,
          };
        })
        .filter((item): item is { label: string; value: string } => item != null),
    ],
    [coaches],
  );

  const pickerValue = [value?.coachUserId?.trim() || ALL_COACH_VALUE];
  const hasStation = Boolean(String(stationId ?? '').trim());

  if (!hasStation) {
    return React.cloneElement(children, {
      onPress: () => Toast.show('请先选择服务站', 1.5),
    });
  }

  return (
    <Picker
      data={pickerData}
      cols={1}
      value={pickerValue}
      onOk={values => {
        const coachUserId = String(values[0] ?? '').trim();
        if (!coachUserId) {
          onChange(null);
          return;
        }
        const matched = pickerData.find(item => item.value === coachUserId);
        onChange({
          coachUserId,
          coachRealName: matched?.label || '未命名教练',
        });
      }}
      onVisibleChange={open => {
        if (open) {
          void loadCoaches();
        }
      }}
    >
      {children}
    </Picker>
  );
}
