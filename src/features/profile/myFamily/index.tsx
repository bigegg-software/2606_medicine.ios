import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground, ScrollView } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/myFamily';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export default function ProfileEditPage() {
    const navigation: any = useNavigation();
    const user: any = useSelector((state: RootState) => state.user.info);
    const [emergencyList, setEmergencyList] = useState<any[]>([{}]);
    return (
        <PageLayout style={styles.container} edges={[]}>
            <ScrollView style={styles.body}>
                <Flex style={styles.rowBox} align="start">
                    <View style={styles.rowBoxTextWrap}>
                        <Text style={styles.rowBoxText}>
                            <Text style={styles.rowBoxTextHighlight}>授权家人</Text>
                            可以查看您的健康数据、接收健康预警等，让家人随时了解您的健康状况。
                        </Text>
                    </View>
                    <Image style={styles.familyIcon} source={require('@/assets/images/family/family.png')} />
                </Flex>
                <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.backImage1}>
                    <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
                        <Text style={styles.backImage1Text}>已绑定家人</Text>
                    </Flex>
                </ImageBackground>
                <View style={styles.familyList}>
                    <TouchableOpacity onPress={()=>navigation.navigate('FamilyDetail')}>
                        <Flex style={styles.familyItem}>
                            <Image style={styles.familyItemIcon} source={require('@/assets/images/family/family.png')} />
                            <View style={styles.familyItemWrap}>
                                <Flex justify="between">
                                    <Flex>
                                        <Text style={styles.familyItemName}>王剑虹</Text>
                                        <Text style={styles.familyItemRelation}>儿子</Text>
                                    </Flex>
                                    <Flex>
                                        <View style={styles.familyItemStatusBox}></View>
                                        <Text style={styles.familyItemStatus}>已授权</Text>
                                    </Flex>
                                </Flex>
                                <Flex justify="between" style={styles.familyItemPhoneWrap}>
                                    <View>
                                        <Text style={styles.phoneNumber}>138****8888</Text>
                                        <Text style={styles.familyItemStatusText}>已授权6项·健康 用药 运动 饮食 评估 预警</Text>
                                    </View>
                                    <Image style={styles.familyItemRightIcon} source={require("@/assets/images/family/icon_right.png")} />
                                </Flex>
                            </View>
                        </Flex>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Flex style={styles.familyItem}>
                            <Image style={styles.familyItemIcon} source={require('@/assets/images/family/family.png')} />
                            <View style={styles.familyItemWrap}>
                                <Flex justify="between">
                                    <Flex>
                                        <Text style={styles.familyItemName}>王剑虹</Text>
                                        <Text style={styles.familyItemRelation}>儿子</Text>
                                    </Flex>
                                    <Flex>
                                        <View style={styles.familyItemStatusBox1}></View>
                                        <Text style={styles.familyItemStatus1}>未授权</Text>
                                    </Flex>
                                </Flex>
                                <Flex justify="between" style={styles.familyItemPhoneWrap}>
                                    <View>
                                        <Text style={styles.phoneNumber}>138****8888</Text>
                                        <Text style={styles.familyItemStatusText}>等待确认中...</Text>
                                    </View>
                                    <Image style={styles.familyItemRightIcon} source={require("@/assets/images/family/icon_right.png")} />
                                </Flex>
                            </View>
                        </Flex>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomBarButtonLeft}
                    activeOpacity={0.7}
                    onPress={() => { navigation.navigate('MyFamilyAdd') }}
                >
                    <Flex style={{ flex: 1 }}>
                        <Image
                            style={styles.bottomBarButtonImg}
                            source={require('@/assets/images/vitals/icon_add.png')}
                        />
                        <Text style={styles.bottomBarButtonTextLeft}>邀请家人加入</Text>
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}
