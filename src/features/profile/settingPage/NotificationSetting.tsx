import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Switch, Toast, WingBlank } from '@ant-design/react-native';
import { updateExtrInfo } from '@/api/user';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  buildNotificationSettingsPayload,
  parseNotificationSettings,
  type NotificationSettings,
} from '@/src/utils/notificationSettingsHelpers';
import {
  applyNotificationSettings,
  registerIosPushToken,
} from '@/src/utils/pushNotifications';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import styles from '@/css/profile/settings';

type SwitchKey = 'notification' | 'sound' | 'vibration';

function settingsEqual(a: NotificationSettings, b: NotificationSettings) {
  return (
    a.enabled === b.enabled
    && a.soundEnabled === b.soundEnabled
    && a.vibrationEnabled === b.vibrationEnabled
  );
}

export default function NotificationSettingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [savingKey, setSavingKey] = useState<SwitchKey | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  /** 本地保存成功后会写回 Redux，跳过一次回写同步，避免其它开关闪烁 */
  const skipNextExtrSyncRef = useRef(false);

  useEffect(() => {
    if (skipNextExtrSyncRef.current) {
      skipNextExtrSyncRef.current = false;
      return;
    }
    const settings = parseNotificationSettings(userExtr);
    setNotificationEnabled(prev => (prev === settings.enabled ? prev : settings.enabled));
    setSoundEnabled(prev => (prev === settings.soundEnabled ? prev : settings.soundEnabled));
    setVibrationEnabled(prev => (
      prev === settings.vibrationEnabled ? prev : settings.vibrationEnabled
    ));
    applyNotificationSettings(settings);
  }, [userExtr?.isSendSysMsg, userExtr?.params]);

  const saveNotificationSettings = useCallback(async (
    next: NotificationSettings,
    key: SwitchKey,
  ) => {
    setSavingKey(key);
    try {
      const payload = buildNotificationSettingsPayload(next, userExtr?.params);
      const res = await updateExtrInfo(payload);
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '保存通知设置失败', 1.5);
        return false;
      }

      applyNotificationSettings(next);
      if (userExtr) {
        skipNextExtrSyncRef.current = true;
        dispatch({
          type: SET_USER_EXTR,
          payload: {
            ...userExtr,
            isSendSysMsg: payload.isSendSysMsg,
            params: payload.params,
          },
        });
      }
      return true;
    } catch {
      Toast.show('保存通知设置失败', 1.5);
      return false;
    } finally {
      setSavingKey(null);
    }
  }, [dispatch, userExtr]);

  const handleNotificationChange = useCallback(async (checked: boolean) => {
    if (savingKey) return;
    const prev: NotificationSettings = {
      enabled: notificationEnabled,
      soundEnabled,
      vibrationEnabled,
    };
    const next: NotificationSettings = {
      enabled: checked,
      soundEnabled: prev.soundEnabled,
      vibrationEnabled: prev.vibrationEnabled,
    };
    if (settingsEqual(prev, next)) return;

    setNotificationEnabled(checked);
    if (checked && Platform.OS === 'ios') {
      await registerIosPushToken().catch(() => undefined);
    }
    const ok = await saveNotificationSettings(next, 'notification');
    if (!ok) {
      setNotificationEnabled(prev.enabled);
    }
  }, [
    notificationEnabled,
    saveNotificationSettings,
    savingKey,
    soundEnabled,
    vibrationEnabled,
  ]);

  const handleSoundChange = useCallback(async (checked: boolean) => {
    if (savingKey) return;
    const prev = soundEnabled;
    if (prev === checked) return;

    setSoundEnabled(checked);
    const ok = await saveNotificationSettings({
      enabled: notificationEnabled,
      soundEnabled: checked,
      vibrationEnabled,
    }, 'sound');
    if (!ok) {
      setSoundEnabled(prev);
    }
  }, [
    notificationEnabled,
    saveNotificationSettings,
    savingKey,
    soundEnabled,
    vibrationEnabled,
  ]);

  const handleVibrationChange = useCallback(async (checked: boolean) => {
    if (savingKey) return;
    const prev = vibrationEnabled;
    if (prev === checked) return;

    setVibrationEnabled(checked);
    const ok = await saveNotificationSettings({
      enabled: notificationEnabled,
      soundEnabled,
      vibrationEnabled: checked,
    }, 'vibration');
    if (!ok) {
      setVibrationEnabled(prev);
    }
  }, [
    notificationEnabled,
    saveNotificationSettings,
    savingKey,
    soundEnabled,
    vibrationEnabled,
  ]);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.sectionBox, { paddingVertical: 0 }]}>
          <Flex justify="between" align="center" style={styles.settingRow}>
            <Flex align="center">
              <Image
                tintColor={AppTheme.textPrimary}
                style={styles.imgItem}
                source={require('@/assets/images/user/tip.png')}
              />
              <Text style={styles.itemText}>消息通知</Text>
            </Flex>
            <Switch
              style={styles.switch}
              checked={notificationEnabled}
              onChange={handleNotificationChange}
              color={AppTheme.primaryColor}
              disabled={savingKey === 'notification'}
            />
          </Flex>
          <View style={styles.rowLine} />
          <Flex justify="between" align="center" style={styles.settingRow}>
            <Flex align="center">
              <Image
                tintColor={AppTheme.textPrimary}
                style={styles.imgItem}
                source={require('@/assets/images/user/zs.png')}
              />
              <Text style={styles.itemText}>声音提醒</Text>
            </Flex>
            <Switch
              style={styles.switch}
              checked={soundEnabled}
              onChange={handleSoundChange}
              color={AppTheme.primaryColor}
              disabled={!notificationEnabled || savingKey === 'sound'}
            />
          </Flex>
          <View style={styles.rowLine} />
          <Flex justify="between" align="center" style={styles.settingRow}>
            <Flex align="center">
              <Image
                tintColor={AppTheme.textPrimary}
                style={styles.imgItem}
                source={require('@/assets/images/user/phonezd.png')}
              />
              <Text style={styles.itemText}>震动提醒</Text>
            </Flex>
            <Switch
              style={styles.switch}
              checked={vibrationEnabled}
              onChange={handleVibrationChange}
              color={AppTheme.primaryColor}
              disabled={!notificationEnabled || savingKey === 'vibration'}
            />
          </Flex>
        </View>
      </ScrollView>
    </PageLayout>
  );
}
