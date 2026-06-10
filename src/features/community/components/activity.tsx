import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { AppTheme } from '@/common/theme';
import styles from '@/css/community/community';
import type { RootStackParamList } from '@/route/router';
import { LinearGradient } from 'expo-linear-gradient';
type Nav = NativeStackNavigationProp<RootStackParamList>;



export default function CommunityPage() {
    const navigation: any = useNavigation<Nav>();
    const dispatch = useDispatch<AppDispatch>();

    const [activeNav, setActiveNav] = useState('all');
    const navList = [
        {
            label: '全部',
            value: 'all'
        },
        {
            label: '运动健身',
            value: 'sports'
        },
        {
            label: '健康讲座',
            value: 'healthLecture'
        },
        {
            label: '兴趣活动',
            value: 'interestActivity'
        }
    ]
    return (
        <View>
            <Flex justify="around" style={styles.navBox}>
                {navList.map((item, index) => (
                    <TouchableOpacity style={styles.navCol} key={index} onPress={() => setActiveNav(item.value)}>
                        <View style={styles.navItemWrap}>
                            <Text style={[styles.navText, activeNav === item.value && styles.activeNavText]}>{item.label}</Text>
                            {activeNav === item.value ? (
                                <View style={styles.navIndicatorWrap}>
                                    <Image source={require('@/assets/images/user/btm.png')} style={styles.navIndicator} />
                                </View>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                ))}
            </Flex>

            <View style={styles.mapBox}>
                <View style={styles.mapBoxItem}>
                    <Flex style={{ flex: 1, }}>
                        <Image source={require('@/assets/images/home/head.png')} style={styles.mapBoxItemImg} />
                        <View style={styles.mapRightBox}>
                            <Flex justify="between">
                                <Text style={styles.mapBoxItemTitle}>公园太极拳活动</Text>

                                <Flex style={styles.mapRightBtn}>
                                    <Text style={styles.mapRightText}>已报名</Text>
                                </Flex>

                                {/* <Flex style={styles.wbmBtn}>
                                        <Text style={styles.wbmText}>未报名</Text>
                                    </Flex> */}
                            </Flex>
                            <Text style={styles.mapIntro} numberOfLines={2}>每周六上午在朝阳公园东门集合，由专业教练张老师带领练习太极拳。太极拳是一种传统的健身方式，动作缓慢柔和，非常适合老年人锻炼身体。 </Text>
                        </View>
                    </Flex>
                    <Flex justify='between' style={{ marginTop: 12 }}>
                        <Flex>
                            <Image style={styles.mapIcon} source={require('@/assets/images/home/nz.png')} />
                            <Text style={styles.mapText}>明天9:00</Text>
                        </Flex>
                        <Flex>
                            <Image style={styles.mapIcon} source={require('@/assets/images/home/dw.png')} />
                            <Text style={styles.mapText}>朝阳公园正门</Text>
                        </Flex>
                        <Flex>
                            <Image style={styles.mapIcon} source={require('@/assets/images/community/user.png')} />
                            <Text style={styles.mapText}>23人</Text>
                        </Flex>
                    </Flex>
                </View>
            </View>

            <Text style={styles.timeText}>5月20日 10:00</Text>
            <View style={styles.newDynamicBox}>
                <View style={styles.newDynamicContent}>
                    <Text style={[styles.mapBoxItemTitle, { textAlign: 'center' }]}>通知提醒</Text>
                    <Text style={[styles.newDynamicContentText, { marginTop: 12 }]}>每周六上午在朝阳公园东门集合，由专业教练带领练习太极拳，适合各年龄段老年人参加。</Text>
                </View>
            </View>
        </View>
    );
}
