import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  Text,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Flex } from '@ant-design/react-native';
import { useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/nutrition/coachBooking';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import type { RootState } from '@/store/store';
import { getSpecialPlanInfo, type SpecialPlanItem } from '@/api/specialPlan';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import {
  loadInStoreRecommendCards,
  type InStoreRecommendCardView,
} from '@/src/features/exercise/utils/inStoreRecommendHelpers';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import {
  buildSpecialPlanIntroItems,
  buildSpecialPlanServiceFlowItems,
  formatSpecialPlanPrice,
  formatSpecialPlanSchemeName,
  formatSpecialPlanSubtitle,
  getSpecialPlanTopCoverSource,
} from './components/utils/healthPlanHelpers';

type Route = RouteProp<RootStackParamList, 'CoachBookingPage'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'CoachBookingPage'>;

/** 无教练头像时与「我的」页一致的默认头像 */
const DEFAULT_COACH_AVATAR = getDefaultAvatarByGender();

function resolveRecommendDetailRoute(
  courseType?: string,
): 'PrivateCourseDetail' | 'GroupCourseDetail' | 'OnlineCourseDetail' {
  if (courseType === 'group') return 'GroupCourseDetail';
  if (courseType === 'online') return 'OnlineCourseDetail';
  return 'PrivateCourseDetail';
}

/** 预约教练 / 专项计划详情 */
export default function CoachBookingPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const planId = route.params?.planId ? String(route.params.planId) : '';
  const readOnly = Boolean(route.params?.readOnly);
  const stationId = useSelector((state: RootState) => {
    const id = state.user.systemUser?.stationId;
    return id != null ? String(id).trim() : '';
  });
  const [plan, setPlan] = useState<SpecialPlanItem | null>(null);
  const [loading, setLoading] = useState(Boolean(planId));
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [recommendCards, setRecommendCards] = useState<InStoreRecommendCardView[]>([]);

  const loadPlan = useCallback(async () => {
    if (!planId) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getSpecialPlanInfo(planId);
      if (!isResourceApiOk(res)) {
        setPlan(null);
        return;
      }
      setPlan(apiResourceData(res) ?? null);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  const loadRecommend = useCallback(async () => {
    if (!stationId) {
      setRecommendCards([]);
      return;
    }
    try {
      const list = await loadInStoreRecommendCards({ stationId });
      setRecommendCards(list);
    } catch {
      setRecommendCards([]);
    }
  }, [stationId]);

  useFocusEffect(
    useCallback(() => {
      void loadPlan();
      void loadRecommend();
    }, [loadPlan, loadRecommend]),
  );

  const toggleIntro = (index: number) => {
    setExpandedMap(prev => ({ ...prev, [index]: prev[index] === false }));
  };

  const planIntro = useMemo(() => buildSpecialPlanIntroItems(plan), [plan]);
  const serviceFlow = useMemo(() => buildSpecialPlanServiceFlowItems(plan), [plan]);
  const serviceFlowListRef = useRef<View>(null);
  const serviceFlowIconRefs = useRef<Array<View | null>>([]);
  const [serviceFlowDash, setServiceFlowDash] = useState<{
    left: number;
    top: number;
    height: number;
  } | null>(null);

  const syncServiceFlowDash = useCallback(() => {
    const lastIndex = serviceFlow.length - 1;
    const container = serviceFlowListRef.current;
    const first = serviceFlowIconRefs.current[0];
    const last = serviceFlowIconRefs.current[lastIndex];
    if (!container || !first || !last || lastIndex < 1) {
      setServiceFlowDash(null);
      return;
    }
    first.measureLayout(
      container,
      (_, y1, __, h1) => {
        last.measureLayout(
          container,
          (x2, y2, w2, h2) => {
            const top = y1 + h1 / 2;
            const height = y2 + h2 / 2 - top;
            setServiceFlowDash(
              height > 0 ? { left: x2 + w2 / 2 - 0.5, top, height } : null,
            );
          },
          () => { },
        );
      },
      () => { },
    );
  }, [serviceFlow.length]);

  const schemeName = plan ? formatSpecialPlanSchemeName(plan) : '阜外 My Health 方案';
  const planName = plan?.planName?.trim() || '--';
  const planSubtitle = plan ? formatSpecialPlanSubtitle(plan) : '';
  const priceText = plan ? formatSpecialPlanPrice(plan.price) : '--';
  const complianceDeclaration = plan?.complianceDeclaration?.trim() || '';

  useEffect(() => {
    if (!plan?.planName?.trim()) return;
    navigation.setOptions({ title: plan.planName.trim() });
  }, [navigation, plan?.planName]);

  useEffect(() => {
    syncServiceFlowDash();
  }, [syncServiceFlowDash, serviceFlow]);

  return (
    <PageLayout style={styles.container} edges={[]}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.planItemBox}>
              <Flex justify="between">
                <Flex align="center" style={{ marginLeft: 11 }}>
                  <Image
                    style={styles.planItemBrandIcon}
                    source={require('@/assets/images/exercise/fw.png')}
                  />
                  <Text style={styles.planItemBrandText}>{schemeName}</Text>
                </Flex>
                <Flex style={styles.planItemCoachBtn} onPress={() => { }}>
                  <Image
                    style={styles.planItemCoachBtnIcon}
                    source={require('@/assets/images/common/wc.png')}
                  />
                  <Text style={styles.planItemCoachBtnText}>专项健康计划</Text>
                </Flex>
              </Flex>
              <View style={styles.planTopBox}>
                <Image
                  style={styles.planTopBg}
                  source={
                    plan
                      ? getSpecialPlanTopCoverSource(plan)
                      : require('@/assets/images/exercise/slt.png')
                  }
                />
                <View style={styles.planTopContent}>
                  <Text style={styles.planTopTitle}>{planName}</Text>
                  {planSubtitle ? (
                    <Text style={styles.planTopSubtitle}>{planSubtitle}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            {planIntro.length > 0 ? (
              <>
                <ImageBackground
                  source={require('@/assets/images/schedule/calendarBack.png')}
                  style={styles.backImage1}
                >
                  <Flex align="center" style={{ flex: 1, paddingHorizontal: 21 }}>
                    <Text style={styles.backImage1Text}>计划简介</Text>
                  </Flex>
                </ImageBackground>

                <View style={styles.planIntroBox}>
                  {planIntro.map((item, index) => {
                    const expanded = expandedMap[index] !== false;
                    return (
                      <View
                        key={item.key}
                        style={[styles.planIntroItem, index > 0 && { marginTop: 13 }]}
                      >
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleIntro(index)}
                        >
                          <Flex justify="between" align="center">
                            <Flex align="center" style={{ flex: 1 }}>
                              <Image style={styles.planIntroItemIcon} source={item.icon} />
                              <View style={styles.planIntroItemTitleWrap}>
                                <LinearGradient
                                  colors={['rgba(109,146,94,0.5)', 'rgba(109,146,94,0)']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.planIntroItemTitleUnderline}
                                />
                                <Text style={styles.planIntroItemTitle}>{item.title}</Text>
                              </View>
                            </Flex>
                            <Image
                              style={styles.planIntroItemToggle}
                              source={
                                expanded
                                  ? require('@/assets/images/nutrition/dk.png')
                                  : require('@/assets/images/nutrition/sq.png')
                              }
                            />
                          </Flex>
                        </TouchableOpacity>
                        {expanded ? (
                          <Text style={styles.planIntroItemContent}>{item.content}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {serviceFlow.length > 0 ? (
              <>
                <ImageBackground
                  source={require('@/assets/images/schedule/calendarBack.png')}
                  style={styles.backImage1}
                >
                  <Flex align="center" style={{ flex: 1, paddingHorizontal: 21 }}>
                    <Text style={styles.backImage1Text}>服务流程</Text>
                  </Flex>
                </ImageBackground>
                <View style={styles.planIntroBox}>
                  <View style={styles.planIntroItem}>
                    <View
                      ref={serviceFlowListRef}
                      style={styles.serviceFlowList}
                      onLayout={syncServiceFlowDash}
                    >
                      {serviceFlowDash ? (
                        <View
                          style={[styles.serviceFlowDashLine, serviceFlowDash]}
                          pointerEvents="none"
                        >
                          <Svg width={1} height={serviceFlowDash.height}>
                            <Line
                              x1={0.5}
                              y1={0}
                              x2={0.5}
                              y2={serviceFlowDash.height}
                              stroke="#6D925E"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                            />
                          </Svg>
                        </View>
                      ) : null}
                      {serviceFlow.map((item, index) => (
                        <Flex
                          key={item.key}
                          align="start"
                          style={[styles.serviceFlowItem, index > 0 ? { marginTop: 13 } : undefined]}
                        >
                          <View style={styles.serviceFlowIconCol}>
                            <View
                              ref={node => {
                                serviceFlowIconRefs.current[index] = node;
                              }}
                              onLayout={syncServiceFlowDash}
                              style={styles.serviceFlowIcon}
                            >
                              <Text style={styles.serviceFlowIconText}>{item.stepNo}</Text>
                            </View>
                          </View>
                          <View style={styles.serviceFlowContent}>
                            <Text style={styles.serviceFlowTitle}>{item.title}</Text>
                            {item.subtitle ? (
                              <Text style={styles.serviceFlowSubtitle}>{item.subtitle}</Text>
                            ) : null}
                          </View>
                        </Flex>
                      ))}
                    </View>
                  </View>
                </View>
              </>
            ) : null}

            {complianceDeclaration ? (
              <Flex align="start" style={styles.planDisclaimer}>
                <Image
                  style={styles.planDisclaimerIcon}
                  source={require('@/assets/images/exercise/fw.png')}
                />
                <Text style={styles.planDisclaimerText}>{complianceDeclaration}</Text>
              </Flex>
            ) : null}

            {recommendCards.length > 0 ? (
              <>
                <ImageBackground
                  source={require('@/assets/images/schedule/calendarBack.png')}
                  style={styles.backImage1}
                >
                  <Flex align="center" style={{ flex: 1, paddingHorizontal: 21 }}>
                    <Text style={styles.backImage1Text}>为你推荐的健康陪伴教练</Text>
                  </Flex>
                </ImageBackground>
                <View style={styles.planIntroBox}>
                  {recommendCards.map((item, index) => {
                    const timeText = item.availableText?.trim() || '';
                    return (
                      <TouchableOpacity
                        key={item.key}
                        disabled
                        activeOpacity={0.7}
                        onPress={() => {
                          const id = item.sessionId?.trim() || '';
                          if (!id) return;
                          navigation.navigate(resolveRecommendDetailRoute(item.courseType), {
                            sessionId: id,
                          });
                        }}
                      >
                        <Flex
                          align="start"
                          style={[
                            styles.coachRecommendItem,
                            { marginTop: index === 0 ? 0 : 13 },
                          ]}
                        >
                          <Image
                            style={styles.coachRecommendIcon}
                            source={
                              item.avatarUri?.trim()
                                ? { uri: item.avatarUri.trim() }
                                : DEFAULT_COACH_AVATAR
                            }
                          />
                          <View style={styles.coachRecommendContent}>
                            <Flex align="center" style={{ marginTop: 4 }}>
                              <Text style={styles.coachRecommendName}>{item.coachName}</Text>
                              {item.tag ? (
                                <View style={styles.coachRecommendTag}>
                                  <Text style={styles.coachRecommendTagText}>{item.tag}</Text>
                                </View>
                              ) : null}
                            </Flex>
                            {timeText ? (
                              <Text style={styles.coachRecommendTime}>{`可约：${timeText}`}</Text>
                            ) : null}
                          </View>
                        </Flex>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Flex justify="center" align="center" style={styles.planListFooter}>
              <View style={styles.planListFooterLine} />
              <Text style={styles.planListFooterText}>寻得同行者，开启健康路</Text>
              <View style={styles.planListFooterLine} />
            </Flex>
          </ScrollView>

          {!readOnly ? (
            <Flex justify="between" align="start" style={styles.bottomBar}>
              <View>
                <Text style={styles.bottomPrice}>
                  <Text style={{ fontSize: 18 }}>￥</Text>
                  {priceText}
                </Text>
                <Text style={styles.bottomPriceDesc}>专项健康体验课</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.bottomBookBtn}
                onPress={() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs', params: { screen: 'Curriculum' } }],
                  });
                }}
              >
                <Image
                  style={styles.bottomBookIcon}
                  tintColor="#FFFFFF"
                  source={require('@/assets/images/schedule/time.png')}
                />
                <Text style={styles.bottomBookText}>预约教练</Text>
              </TouchableOpacity>
            </Flex>
          ) : null}
        </>
      )}
    </PageLayout>
  );
}
