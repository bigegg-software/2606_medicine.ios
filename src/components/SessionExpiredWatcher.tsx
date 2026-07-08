import React, { useCallback } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppTheme } from '@/common/theme';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_LOGIN_EXPIRED } from '@/store/type/login';
import { navigationRef } from '@/utils/navigationRef';
import { resetUnauthorizedHandling } from '@/utils/axios';

const SESSION_EXPIRED_MESSAGE = '账号已退出登录';

export default function SessionExpiredWatcher() {
  const dispatch = useDispatch<AppDispatch>();
  const loginExpired = useSelector((state: RootState) => state.login.loginExpired);

  const handleDismiss = useCallback(() => {
    dispatch({ type: SET_LOGIN_EXPIRED, payload: false });
    resetUnauthorizedHandling();

    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [dispatch]);

  return (
    <Modal
      visible={loginExpired}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}>
      <TouchableOpacity
        activeOpacity={1}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        }}
        onPress={handleDismiss}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleDismiss}
          style={{
            width: '100%',
            maxWidth: 320,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
          }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: AppTheme.textPrimary,
              textAlign: 'center',
            }}>
            提示
          </Text>
          <Text
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: 22,
              color: AppTheme.textSecondary,
              textAlign: 'center',
            }}>
            {SESSION_EXPIRED_MESSAGE}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDismiss}
            style={{
              marginTop: 20,
              height: 44,
              borderRadius: 8,
              backgroundColor: AppTheme.primaryColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: AppTheme.onPrimaryColor }}>
              确定
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
