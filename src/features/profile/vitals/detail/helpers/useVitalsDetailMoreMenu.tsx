import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import type { RootStackParamList } from '@/route/router';
import type { AppDispatch, RootState } from '@/store/store';
import GoalTargetModal from '../../components/GoalTargetModal';
import VitalInfoModal from '@/src/features/home/components/VitalInfoModal';
import { getVitalInfoContent } from '@/src/features/home/utils/vitalInfoContent';
import VitalsDetailMoreSheet from '../components/VitalsDetailMoreSheet';
import styles from '@/css/vitals/bloodPage';
import {
  getGoalSaveErrorMessage,
  getGoalSaveSuccessMessage,
  getGoalTargetModalConfig,
  resolveGoalTargetValue,
  saveVitalsGoalTarget,
  type VitalsDetailMenuConfig,
} from './vitalsGoalTargets';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Options = VitalsDetailMenuConfig & {
  onGoalSaved?: (target: number) => void;
  /** 数据说明 key，默认使用 allRecordsType */
  infoKey?: string;
};

export function useVitalsDetailMoreMenu({
  allRecordsType,
  goalKind,
  goalDisabled = false,
  onGoalSaved,
  infoKey,
}: Options) {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [vitalInfoKey, setVitalInfoKey] = useState<string | null>(null);
  const pendingGoalOpenRef = useRef(false);
  const pendingInfoOpenRef = useRef(false);
  const [goalTarget, setGoalTarget] = useState(() =>
    goalKind ? resolveGoalTargetValue(goalKind, userExtr) : 0,
  );

  const resolvedInfoKey = infoKey ?? allRecordsType;
  const hasDataInfo = Boolean(resolvedInfoKey && getVitalInfoContent(resolvedInfoKey));

  useEffect(() => {
    if (!goalKind) return;
    setGoalTarget(resolveGoalTargetValue(goalKind, userExtr));
  }, [goalKind, userExtr?.sleepGoals, userExtr?.stepGoals, userExtr?.energyGoals, userExtr?.weightGoals]);

  const openMenu = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleAllRecords = useCallback(() => {
    closeMenu();
    if (allRecordsType) {
      navigation.navigate('AllDataPage', { type: allRecordsType });
    }
  }, [allRecordsType, closeMenu, navigation]);

  const handleSetGoal = useCallback(() => {
    if (!goalKind || goalDisabled) return;
    setGoalTarget(resolveGoalTargetValue(goalKind, userExtr));
    pendingGoalOpenRef.current = true;
    closeMenu();
  }, [closeMenu, goalDisabled, goalKind, userExtr]);

  const handleDataInfo = useCallback(() => {
    if (!hasDataInfo || !resolvedInfoKey) return;
    pendingInfoOpenRef.current = true;
    closeMenu();
  }, [closeMenu, hasDataInfo, resolvedInfoKey]);

  const handleSheetDismissed = useCallback(() => {
    if (pendingGoalOpenRef.current) {
      pendingGoalOpenRef.current = false;
      setGoalVisible(true);
      return;
    }
    if (pendingInfoOpenRef.current) {
      pendingInfoOpenRef.current = false;
      setVitalInfoKey(resolvedInfoKey ?? null);
    }
  }, [resolvedInfoKey]);

  const handleSaveGoal = useCallback(async (target: number) => {
    if (!goalKind || goalDisabled) return;

    setSavingGoal(true);
    try {
      const result = await saveVitalsGoalTarget(goalKind, target, userExtr, dispatch);
      if (!result.ok) {
        Alert.alert('失败', result.message);
        return;
      }

      setGoalTarget(target);
      Alert.alert('成功', getGoalSaveSuccessMessage(goalKind));
      setGoalVisible(false);
      onGoalSaved?.(target);
    } catch {
      Alert.alert('错误', getGoalSaveErrorMessage(goalKind));
    } finally {
      setSavingGoal(false);
    }
  }, [dispatch, goalDisabled, goalKind, onGoalSaved, userExtr]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openMenu} activeOpacity={0.8}>
          <Image source={require('@/assets/images/vitals/more.png')} style={styles.uploadIcon} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, openMenu]);

  const sheetActions = useMemo(() => {
    const actions = [];
    if (goalKind) {
      actions.push({
        key: 'set-goal',
        label: '设置目标',
        onPress: handleSetGoal,
        disabled: goalDisabled,
      });
    }
    if (hasDataInfo) {
      actions.push({
        key: 'data-info',
        label: '数据说明',
        onPress: handleDataInfo,
      });
    }
    if (allRecordsType) {
      actions.push({
        key: 'all-records',
        label: '全部记录',
        onPress: handleAllRecords,
      });
    }
    return actions;
  }, [
    allRecordsType,
    goalDisabled,
    goalKind,
    handleAllRecords,
    handleDataInfo,
    handleSetGoal,
    hasDataInfo,
  ]);

  const goalModalConfig = goalKind ? getGoalTargetModalConfig(goalKind) : null;

  const menuModals = (
    <>
      <VitalsDetailMoreSheet
        visible={sheetVisible}
        actions={sheetActions}
        onClose={closeMenu}
        onDismissed={handleSheetDismissed}
      />
      {goalKind && goalModalConfig ? (
        <GoalTargetModal
          visible={goalVisible}
          title={goalModalConfig.title}
          label={goalModalConfig.label}
          unit={goalModalConfig.unit}
          initialValue={goalTarget}
          saving={savingGoal}
          min={goalModalConfig.min}
          max={goalModalConfig.max}
          step={goalModalConfig.step}
          patternUnitSize={goalModalConfig.patternUnitSize}
          formatDisplay={goalModalConfig.formatDisplay}
          onCancel={() => setGoalVisible(false)}
          onConfirm={handleSaveGoal}
        />
      ) : null}
      <VitalInfoModal vitalKey={vitalInfoKey} onClose={() => setVitalInfoKey(null)} />
    </>
  );

  return { menuModals };
}
