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
import { MaterialIcons } from '@expo/vector-icons';



export default function ProfileEditPage() {
    const navigation: any = useNavigation();
    const user: any = useSelector((state: RootState) => state.user.info);


    const avatarOssUrl = String(user.avatarOssUrl ?? '');
    const name = user.name ?? '';
    return (
        <ScrollView contentContainerStyle={styles.body}>
            <Flex direction="column" justify='center' align='center'>
                {avatarOssUrl ? (
                    <Image source={{ uri: avatarOssUrl }} style={styles.avatarImg} />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{name[0] ?? 'U'}</Text>
                    </View>
                )}
                <Text style={styles.name}>{name}</Text>
            </Flex>

            <Flex justify='between' style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>个人信息</Text>
                <TouchableOpacity>
                    <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                </TouchableOpacity>
            </Flex>

            <View style={styles.infoBox}>
                <Flex justify="between" style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>性别</Text>
                    <Text style={styles.infoItemValue}>{user.gender}</Text>
                </Flex>
                <Flex justify="between" style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>出生日期</Text>
                    <Text style={styles.infoItemValue}>{user.birthDate}</Text>
                </Flex>
                <Flex justify="between" style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>年龄</Text>
                    <Text style={styles.infoItemValue}>{user.age}</Text>
                </Flex>
                <Flex justify="between" style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>身高</Text>
                    <Text style={styles.infoItemValue}>{user.height}</Text>
                </Flex>
                <Flex justify="between" style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>体重</Text>
                    <Text style={styles.infoItemValue}>{user.weight}</Text>
                </Flex>
                <Flex justify="between" style={styles.infoItem}>
                    <Text style={styles.infoItemLabel}>血型</Text>
                    <Text style={styles.infoItemValue}>{user.bloodType}</Text>
                </Flex>
                <Flex justify="between" style={[styles.infoItem, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoItemLabel}>手机号</Text>
                    <Text style={styles.infoItemValue}>--</Text>
                </Flex>
            </View>

            <Flex justify='between' style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>紧急联系人</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Emergency')}>
                    <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                </TouchableOpacity>
            </Flex>

            <View style={styles.infoBox}>
                {/* <Flex justify='between' style={styles.familyItem}>
                    <View>
                        <Text style={styles.familyItemName}>张小红（女儿）</Text>
                        <Text style={styles.familyItemRelation}>已授权4项权限</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                </Flex>
                <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                    <View>
                        <Text style={styles.familyItemName}>张小红（女儿）</Text>
                        <Text style={styles.familyItemRelation}>已授权4项权限</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                </Flex> */}
                <TouchableOpacity onPress={() => { }}>
                    <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                        <View>
                            <Text style={styles.familyItemName}>点击添加联系人</Text>
                            <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                    </Flex>
                </TouchableOpacity>
            </View>

            <Flex justify='between' style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>病例记录</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CaseNotes')}>
                    <Text style={styles.more}>查看全部</Text>
                </TouchableOpacity>
            </Flex>

            <View style={styles.infoBox}>
                <Flex justify='between' style={styles.familyItem}>
                    <Flex>
                        <Flex justify='center' align='center' style={styles.imgBox}>
                            <Image style={styles.imgItem} source={require('@/assets/images/user/hospital1.png')} />
                        </Flex>
                        <View style={styles.familyItemContent}>
                            <Text style={styles.familyItemName}>脑卒（住院）</Text>
                            <Text style={styles.familyItemRelation}>北京大学人民医院</Text>
                        </View>
                    </Flex>
                    <Text style={styles.familyItemRelation}>2026-05-21</Text>
                </Flex>
                <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                    <Flex>
                        <Flex justify='center' align='center' style={styles.imgBox}>
                            <Image style={styles.imgItem} source={require('@/assets/images/user/hospital.png')} />
                        </Flex>
                        <View style={styles.familyItemContent}>
                            <Text style={styles.familyItemName}>2型糖尿病（门诊）</Text>
                            <Text style={styles.familyItemRelation}>北京协和医院</Text>
                        </View>
                    </Flex>
                    <Text style={styles.familyItemRelation}>2026-05-21</Text>
                </Flex>
                <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                    <Flex>
                        <Flex justify='center' align='center' style={styles.imgBox}>
                            <Image style={styles.imgItem} source={require('@/assets/images/user/hospital.png')} />
                        </Flex>
                        <View style={styles.familyItemContent}>
                            <Text style={styles.familyItemName}>2型糖尿病（门诊）</Text>
                            <Text style={styles.familyItemRelation}>北京大学人民医院</Text>
                        </View>
                    </Flex>
                    <Text style={styles.familyItemRelation}>2026-05-21</Text>
                </Flex>
                {/* <TouchableOpacity onPress={() => { }}>
                    <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                        <Flex>
                            <Flex justify='center' align='center' style={styles.imgBox}>
                                <Image style={styles.imgItem} source={require('@/assets/images/user/user.png')} />
                            </Flex>
                            <View style={styles.familyItemContent}>
                                <Text style={styles.familyItemName}>点击添加联系人</Text>
                                <Text style={styles.familyItemRelation}>暂未添加联系人</Text>
                            </View>
                        </Flex>
                        <MaterialIcons name="chevron-right" size={24} color={AppTheme.textSecondary} />
                    </Flex>
                </TouchableOpacity> */}
            </View>
            <Flex justify='between' style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>过敏史</Text>
                <TouchableOpacity>
                    <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                </TouchableOpacity>
            </Flex>
            <View style={styles.infoBox}>
                <Flex justify='between' style={styles.familyItem}>
                    <Flex>
                        <Image style={styles.imgItem} source={require('@/assets/images/user/icon1.png')} />
                        <View style={styles.familyItemContent}>
                            <Text style={styles.familyItemName}>药物过敏</Text>
                        </View>
                    </Flex>
                    <Text style={styles.infoItemValue}>青霉素</Text>
                </Flex>
                <Flex justify='between' style={styles.familyItem}>
                    <Flex>
                        <Image style={styles.imgItem} source={require('@/assets/images/user/icon2.png')} />
                        <View style={styles.familyItemContent}>
                            <Text style={styles.familyItemName}>食物过敏</Text>
                        </View>
                    </Flex>
                    <Text style={styles.infoItemValue}>无</Text>
                </Flex>
                <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                    <Flex>
                        <Image style={styles.imgItem} source={require('@/assets/images/user/icon3.png')} />
                        <View style={styles.familyItemContent}>
                            <Text style={styles.familyItemName}>其他过敏</Text>
                        </View>
                    </Flex>
                    <Text style={styles.infoItemValue}>花粉</Text>
                </Flex>
            </View>
            <Flex justify='between' style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>家族病史</Text>
                <TouchableOpacity>
                    <Image style={styles.editIcon} source={require('@/assets/images/user/edit.png')} />
                </TouchableOpacity>
            </Flex>
            <View style={styles.infoBox}>
                <Flex justify='between' style={styles.familyItem}>
                    <Text style={styles.familyItemName}>父亲（在世）</Text>
                    <Text style={styles.infoItemValue}>高血压、冠心病</Text>
                </Flex>
                <Flex justify='between' style={[styles.familyItem, { borderBottomWidth: 0 }]}>
                    <Text style={styles.familyItemName}>母亲（在世）</Text>
                    <Text style={styles.infoItemValue}>糖尿病</Text>
                </Flex>
            </View>
        </ScrollView>
    );
}
