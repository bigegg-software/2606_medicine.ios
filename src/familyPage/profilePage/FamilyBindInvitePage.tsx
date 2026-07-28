import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/family/familyBindInvite';
import type { RootStackParamList } from '@/route/router';
import type { DictDataItem } from '@/api/dict';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import {
  FAMILY_PERMISSION_OPTIONS,
  type FamilyPermissionKey,
} from '@/src/features/profile/myFamily/utils/myFamilyAddHelpers';
import { AppTheme } from '@/common/theme';
import {
  acceptFamilyBindInvite,
  rejectFamilyBindInvite,
} from '@/api/familyBind';
import { isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import {
  buildFamilyBindInviteView,
  loadFamilyBindInviteById,
  loadFamilyBindInviteByMessageId,
  type FamilyBindInviteView,
} from './utils/familyBindInviteHelpers';

const ICON_SELECTED = '#6D925E';
const ICON_UNSELECTED = '#333333';

type Route = RouteProp<RootStackParamList, 'FamilyBindInvitePage'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyBindInvitePage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const messageId = route.params.messageId;
  const bindId = route.params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<FamilyBindInviteView | null>(null);
  const [relationOptions, setRelationOptions] = useState<DictDataItem[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const options = await loadRelationTypeOptions();
        setRelationOptions(options);
      } catch {
        setRelationOptions([]);
      }
    })();
  }, []);

  const relationLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    relationOptions.forEach(item => {
      const value = String(item.dictValue ?? '');
      if (!value) return;
      map[value] = item.dictLabel || value;
    });
    return map;
  }, [relationOptions]);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const item = messageId
        ? await loadFamilyBindInviteByMessageId(messageId)
        : bindId
          ? await loadFamilyBindInviteById(bindId)
          : null;
      setDetail(item ? buildFamilyBindInviteView(item) : null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [bindId, messageId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const handleReject = useCallback(() => {
    if (!messageId) {
      // 按绑定 id 拒绝接口暂未提供
      return;
    }
    Alert.alert('拒绝邀请', '确认拒绝该家人邀请吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认拒绝',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (submitting) return;
            setSubmitting(true);
            try {
              const res = await rejectFamilyBindInvite(messageId);
              if (!isResourceApiOk(res as ApiResult)) {
                const r = res as ApiResult;
                Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
                return;
              }
              Alert.alert('成功', '已拒绝邀请', [
                { text: '确定', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('错误', '网络错误，请稍后重试');
            } finally {
              setSubmitting(false);
            }
          })();
        },
      },
    ]);
  }, [messageId, navigation, submitting]);

  const handleAccept = useCallback(() => {
    if (!messageId) {
      // 按绑定 id 接受接口暂未提供
      return;
    }
    Alert.alert('接受邀请', '确认接受该家人邀请吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认接受',
        onPress: () => {
          void (async () => {
            if (submitting) return;
            setSubmitting(true);
            try {
              const res = await acceptFamilyBindInvite(messageId);
              if (!isResourceApiOk(res as ApiResult)) {
                const r = res as ApiResult;
                Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
                return;
              }
              Alert.alert('成功', '已接受邀请', [
                { text: '确定', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('错误', '网络错误，请稍后重试');
            } finally {
              setSubmitting(false);
            }
          })();
        },
      },
    ]);
  }, [messageId, navigation, submitting]);

  const relationLabel =
    (detail && (relationLabelMap[detail.relationType] || detail.relationType)) || '--';
  const selectedPermissions: FamilyPermissionKey[] = detail?.permissions ?? [];
  const canRespondByMessage = Boolean(messageId);
  const showActionButtons = detail?.bindStatus !== 1;

  if (loading) {
    return (
      <PageLayout style={styles.container} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  if (!detail) {
    return (
      <PageLayout style={styles.container} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={styles.formValue}>未找到该邀请信息</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.rowBox}>
          <Flex style={[styles.formRow, styles.formRowFirst]} align="center" justify="between">
            <Text style={styles.formLabel}>姓名</Text>
            <Text style={styles.formReadonlyValue}>{detail.name || '--'}</Text>
          </Flex>

          <Flex style={styles.formRow} align="center" justify="between">
            <Text style={styles.formLabel}>关系</Text>
            <Text style={styles.formReadonlyValue}>{relationLabel}</Text>
          </Flex>

          <Flex style={[styles.formRow, styles.formRowLast]} align="center" justify="between">
            <Text style={styles.formLabel}>手机号</Text>
            <Text style={styles.formReadonlyValue}>{detail.phone}</Text>
          </Flex>
        </View>

        <View style={[styles.rowBox, { marginTop: 12 }]}>
          <Text style={styles.rowTitle}>授权权限</Text>
          <Text style={styles.rowTitleDesc}>以下为对方授予的查看权限（仅查看）</Text>

          <View style={styles.qxBox}>
            {FAMILY_PERMISSION_OPTIONS.map(item => {
              const active = selectedPermissions.includes(item.key);
              const iconColor = active ? ICON_SELECTED : ICON_UNSELECTED;
              return (
                <View
                  key={item.key}
                  style={[styles.qxItem, active && styles.qxItemActive]}
                >
                  <Flex style={styles.qxItemLeft} align="center">
                    <Image
                      style={styles.qxItemIcon}
                      source={item.icon}
                      tintColor={iconColor}
                    />
                    <Text
                      style={[styles.qxItemTitle, active && styles.qxItemTitleActive]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  </Flex>
                  <Image
                    style={styles.qxCheckIcon}
                    source={
                      active
                        ? require('@/assets/images/schedule/wc.png')
                        : require('@/assets/images/schedule/select.png')
                    }
                  />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {showActionButtons ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarRow}>
            <TouchableOpacity
              style={[styles.bottomBarButton, styles.bottomBarButtonReject]}
              activeOpacity={0.7}
              disabled={submitting || !canRespondByMessage}
              onPress={handleReject}
            >
              {submitting ? (
                <ActivityIndicator color="#FB4550" />
              ) : (
                <Text style={styles.bottomBarButtonTextReject}>拒绝</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bottomBarButton, styles.bottomBarButtonAccept]}
              activeOpacity={0.7}
              disabled={submitting || !canRespondByMessage}
              onPress={handleAccept}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.bottomBarButtonTextAccept}>接受</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </PageLayout>
  );
}
