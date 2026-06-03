import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserBaseInfo, updateUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/healthRecord';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import NoData from '@/src/components/noData';

export default function ProfileEditPage() {
    const navigation = useNavigation();
    const user: any = useSelector((state: RootState) => state.user.info);
    const [emergencyList, setEmergencyList] = useState<any[]>([{}]);
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>

            {emergencyList.length > 0 ?

                <ScrollView style={styles.body}>
                    <View style={[styles.infoBox, { marginTop: 6 }]}>
                        <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.familyItemContent1}>
                                <Text style={styles.familyItemName}>张小红（女儿）</Text>
                                <Text style={styles.familyItemRelation}>13912344123</Text>
                            </View>
                            <TouchableOpacity>
                                <Image style={styles.editIcon} source={require('@/assets/images/user/del.png')} />
                            </TouchableOpacity>
                        </Flex>
                    </View>
                    <View style={[styles.infoBox, { marginTop: 6 }]}>
                        <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.familyItemContent1}>
                                <Text style={styles.familyItemName}>药物过敏</Text>
                                <Text style={styles.familyItemRelation}>北京大学人民医院</Text>
                            </View>
                            <TouchableOpacity>
                                <Image style={styles.editIcon} source={require('@/assets/images/user/del.png')} />
                            </TouchableOpacity>
                        </Flex>
                    </View>
                    <View style={[styles.infoBox, { marginTop: 6 }]}>
                        <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.familyItemContent1}>
                                <Text style={styles.familyItemName}>药物过敏</Text>
                                <Text style={styles.familyItemRelation}>北京大学人民医院</Text>
                            </View>
                            <TouchableOpacity>
                                <Image style={styles.editIcon} source={require('@/assets/images/user/del.png')} />
                            </TouchableOpacity>
                        </Flex>
                    </View>
                    <Text style={styles.emergencyText}>紧急联系人将在您遇到紧急情况时被通知，建议添加2-3位家人或朋友。</Text>
                </ScrollView>
                : <View style={[styles.body, { flex: 1 }]}>
                    <Flex style={{ flex: 1 }}>
                        <NoData />
                    </Flex>
                    <Text style={styles.emergencyText}>紧急联系人将在您遇到紧急情况时被通知，建议添加2-3位家人或朋友。</Text>
                </View>
            }

            <TouchableOpacity style={styles.addBtn}>
                <Flex justify='center' align='center' style={{ flex: 1 }}>
                    <Text style={styles.addText}>添加紧急联系人</Text>
                </Flex>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
