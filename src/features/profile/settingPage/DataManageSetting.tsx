import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Switch, Toast } from '@ant-design/react-native';
import { updateExtrInfo } from '@/api/user';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import styles from '@/css/profile/settings';
import SyncDaysPickerModal from '@/src/features/profile/vitals/components/SyncDaysPickerModal';
import AcceptAiPromptModal from './components/AcceptAiPromptModal';
import {
  SYNC_RANGE_DAYS,
  SYNC_RANGE_OPTIONS,
  syncRangeFromDays,
  type SyncRange,
} from './utils/settingsHelpers';

export default function DataManageSettingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [acceptAiEnabled, setAcceptAiEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncRange, setSyncRange] = useState<SyncRange>('7d');
  const [savingSync, setSavingSync] = useState(false);
  const [syncRangePickerVisible, setSyncRangePickerVisible] = useState(false);
  const [acceptAiModalVisible, setAcceptAiModalVisible] = useState(false);
  const [pendingAcceptAi, setPendingAcceptAi] = useState(true);

  useEffect(() => {
    setAcceptAiEnabled(userExtr?.acceptAi !== 0);
    setAutoSyncEnabled(userExtr?.autoSyncData !== 0);
    setSyncRange(syncRangeFromDays(userExtr?.synWdataDays));
  }, [userExtr?.acceptAi, userExtr?.autoSyncData, userExtr?.synWdataDays]);

  const syncRangeLabel = useMemo(
    () => SYNC_RANGE_OPTIONS.find(item => item.key === syncRange)?.label ?? '最近7天',
    [syncRange],
  );

  const saveExtrSettings = useCallback(async (payload: {
    acceptAi?: number;
    autoSyncData?: number;
    synWdataDays?: number;
  }) => {
    setSavingSync(true);
    try {
      const res = await updateExtrInfo(payload);
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '保存设置失败', 1.5);
        return false;
      }

      if (userExtr) {
        dispatch({
          type: SET_USER_EXTR,
          payload: {
            ...userExtr,
            ...payload,
          },
        });
      }
      return true;
    } catch {
      Toast.show('保存设置失败', 1.5);
      return false;
    } finally {
      setSavingSync(false);
    }
  }, [dispatch, userExtr]);

  const handleAcceptAiChange = useCallback((checked: boolean) => {
    if (savingSync) return;
    if (checked) {
      setPendingAcceptAi(true);
      setAcceptAiModalVisible(true);
      return;
    }
    void (async () => {
      const prev = acceptAiEnabled;
      setAcceptAiEnabled(false);
      const ok = await saveExtrSettings({ acceptAi: 0 });
      if (!ok) {
        setAcceptAiEnabled(prev);
      }
    })();
  }, [acceptAiEnabled, saveExtrSettings, savingSync]);

  const handleAcceptAiCancel = useCallback(() => {
    if (savingSync) return;
    setAcceptAiModalVisible(false);
  }, [savingSync]);

  const handleAcceptAiConfirm = useCallback(async () => {
    const prev = acceptAiEnabled;
    setAcceptAiEnabled(true);
    const ok = await saveExtrSettings({ acceptAi: 1 });
    if (!ok) {
      setAcceptAiEnabled(prev);
      return;
    }
    setAcceptAiModalVisible(false);
  }, [acceptAiEnabled, saveExtrSettings]);

  const handleAutoSyncChange = useCallback(async (checked: boolean) => {
    const prev = autoSyncEnabled;
    setAutoSyncEnabled(checked);
    const ok = await saveExtrSettings({ autoSyncData: checked ? 1 : 0 });
    if (!ok) {
      setAutoSyncEnabled(prev);
    }
  }, [autoSyncEnabled, saveExtrSettings]);

  const handleSyncRangeChange = useCallback(async (next: SyncRange) => {
    const prev = syncRange;
    setSyncRange(next);
    const ok = await saveExtrSettings({ synWdataDays: SYNC_RANGE_DAYS[next] });
    if (!ok) {
      setSyncRange(prev);
    }
    return ok;
  }, [saveExtrSettings, syncRange]);

  const handleOpenSyncRangePicker = useCallback(() => {
    if (!autoSyncEnabled || savingSync) return;
    setSyncRangePickerVisible(true);
  }, [autoSyncEnabled, savingSync]);

  const handleConfirmSyncDays = useCallback(async (days: number) => {
    const ok = await handleSyncRangeChange(syncRangeFromDays(days));
    if (ok) {
      setSyncRangePickerVisible(false);
    }
  }, [handleSyncRangeChange]);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.sectionBox, { paddingVertical: 0 }]}>
          <View style={[styles.settingRow, styles.settingRowMulti]}>
            <View style={styles.settingLeft}>
              <Image
                tintColor={AppTheme.textPrimary}
                style={styles.imgItem}
                source={require('@/assets/images/user/icon_ai.png')}
              />
              <View style={styles.settingLeftText}>
                <Text style={styles.itemText}>AI数据处理</Text>
                <Text style={styles.itemTextSmall}>
                  允许莱益昇适用AI服务分析您的数据并生成个性化信息。
                </Text>
              </View>
            </View>
            <View style={styles.switchWrap}>
              <Switch
                style={styles.switch}
                checked={acceptAiEnabled}
                onChange={handleAcceptAiChange}
                color={AppTheme.primaryColor}
                disabled={savingSync}
              />
            </View>
          </View>
          <View style={styles.rowLine} />
          <Flex justify="between" align="center" style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Image
                tintColor={AppTheme.textPrimary}
                style={styles.imgItem}
                source={require('@/assets/images/user/sx.png')}
              />
              <View style={styles.settingLeftText}>
                <Text style={styles.itemText}>自动同步数据</Text>
                <Text style={styles.itemTextSmall}>打开应用时自动同步</Text>
              </View>
            </View>
            <View style={styles.switchWrap}>
              <Switch
                style={styles.switch}
                checked={autoSyncEnabled}
                onChange={handleAutoSyncChange}
                color={AppTheme.primaryColor}
                disabled={savingSync}
              />
            </View>
          </Flex>
          <View style={styles.rowLine} />
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!autoSyncEnabled || savingSync}
            onPress={handleOpenSyncRangePicker}
            style={!autoSyncEnabled || savingSync ? { opacity: 0.5 } : undefined}>
            <Flex justify="between" align="center" style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Image
                  tintColor={AppTheme.textPrimary}
                  style={styles.imgItem}
                  source={require('@/assets/images/user/time.png')}
                />
                <View style={styles.settingLeftText}>
                  <Text style={styles.itemText}>可穿戴设备数据同步周期</Text>
                  <Text style={styles.itemTextSmall}>{syncRangeLabel}</Text>
                </View>
              </View>
              <Image
                style={{ width: 8, height: 13, flexShrink: 0 }}
                source={require('@/assets/images/message/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
          <View style={styles.rowLine} />
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!autoSyncEnabled || savingSync}
            onPress={() => { }}
            style={!autoSyncEnabled || savingSync ? { opacity: 0.5 } : undefined}>
            <Flex justify="between" align="center" style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Image
                  tintColor={AppTheme.textPrimary}
                  style={styles.imgItem}
                  source={require('@/assets/images/user/icon_delData.png')}
                />
                <Text style={styles.itemText}>删除数据</Text>
              </View>
              <Image
                style={{ width: 8, height: 13, flexShrink: 0 }}
                source={require('@/assets/images/message/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
          <View style={styles.rowLine} />
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!autoSyncEnabled || savingSync}
            onPress={() => { }}
            style={!autoSyncEnabled || savingSync ? { opacity: 0.5 } : undefined}>
            <Flex justify="between" align="center" style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Image
                  tintColor={AppTheme.textPrimary}
                  style={styles.imgItem}
                  source={require('@/assets/images/user/icon_delUser.png')}
                />
                <Text style={styles.itemText}>删除账户</Text>
              </View>
              <Image
                style={{ width: 8, height: 13, flexShrink: 0 }}
                source={require('@/assets/images/message/icon_right.png')}
              />
            </Flex>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AcceptAiPromptModal
        visible={acceptAiModalVisible}
        enabling={pendingAcceptAi}
        saving={savingSync}
        onCancel={handleAcceptAiCancel}
        onConfirm={() => {
          void handleAcceptAiConfirm();
        }}
      />

      <SyncDaysPickerModal
        visible={syncRangePickerVisible}
        initialValue={SYNC_RANGE_DAYS[syncRange]}
        saving={savingSync}
        description="选择后将按该周期同步可穿戴设备数据"
        onCancel={() => setSyncRangePickerVisible(false)}
        onConfirm={days => {
          void handleConfirmSyncDays(days);
        }}
      />
    </PageLayout>
  );
}
