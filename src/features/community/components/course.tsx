import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { GlassView } from 'expo-glass-effect';
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

    return (
        <View>
            <View style={styles.courseBox}>
                <View style={styles.courseImgWrap}>
                    <Image source={require('@/assets/images/home/head.png')} style={styles.courseImg} />
                    <GlassView style={styles.courseCategoryTag} glassEffectStyle="regular">
                        <Text style={styles.liveTopCategoryText}>慢病管理</Text>
                    </GlassView>
                    <Text style={styles.gkrsText}>3280人次观看</Text>
                    <Image source={require('@/assets/images/community/play.png')} style={styles.coursePlayIcon} />
                </View>
                <View style={styles.courseBoxInfo}>
                    <Text style={styles.courseTitle}>直播预告</Text>
                    <Text style={styles.courseText}>学习血压监测、饮食控制、运动调节等高血压管理知识</Text>
                    <Flex justify='between' style={{ marginTop: 12 }}>
                        <Text style={styles.mapText}>王医生</Text>
                        <Flex>
                            <Image style={styles.courseIcon} source={require('@/assets/images/community/dz.png')} />
                            <Text style={styles.mapText}>256</Text>
                            <Image style={styles.courseIcon} source={require('@/assets/images/community/sc.png')} />
                            <Text style={styles.mapText}>130</Text>
                        </Flex>
                    </Flex>
                </View>
            </View>
            <View style={styles.courseBox}>
                <View style={styles.courseImgWrap}>
                    <Image source={require('@/assets/images/home/head.png')} style={styles.courseImg} />
                    <GlassView style={styles.courseCategoryTag} glassEffectStyle="regular">
                        <Text style={styles.liveTopCategoryText}>慢病管理</Text>
                    </GlassView>
                    <Text style={styles.gkrsText}>3280人次观看</Text>
                    <Image source={require('@/assets/images/community/play.png')} style={styles.coursePlayIcon} />
                </View>
                <View style={styles.courseBoxInfo}>
                    <Text style={styles.courseTitle}>直播预告</Text>
                    <Text style={styles.courseText}>学习血压监测、饮食控制、运动调节等高血压管理知识</Text>
                    <Flex justify='between' style={{ marginTop: 12 }}>
                        <Text style={styles.mapText}>王医生</Text>
                        <Flex>
                            <Image style={styles.courseIcon} source={require('@/assets/images/community/dz.png')} />
                            <Text style={styles.mapText}>256</Text>
                            <Image style={styles.courseIcon} source={require('@/assets/images/community/sc.png')} />
                            <Text style={styles.mapText}>130</Text>
                        </Flex>
                    </Flex>
                </View>
            </View>
            <View style={styles.courseBox}>
                <View style={styles.courseImgWrap}>
                    <Image source={require('@/assets/images/home/head.png')} style={styles.courseImg} />
                    <GlassView style={styles.courseCategoryTag} glassEffectStyle="regular">
                        <Text style={styles.liveTopCategoryText}>慢病管理</Text>
                    </GlassView>
                    <Text style={styles.gkrsText}>3280人次观看</Text>
                    <Image source={require('@/assets/images/community/play.png')} style={styles.coursePlayIcon} />
                </View>
                <View style={styles.courseBoxInfo}>
                    <Text style={styles.courseTitle}>直播预告</Text>
                    <Text style={styles.courseText}>学习血压监测、饮食控制、运动调节等高血压管理知识</Text>
                    <Flex justify='between' style={{ marginTop: 12 }}>
                        <Text style={styles.mapText}>王医生</Text>
                        <Flex>
                            <Image style={styles.courseIcon} source={require('@/assets/images/community/dz.png')} />
                            <Text style={styles.mapText}>256</Text>
                            <Image style={styles.courseIcon} source={require('@/assets/images/community/sc.png')} />
                            <Text style={styles.mapText}>130</Text>
                        </Flex>
                    </Flex>
                </View>
            </View>
        </View>
    );
}
