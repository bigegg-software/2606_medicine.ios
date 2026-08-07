import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Switch, Toast } from '@ant-design/react-native';
import { updateExtrInfo } from '@/api/user';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import type { RootStackParamList } from '@/route/router';
import styles from '@/css/profile/settings';
import SyncDaysPickerModal from '@/src/features/profile/vitals/components/SyncDaysPickerModal';
import AutoSyncPromptModal from '@/src/features/profile/vitals/components/AutoSyncPromptModal';
import AcceptAiPromptModal from './components/AcceptAiPromptModal';
import RevokeAiPromptModal from './components/RevokeAiPromptModal';
import DeleteAccountModal from './components/DeleteAccountModal';
import {
  SYNC_RANGE_DAYS,
  SYNC_RANGE_OPTIONS,
  syncRangeFromDays,
  type SyncRange,
} from './utils/settingsHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DataManageSettingPage() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [acceptAiEnabled, setAcceptAiEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncRange, setSyncRange] = useState<SyncRange>('7d');
  const [savingAcceptAi, setSavingAcceptAi] = useState(false);
  const [savingAutoSync, setSavingAutoSync] = useState(false);
  const [savingSyncRange, setSavingSyncRange] = useState(false);
  const [syncRangePickerVisible, setSyncRangePickerVisible] = useState(false);
  const [acceptAiModalVisible, setAcceptAiModalVisible] = useState(false);
  const [pendingAcceptAi, setPendingAcceptAi] = useState(true);
  const [revokeAiModalVisible, setRevokeAiModalVisible] = useState(false);
  const [autoSyncModalVisible, setAutoSyncModalVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);

  useEffect(() => {
    setAcceptAiEnabled(userExtr?.acceptAi !== 0);
  }, [userExtr?.acceptAi]);

  useEffect(() => {
    setAutoSyncEnabled(userExtr?.autoSyncData !== 0);
  }, [userExtr?.autoSyncData]);

  useEffect(() => {
    setSyncRange(syncRangeFromDays(userExtr?.synWdataDays));
  }, [userExtr?.synWdataDays]);

  const syncRangeLabel = useMemo(
    () => SYNC_RANGE_OPTIONS.find(item => item.key === syncRange)?.label ?? '最近7天',
    [syncRange],
  );

  const saveExtrSettings = useCallback(async (
    payload: {
      acceptAi?: number;
      autoSyncData?: number;
      synWdataDays?: number;
    },
    setSaving: (saving: boolean) => void,
  ) => {
    setSaving(true);
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
      setSaving(false);
    }
  }, [dispatch, userExtr]);

  const handleAcceptAiChange = useCallback((checked: boolean) => {
    if (savingAcceptAi) return;
    if (checked) {
      setPendingAcceptAi(true);
      setAcceptAiModalVisible(true);
      return;
    }
    setRevokeAiModalVisible(true);
  }, [savingAcceptAi]);

  const handleAcceptAiCancel = useCallback(() => {
    if (savingAcceptAi) return;
    setAcceptAiModalVisible(false);
  }, [savingAcceptAi]);

  const handleAcceptAiConfirm = useCallback(async () => {
    const prev = acceptAiEnabled;
    setAcceptAiEnabled(true);
    const ok = await saveExtrSettings({ acceptAi: 1 }, setSavingAcceptAi);
    if (!ok) {
      setAcceptAiEnabled(prev);
      return;
    }
    setAcceptAiModalVisible(false);
  }, [acceptAiEnabled, saveExtrSettings]);

  const handleRevokeAiCancel = useCallback(() => {
    if (savingAcceptAi) return;
    setRevokeAiModalVisible(false);
  }, [savingAcceptAi]);

  const handleRevokeAiConfirm = useCallback(async () => {
    const prev = acceptAiEnabled;
    setAcceptAiEnabled(false);
    const ok = await saveExtrSettings({ acceptAi: 0 }, setSavingAcceptAi);
    if (!ok) {
      setAcceptAiEnabled(prev);
      return;
    }
    setRevokeAiModalVisible(false);
  }, [acceptAiEnabled, saveExtrSettings]);

  const handleAutoSyncChange = useCallback((checked: boolean) => {
    if (savingAutoSync) return;
    if (checked) {
      setAutoSyncModalVisible(true);
      return;
    }
    void (async () => {
      const prev = autoSyncEnabled;
      setAutoSyncEnabled(false);
      const ok = await saveExtrSettings({ autoSyncData: 0 }, setSavingAutoSync);
      if (!ok) {
        setAutoSyncEnabled(prev);
      }
    })();
  }, [autoSyncEnabled, saveExtrSettings, savingAutoSync]);

  const handleAutoSyncCancel = useCallback(() => {
    if (savingAutoSync) return;
    setAutoSyncModalVisible(false);
  }, [savingAutoSync]);

  const handleAutoSyncConfirm = useCallback(async () => {
    const prev = autoSyncEnabled;
    setAutoSyncEnabled(true);
    const ok = await saveExtrSettings({ autoSyncData: 1 }, setSavingAutoSync);
    if (!ok) {
      setAutoSyncEnabled(prev);
      return;
    }
    setAutoSyncModalVisible(false);
  }, [autoSyncEnabled, saveExtrSettings]);

  const handleSyncRangeChange = useCallback(async (next: SyncRange) => {
    if (savingSyncRange) return false;
    const prev = syncRange;
    setSyncRange(next);
    const ok = await saveExtrSettings({ synWdataDays: SYNC_RANGE_DAYS[next] }, setSavingSyncRange);
    if (!ok) {
      setSyncRange(prev);
    }
    return ok;
  }, [saveExtrSettings, savingSyncRange, syncRange]);

  const handleOpenSyncRangePicker = useCallback(() => {
    if (savingSyncRange) return;
    setSyncRangePickerVisible(true);
  }, [savingSyncRange]);

  const handleConfirmSyncDays = useCallback(async (days: number) => {
    const ok = await handleSyncRangeChange(syncRangeFromDays(days));
    if (ok) {
      setSyncRangePickerVisible(false);
    }
  }, [handleSyncRangeChange]);

  const handleOpenDeleteAccount = useCallback(() => {
    setDeleteAccountVisible(true);
  }, []);

  const handleCancelDeleteAccount = useCallback(() => {
    setDeleteAccountVisible(false);
  }, []);

  const handleConfirmDeleteAccount = useCallback(() => {
    setDeleteAccountVisible(false);
    navigation.navigate('DeleteAccountVerifyPage');
  }, [navigation]);

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
                  允许莱益晟适用AI服务分析您的数据并生成个性化信息。
                </Text>
              </View>
            </View>
            <View style={styles.switchWrap}>
              <Switch
                style={styles.switch}
                checked={acceptAiEnabled}
                onChange={handleAcceptAiChange}
                color={AppTheme.primaryColor}
                disabled={savingAcceptAi}
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
                disabled={savingAutoSync}
              />
            </View>
          </Flex>
          <View style={styles.rowLine} />
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={savingSyncRange}
            onPress={handleOpenSyncRangePicker}
            style={savingSyncRange ? { opacity: 0.5 } : undefined}>
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
          {/* <TouchableOpacity
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
          </TouchableOpacity> */}
          {/* <View style={styles.rowLine} /> */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenDeleteAccount}>
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
        saving={savingAcceptAi}
        onCancel={handleAcceptAiCancel}
        onConfirm={() => {
          void handleAcceptAiConfirm();
        }}
      />

      <RevokeAiPromptModal
        visible={revokeAiModalVisible}
        saving={savingAcceptAi}
        onCancel={handleRevokeAiCancel}
        onConfirm={() => {
          void handleRevokeAiConfirm();
        }}
      />

      <AutoSyncPromptModal
        visible={autoSyncModalVisible}
        saving={savingAutoSync}
        onClose={handleAutoSyncCancel}
        onCancel={handleAutoSyncCancel}
        onConfirm={() => {
          void handleAutoSyncConfirm();
        }}
      />

      <DeleteAccountModal
        visible={deleteAccountVisible}
        onCancel={handleCancelDeleteAccount}
        onConfirm={handleConfirmDeleteAccount}
      />

      <SyncDaysPickerModal
        visible={syncRangePickerVisible}
        initialValue={SYNC_RANGE_DAYS[syncRange]}
        saving={savingSyncRange}
        description="选择后将按该周期同步可穿戴设备数据"
        onCancel={() => setSyncRangePickerVisible(false)}
        onConfirm={days => {
          void handleConfirmSyncDays(days);
        }}
      />
    </PageLayout>
  );
}
