import React, { useState } from 'react';
import { View, ScrollView, Image, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageLayout from '@/src/components/PageLayout';
import styles from '@/css/nutrition/coachBooking';
import { Flex } from '@ant-design/react-native';
/** 预约教练：页面内容待定 */
export default function CoachBookingPage() {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

  const toggleIntro = (index: number) => {
    setExpandedMap(prev => ({ ...prev, [index]: prev[index] === false }));
  };

  const planIntro = [
    {
      icon: require('@/assets/images/exercise/icon1.png'),
      title: '核心理念',
      content: '科学的生活方式干预能显著降低胆固醇和甘油三酯，是最根本的"源头疗法”;根据个体代谢特点制定个体化降脂路径。',
    },
    {
      icon: require('@/assets/images/exercise/icon2.png'),
      title: '适合人群',
      content: '总胆固醇/DL-C/甘油三酯异常者;有心血管家族史或动脉硬化风险者;合并代谢综合征者;已服他汀期望优化方案者;药物不耐受者。',
    },
    {
      icon: require('@/assets/images/exercise/icon3.png'),
      title: '干预内容',
      content: '优脂饮食解构(植物甾醇+低糖+抗炎);支持肝脂代谢(n-3脂肪酸、低GI饮食);有氧+力量训练组合;体重与内脏脂肪管理;肠道菌群干预;药物优化支持;颈动脉斑块及动脉弹性评估反馈。',
    },
    {
      icon: require('@/assets/images/exercise/icon4.png'),
      title: '依据',
      content: '相关研究表明强化生活方式干预使LDL平均下降约22-37%;每增加一定运动时长HDL相应提升。',
    }
  ]

  const serviceFlow = [
    {
      icon: require('@/assets/images/nutrition/num1.png'),
      title: '选择适合你的康复教练',
      subtitle: '与将来长期陪伴你的教练相识，先建立信任',
    },
    {
      icon: require('@/assets/images/nutrition/num2.png'),
      title: '99元专项健康体验课',
      subtitle: '到店完成基础健康问询、习惯沟通与一次训练体验。',
    },
    {
      icon: require('@/assets/images/nutrition/num3.png'),
      title: '阜外医院医学评估',
      subtitle: '由Life Medicine协调阜外医院健康管理中心完成医学体检与初始处方。',
    },
    {
      icon: require('@/assets/images/nutrition/num4.png'),
      title: '长期处方执行陪伴',
      subtitle: '回到同一位教练，进入营养、训练与生活方式的每周执行。',
    },
  ]

  const coachRecommend = [
    {
      avatar: require('@/assets/images/exercise/dtls.png'),
      name: '李教练',
      tag: '心代谢生活方式执行',
      time: '可约：周二/周四/周六上午',
    },
    {
      avatar: require('@/assets/images/exercise/dtls.png'),
      name: '李教练',
      tag: '心代谢生活方式执行',
      time: '可约：周二/周四/周六上午',
    },
  ]

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.planItemBox}>
          <Flex justify="between" >
            <Flex align="center" style={{ marginLeft: 11 }}>
              <Image style={styles.planItemBrandIcon} source={require('@/assets/images/exercise/fw.png')} />
              <Text style={styles.planItemBrandText}>阜外 My Health 方案</Text>
            </Flex>
            <Flex style={styles.planItemCoachBtn} onPress={() => { }}>
              <Image style={styles.planItemCoachBtnIcon} source={require('@/assets/images/common/wc.png')} />
              <Text style={styles.planItemCoachBtnText}>专项健康计划</Text>
            </Flex>
          </Flex>
          <View style={styles.planTopBox}>
            <Image style={styles.planTopBg} source={require('@/assets/images/exercise/slt.png')} />
            <View style={styles.planTopContent}>
              <Text style={styles.planTopTitle}>高血脂生活方式治疗项目</Text>
              <Text style={styles.planTopSubtitle}>低GI膳食·规律进餐·肌力与有氧·数据记录</Text>
            </View>
          </View>
        </View>

        <ImageBackground
          source={require('@/assets/images/schedule/calendarBack.png')}
          style={styles.backImage1}>
          <Flex align="center" style={{ flex: 1, paddingHorizontal: 21 }}>
            <Text style={styles.backImage1Text}>计划简介</Text>
          </Flex>
        </ImageBackground>

        <View style={styles.planIntroBox}>
          {
            planIntro.map((item, index) => {
              const expanded = expandedMap[index] !== false;
              return (
                <View key={index} style={[styles.planIntroItem, index > 0 && { marginTop: 13 }]}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => toggleIntro(index)}>
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
            })
          }
        </View>
        <ImageBackground
          source={require('@/assets/images/schedule/calendarBack.png')}
          style={styles.backImage1}>
          <Flex align="center" style={{ flex: 1, paddingHorizontal: 21 }}>
            <Text style={styles.backImage1Text}>服务流程</Text>
          </Flex>
        </ImageBackground>
        <View style={styles.planIntroBox}>
          <View style={styles.planIntroItem}>
            {serviceFlow.map((item, index) => (
              <Flex
                key={index}
                align="start"
                style={[styles.serviceFlowItem, index > 0 && { marginTop: 13 }]}
              >
                <Image style={styles.serviceFlowIcon} source={item.icon} />
                <View style={styles.serviceFlowContent}>
                  <Text style={styles.serviceFlowTitle}>{item.title}</Text>
                  <Text style={styles.serviceFlowSubtitle}>{item.subtitle}</Text>
                </View>
              </Flex>
            ))}
          </View>
        </View>
        <Flex align="start" style={styles.planDisclaimer}>
          <Image style={styles.planDisclaimerIcon} source={require('@/assets/images/exercise/fw.png')} />
          <Text style={styles.planDisclaimerText}>
            医学评估 、诊断与医学处方由卓外医院健康管理中心完成; Life Medicine提供处方执行、训练陪伴与阶段反馈服务。
          </Text>
        </Flex>
        <ImageBackground
          source={require('@/assets/images/schedule/calendarBack.png')}
          style={styles.backImage1}>
          <Flex align="center" style={{ flex: 1, paddingHorizontal: 21 }}>
            <Text style={styles.backImage1Text}>为你推荐的健康陪伴教练</Text>
          </Flex>
        </ImageBackground>
        <View style={styles.planIntroBox}>
          {coachRecommend.map((item, index) => (
            <Flex
              key={index}
              align="start"
              style={[styles.coachRecommendItem, { marginTop: index === 0 ? 0 : 13 }]}
            >
              <Image style={styles.coachRecommendIcon} source={item.avatar} />
              <View style={styles.coachRecommendContent}>
                <Flex align="center" style={{ marginTop: 4 }}>
                  <Text style={styles.coachRecommendName}>{item.name}</Text>
                  <View style={styles.coachRecommendTag}>
                    <Text style={styles.coachRecommendTagText}>{item.tag}</Text>
                  </View>
                </Flex>
                <Text style={styles.coachRecommendTime}>{item.time}</Text>
              </View>
            </Flex>
          ))}
        </View>
        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>寻得同行者，开启健康路</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
      <Flex justify="between" align="start" style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}><Text style={{ fontSize: 18 }}>￥</Text>99</Text>
          <Text style={styles.bottomPriceDesc}>专项健康体验课</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.bottomBookBtn}>
          <Image style={styles.bottomBookIcon} tintColor={"#FFFFFF"} source={require('@/assets/images/schedule/time.png')} />
          <Text style={styles.bottomBookText}>预约教练</Text>
        </TouchableOpacity>
      </Flex>
    </PageLayout>
  );
}
