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
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import styles from '@/css/family/familyBindInvite';
import type { RootStackParamList } from '@/route/router';
import type { DictDataItem } from '@/api/dict';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import {
  FAMILY_PERMISSION_OPTIONS,
  toggleFamilyPermission,
  type FamilyPermissionKey,
} from '@/src/features/profile/myFamily/utils/myFamilyAddHelpers';
import { normalizeIdentityPerspective } from '@/src/features/auth/utils/identityHelpers';
import { AppTheme } from '@/common/theme';
import type { RootState } from '@/store/store';
import {
  FAMILY_BIND_INVITE_INVALID_TOAST,
  buildFamilyBindInviteView,
  cancelElderFamilyBindInvite,
  loadLiveFamilyBindInvite,
  resolveFamilyBindInviteActionState,
  respondToFamilyBindInvite,
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
  const identityPerspective = useSelector(
    (state: RootState) => state.user.systemUser?.identityPerspective,
  );
  const isElder = normalizeIdentityPerspective(identityPerspective) !== 'child';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<FamilyBindInviteView | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<FamilyPermissionKey[]>([]);
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
      const item = await loadLiveFamilyBindInvite({
        messageId,
        bindId,
        isElder,
      });
      const view = item ? buildFamilyBindInviteView(item, { isElder }) : null;
      setDetail(view);
      setSelectedPermissions(view?.permissions ?? []);
      if (!item && messageId) {
        Toast.show(FAMILY_BIND_INVITE_INVALID_TOAST);
        navigation.goBack();
      }
    } catch {
      setDetail(null);
      setSelectedPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [bindId, isElder, messageId, navigation]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const resolveRespondBindId = useCallback(() => {
    return detail?.id || bindId || '';
  }, [bindId, detail?.id]);

  const handleTogglePermission = useCallback((key: FamilyPermissionKey) => {
    if (!isElder) return;
    setSelectedPermissions(prev => toggleFamilyPermission(prev, key));
  }, [isElder]);

  const submitRespond = useCallback(
    async (action: 'accept' | 'reject') => {
      if (submitting) return;
      const respondBindId = resolveRespondBindId();
      if (!messageId && !respondBindId) {
        Alert.alert('提示', '缺少邀请信息，无法操作');
        return;
      }

      setSubmitting(true);
      try {
        const result = await respondToFamilyBindInvite({
          isElder,
          action,
          messageId,
          bindId: respondBindId,
          authPermissions: selectedPermissions,
        });
        if (!result.ok) {
          Alert.alert('失败', result.msg ?? '请稍后重试');
          return;
        }
        Alert.alert('成功', action === 'accept' ? (isElder ? '已接受申请' : '已接受邀请') : (isElder ? '已拒绝申请' : '已拒绝邀请'), [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      } catch {
        Alert.alert('错误', '网络错误，请稍后重试');
      } finally {
        setSubmitting(false);
      }
    },
    [isElder, messageId, navigation, resolveRespondBindId, selectedPermissions, submitting],
  );

  const handleReject = useCallback(() => {
    Alert.alert(
      isElder ? '拒绝申请' : '拒绝邀请',
      isElder ? '确认拒绝该家属的绑定申请吗？' : '确认拒绝该家人邀请吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认拒绝',
          style: 'destructive',
          onPress: () => {
            void submitRespond('reject');
          },
        },
      ],
    );
  }, [isElder, submitRespond]);

  const handleAccept = useCallback(() => {
    Alert.alert(
      isElder ? '接受申请' : '接受邀请',
      isElder ? '确认接受该家属的绑定申请并授予所选查看权限吗？' : '确认接受该家人邀请吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认接受',
          onPress: () => {
            void submitRespond('accept');
          },
        },
      ],
    );
  }, [isElder, submitRespond]);

  const handleCancelInvite = useCallback(() => {
    const respondBindId = resolveRespondBindId();
    if (!respondBindId) {
      Alert.alert('提示', '缺少邀请信息，无法取消');
      return;
    }
    Alert.alert('取消邀请', '取消后可重新邀请，确认取消该邀请吗？', [
      { text: '再想想', style: 'cancel' },
      {
        text: '确认取消',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (submitting) return;
            setSubmitting(true);
            try {
              const result = await cancelElderFamilyBindInvite(respondBindId);
              if (!result.ok) {
                Alert.alert('失败', result.msg ?? '请稍后重试');
                return;
              }
              Alert.alert('成功', '已取消邀请', [
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
  }, [navigation, resolveRespondBindId, submitting]);

  const relationLabel =
    (detail && (relationLabelMap[detail.relationType] || detail.relationType)) || '--';
  const canRespond = Boolean(messageId || detail?.id || bindId);
  const { showActionButtons, showCancelInvite, showRejectButton, showAcceptButton } =
    resolveFamilyBindInviteActionState(detail, isElder, {
      fromIncomingMessage: Boolean(messageId),
    });
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
          <Text style={styles.rowTitleDesc}>
            {isElder
              ? detail.initiatedByElder
                ? '请选择授予对方的查看权限'
                : '以下为对方申请的查看权限，可修改后再授权'
              : '以下为对方授予的查看权限（仅查看）'}
          </Text>

          <View style={styles.qxBox}>
            {FAMILY_PERMISSION_OPTIONS.map(item => {
              const active = selectedPermissions.includes(item.key);
              const iconColor = active ? ICON_SELECTED : ICON_UNSELECTED;
              const content = (
                <>
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
                </>
              );
              if (isElder) {
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    onPress={() => handleTogglePermission(item.key)}
                    style={[styles.qxItem, active && styles.qxItemActive]}
                  >
                    {content}
                  </TouchableOpacity>
                );
              }
              return (
                <View
                  key={item.key}
                  style={[styles.qxItem, active && styles.qxItemActive]}
                >
                  {content}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {showCancelInvite ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarRow}>
            <TouchableOpacity
              style={[styles.bottomBarButton, styles.bottomBarButtonReject]}
              activeOpacity={0.7}
              disabled={submitting || !canRespond}
              onPress={handleCancelInvite}
            >
              {submitting ? (
                <ActivityIndicator color="#FB4550" />
              ) : (
                <Text style={styles.bottomBarButtonTextReject}>取消邀请</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : showActionButtons ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarRow}>
            {showRejectButton ? (
              <TouchableOpacity
                style={[styles.bottomBarButton, styles.bottomBarButtonReject]}
                activeOpacity={0.7}
                disabled={submitting || !canRespond}
                onPress={handleReject}
              >
                {submitting ? (
                  <ActivityIndicator color="#FB4550" />
                ) : (
                  <Text style={styles.bottomBarButtonTextReject}>拒绝</Text>
                )}
              </TouchableOpacity>
            ) : null}
            {showAcceptButton ? (
              <TouchableOpacity
                style={[styles.bottomBarButton, styles.bottomBarButtonAccept]}
                activeOpacity={0.7}
                disabled={submitting || !canRespond}
                onPress={handleAccept}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.bottomBarButtonTextAccept}>接受</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </PageLayout>
  );
}
