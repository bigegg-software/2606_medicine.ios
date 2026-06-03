import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getMedicalRecordFrontList, type MedicalRecord } from '@/api/medicalRecord';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/allergies';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { getResourceRows } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import moment from 'moment';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AllergiesPage() {
    const navigation = useNavigation<Nav>();
    const user = useSelector((state: RootState) => state.user.info);
    const [records, setRecords] = useState<MedicalRecord[]>([]);

    const loadRecords = useCallback(async () => {
        try {
            const res = await getMedicalRecordFrontList({ pageNum: 1, pageSize: 3 });
            setRecords(getResourceRows(res as { code?: number; rows?: MedicalRecord[] }));
        } catch {
            setRecords([]);
        }
    }, []);

    const loadRecordsRef = useRef(loadRecords);
    loadRecordsRef.current = loadRecords;

    const hasMountedRef = useRef(false);

    useEffect(() => {
        loadRecordsRef.current();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            loadRecordsRef.current();
        }, []),
    );


    const avatarOssUrl = String(user?.avatarOssUrl ?? '');
    const name = user?.name ?? '';

    const birthMoment = moment(user?.birthDate, 'YYYYMMDD', true);
    const birthDate = birthMoment.isValid() ? birthMoment.format('YYYY-MM-DD') : '--';
    const age = birthMoment.isValid() ? moment().diff(birthMoment, 'years') : '--';
    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.body}>
                <Flex justify='between' style={styles.sectionBox}>
                    <Flex>
                        <Image style={styles.imgItem} source={require('@/assets/images/user/icon1.png')} />
                        <Text style={styles.sectionTitle}>药物过敏</Text>
                    </Flex>
                    <TouchableOpacity>
                        <Text style={styles.more}>添加</Text>
                    </TouchableOpacity>
                </Flex>
                <View style={styles.listBox}>
                    <Flex justify='between' style={styles.infoBox}>
                        <View>
                            <Flex>
                                <Text style={styles.mapItemName}>青霉素</Text>
                                <Flex style={styles.mapItemValueBox}>
                                    <Text style={styles.mapItemValue}>严重</Text>
                                </Flex>
                            </Flex>
                            <Text style={styles.mapItemSubtitle}>症状：皮疹、呼吸困难</Text>
                        </View>
                        <Image style={styles.delIcon} source={require('@/assets/images/user/del.png')} />
                    </Flex>
                </View>
                <Flex justify='between' style={styles.sectionBox}>
                    <Flex>
                        <Image style={styles.imgItem} source={require('@/assets/images/user/icon2.png')} />
                        <Text style={styles.sectionTitle}>食物过敏</Text>
                    </Flex>
                    <TouchableOpacity>
                        <Text style={styles.more}>添加</Text>
                    </TouchableOpacity>
                </Flex>
                <View style={styles.listBox}>
                    <Flex justify='between' style={styles.infoBox}>
                        <View>
                            <Flex>
                                <Text style={styles.mapItemName}>青霉素</Text>
                                <Flex style={styles.mapItemValueBox}>
                                    <Text style={styles.mapItemValue}>严重</Text>
                                </Flex>
                            </Flex>
                            <Text style={styles.mapItemSubtitle}>症状：皮疹、呼吸困难</Text>
                        </View>
                        <Image style={styles.delIcon} source={require('@/assets/images/user/del.png')} />
                    </Flex>
                </View>
                <Flex justify='between' style={styles.sectionBox}>
                    <Flex>
                        <Image style={styles.imgItem} source={require('@/assets/images/user/icon3.png')} />
                        <Text style={styles.sectionTitle}>其他过敏</Text>
                    </Flex>
                    <TouchableOpacity>
                        <Text style={styles.more}>添加</Text>
                    </TouchableOpacity>
                </Flex>
                <View style={styles.listBox}>
                    <Flex justify='between' style={styles.infoBox}>
                        <View>
                            <Flex>
                                <Text style={styles.mapItemName}>青霉素</Text>
                                <Flex style={styles.mapItemValueBox}>
                                    <Text style={styles.mapItemValue}>严重</Text>
                                </Flex>
                            </Flex>
                            <Text style={styles.mapItemSubtitle}>症状：皮疹、呼吸困难</Text>
                        </View>
                        <Image style={styles.delIcon} source={require('@/assets/images/user/del.png')} />
                    </Flex>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
