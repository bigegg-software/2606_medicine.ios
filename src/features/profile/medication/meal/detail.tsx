import React, { useEffect, useState } from 'react';
import { Text, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Flex } from '@ant-design/react-native';
import { AppTheme } from '@/common/theme';
import styles from '@/css/medication/deal/detail';
import PageLayout from '@/src/components/PageLayout';
import type { RootStackParamList } from '@/route/router';

export default function MedicationPage() {
    return (
        <PageLayout style={styles.container} contentStyle={styles.pageBody}>
            <ScrollView contentContainerStyle={styles.body}>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <Flex direction="column" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/rl.png')}></Image>
                        <Text style={styles.mealTitle}>1600千卡</Text>
                        <Text style={styles.mealText}>总热量</Text>
                    </Flex>
                    <Flex direction="column" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/dbz.png')}></Image>
                        <Text style={styles.mealTitle}>80克</Text>
                        <Text style={styles.mealText}>蛋白质</Text>
                    </Flex>
                    <Flex direction="column" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/ts.png')}></Image>
                        <Text style={styles.mealTitle}>40%</Text>
                        <Text style={styles.mealText}>碳水化合物</Text>
                    </Flex>
                    <Flex direction="column" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/shui.png')}></Image>
                        <Text style={styles.mealTitle}>2000毫升</Text>
                        <Text style={styles.mealText}>饮水</Text>
                    </Flex>
                    <Flex direction="column" style={styles.mealBox}>
                        <Image style={styles.mealIcon} source={require('@/assets/images/medication/meal/zf.png')}></Image>
                        <Text style={styles.mealTitle}>28%</Text>
                        <Text style={styles.mealText}>脂肪</Text>
                    </Flex>
                </ScrollView>



                <Text style={styles.sectionTitle}>推荐摄入</Text>
                <View style={styles.medicationBox}>
                    <Flex justify="between" style={[styles.mealRow, { marginTop: 0 }]}>
                        <Text style={styles.mealLeft}>蔬菜</Text>
                        <Text style={styles.mealRight}>≥500g/天</Text>
                    </Flex>
                    <Flex justify="between" style={styles.mealRow}>
                        <Text style={styles.mealLeft}>水果</Text>
                        <Text style={styles.mealRight}>200-300g/天</Text>
                    </Flex>
                    <Flex justify="between" style={styles.mealRow}>
                        <Text style={styles.mealLeft}>全谷物</Text>
                        <Text style={styles.mealRight}>50-150g/天</Text>
                    </Flex>
                    <Flex justify="between" style={styles.mealRow}>
                        <Text style={styles.mealLeft}>优质蛋白</Text>
                        <Text style={styles.mealRight}>120-200g/天</Text>
                    </Flex>
                </View>
                <Text style={styles.sectionTitle}>限制项</Text>
                <View style={styles.medicationBox}>
                    <Flex justify="between" style={[styles.mealRow, { marginTop: 0 }]}>
                        <Text style={styles.mealLeft}>盐</Text>
                        <Text style={styles.mealRight}>＜5g/天</Text>
                    </Flex>
                    <Flex justify="between" style={styles.mealRow}>
                        <Text style={styles.mealLeft}>水果</Text>
                        <Text style={styles.mealRight}>＜25g/天</Text>
                    </Flex>
                    <Flex justify="between" style={styles.mealRow}>
                        <Text style={styles.mealLeft}>全谷物</Text>
                        <Text style={styles.mealRight}>＜25g/天</Text>
                    </Flex>
                    <Flex justify="between" style={styles.mealRow}>
                        <Text style={styles.mealLeft}>酒精</Text>
                        <Text style={styles.mealRight}>戒酒</Text>
                    </Flex>
                </View>
                <View style={[styles.medicationBox, { marginTop: 0 }]}>
                    <Flex>
                        <Image source={require('@/assets/images/medication/icon.png')} style={styles.cfIcon} />
                        <Text style={styles.cfIconText}>注意事项</Text>
                    </Flex>
                    <View style={styles.suggestBox}>
                        <View>
                            <Text style={styles.aiSuggest}>1. 少食多餐，每餐七八分饱，避免暴饮暴食加重代谢负担。</Text>
                        </View>
                        <View>
                            <Text style={styles.aiSuggest}>2. 烹饪方式以蒸、煮、炖为主，减少油炸、煎烤等高油高盐做法。</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </PageLayout>
    );
}
