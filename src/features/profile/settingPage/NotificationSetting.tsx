import React, { useCallback, useEffect, useState } from 'react';
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
} from '@/src/utils/notificationSettingsHelpers';
import {
  applyNotificationSettings,
  registerIosPushToken,
} from '@/src/utils/pushNotifications';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import styles from '@/css/profile/settings';

export default function NotificationSettingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [savingNotification, setSavingNotification] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);

  useEffect(() => {
    const settings = parseNotificationSettings(userExtr);
    setNotificationEnabled(settings.enabled);
    setSoundEnabled(settings.soundEnabled);
    setVibrationEnabled(settings.vibrationEnabled);
    applyNotificationSettings(settings);
  }, [userExtr?.isSendSysMsg, userExtr?.params]);

  const saveNotificationSettings = useCallback(async (next: {
    enabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  }) => {
    setSavingNotification(true);
    try {
      const payload = buildNotificationSettingsPayload(next, userExtr?.params);
      const res = await updateExtrInfo(payload);
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '保存通知设置失败', 1.5);
        return false;
      }

      applyNotificationSettings(next);
      if (userExtr) {
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
      setSavingNotification(false);
    }
  }, [dispatch, userExtr]);

  const handleNotificationChange = useCallback(async (checked: boolean) => {
    const prev = {
      enabled: notificationEnabled,
      soundEnabled,
      vibrationEnabled,
    };
    setNotificationEnabled(checked);
    if (checked && Platform.OS === 'ios') {
      await registerIosPushToken().catch(() => undefined);
    }
    const ok = await saveNotificationSettings({
      enabled: checked,
      soundEnabled: prev.soundEnabled,
      vibrationEnabled: prev.vibrationEnabled,
    });
    if (!ok) {
      setNotificationEnabled(prev.enabled);
    }
  }, [notificationEnabled, saveNotificationSettings, soundEnabled, vibrationEnabled]);

  const handleSoundChange = useCallback(async (checked: boolean) => {
    const prev = soundEnabled;
    setSoundEnabled(checked);
    const ok = await saveNotificationSettings({
      enabled: notificationEnabled,
      soundEnabled: checked,
      vibrationEnabled,
    });
    if (!ok) {
      setSoundEnabled(prev);
    }
  }, [notificationEnabled, saveNotificationSettings, soundEnabled, vibrationEnabled]);

  const handleVibrationChange = useCallback(async (checked: boolean) => {
    const prev = vibrationEnabled;
    setVibrationEnabled(checked);
    const ok = await saveNotificationSettings({
      enabled: notificationEnabled,
      soundEnabled,
      vibrationEnabled: checked,
    });
    if (!ok) {
      setVibrationEnabled(prev);
    }
  }, [notificationEnabled, saveNotificationSettings, soundEnabled, vibrationEnabled]);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* <Text style={styles.sectionTitle}>消息通知</Text> */}
        <View style={[styles.sectionBox,{paddingVertical:0}]}>
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
              disabled={savingNotification}
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
              disabled={!notificationEnabled || savingNotification}
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
              disabled={!notificationEnabled || savingNotification}
            />
          </Flex>
        </View>
      </ScrollView>
    </PageLayout>
  );
}
