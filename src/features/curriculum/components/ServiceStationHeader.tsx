import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import type { ServiceStationItem } from '@/api/serviceStation';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/curriculum/serviceStation';
import {
  fetchEnabledServiceStations,
  formatServiceStationName,
  loadSelectedServiceStation,
  resolveInitialServiceStation,
  saveSelectedServiceStation,
  toServiceStationId,
  type SelectedServiceStation,
} from '../utils/serviceStationHelpers';

type Props = {
  onStationChange?: (station: SelectedServiceStation | null) => void;
};

/** 课程页左上角服务站切换（含底部选择弹层） */
export default function ServiceStationHeader({ onStationChange }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [stations, setStations] = useState<ServiceStationItem[]>([]);
  const [selected, setSelected] = useState<SelectedServiceStation | null>(null);

  const applyStation = useCallback(
    async (item: ServiceStationItem | null) => {
      if (!item) {
        setSelected(null);
        onStationChange?.(null);
        return;
      }
      const next: SelectedServiceStation = {
        stationId: toServiceStationId(item),
        stationName: formatServiceStationName(item),
      };
      if (!next.stationId) return;
      setSelected(next);
      onStationChange?.(next);
      await saveSelectedServiceStation(next);
    },
    [onStationChange],
  );

  const loadStations = useCallback(async () => {
    setListLoading(true);
    try {
      const [saved, list] = await Promise.all([
        loadSelectedServiceStation(),
        fetchEnabledServiceStations(),
      ]);
      setStations(list);
      const initial = resolveInitialServiceStation(list, saved);
      await applyStation(initial);
    } catch {
      setStations([]);
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  }, [applyStation]);

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  const openPicker = useCallback(() => {
    setVisible(true);
    if (stations.length === 0) {
      void loadStations();
    }
  }, [loadStations, stations.length]);

  const closePicker = useCallback(() => {
    setVisible(false);
  }, []);

  const onSelect = useCallback(
    (item: ServiceStationItem) => {
      void applyStation(item);
      setVisible(false);
    },
    [applyStation],
  );

  const displayName = selected?.stationName || (loading ? '加载中…' : '选择服务站');

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        headerLeft: () => (
          <TouchableOpacity activeOpacity={0.7} onPress={openPicker}>
            <Flex align="center" style={styles.headerLeft}>
              <Image
                style={styles.headerLeftIcon}
                source={require('@/assets/images/curriculum/address.png')}
              />
              <Text style={styles.headerLeftText} numberOfLines={1}>
                {displayName}
              </Text>
              <Image
                style={styles.headerCaret}
                source={require('@/assets/images/curriculum/arrow_down.png')}
              />
            </Flex>
          </TouchableOpacity>
        ),
      });
    }, [displayName, navigation, openPicker]),
  );

  return (
    <BottomSheetModal visible={visible} onClose={closePicker}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Text style={styles.sheetTitle}>切换服务站</Text>
        {listLoading && stations.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={AppTheme.primaryColor} />
          </View>
        ) : stations.length === 0 ? (
          <Text style={styles.emptyText}>暂无可用服务站</Text>
        ) : (
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            {stations.map(item => {
              const stationId = toServiceStationId(item);
              const name = formatServiceStationName(item);
              const selectedRow = selected?.stationId === stationId;
              const address = [
                item.residentialDistrict,
                item.residentialStreet,
                item.residentialAddress,
              ]
                .map(part => part?.trim())
                .filter(Boolean)
                .join('');
              return (
                <TouchableOpacity
                  key={stationId || name}
                  activeOpacity={0.85}
                  style={[styles.optionRow, selectedRow && styles.optionRowSelected]}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.optionTextWrap}>
                    <Text
                      style={[styles.optionName, selectedRow && styles.optionTextSelected]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    {address ? (
                      <Text style={styles.optionAddress} numberOfLines={1}>
                        {address}
                      </Text>
                    ) : null}
                  </View>
                  {selectedRow ? (
                    <Image
                      style={styles.optionCheck}
                      source={require('@/assets/images/schedule/wc.png')}
                      resizeMode="contain"
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </BottomSheetModal>
  );
}
