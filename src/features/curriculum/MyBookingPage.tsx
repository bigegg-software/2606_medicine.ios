import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import EmptyRecord from '@/src/components/EmptyRecord';
import styles from '@/css/curriculum/myBooking';

const TAB_LIST = [
  { key: 'upcoming', title: '即将开始' },
  { key: 'completed', title: '已完成' },
] as const;

type TabKey = (typeof TAB_LIST)[number]['key'];

/** 我的预约 */
export default function MyBookingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const hasUpcoming = true;
  const hasCompleted = false;

  return (
    <PageLayout style={styles.container} contentStyle={styles.content}>
      <Flex style={styles.navBox}>
        {TAB_LIST.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Flex
              key={tab.key}
              style={[styles.navItem, active && styles.activeNavItem]}
              justify="center"
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.navText, active && styles.activeNavText]}>{tab.title}</Text>
            </Flex>
          );
        })}
      </Flex>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'upcoming' ? (
          hasUpcoming ? (
            <>
              <View style={styles.bookingCard}>
                <Image
                  source={require('@/assets/images/curriculum/back.png')}
                  style={styles.bookingCardBg}
                  resizeMode="stretch"
                />
                <View style={styles.bookingCardBody}>
                  <Flex justify="between" align="center">
                    <Text style={styles.bookingLabel}>下一次训练</Text>
                    <View style={styles.bookingStatusTag}>
                      <Text style={styles.bookingStatusText}>已预约</Text>
                    </View>
                  </Flex>

                  <Text style={styles.bookingTime}>明天·周三 (10:15-11:15)</Text>
                  <Text style={styles.bookingTitle}>康复普拉提私教训练</Text>

                  <Flex align="start" style={styles.bookingCoachRow}>
                    <Image
                      style={styles.bookingCoachAvatar}
                      source={require('@/assets/images/curriculum/ljl.png')}
                    />
                    <View style={styles.bookingCoachInfo}>
                      <Text style={styles.bookingCoachName}>李教练·康复普拉提</Text>
                      <Flex align="center" style={styles.bookingCoachMetaRow}>
                        <Image
                          style={styles.bookingCoachMetaIcon}
                          tintColor="#999999"
                          source={require('@/assets/images/curriculum/address.png')}
                        />
                        <Text style={styles.bookingCoachMeta}>崇文门 Life Medicine</Text>
                      </Flex>
                      <Flex align="center" style={styles.bookingCoachMetaRow}>
                        <Image
                          style={styles.bookingCoachMetaIcon}
                          tintColor="#999999"
                          source={require('@/assets/images/curriculum/time.png')}
                        />
                        <Text style={styles.bookingCoachTip}>请提前10分钟到店</Text>
                      </Flex>
                    </View>
                  </Flex>

                  <Flex style={styles.bookingActionRow}>
                    <TouchableOpacity activeOpacity={0.7} style={styles.bookingAdjustBtn}>
                      <Flex style={{ flex: 1 }} justify="center">
                        <Image
                          style={styles.bookingAdjustBtnIcon}
                          tintColor="#6D925E"
                          source={require('@/assets/images/curriculum/time.png')}
                        />
                        <Text style={styles.bookingAdjustBtnText}>调整时间</Text>
                      </Flex>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} style={styles.bookingDetailBtn}>
                      <Flex style={{ flex: 1 }} justify="center">
                        <Text style={styles.bookingDetailBtnText}>查看详情</Text>
                        <Image
                          style={styles.bookingDetailBtnIcon}
                          tintColor="#333333"
                          source={require('@/assets/images/curriculum/icon_right.png')}
                        />
                      </Flex>
                    </TouchableOpacity>
                  </Flex>
                </View>
              </View>
              <View style={styles.contentBox}>
                <Text style={[styles.weekOnlineTitle, { marginTop: 0 }]}>后续安排</Text>

                <View style={styles.followCard}>
                  <Flex align="start">
                    <Image
                      style={styles.followCover}
                      source={require('@/assets/images/curriculum/xb1.png')}
                    />
                    <View style={styles.followInfo}>
                      <Flex justify="between" align="center">
                        <Text style={styles.followTime} numberOfLines={1}>
                          11月8日 · 周六 10:30-11:30
                        </Text>
                        <View style={styles.bookingStatusTag}>
                          <Text style={styles.bookingStatusText}>已预约</Text>
                        </View>
                      </Flex>
                      <Text style={styles.followTitle} numberOfLines={1}>
                        下肢稳定与平衡巩固小班
                      </Text>
                      <Flex align="center" style={styles.followMetaRow}>
                        <Image
                          style={styles.followMetaIcon}
                          tintColor="#999999"
                          source={require('@/assets/images/curriculum/bm.png')}
                        />
                        <Text style={styles.followMeta} numberOfLines={1}>
                          李教练·4-6人小班
                        </Text>
                      </Flex>
                    </View>
                  </Flex>
                </View>

                <Text style={styles.weekOnlineTitle}>最近完成</Text>
                <Flex justify="between" align="start" style={styles.completedCard}>
                  <Image
                    style={styles.completedDateIcon}
                    source={require('@/assets/images/common/wc.png')}
                  />
                  <View style={styles.completedInfo}>
                    <Text style={styles.completedDate}>10月30日</Text>
                    <Text style={styles.completedTitle} numberOfLines={1}>
                      康复普拉提私教训练 · 李教练
                    </Text>
                  </View>
                  <View style={styles.completedStatusTag}>
                    <Text style={styles.completedStatusText}>已完成</Text>
                  </View>
                </Flex>
              </View>
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyRecord text="暂无即将开始的预约" />
            </View>
          )
        ) : hasCompleted ? (
          <>
            <Text style={styles.weekOnlineTitle}>最近完成</Text>
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyRecord text="暂无已完成的预约" />
          </View>
        )}

        <Flex justify="center" align="center" style={styles.planListFooter}>
          <View style={styles.planListFooterLine} />
          <Text style={styles.planListFooterText}>日复一日的规律，是身体最好的滋养</Text>
          <View style={styles.planListFooterLine} />
        </Flex>
      </ScrollView>
    </PageLayout>
  );
}
