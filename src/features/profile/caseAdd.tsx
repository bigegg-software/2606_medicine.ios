import React from 'react';
import { useState } from 'react';
import { Text, Image, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/profile/caseAdd';
import DashedBorderBox from './components/DashedBorderBox';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/common/theme';


export default function CaseAddPage() {
    const navigation: any = useNavigation();

    const [type, setType] = useState('门诊');
    const typeList = [
        {
            label: '门诊',
            value: '门诊'
        },
        {
            label: '住院',
            value: '住院'
        },
        {
            label: '体检',
            value: '体检'
        },
        {
            label: '其他',
            value: '其他'
        }
    ]
    const ksList = [
        {
            label: "心血管内科",
            value: "心血管内科"
        },
        {
            label: "神经内科",
            value: "神经内科"
        },
        {
            label: "内分泌科",
            value: "内分泌科"
        },
        {
            label: "消化内科",
            value: "消化内科"
        },
        {
            label: "呼吸内科",
            value: "呼吸内科"
        },
        {
            label: "肾脏内科",
            value: "肾脏内科"
        }
    ]

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.sectionTitle}>个人信息</Text>
                <Flex justify='between' style={styles.cameraBoxRow}>
                    <TouchableOpacity style={styles.cameraBox}>
                        <DashedBorderBox style={{ flex: 1 }}>
                            <Image source={require('@/assets/images/user/camera.png')} style={styles.cameraIcon} />
                            <Text style={styles.cameraBoxText}>拍照识别</Text>
                        </DashedBorderBox>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cameraBox}>
                        <DashedBorderBox style={{ flex: 1 }}>
                            <Image source={require('@/assets/images/user/upload.png')} style={styles.cameraIcon} />
                            <Text style={styles.cameraBoxText}>上传照片</Text>
                        </DashedBorderBox>
                    </TouchableOpacity>
                </Flex>
                <Text style={styles.sectionTitle}>手动录入</Text>


                <View style={styles.rowBox}>
                    <View>
                        <Text style={styles.rowTitle}>就诊类型</Text>
                        <Flex justify='between' style={styles.rowContent}>
                            {typeList.map((item, index) => (
                                <TouchableOpacity style={[styles.typeItem, type === item.value && styles.typeItemActive]} key={index} onPress={() => setType(item.value)}>
                                    <Flex style={{ flex: 1 }}>
                                        <Text style={[styles.typeItemText, type === item.value && styles.typeItemTextActive]}>{item.label}</Text>
                                    </Flex>
                                </TouchableOpacity>
                            ))}
                        </Flex>
                    </View>
                    <View style={styles.rowLine}></View>

                    <Flex justify='between'>
                        <Text style={styles.rowTitle}>就诊日期</Text>
                        <TouchableOpacity>
                            <Flex>
                                <Text style={styles.tqText}>2026-06-02</Text>
                                <Image source={require('@/assets/images/user/icon-rl.png')} style={styles.arrowIcon} />
                            </Flex>
                        </TouchableOpacity>
                    </Flex>
                    <View style={styles.rowLine}></View>
                    <View>
                        <Text style={styles.rowTitle}>医院名称</Text>
                        <TextInput style={styles.inputBox} placeholder="请输入医院名称" placeholderTextColor={AppTheme.textSecondary} />
                    </View>
                    <View style={styles.rowLine}></View>
                    <View>
                        <Text style={styles.rowTitle}>就诊科室</Text>
                        <TextInput style={styles.inputBox} placeholder="请输入科室" placeholderTextColor={AppTheme.textSecondary} />
                    </View>
                    <View style={styles.rowLine}></View>
                    <ScrollView horizontal style={styles.ksList} showsHorizontalScrollIndicator={false}>
                        {ksList.map((item, index) => (
                            <TouchableOpacity style={styles.ksItem} key={index}>
                                <Flex style={{ flex: 1 }}>
                                    <Text style={styles.ksItemText}>{item.label}</Text>
                                </Flex>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View>
                        <Text style={styles.rowTitle}>诊断结果</Text>
                        <TextInput style={styles.inputBox} placeholder="请输入诊断结果" placeholderTextColor={AppTheme.textSecondary} />
                    </View>
                    <View style={styles.rowLine}></View>
                    <View>
                        <Text style={styles.rowTitle}>主治医生（选填）</Text>
                        <TextInput style={styles.inputBox} placeholder="请输入医生姓名" placeholderTextColor={AppTheme.textSecondary} />
                    </View>
                    <View style={styles.rowLine}></View>
                    <View>
                        <Text style={styles.rowTitle}>病情摘要（选填）</Text>
                        <TextInput style={styles.inputBox} placeholder="简要描述病情和治疗情况" placeholderTextColor={AppTheme.textSecondary} />
                    </View>
                    <View style={styles.rowLine}></View>
                    <View>
                        <Text style={styles.rowTitle}>上传附件（选填）</Text>
                        <Text style={styles.inputBox}>点击上传检查报告、处方等</Text>
                        <TouchableOpacity style={styles.uploadIcon}>
                            <Flex style={{ flex: 1 }} justify='center' align='center'>
                                <MaterialIcons name="add" size={24} color={AppTheme.textSecondary} />
                            </Flex>
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => {}}>
                    <Flex justify='center' align='center' style={{ flex: 1 }}>
                        <Text style={styles.addText}>添加病例</Text>
                    </Flex>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>

    );
}
