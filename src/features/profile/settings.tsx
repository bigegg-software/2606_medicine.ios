import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Switch, Toast, WhiteSpace, WingBlank } from '@ant-design/react-native';
import { updateExtrInfo } from '@/api/user';
import { FONT_SIZE_OPTIONS } from '@/common/fontSize';
import { useFontSize } from '@/common/FontSizeContext';
import { AppTheme } from '@/common/theme';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { AppDispatch, RootState } from '@/store/store';
import { SET_USER_EXTR } from '@/store/type/user';
import styles from '@/css/profile/settings';

const SPEECH_SPEED_OPTIONS = [
    { key: 'slow', label: '慢' },
    { key: 'normal', label: '正常' },
    { key: 'fast', label: '快' },
] as const;

const SYNC_RANGE_OPTIONS = [
    { key: '7d', label: '最近7天' },
    { key: '1m', label: '最近1个月' },
    { key: '2m', label: '最近2个月' },
    { key: '3m', label: '最近3个月' },
] as const;

type SpeechSpeed = (typeof SPEECH_SPEED_OPTIONS)[number]['key'];
type SyncRange = (typeof SYNC_RANGE_OPTIONS)[number]['key'];

const SYNC_RANGE_DAYS: Record<SyncRange, number> = {
    '7d': 7,
    '1m': 30,
    '2m': 60,
    '3m': 90,
};

function syncRangeFromDays(days?: number): SyncRange {
    if (days == null) return '7d';
    const matched = (Object.entries(SYNC_RANGE_DAYS) as [SyncRange, number][]).find(([, value]) => value === days);
    return matched?.[0] ?? '7d';
}

export default function SettingsPage() {
    const dispatch = useDispatch<AppDispatch>();
    const userExtr = useSelector((state: RootState) => state.user.userExtr);
    const { option, setOption } = useFontSize();
    const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>('normal');
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
    const [syncRange, setSyncRange] = useState<SyncRange>('7d');
    const [savingSync, setSavingSync] = useState(false);
    const [notificationEnabled, setNotificationEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(false);

    useEffect(() => {
        setAutoSyncEnabled(userExtr?.autoSyncData !== 0);
        setSyncRange(syncRangeFromDays(userExtr?.synWdataDays));
    }, [userExtr?.autoSyncData, userExtr?.synWdataDays]);

    const saveSyncSettings = useCallback(async (payload: { autoSyncData?: number; synWdataDays?: number }) => {
        setSavingSync(true);
        try {
            const res = await updateExtrInfo(payload);
            if (!isResourceApiOk(res as { code?: number })) {
                Toast.fail((res as { msg?: string })?.msg || '保存同步设置失败', 1.5);
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
            Toast.fail('保存同步设置失败', 1.5);
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

    const handleSelect = (next: (typeof FONT_SIZE_OPTIONS)[number]['key']) => {
        void setOption(next);
    };

    return (
        <PageLayout style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionTitle}>字体大小</Text>
                <View style={styles.sectionBox}>
                    <Flex justify="between">
                        {FONT_SIZE_OPTIONS.map(item => {
                            const active = option === item.key;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[styles.optionBox, active && styles.optionBoxActive]}
                                    onPress={() => handleSelect(item.key)}>
                                    <Flex style={{ flex: 1 }} justify='center'>
                                        <Text style={[styles.optionText, active && styles.optionTextActive]}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </TouchableOpacity>
                            );
                        })}
                    </Flex>
                    <View style={styles.previewBox}>
                        <Text style={styles.previewLabel}>预览效果：</Text>
                        <Text style={[styles.previewText, { fontSize: 16, lineHeight: 24 }]}>
                            这是一段文字示例，用于展示当前字体大小的效果。
                        </Text>
                    </View>
                </View>
                <Text style={styles.sectionTitle}>语音语速</Text>
                <View style={styles.sectionBox}>
                    <Flex justify="between">
                        {SPEECH_SPEED_OPTIONS.map(item => {
                            const active = speechSpeed === item.key;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[styles.optionBox, active && styles.optionBoxActive]}
                                    onPress={() => setSpeechSpeed(item.key)}>
                                    <Flex style={{ flex: 1 }} justify="center">
                                        <Text style={[styles.optionText, active && styles.optionTextActive]}>
                                            {item.label}
                                        </Text>
                                    </Flex>
                                </TouchableOpacity>
                            );
                        })}
                    </Flex>
                </View>
                <Text style={styles.sectionTitle}>消息通知</Text>
                <View style={styles.sectionBox}>
                    <WingBlank size="sm">
                        <Flex justify="between" align="center">
                            <Flex align="center">
                                <Flex justify="center" align="center" style={styles.imgBox}>
                                    <Image style={styles.imgItem} source={require('@/assets/images/user/tip.png')} />
                                </Flex>
                                <Text style={styles.itemText}>消息通知</Text>
                            </Flex>
                            <Switch
                                style={styles.switch}
                                checked={notificationEnabled}
                                onChange={setNotificationEnabled}
                                color={AppTheme.primaryColor}
                            />
                        </Flex>
                        <WhiteSpace size="md" />
                        <View style={styles.rowLine} />
                        <WhiteSpace size="md" />
                        <Flex justify="between" align="center">
                            <Flex align="center">
                                <Flex justify="center" align="center" style={styles.imgBox}>
                                    <Image style={styles.imgItem} source={require('@/assets/images/user/ys.png')} />
                                </Flex>
                                <Text style={styles.itemText}>声音提醒</Text>
                            </Flex>
                            <Switch
                                style={styles.switch}
                                checked={soundEnabled}
                                onChange={setSoundEnabled}
                                color={AppTheme.primaryColor}
                            />
                        </Flex>
                        <WhiteSpace size="md" />
                        <View style={styles.rowLine} />
                        <WhiteSpace size="md" />
                        <Flex justify="between" align="center">
                            <Flex align="center">
                                <Flex justify="center" align="center" style={styles.imgBox}>
                                    <Image style={styles.imgItem} source={require('@/assets/images/user/phonezd.png')} />
                                </Flex>
                                <Text style={styles.itemText}>震动提醒</Text>
                            </Flex>
                            <Switch
                                style={styles.switch}
                                checked={vibrationEnabled}
                                onChange={setVibrationEnabled}
                                color={AppTheme.primaryColor}
                            />
                        </Flex>
                    </WingBlank>
                </View>

                <Text style={styles.sectionTitle}>数据管理</Text>
                <View style={styles.sectionBox}>
                    <Flex justify="between" align="center">
                        <Flex align="center">
                            <Flex justify="center" align="center" style={styles.imgBox}>
                                <Image style={styles.imgItem} source={require('@/assets/images/user/sx.png')} />
                            </Flex>
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
                    <WhiteSpace size="md" />
                    <View style={styles.rowLine} />
                    <WhiteSpace size="md" />
                    <Text style={styles.rowTitle}>同步数据时间范围</Text>
                    <WhiteSpace size="md" />
                    <Flex justify="between" wrap="wrap" style={styles.optionRowWrap}>
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
                <Text style={styles.sectionTitle}>其他</Text>
                <Flex justify="between" style={styles.sectionBox}>
                    <Flex>
                        <Flex justify='center' align='center' style={styles.imgBox}>
                            <Image style={styles.imgItem} source={require('@/assets/images/user/del1.png')} />
                        </Flex>
                        <Text style={styles.itemText}>清除缓存</Text>
                    </Flex>
                    <TouchableOpacity>
                        <Text style={styles.delText}>清除</Text>
                    </TouchableOpacity>
                </Flex>
            </ScrollView>
        </PageLayout>
    );
}
