import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getUserBaseInfo, updateUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import NoData from '@/src/components/noData';

export default function ProfileEditPage() {
    const navigation: any = useNavigation();
    const user: any = useSelector((state: RootState) => state.user.info);
    const [emergencyList, setEmergencyList] = useState<any[]>([{}]);
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>

            {emergencyList.length > 0 ?

                <ScrollView style={styles.body}>
                    <TouchableOpacity style={[styles.infoBox, { marginTop: 6 }]} onPress={() => navigation.navigate('FamilyDetail')}>
                        <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <Flex>
                                <Flex justify='center' align='center' style={styles.imgBox}>
                                    <Image style={styles.imgItem} source={require('@/assets/images/user/user.png')} />
                                </Flex>
                                <View style={styles.familyItemContent}>
                                    <Text style={styles.familyItemName}>张小红（女儿）</Text>
                                    <Text style={styles.familyItemRelation}>13912344123</Text>
                                </View>
                            </Flex>
                            <Flex>
                                <Text style={styles.familyAuthText}>已授权4项权限</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.primaryColor} />
                            </Flex>
                        </Flex>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.infoBox, { marginTop: 6 }]} onPress={() => navigation.navigate('FamilyDetail')}>
                        <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <Flex>
                                <Flex justify='center' align='center' style={styles.imgBox}>
                                    <Image style={styles.imgItem} source={require('@/assets/images/user/user.png')} />
                                </Flex>
                                <View style={styles.familyItemContent}>
                                    <Text style={styles.familyItemName}>张小红（女儿）</Text>
                                    <Text style={styles.familyItemRelation}>13912344123</Text>
                                </View>
                            </Flex>
                            <Flex>
                                <Text style={styles.familyAuthText}>已授权4项权限</Text>
                                <MaterialIcons name="chevron-right" size={24} color={AppTheme.primaryColor} />
                            </Flex>
                        </Flex>
                    </TouchableOpacity>
                    <Text style={styles.emergencyText}>授权家人可以查看您的健康数据、接收健康预警等，让家人随时了解您的健康状况。</Text>
                </ScrollView>
                : <View style={[styles.body, { flex: 1 }]}>
                    <Flex style={{ flex: 1 }}>
                        <NoData />
                    </Flex>
                    <Text style={styles.emergencyText}>授权家人可以查看您的健康数据、接收健康预警等，让家人随时了解您的健康状况。</Text>
                </View>
            }

            <TouchableOpacity style={styles.addBtn}>
                <Flex justify='center' align='center' style={{ flex: 1 }}>
                    <Text style={styles.addText}>邀请家人加入</Text>
                </Flex>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
