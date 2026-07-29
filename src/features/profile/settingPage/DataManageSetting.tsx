import React, { useCallback, useEffect, useState } from 'react';
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
import {
  SYNC_RANGE_DAYS,
  SYNC_RANGE_OPTIONS,
  syncRangeFromDays,
  type SyncRange,
} from './utils/settingsHelpers';

export default function DataManageSettingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncRange, setSyncRange] = useState<SyncRange>('7d');
  const [savingSync, setSavingSync] = useState(false);

  useEffect(() => {
    setAutoSyncEnabled(userExtr?.autoSyncData !== 0);
    setSyncRange(syncRangeFromDays(userExtr?.synWdataDays));
  }, [userExtr?.autoSyncData, userExtr?.synWdataDays]);

  const saveSyncSettings = useCallback(async (payload: {
    autoSyncData?: number;
    synWdataDays?: number;
  }) => {
    setSavingSync(true);
    try {
      const res = await updateExtrInfo(payload);
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '保存同步设置失败', 1.5);
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
      Toast.show('保存同步设置失败', 1.5);
      return false;
    } finally {
      setSavingSync(false);
    }
  }, [dispatch, userExtr]);

  const handleAutoSyncChange = useCallback(async (checked: boolean) => {
    const prev = autoSyncEnabled;
    setAutoSyncEnabled(checked);
    const ok = await saveSyncSettings({ autoSyncData: checked ? 1 : 0 });
    if (!ok) {
      setAutoSyncEnabled(prev);
    }
  }, [autoSyncEnabled, saveSyncSettings]);

  const handleSyncRangeChange = useCallback(async (next: SyncRange) => {
    const prev = syncRange;
    setSyncRange(next);
    const ok = await saveSyncSettings({ synWdataDays: SYNC_RANGE_DAYS[next] });
    if (!ok) {
      setSyncRange(prev);
    }
  }, [saveSyncSettings, syncRange]);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.sectionBox, { paddingVertical: 0 }]}>
          <Flex justify="between" align="center" style={styles.settingRow}>
            <Flex align="center">
              <Image
                tintColor={AppTheme.textPrimary}
                style={styles.imgItem}
                source={require('@/assets/images/user/sx.png')}
              />
              <Text style={styles.itemText}>自动同步数据</Text>
            </Flex>
            <Switch
              style={styles.switch}
              checked={autoSyncEnabled}
              onChange={handleAutoSyncChange}
              color={AppTheme.primaryColor}
              disabled={savingSync}
            />
          </Flex>
          <View style={styles.rowLine} />
          <View style={{ paddingVertical: 16 }}>
            <Flex align="center">
              <Image
                tintColor={AppTheme.textPrimary}
                style={styles.imgItem}
                source={require('@/assets/images/user/time.png')}
              />
              <Text style={styles.itemText}>同步数据时间范围</Text>
            </Flex>
            <Flex justify="between" wrap="wrap" style={[styles.optionRowWrap, { marginTop: 12 }]}>
              {SYNC_RANGE_OPTIONS.map(item => {
                const active = syncRange === item.key;
                const disabled = !autoSyncEnabled || savingSync;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.optionBoxThird,
                      active && styles.optionBoxActive,
                      disabled && { opacity: 0.5 },
                    ]}
                    disabled={disabled}
                    onPress={() => handleSyncRangeChange(item.key)}>
                    <Flex style={{ flex: 1 }} justify="center">
                      <Text style={[styles.optionTextSm, active && styles.optionTextActive]}>
                        {item.label}
                      </Text>
                    </Flex>
                  </TouchableOpacity>
                );
              })}
            </Flex>
          </View>
        </View>
      </ScrollView>
    </PageLayout>
  );
}
