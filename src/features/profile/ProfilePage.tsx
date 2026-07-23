import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import { Flex, Toast } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { logout as logoutApi } from '@/api/auth';
import { clearAll } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { fetchUserSession, clearUser } from '@/store/actions/user';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import type { RootState, AppDispatch } from '@/store/store';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/profile';
import { getDisplayUserName, getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import type { RootStackParamList } from '@/route/router';
import { useFontSize } from '@/common/FontSizeContext';
import {
  getIdentityLabel,
  switchIdentityPerspective,
} from '@/src/features/auth/utils/identityHelpers';
import SignInModal from './components/SignInModal';
type Nav = NativeStackNavigationProp<RootStackParamList>;

// const navList = [
//   {
//     img: require('@/assets/images/user/img2.png'),
//     label: '健康档案',
//     route: 'HealthRecord'
//   },
//   {
//     img: require('@/assets/images/user/img3.png'),
//     label: '健康数据',
//     route: 'VitalsPage'
//   },
//   {
//     img: require('@/assets/images/user/img6.png'),
//     label: '用药记录',
//     route: 'Medication'
//   },
//   {
//     img: require('@/assets/images/user/img5.png'),
//     label: '慢病管理',
//     route: 'ChronicDisease'
//   },
//   {
//     img: require('@/assets/images/user/img4.png'),
//     label: '评估问卷',
//     route: 'QuestionnaireList'
//   }]

const navList = [
  {
    img: require('@/assets/images/user/img2.png'),
    label: '健康档案',
    route: 'HealthRecord' as const,
  },
  {
    img: require('@/assets/images/user/img3.png'),
    label: '健康数据',
    route: 'VitalsPage' as const,
  },
  {
    img: require('@/assets/images/user/img6.png'),
    label: '运动处方',
    route: 'Schedule' as const,
  },
  {
    img: require('@/assets/images/user/img5.png'),
    label: '营养处方',
    route: 'Medication' as const,
    params: { tab: 'meal' as const },
  },
  {
    img: require('@/assets/images/user/img4.png'),
    label: '用药记录',
    route: 'Medication' as const,
    params: { tab: 'medication' as const },
  },
];

export default function ProfilePage() {
  const navigation: any = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser: any = useSelector((s: RootState) => s.user.systemUser);
  const loading = useSelector((s: RootState) => s.user.loading);
  const { label: fontSizeLabel } = useFontSize();
  const [switchingIdentity, setSwitchingIdentity] = useState(false);
  const [signInVisible, setSignInVisible] = useState(false);
  const identityLabel = getIdentityLabel(systemUser?.identityPerspective);

  useEffect(() => {
    dispatch(fetchUserSession());
  }, [dispatch]);

  const switchToFamilyPerspective = useCallback(async () => {
    if (switchingIdentity) return;
    setSwitchingIdentity(true);
    try {
      const result = await switchIdentityPerspective('child');
      if (!result.ok) {
        Toast.fail(result.msg ?? '切换失败', 1.5);
        return;
      }
      await dispatch(fetchUserSession());
      navigation.reset({
        index: 0,
        routes: [{ name: result.homeRoute }],
      });
    } finally {
      setSwitchingIdentity(false);
    }
  }, [dispatch, navigation, switchingIdentity]);

  const logout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await logoutApi() as { code?: number; msg?: string };
            if (!isResourceApiOk(res)) {
              Alert.alert('退出失败', res.msg ?? '请稍后重试');
              return;
            }
          } catch {
            Alert.alert('错误', '网络错误，请稍后重试');
            return;
          }
          await clearAll();
          dispatch(clearUser());
          dispatch({ type: SET_LOGIN, payload: false });
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const name = getDisplayUserName(user);
  const avatarOssUrl = String(user?.avatarOssUrl ?? '');
  const defaultAvatar = getDefaultAvatarByGender(user?.gender);
  if (loading && user == null) {
    return (
      <TabPageLayout style={styles.container} contentStyle={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </TabPageLayout>
    );
  }

  return (
    <TabPageLayout style={styles.container}>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Flex justify='between' style={styles.avatarBox}>
          <Flex>
            {avatarOssUrl ? (
              <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
            ) : (
              <Image source={defaultAvatar} style={styles.avatarImg} />
            )}
            <View>
              <Flex>
                <Text style={styles.name}>{name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AuthenticationPage')}>
                  <Image style={styles.wrzImg} source={require('@/assets/images/user/wrz.png')} />
                </TouchableOpacity>
              </Flex>
              <Flex style={{ marginTop: 7 }}>
                <Image style={styles.avatarIcon} source={require('@/assets/images/user/img1.png')} />
                <Text style={styles.avatarValue}>{Number(systemUser?.tokens ?? 0).toFixed(2)}</Text>
              </Flex>
            </View>
          </Flex>
          <TouchableOpacity onPress={() => navigation.navigate('AuthenticationPage')}>
            <View style={styles.rlBox}>
              <Image style={styles.rlImg} source={require('@/assets/images/user/smrz.png')} />
            </View>
          </TouchableOpacity>
        </Flex>

        <ImageBackground
          source={require('@/assets/images/user/userBack.png')}
          style={styles.bgImg}>
          <Flex align="start" style={styles.diamondsBox}>
            <View style={{ flex: 1 }}>
              <Flex justify='between'>
                <Flex>
                  <Image style={styles.diamondsImg} source={require('@/assets/images/user/diamonds.png')} />
                  <Text style={styles.diamondsTitle}>积分商城</Text>
                </Flex>
                <TouchableOpacity onPress={() => setSignInVisible(true)}>
                  <Flex style={styles.diamondsSignIn}>
                    <Text style={styles.diamondsSignInText}>签到+10</Text>
                    <Image style={styles.diamondsSignInImg} tintColor={"#804A15"} source={require('@/assets/images/user/img1.png')} />
                  </Flex>
                </TouchableOpacity>
              </Flex>
              <Text style={styles.diamondsDesc}>已连续签到15天，再签到5天可额外得100积分</Text>
            </View>
          </Flex>
        </ImageBackground>

        <Flex justify="around" align="center" style={styles.navList}>
          {navList.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(item.route, 'params' in item ? item.params : undefined)}
            >
              <Flex direction="column" justify="start" align='center'>
                <Image style={styles.navListItemImg} source={item.img} />
                <Text style={styles.navListItemText}>{item.label}</Text>
              </Flex>
            </TouchableOpacity>
          ))}
        </Flex>

        <Text style={[styles.modelTitle, { marginTop: 24 }]}>我的家人</Text>

        <View style={[styles.familyBox, { paddingVertical: 10 }]}>
          {/* <Flex justify='between' style={styles.familyItem}>
            <Flex>
              <Image style={styles.familyItemImg} source={require('@/assets/images/home/head.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>张小红（女儿）</Text>
                <Text style={styles.familyItemRelation}>已授权4项权限</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
          </Flex>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Image style={styles.familyItemImg} source={require('@/assets/images/home/head.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>张小红（女儿）</Text>
                <Text style={styles.familyItemRelation}>已授权4项权限</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
          </Flex> */}

          <TouchableOpacity onPress={() => navigation.navigate('MyFamily')}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/user.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>点击添加联系人</Text>
                  <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
            </Flex>
          </TouchableOpacity>
        </View>

        <Text style={styles.modelTitle}>我的设备</Text>
        <View style={[styles.familyBox, { paddingVertical: 10 }]}>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Image style={styles.imgItem} source={require('@/assets/images/user/phone.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>3个设备在线</Text>
                <Text style={styles.familyItemRelation}>共绑定5个设备</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
          </Flex>
        </View>

        <Text style={styles.modelTitle}>设置</Text>
        <View style={styles.familyBox}>
          <TouchableOpacity
            disabled={switchingIdentity}
            onPress={switchToFamilyPerspective}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/tab.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>视角与身份</Text>
                  <Text style={styles.familyItemRelation}>
                    {switchingIdentity ? '切换中...' : `当前：${identityLabel}`}
                  </Text>
                </View>
              </Flex>
              <Image style={styles.tabSize} source={require('@/assets/images/user/icon_tab.png')} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/fontSize.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>字体大小</Text>
                  <Text style={styles.familyItemRelation}>当前：{fontSizeLabel}</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/zs.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>语音语速</Text>
                  <Text style={styles.familyItemRelation}>当前：正常</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/tip.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>消息通知</Text>
                  <Text style={styles.familyItemRelation}>已开启</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/data.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>数据管理</Text>
                  <Text style={styles.familyItemRelation}>手动同步・7天</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
            </Flex>
          </TouchableOpacity>
        </View>

        <View style={styles.familyBox}>
          <Flex justify='between' style={styles.familyItem}>
            <Flex>
              <Image style={styles.imgItem} source={require('@/assets/images/user/info.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>帮助与反馈</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
          </Flex>
          <TouchableOpacity onPress={() => navigation.navigate('AboutUsPage')}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Image style={styles.imgItem} source={require('@/assets/images/user/about.png')} />
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>关于我们</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
            </Flex>
          </TouchableOpacity>
        </View>
        <Text style={styles.modelTitle}>隐私设置</Text>
        <View style={styles.familyBox}>
          <Flex justify='between' style={styles.familyItem}>
            <Flex>
              <Image style={styles.imgItem} source={require('@/assets/images/user/sz.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>修改密码</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
          </Flex>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Image style={styles.imgItem} source={require('@/assets/images/user/eye.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>个人信息可见性</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={"#9DAAAD"} />
          </Flex>
        </View>
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Flex justify='center' style={{ flex: 1 }}>
            <Text style={styles.logoutText}>退出登录</Text>
          </Flex>
        </TouchableOpacity>
      </ScrollView>
      <SignInModal visible={signInVisible} onClose={() => setSignInVisible(false)} />
    </TabPageLayout>
  );
}
