import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ImageBackground, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flex, Carousel } from '@ant-design/react-native';
import { TabPageLayout } from '@/src/components/PageLayout';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/src/features/home/MainTabs';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import styles from '@/css/home/home';
import MiniProgressRing from './components/MiniProgressRing';
import type { RootStackParamList } from '@/route/router';
import { fetchUserInfo } from '@/store/actions/user';
import type { AppDispatch, RootState } from '@/store/store';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HOME_BANNER_ASPECT = 434 / 750;

export default function HomeTab() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const { width: windowWidth } = useWindowDimensions();
  const bannerSize = useMemo(() => {
    const width = windowWidth;
    return { width, height: Math.round(width * HOME_BANNER_ASPECT) };
  }, [windowWidth]);
  const colBoxWidth = useMemo(
    () => Math.floor((windowWidth - 36) * 0.3),
    [windowWidth],
  );
  const [refreshing, setRefreshing] = useState(false);
  const userExtr = useSelector((state: RootState) => state.user.userExtr);


  useEffect(() => {
    if (userExtr == null) {
      void dispatch(fetchUserInfo());
    }
  }, [dispatch, userExtr]);

  useFocusEffect(
    useCallback(() => {
      const stackNavigation = navigation.getParent()?.getParent() ?? navigation.getParent();
      stackNavigation?.setOptions({
        title: '',
        headerTitle: () => null,
        headerLeft: () => (
          <View style={{ marginLeft: 18 }}>
            <Image source={require('@/assets/images/home/homeLogo.png')} style={styles.miniLogo} />
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity style={styles.topRight} activeOpacity={0.8}>
            <Image source={require('@/assets/images/home/tip.png')} style={styles.rightImg} />
            <View style={styles.redDot} />
          </TouchableOpacity>
        ),
      });
      return () => {
        stackNavigation?.setOptions({
          headerTitle: undefined,
          headerLeft: undefined,
          headerRight: undefined,
        });
      };
    }, [navigation]),
  );


  // return (
  //   <TabPageLayout style={styles.container} contentStyle={styles.center}>
  //     <ActivityIndicator size="large" color={AppTheme.primaryColor} />
  //   </TabPageLayout>
  // );

  return (
    <TabPageLayout style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); }} />}
        contentContainerStyle={styles.scroll}>
        <Image
          source={require('@/assets/images/home/banner.png')}
          style={[styles.banner, bannerSize]}
          resizeMode="cover"
        />
        <View style={styles.pd18}>
          <Flex justify='between' style={styles.colBoxes}>
            <ImageBackground
              source={require('@/assets/images/home/back1.png')}
              style={[styles.colBox, { width: colBoxWidth }]}
              imageStyle={styles.colBg}
              resizeMode="cover">
              <Image source={require('@/assets/images/home/rl_w.png')} style={styles.imgIcon} />
              <Text style={styles.colText}>心率</Text>
              <Text style={styles.colValue}>72次/分钟</Text>
            </ImageBackground>
            <ImageBackground
              source={require('@/assets/images/home/back2.png')}
              style={[styles.colBox, { width: colBoxWidth }]}
              imageStyle={styles.colBg}
              resizeMode="cover">
              <Image source={require('@/assets/images/home/xl_w.png')} style={styles.imgIcon} />
              <Text style={styles.colText}>卡路里</Text>
              <Text style={styles.colValue}>2000千卡</Text>
            </ImageBackground>
            <ImageBackground
              source={require('@/assets/images/home/back3.png')}
              style={[styles.colBox, { width: colBoxWidth }]}
              imageStyle={styles.colBg}
              resizeMode="cover">
              <Image source={require('@/assets/images/home/xt_w.png')} style={styles.imgIcon} />
              <Text style={styles.colText}>血糖</Text>
              <Text style={styles.colValue}>6.8mmol/L</Text>
            </ImageBackground>
          </Flex>
          <View style={styles.scheduleBox}>
            <Flex justify='between'>
              <Flex>
                <Flex justify='center' style={styles.cfIconBox}>
                  <Image source={require('@/assets/images/home/yd.png')} style={styles.cfIcon} />
                </Flex>
                <Text style={styles.cfIconText}>运动处方</Text>
              </Flex>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#333333" />
            </Flex>
            <Flex justify='between' style={styles.cfContent}>
              <View>
                <Text style={styles.cfValue}>65%</Text>
                <Text style={styles.cfText}>有氧心肺</Text>
              </View>
              <View>
                <Text style={styles.cfValue}>15%</Text>
                <Text style={styles.cfText}>抗阻增肌</Text>
              </View>
              <View>
                <Text style={styles.cfValue}>100%</Text>
                <Text style={styles.cfText}>平衡控制</Text>
              </View>
              <View>
                <Text style={styles.cfValue}>15%</Text>
                <Text style={styles.cfText}>柔韧拉伸</Text>
              </View>
            </Flex>
            <View style={styles.cfLine} />
            <Flex justify='center' style={{ marginTop: 16 }}>
              <Text style={styles.btm1}>血糖控制目标</Text>
              <Text style={styles.btmText}>30</Text>
              <Text style={styles.btm1}>天</Text>
              <Flex style={styles.ydbBox}>
                <Text style={styles.ydbText}>已达标15天</Text>
              </Flex>
            </Flex>
          </View>
          <View style={styles.scheduleBox}>
            <TouchableOpacity onPress={() => navigation.navigate('Medication', { tab: 'meal' })}>
              <Flex justify='between'>
                <Flex>
                  <Flex justify='center' style={styles.cfIconBox}>
                    <Image source={require('@/assets/images/home/yy.png')} style={styles.cfIcon} />
                  </Flex>
                  <Text style={styles.cfIconText}>营养处方</Text>
                </Flex>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#333333" />
              </Flex>
            </TouchableOpacity>
            <Flex justify='between' style={styles.yyContent}>
              <View style={styles.yyItem}>
                <Flex justify="center" align="center">
                  <Text style={styles.yyTitle}>热量</Text>
                  <MiniProgressRing progress={65} />
                </Flex>
                <Flex justify="center" style={{ marginTop: 6 }}>
                  <Text style={styles.yyValue}>300</Text>
                  <Text style={styles.yyUnit}> /1200千卡</Text>
                </Flex>
              </View>
              <View style={styles.yyItem}>
                <Flex justify="center" align="center">
                  <Text style={styles.yyTitle}>蛋白</Text>
                  <MiniProgressRing progress={40} />
                </Flex>
                <Flex justify="center" style={{ marginTop: 6 }}>
                  <Text style={styles.yyValue}>30</Text>
                  <Text style={styles.yyUnit}> /70克</Text>
                </Flex>
              </View>
              <View style={styles.yyItem}>
                <Flex justify="center" align="center">
                  <Text style={styles.yyTitle}>饮水</Text>
                  <MiniProgressRing progress={80} />
                </Flex>
                <Flex justify="center" style={{ marginTop: 6 }}>
                  <Text style={styles.yyValue}>1300</Text>
                  <Text style={styles.yyUnit}> /1600毫升</Text>
                </Flex>
              </View>
            </Flex>
            <Flex style={styles.ysBox}>
              <View>
                <Flex>
                  <Image style={styles.ysIcon} source={require('@/assets/images/home/zao.png')} />
                  <Text style={styles.ysText}>早餐</Text>
                </Flex>
                <Flex justify='center' style={styles.wlrBox}>
                  <Text style={styles.wlrText}>未录入</Text>
                </Flex>
              </View>
              <View style={styles.line}>
                {Array.from({ length: 5 }, (_, index) => (
                  <View key={index} style={styles.lineDash} />
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <Flex justify='between'>
                  <Flex style={styles.foodBox} justify='center'>
                    <Text style={styles.foodText}>小米粥</Text>
                  </Flex>
                  <Flex style={styles.foodBox} justify='center'>
                    <Text style={styles.foodText}>鸡蛋</Text>
                  </Flex>
                  <Flex style={styles.foodBox} justify='center'>
                    <Text style={styles.foodText}>玉米</Text>
                  </Flex>
                </Flex>
                <Flex style={styles.jyBox} justify='center'>
                  <Image source={require('@/assets/images/home/jy.png')} style={styles.jyIcon} />
                  <Text style={styles.jyText}>建议热量：523千卡</Text>
                </Flex>
              </View>
            </Flex>
          </View>
        </View>

      </ScrollView>
    </TabPageLayout>
  );
}