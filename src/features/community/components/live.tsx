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

    const renderLiveTopCard = () => (
        <View style={styles.liveTopBox}>
            <View style={styles.liveTopImgWrap}>
                <Image source={require('@/assets/images/home/head.png')} style={styles.liveTopImg} resizeMode="cover" />
                <Flex justify='center' style={styles.liveTopCategoryTag}>
                    <Text style={styles.liveTopCategoryText}>运动健身</Text>
                </Flex>
                <View style={styles.liveTopLiveTag}>
                    <View style={styles.liveTopLiveDot} />
                    <Text style={styles.liveTopLiveText}>直播中</Text>
                </View>
            </View>
            <View style={styles.liveTopInfo}>
                <Text style={styles.liveTopText}>健康早操直播间</Text>
                <Text style={styles.liveTopIntro}>每日早晨带您做健康操，唤醒身体活力</Text>
            </View>
        </View>
    );

    return (
        <View>
            <View style={styles.liveTopRow}>
                {renderLiveTopCard()}
                {renderLiveTopCard()}
            </View>
            <Text style={styles.sectionTitle}>直播预告</Text>
            <View>
                <View style={styles.mapBox}>
                    <Flex style={styles.mapBoxItem}>
                        <Image source={require('@/assets/images/home/head.png')} style={styles.liveImg} />
                        <View style={styles.liveMapBox}>
                            <Flex justify="between">
                                <Text style={styles.mapBoxItemTitle}>高血压用药指导</Text>

                                <Flex style={styles.wbmBtn}>
                                    <Text style={styles.wbmText}>用药指导</Text>
                                </Flex>
                            </Flex>
                            <Text style={styles.mapIntro} numberOfLines={2}>每周六上午在朝阳公园东门集合，由专业教练张老师带领练习太极拳。太极拳是一种传统的健身方式，动作缓慢柔和，非常适合老年人锻炼身体。 </Text>
                            <Flex justify='between' style={{ marginTop: 2 }}>
                                <Flex>
                                    <Image style={styles.mapIcon} source={require('@/assets/images/home/nz.png')} />
                                    <Text style={styles.mapText}>明天9:00</Text>
                                </Flex>
                                <Text style={styles.mapText}>主播: 王药师</Text>
                            </Flex>
                        </View>
                    </Flex>
                    <Flex style={styles.mapBoxItem}>
                        <Image source={require('@/assets/images/home/head.png')} style={styles.liveImg} />
                        <View style={styles.liveMapBox}>
                            <Flex justify="between">
                                <Text style={styles.mapBoxItemTitle}>高血压用药指导</Text>

                                <Flex style={styles.wbmBtn}>
                                    <Text style={styles.wbmText}>用药指导</Text>
                                </Flex>
                            </Flex>
                            <Text style={styles.mapIntro} numberOfLines={2}>每周六上午在朝阳公园东门集合，由专业教练张老师带领练习太极拳。太极拳是一种传统的健身方式，动作缓慢柔和，非常适合老年人锻炼身体。 </Text>
                            <Flex justify='between' style={{ marginTop: 2 }}>
                                <Flex>
                                    <Image style={styles.mapIcon} source={require('@/assets/images/home/nz.png')} />
                                    <Text style={styles.mapText}>明天9:00</Text>
                                </Flex>
                                <Text style={styles.mapText}>主播: 王药师</Text>
                            </Flex>
                        </View>
                    </Flex>
                </View>
            </View>
        </View >
    );
}
