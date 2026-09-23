import React from 'react';
import { View, Text, Image, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/curriculum/onlineTraining';

/** 线上训练 */
export default function OnlineTrainingPage() {
  return (
    <View style={styles.tabPage}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentBox}>

          <ImageBackground
            source={require('@/assets/images/curriculum/xs.png')}
            style={styles.imgBackground}
            imageStyle={styles.imgBackgroundImage}
          >
            <Text style={styles.bannerTitle}>不在门店，也能保持自己的节奏</Text>
            <Text style={styles.bannerDesc}>
              {'在熟悉老师的陪伴下\n完成适合居家的巩固训练'}
            </Text>
          </ImageBackground>

          <Text style={styles.weekOnlineTitle}>本周线上安排</Text>

          <View style={styles.liveCard}>
            <Flex align="start">
              <Image
                style={styles.liveAvatar}
                source={require('@/assets/images/curriculum/ljl.png')}
              />
              <View style={styles.liveInfo}>
                <View style={styles.liveTag}>
                  <Text style={styles.liveTagText}>直播·推荐</Text>
                </View>
                <Text style={styles.liveTitle}>李教练·居家核心巩固直播</Text>
                <Text style={styles.liveSuit}>适合：已完成基础核心训练的会员</Text>
              </View>
            </Flex>

            <Flex style={styles.livePrepareBox}>
              <Image
                style={styles.livePrepareIcon}
                source={require('@/assets/images/curriculum/zb.png')}
              />
              <Text style={styles.livePrepareText}>准备：瑜伽垫、弹力带、稳定椅子</Text>
            </Flex>

            <Flex justify="between" align="center" style={styles.liveBottomRow}>
              <View style={styles.liveBottomLeft}>
                <Text style={styles.liveTime}>周三 10:15-11:15</Text>
                <View style={styles.liveBenefitRow}>
                  <Image
                    style={styles.liveBenefitIcon}
                    tintColor={"#000000"}
                    source={require('@/assets/images/curriculum/bm.png')}
                  />
                  <Text style={styles.liveBenefitText}>已预约 6/12 人</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.7} style={styles.liveBookBtn}>
                <Text style={styles.liveBookBtnText}>预约直播</Text>
              </TouchableOpacity>
            </Flex>
          </View>

          <View style={styles.liveCard}>
            <Flex align="start">
              <Image
                style={styles.liveAvatar}
                source={require('@/assets/images/curriculum/ljl.png')}
              />
              <View style={styles.liveInfo}>
                <View style={styles.liveTag}>
                  <Text style={styles.liveTagText}>直播·推荐</Text>
                </View>
                <Text style={styles.liveTitle}>李教练·居家核心巩固直播</Text>
                <Text style={styles.liveSuit}>适合：已完成基础核心训练的会员</Text>
              </View>
            </Flex>

            <Flex style={styles.livePrepareBox}>
              <Image
                style={styles.livePrepareIcon}
                source={require('@/assets/images/curriculum/zb.png')}
              />
              <Text style={styles.livePrepareText}>准备：瑜伽垫、弹力带、稳定椅子</Text>
            </Flex>

            <Flex justify="between" align="center" style={styles.liveBottomRow}>
              <View style={styles.liveBottomLeft}>
                <Text style={styles.liveTime}>周三 10:15-11:15</Text>
                <View style={styles.liveBenefitRow}>
                  <Image
                    style={styles.liveBenefitIcon}
                    tintColor={"#000000"}
                    source={require('@/assets/images/curriculum/bm.png')}
                  />
                  <Text style={styles.liveBenefitText}>已预约 6/12 人</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.7} style={styles.liveBookBtn}>
                <Text style={styles.liveBookBtnText}>预约直播</Text>
              </TouchableOpacity>
            </Flex>
          </View>

          <Text style={styles.weekOnlineTitle}>随时练一练</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.practiceScroll}
          contentContainerStyle={styles.practiceScrollContent}
        >
          {[1, 2, 3].map(key => (
            <Flex key={key} align="start" style={styles.practiceCard}>
              <Image
                style={styles.practiceCover}
                source={require('@/assets/images/curriculum/ljl.png')}
              />
              <View style={styles.practiceInfo}>
                <Text style={styles.practiceTitle}>15分钟晨间舒展</Text>
                <Text style={styles.practiceSubtitle}>处方配套视频</Text>
              </View>
            </Flex>
          ))}
        </ScrollView>

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>每一次居家练习，都是为更好相见做准备</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
    </View>
  );
}
