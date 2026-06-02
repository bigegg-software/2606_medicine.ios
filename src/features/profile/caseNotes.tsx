import React, { useEffect, useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import { AppTheme } from '@/common/theme';
import { useNavigation } from '@react-navigation/native';
import styles from '@/css/profile/healthRecord';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';



export default function ProfileEditPage() {
    const navigation:any = useNavigation();
    const user: any = useSelector((state: RootState) => state.user.info);
    const [activeNav, setActiveNav] = useState('all');
    const navList = [
        {
            label: '全部',
            value: 'all'
        },
        {
            label: '住院',
            value: 'hospital'
        },
        {
            label: '门诊',
            value: 'outpatient'
        }
    ]

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.topBox}>
                <Flex style={styles.inputBox}>
                    <Image style={styles.inputIcon} source={require('@/assets/images/user/fdj.png')} />
                    <TextInput style={styles.inputText} placeholder='请输入病例名称' placeholderTextColor={AppTheme.textPrimary} />
                </Flex>

                <Flex style={styles.navBox}>
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
            </View >
            <ScrollView contentContainerStyle={styles.body}>
                <View style={styles.caseBox}>
                    <Flex justify='between' style={styles.caseTopBox}>
                        <Text style={styles.caseTitle}>高血压</Text>
                        <Text style={styles.caseTime}>2026-05-21</Text>
                    </Flex>
                    <View style={styles.caseLine}></View>
                    <View style={styles.caseContentBox}>
                        <Flex justify="between">
                            <Text style={styles.caseContentText}>医院：北京大学人民医院</Text>
                            <Text style={styles.caseContentText}>科室：神经内科</Text>
                        </Flex>
                        <Flex justify="between">
                            <Text style={styles.caseContentText}>主治医师：李医生</Text>
                            <Text style={styles.caseContentText}>主治医师：李医生</Text>
                        </Flex>
                    </View>
                </View>
                <View style={styles.caseBox}>
                    <Flex justify='between' style={styles.caseTopBox}>
                        <Text style={styles.caseTitle}>2型糖尿病复查</Text>
                        <Text style={styles.caseTime}>2026-05-21</Text>
                    </Flex>
                    <View style={styles.caseLine}></View>
                    <View style={styles.caseContentBox}>
                        <Flex justify="between">
                            <Text style={styles.caseContentText}>医院：北京大学人民医院</Text>
                            <Text style={styles.caseContentText}>科室：神经内科</Text>
                        </Flex>
                        <Flex justify="between">
                            <Text style={styles.caseContentText}>主治医师：李医生</Text>
                            <Text style={styles.caseContentText}>主治医师：李医生</Text>
                        </Flex>
                    </View>
                </View>

            </ScrollView>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CaseAdd')}>
                <Flex justify='center' align='center' style={{ flex: 1 }}>
                    <Text style={styles.addText}>添加病例</Text>
                </Flex>
            </TouchableOpacity>
        </SafeAreaView >
    );
}
