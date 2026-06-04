import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { clearAll } from '@/services/storage';
import { SET_LOGIN } from '@/store/type/login';
import { fetchUserBaseInfo, clearUser } from '@/store/actions/user';
import type { RootState, AppDispatch } from '@/store/store';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/profile';
import type { RootStackParamList } from '@/route/router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFontSize } from '@/common/FontSizeContext';
type Nav = NativeStackNavigationProp<RootStackParamList>;


const navList = [
  {
    img: require('@/assets/images/user/img2.png'),
    label: '健康档案',
    route: 'HealthRecord'
  },
  {
    img: require('@/assets/images/user/img3.png'),
    label: '体征数据',
    route: 'VitalsPage'
  },
  {
    img: require('@/assets/images/user/img4.png'),
    label: '用药记录',
    route: 'Medication'
  },
  {
    img: require('@/assets/images/user/img5.png'),
    label: '慢病管理',
    route: 'ChronicDisease'
  },
  {
    img: require('@/assets/images/user/img6.png'),
    label: '评估问卷',
    route: 'QuestionnaireList'
  }]

export default function ProfilePage() {
  const navigation: any = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.user.info);
  const loading = useSelector((s: RootState) => s.user.loading);
  const { label: fontSizeLabel } = useFontSize();

  useEffect(() => {
    dispatch(fetchUserBaseInfo());
  }, [dispatch]);

  const logout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          dispatch(clearUser());
          dispatch({ type: SET_LOGIN, payload: false });
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  const name = String(user?.name ?? '未知用户');
  const avatarOssUrl = String(user?.avatarOssUrl ?? '');

  if (loading && user == null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#B4D0FF', '#F5F8FF']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Text style={styles.pageTitle}>我的</Text>
      <View style={styles.pageLine} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Flex justify='between' style={styles.avatarBox}>
          <Flex>
            {avatarOssUrl ? (
              <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name[0] ?? 'U'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.name}>{name}</Text>
              <Flex style={{ marginTop: 7 }}>
                <Image style={styles.avatarIcon} tintColor={"#999999"} source={require('@/assets/images/user/img1.png')} />
                <Text style={styles.avatarValue}>{3211}</Text>
              </Flex>
            </View>
          </Flex>
          <View style={styles.rlBox}>
            <Image style={styles.rlImg} source={require('@/assets/images/user/rl.png')} />
            <Flex style={styles.qdBox}>
              <Text style={styles.qdText}>签到+10积分</Text>
            </Flex>
          </View>
        </Flex>

        <Flex justify="around" align="center" style={styles.navList}>
          {navList.map((item, index) => <TouchableOpacity key={index} onPress={() => navigation.navigate(item.route)}>
            <Flex direction="column" justify="start" align='center'>
              <Flex justify='center' align='center' style={styles.navListItem}>
                <Image style={styles.navListItemImg} source={item.img} />
              </Flex>
              <Text style={styles.navListItemText}>{item.label}</Text>
            </Flex>
          </TouchableOpacity>)}
        </Flex>

        <Text style={[styles.modelTitle, { marginTop: 24 }]}>我的家人</Text>

        <View style={styles.familyBox}>
          {/* <Flex justify='between' style={styles.familyItem}>
            <Flex>
              <Image style={styles.familyItemImg} source={require('@/assets/images/home/head.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>张小红（女儿）</Text>
                <Text style={styles.familyItemRelation}>已授权4项权限</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </Flex>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Image style={styles.familyItemImg} source={require('@/assets/images/home/head.png')} />
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>张小红（女儿）</Text>
                <Text style={styles.familyItemRelation}>已授权4项权限</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </Flex> */}

          <TouchableOpacity onPress={() => { }}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                {/* <Flex justify='center' align='center' style={styles.imgBox}>
                  <Image style={styles.imgItem} source={require('@/assets/images/user/user.png')} />
                </Flex> */}
                <View>
                  <Text style={styles.familyItemName}>点击添加联系人</Text>
                  <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </Flex>
          </TouchableOpacity>
        </View>

        <Text style={styles.modelTitle}>我的设备</Text>
        <View style={styles.familyBox}>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Flex justify='center' align='center' style={styles.imgBox}>
                <Image style={styles.imgItem} source={require('@/assets/images/user/phone.png')} />
              </Flex>
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>3个设备在线</Text>
                <Text style={styles.familyItemRelation}>共绑定5个设备</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </Flex>
        </View>

        <Text style={styles.modelTitle}>设置</Text>
        <View style={styles.familyBox}>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Flex justify='center' align='center' style={styles.imgBox}>
                  <Image style={styles.imgItem} source={require('@/assets/images/user/phone.png')} />
                </Flex>
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>字体大小</Text>
                  <Text style={styles.familyItemRelation}>当前：{fontSizeLabel}</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Flex justify='center' align='center' style={styles.imgBox}>
                  <Image style={styles.imgItem} source={require('@/assets/images/user/ys.png')} />
                </Flex>
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>语音语速</Text>
                  <Text style={styles.familyItemRelation}>当前：正常</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={styles.familyItem}>
              <Flex>
                <Flex justify='center' align='center' style={styles.imgBox}>
                  <Image style={styles.imgItem} source={require('@/assets/images/user/tip.png')} />
                </Flex>
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>消息通知</Text>
                  <Text style={styles.familyItemRelation}>已开启</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsPage')}>
            <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
              <Flex>
                <Flex justify='center' align='center' style={styles.imgBox}>
                  <Image style={styles.imgItem} source={require('@/assets/images/user/tip.png')} />
                </Flex>
                <View style={styles.familyItemContent}>
                  <Text style={styles.familyItemName}>数据管理</Text>
                  <Text style={styles.familyItemRelation}>手动同步・7天</Text>
                </View>
              </Flex>
              <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
            </Flex>
          </TouchableOpacity>
        </View>

        <View style={styles.familyBox}>
          <Flex justify='between' style={styles.familyItem}>
            <Flex>
              <Flex justify='center' align='center' style={styles.imgBox}>
                <Image style={styles.imgItem} source={require('@/assets/images/user/info.png')} />
              </Flex>
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>帮助与反馈</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </Flex>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Flex justify='center' align='center' style={styles.imgBox}>
                <Image style={styles.imgItem} source={require('@/assets/images/user/about.png')} />
              </Flex>
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>关于我们</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </Flex>
        </View>
        <Text style={styles.modelTitle}>隐私设置</Text>
        <View style={styles.familyBox}>
          <Flex justify='between' style={styles.familyItem}>
            <Flex>
              <Flex justify='center' align='center' style={styles.imgBox}>
                <Image style={styles.imgItem} source={require('@/assets/images/user/sz.png')} />
              </Flex>
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>修改密码</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </Flex>
          <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
            <Flex>
              <Flex justify='center' align='center' style={styles.imgBox}>
                <Image style={styles.imgItem} source={require('@/assets/images/user/eye.png')} />
              </Flex>
              <View style={styles.familyItemContent}>
                <Text style={styles.familyItemName}>个人信息可见性</Text>
              </View>
            </Flex>
            <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
          </Flex>
        </View>
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Flex justify='center' style={{ flex: 1 }}>
            <Text style={styles.logoutText}>退出登录</Text>
          </Flex>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
