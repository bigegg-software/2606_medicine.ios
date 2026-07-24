import React, { useEffect, useMemo, useState } from 'react';
import { Picker } from '@ant-design/react-native';
import type { PickerColumnItem, PickerValue } from '@ant-design/react-native/lib/picker-view/PropsType';
import {
  loadChinaRegionData,
  normalizeCityForPicker,
  type RegionSelection,
} from '@/src/utils/regionData';

type RegionCascaderProps = {
  value?: RegionSelection;
  onChange: (next: RegionSelection) => void;
  children: React.ReactElement;
  title?: string;
  disabled?: boolean;
};

export default function RegionCascader({
  value,
  onChange,
  children,
  title = '请选择',
  disabled,
}: RegionCascaderProps) {
  const [data, setData] = useState<PickerColumnItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const options = await loadChinaRegionData();
        if (!cancelled) {
          setData(options);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickerValue = useMemo((): PickerValue[] | undefined => {
    if (!value?.province) {
      return undefined;
    }
    return [
      value.province,
      normalizeCityForPicker(value.province, value.city),
      value.district,
      value.street,
    ];
  }, [value]);

  return (
    <Picker
      data={data}
      cols={4}
      cascade
      value={pickerValue}
      loading={loading}
      disabled={disabled || loading || data.length === 0}
      title={title}
      okText="确定"
      dismissText="取消"
      onOk={vals => {
        onChange({
          province: String(vals[0] ?? ''),
          city: String(vals[1] ?? ''),
          district: String(vals[2] ?? ''),
          street: String(vals[3] ?? ''),
        });
      }}>
      {children}
    </Picker>
  );
}
