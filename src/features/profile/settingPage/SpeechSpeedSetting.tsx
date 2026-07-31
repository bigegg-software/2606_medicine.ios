import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { updateExtrInfo } from '@/api/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import styles from '@/css/profile/settings';
import SpeechSpeedStepSlider from './components/SpeechSpeedStepSlider';
import { parseVoiceSpeed, snapSpeechSpeedRate } from './utils/settingsHelpers';

export default function SpeechSpeedSettingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const userExtr = useSelector((state: RootState) => state.user.userExtr);
  const [speechRate, setSpeechRate] = useState(() => parseVoiceSpeed(userExtr?.voiceSpeed));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSpeechRate(parseVoiceSpeed(userExtr?.voiceSpeed));
  }, [userExtr?.voiceSpeed]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const next = snapSpeechSpeedRate(speechRate);
      const res = await updateExtrInfo({ voiceSpeed: next });
      if (!isResourceApiOk(res as { code?: number })) {
        Toast.show((res as { msg?: string })?.msg || '保存失败，请稍后重试', 1.5);
        return;
      }

      setSpeechRate(next);
      if (userExtr) {
        dispatch({
          type: SET_USER_EXTR,
          payload: {
            ...userExtr,
            voiceSpeed: next,
          },
        });
      }
      Toast.success('已保存', 1.2);
    } catch {
      Toast.show('保存失败，请稍后重试', 1.5);
    } finally {
      setSaving(false);
    }
  }, [dispatch, saving, speechRate, userExtr]);

  return (
    <PageLayout style={styles.container} showHeaderBackground={false} edges={[]}>
      <View style={{ flex: 1 }}>
        <View style={[styles.scroll, { flex: 1 }]}>
          <View style={[styles.sectionBox, styles.speechSpeedSectionBox]}>
            <Text style={styles.speechSpeedTitle}>拖动滑块调节</Text>
            <SpeechSpeedStepSlider value={speechRate} onChange={setSpeechRate} />
          </View>
        </View>

        <View style={styles.fontSizeBottomBar}>
          <TouchableOpacity
            style={[styles.fontSizeConfirmBtn, saving && { opacity: 0.6 }]}
            activeOpacity={0.7}
            disabled={saving}
            onPress={() => {
              void handleSave();
            }}
          >
            <Flex style={{ flex: 1 }} justify="center" align="center">
              <Text style={styles.fontSizeConfirmText}>{saving ? '保存中...' : '保存'}</Text>
            </Flex>
          </TouchableOpacity>
        </View>
      </View>
    </PageLayout>
  );
}
