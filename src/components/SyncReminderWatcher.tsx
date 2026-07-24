import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { Toast } from '@ant-design/react-native';
import { useSelector } from 'react-redux';
import SyncReminderModal from '@/src/components/SyncReminderModal';
import type { RootState } from '@/store/store';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import updateHealthKit from '@/utils/healthKit';
import {
  markSyncReminderShown,
  recordAppBackgroundTime,
  shouldShowSyncReminder,
} from '@/utils/syncReminder';

export default function SyncReminderWatcher() {
  const isLogin = useSelector((state: RootState) => state.login.isLogin);
  const userId = useSelector((state: RootState) => state.user.info?.userId ?? state.user.userExtr?.userId);
  const uploading = useSelector((state: RootState) => state.upload.uploading);

  const [visible, setVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const todayRef = useRef('');
  const checkingRef = useRef(false);
  const modalShowingRef = useRef(false);
  const isLoginRef = useRef(isLogin);
  const userIdRef = useRef(userId);
  const uploadingRef = useRef(uploading);

  useEffect(() => {
    isLoginRef.current = isLogin;
    userIdRef.current = userId;
    uploadingRef.current = uploading;
  }, [isLogin, uploading, userId]);

  const triggerSyncReminderCheck = useCallback(async () => {
    if (checkingRef.current || modalShowingRef.current) return;
    if (!isLoginRef.current || userIdRef.current == null || uploadingRef.current) return;
    if (Platform.OS !== 'ios') return;

    checkingRef.current = true;
    try {
      const { shouldShow, today } = await shouldShowSyncReminder();
      if (!shouldShow) return;

      todayRef.current = today;
      modalShowingRef.current = true;
      setVisible(true);
    } catch {
      /* silent */
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let lastAppState: AppStateStatus | null = null;

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'background' || nextState === 'inactive') {
        void recordAppBackgroundTime();
      }

      if (nextState === 'active' && lastAppState != null && lastAppState !== 'active') {
        setTimeout(() => {
          void triggerSyncReminderCheck();
        }, 300);
      }

      lastAppState = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [triggerSyncReminderCheck]);

  const handleLater = useCallback(async () => {
    if (todayRef.current) {
      await markSyncReminderShown(todayRef.current);
    }
    modalShowingRef.current = false;
    setVisible(false);
  }, []);

  const handleSync = useCallback(async () => {
    if (syncing || uploadingRef.current) return;

    const today = todayRef.current;
    if (today) {
      await markSyncReminderShown(today);
    }
    modalShowingRef.current = false;
    setVisible(false);
    setSyncing(true);

    try {
      const res = (await updateHealthKit(null)) as { code?: number; msg?: string } | undefined;
      if (res && 'code' in res && res.code != null && !isResourceApiOk(res) && res.code !== 0) {
        Toast.show(res.msg ?? '同步失败，请稍后重试', 1.5);
        return;
      }
      Toast.success('同步成功，签到完成', 1.5);
    } catch {
      Toast.show('健康数据同步失败，请稍后重试', 1.5);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  return (
    <SyncReminderModal
      visible={visible}
      syncing={syncing}
      onLater={() => void handleLater()}
      onSync={() => void handleSync()}
    />
  );
}
