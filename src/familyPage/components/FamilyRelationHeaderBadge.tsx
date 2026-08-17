import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DictDataItem } from '@/api/dict';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import {
  getApprovedFamilyBindList,
  getChildFamilyDisplayName,
  getFamilyTabKey,
} from '@/src/familyPage/utils/familyProfileHelpers';
import { setSelectedFamilyKey } from '@/store/actions/family';
import type { AppDispatch, RootState } from '@/store/store';
import type { FamilyReadOnlyViewParams } from '@/src/familyPage/utils/familyReadOnlyView';

type Props = {
  label: string;
  /** 放在导航 title 后时去掉右侧外边距 */
  style?: StyleProp<ViewStyle>;
};

/** 家人只读页关系标签；点击可切换家人 */
export default function FamilyRelationHeaderBadge({ label, style }: Props) {
  const text = label.trim() || '家人';
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const familyListRaw = useSelector((s: RootState) => s.family.list);
  const selectedFamilyKey = useSelector((s: RootState) => s.family.selectedKey);
  const [visible, setVisible] = useState(false);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);

  const familyList = useMemo(
    () => getApprovedFamilyBindList(familyListRaw),
    [familyListRaw],
  );

  const relationLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    relationOptions.forEach(item => {
      const value = String(item.dictValue ?? '');
      if (!value) return;
      map[value] = item.dictLabel || value;
    });
    return map;
  }, [relationOptions]);

  const currentPatientUserId = useMemo(() => {
    const params = route.params as FamilyReadOnlyViewParams | undefined;
    return params?.patientUserId != null ? String(params.patientUserId).trim() : '';
  }, [route.params]);

  useEffect(() => {
    void (async () => {
      try {
        const options = await loadRelationTypeOptions();
        setRelationOptions(options);
      } catch {
        setRelationOptions([]);
      }
    })();
  }, []);

  const openPicker = useCallback(() => {
    if (familyList.length === 0) return;
    setVisible(true);
  }, [familyList.length]);

  const closePicker = useCallback(() => {
    setVisible(false);
  }, []);

  const onSelect = useCallback(
    (index: number) => {
      const item = familyList[index];
      if (!item) return;
      const patientUserId =
        item.patientUserId != null ? String(item.patientUserId).trim() : '';
      if (!patientUserId) return;

      const key = getFamilyTabKey(item, index);
      const relationLabel =
        relationLabelMap[String(item.relationType ?? '')] ||
        item.relationType?.trim() ||
        '家人';
      const displayName = getChildFamilyDisplayName(item);

      dispatch(setSelectedFamilyKey(key));
      navigation.setParams({
        readOnly: true,
        patientUserId,
        relationLabel,
        displayName,
      } as never);
      setVisible(false);
    },
    [dispatch, familyList, navigation, relationLabelMap],
  );

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openPicker}
        disabled={familyList.length === 0}
        style={[styles.badge, style]}
      >
        <Text style={styles.text}>{text}</Text>
        <Image
          source={require('@/assets/family/data/icon_relation_caret.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <BottomSheetModal visible={visible} onClose={closePicker}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.sheetTitle}>切换家人</Text>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            {familyList.map((item, index) => {
              const key = getFamilyTabKey(item, index);
              const relationLabel =
                relationLabelMap[String(item.relationType ?? '')] ||
                item.relationType?.trim() ||
                '家人';
              const name = getChildFamilyDisplayName(item);
              const patientUserId =
                item.patientUserId != null ? String(item.patientUserId).trim() : '';
              const selected =
                (currentPatientUserId && patientUserId === currentPatientUserId) ||
                selectedFamilyKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.85}
                  style={[styles.optionRow, selected ? styles.optionRowSelected : null]}
                  onPress={() => onSelect(index)}
                >
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionRelation, selected ? styles.optionTextSelected : null]}>
                      {relationLabel}
                    </Text>
                    <Text style={[styles.optionName, selected ? styles.optionTextSelected : null]}>
                      {name}
                    </Text>
                  </View>
                  {selected ? (
                    <Image
                      source={require('@/assets/images/schedule/wc.png')}
                      style={styles.optionCheck}
                      resizeMode="contain"
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  icon: {
    width: 12,
    height: 12,
    marginLeft: 4,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: 420,
  },
  sheetTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  sheetScroll: {
    maxHeight: 340,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F7F7F9',
    marginBottom: 10,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(109,146,94,0.12)',
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionRelation: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
  },
  optionName: {
    marginTop: 4,
    fontSize: 13,
    color: '#666666',
  },
  optionTextSelected: {
    color: '#6D925E',
  },
  optionCheck: {
    width: 18,
    height: 18,
    marginLeft: 10,
  },
});
