import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Switch } from '@ant-design/react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/myFamilyDetail';
import type { RootStackParamList } from '@/route/router';
import {
  getOldFamilyBindMyList,
  removeOldFamilyBind,
  updateOldFamilyBindAuth,
  type OldFamilyBindItem,
} from '@/api/oldFamilyBind';
import { apiResourceData, isResourceApiOk, type ApiResult } from '@/src/utils/apiHelpers';
import type { DictDataItem } from '@/api/dict';
import { loadRelationTypeOptions } from '@/src/features/profile/emergencyHelpers';
import {
  FAMILY_PERMISSION_DETAIL_OPTIONS,
  type FamilyPermissionKey,
} from './utils/myFamilyAddHelpers';
import {
  formatFamilyBindCreateTime,
  formatFamilyDetailRelationLine,
  getFamilyBindStatusMeta,
  getFamilyDisplayName,
  parseFamilyPermissionKeys,
  resolveFamilyBindAvatarSource,
  toFamilyPermissionApiCodes,
} from './utils/myFamilyListHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'FamilyDetail'>;

export default function MyFamilyDetailPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const bindId = route.params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<OldFamilyBindItem | null>(null);
  const [enabledPermissions, setEnabledPermissions] = useState<FamilyPermissionKey[]>([]);
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
      const res = await getOldFamilyBindMyList();
      const list = apiResourceData(res as unknown as ApiResult<OldFamilyBindItem[]>) ?? [];
      const matched =
        (Array.isArray(list) ? list : []).find(item => String(item.id) === String(bindId)) ?? null;
      setDetail(matched);
      setEnabledPermissions(parseFamilyPermissionKeys(matched?.authPermissions));
    } catch {
      setDetail(null);
      setEnabledPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [bindId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const handleToggle = (key: FamilyPermissionKey, checked: boolean) => {
    setEnabledPermissions(prev => {
      const has = prev.includes(key);
      if (checked && !has) return [...prev, key];
      if (!checked && has) return prev.filter(item => item !== key);
      return prev;
    });
  };

  const submitAuthUpdate = useCallback(
    async (permissions: FamilyPermissionKey[], successMsg: string) => {
      if (saving) return false;
      setSaving(true);
      try {
        const res = await updateOldFamilyBindAuth({
          id: String(bindId),
          authPermissions: toFamilyPermissionApiCodes(permissions),
        });
        if (!isResourceApiOk(res as ApiResult)) {
          const r = res as ApiResult;
          Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
          return false;
        }
        setEnabledPermissions(permissions);
        setDetail(prev =>
          prev
            ? {
                ...prev,
                authPermissions: toFamilyPermissionApiCodes(permissions),
              }
            : prev,
        );
        Alert.alert('成功', successMsg);
        return true;
      } catch {
        Alert.alert('错误', '网络错误，请稍后重试');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [bindId, saving],
  );

  const handleSave = useCallback(() => {
    void submitAuthUpdate(enabledPermissions, '授权已更新');
  }, [enabledPermissions, submitAuthUpdate]);

  const handleRevokeAll = useCallback(() => {
    Alert.alert('解除全部授权', '确认解除全部授权？家人关系仍会保留。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认解除',
        style: 'destructive',
        onPress: () => {
          void submitAuthUpdate([], '已解除全部授权');
        },
      },
    ]);
  }, [submitAuthUpdate]);

  const handleDelete = useCallback(() => {
    Alert.alert('删除家人', '删除后须重新添加，确认删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认删除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (saving) return;
            setSaving(true);
            try {
              const res = await removeOldFamilyBind(bindId);
              if (!isResourceApiOk(res as ApiResult)) {
                const r = res as ApiResult;
                Alert.alert('失败', r.msg ?? r.message ?? '请稍后重试');
                return;
              }
              Alert.alert('成功', '已删除家人', [
                {
                  text: '确定',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch {
              Alert.alert('错误', '网络错误，请稍后重试');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  }, [bindId, navigation, saving]);

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
          <Text style={styles.rowBoxText}>未找到该家人信息</Text>
        </View>
      </PageLayout>
    );
  }

  const status = getFamilyBindStatusMeta(detail.bindStatus);
  const relationLabel =
    relationLabelMap[String(detail.relationType ?? '')] || detail.relationType || '家人';
  const createTimeText = formatFamilyBindCreateTime(detail.createTime);

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
        <Flex justify="between" align="center" style={styles.rowBox}>
          <Flex align="center">
            <Image style={styles.rowBoxIcon} source={resolveFamilyBindAvatarSource(detail)} />
            <View style={styles.rowBoxContent}>
              <Text style={styles.rowBoxName}>{getFamilyDisplayName(detail)}</Text>
              <Flex align="center" style={styles.rowBoxTextWrap}>
                <Image style={styles.iconLj} source={require('@/assets/images/family/icon_lj.png')} />
                <Text style={styles.rowBoxText}>
                  {formatFamilyDetailRelationLine(relationLabel, detail.jsPhonenumber)}
                </Text>
              </Flex>
              <Flex align="center" style={styles.rowBoxTextWrap2}>
                <Text style={styles.rowBoxText2}>{status.label}</Text>
                {createTimeText ? (
                  <Text style={styles.rowBoxText3}>·添加于{createTimeText}</Text>
                ) : null}
              </Flex>
            </View>
          </Flex>
          <Image style={styles.rightImg} source={require('@/assets/images/family/fz.png')} />
        </Flex>

        <Text style={styles.rowBoxInfoText}>授权权限（点击开关即可修改）</Text>

        <View style={[styles.rowBox, styles.permissionBox]}>
          {FAMILY_PERMISSION_DETAIL_OPTIONS.map((item, index) => {
            const checked = enabledPermissions.includes(item.key);
            const isLast = index === FAMILY_PERMISSION_DETAIL_OPTIONS.length - 1;
            return (
              <Flex
                key={item.key}
                align="center"
                justify="between"
                style={[styles.rowBoxInfoItem, !isLast && styles.rowBoxInfoItemBorder]}
              >
                <Flex align="center" style={styles.rowBoxInfoItemLeft}>
                  <Image
                    style={styles.rowBoxInfoItemIcon}
                    source={item.icon}
                    tintColor="#333333"
                  />
                  <View style={styles.rowBoxInfoItemText}>
                    <Text style={styles.rowBoxInfoItemTitle}>{item.detailTitle}</Text>
                    <Text style={styles.rowBoxInfoItemDesc}>{item.detailDesc}</Text>
                  </View>
                </Flex>
                <Switch
                  style={styles.permissionSwitch}
                  checked={checked}
                  onChange={next => handleToggle(item.key, next)}
                  color={AppTheme.primaryColor}
                  disabled={saving}
                />
              </Flex>
            );
          })}
        </View>

        <Text style={styles.rowBoxInfoText}>危险操作</Text>
        <TouchableOpacity
          style={styles.dangerBtnRevoke}
          activeOpacity={0.8}
          disabled={saving}
          onPress={handleRevokeAll}
        >
          <Flex justify="center">
            <Image
              style={styles.dangerBtnRevokeIcon}
              source={require('@/assets/images/family/sz.png')}
            />
            <Text style={styles.dangerBtnRevokeText}>解除全部授权（保留家人关系）</Text>
          </Flex>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dangerBtnDelete}
          activeOpacity={0.8}
          disabled={saving}
          onPress={handleDelete}
        >
          <Flex justify="center">
            <Image
              style={styles.dangerBtnRevokeIcon}
              source={require('@/assets/images/family/del.png')}
            />
            <Text style={styles.dangerBtnDeleteText}>删除家人（移除后须重新添加）</Text>
          </Flex>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBarButtonLeft}
          activeOpacity={0.7}
          disabled={saving}
          onPress={handleSave}
        >
          <Flex style={{ flex: 1 }} justify="center" align="center">
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Image
                  style={styles.bottomBarButtonImg}
                  source={require('@/assets/images/schedule/save.png')}
                />
                <Text style={styles.bottomBarButtonTextLeft}>保存修改</Text>
              </>
            )}
          </Flex>
        </TouchableOpacity>
      </View>
    </PageLayout>
  );
}
