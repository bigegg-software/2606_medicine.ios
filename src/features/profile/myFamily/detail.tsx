import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex, Switch } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/myFamilyDetail';
import type { RootStackParamList } from '@/route/router';
import {
    FAMILY_PERMISSION_DETAIL_OPTIONS,
    type FamilyPermissionKey,
} from './utils/myFamilyAddHelpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MyFamilyDetailPage() {
    const navigation = useNavigation<Nav>();
    const [enabledPermissions, setEnabledPermissions] = useState<FamilyPermissionKey[]>(
        FAMILY_PERMISSION_DETAIL_OPTIONS.map(item => item.key),
    );

    const handleToggle = (key: FamilyPermissionKey, checked: boolean) => {
        setEnabledPermissions(prev => {
            const has = prev.includes(key);
            if (checked && !has) {
                return [...prev, key];
            }
            if (!checked && has) {
                return prev.filter(item => item !== key);
            }
            return prev;
        });
    };

    return (
        <PageLayout style={styles.container} edges={[]}>
            <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
                <Flex justify="between" align="center" style={styles.rowBox}>
                    <Flex align="center">
                        <Image style={styles.rowBoxIcon} source={require('@/assets/images/family/family.png')} />
                        <View style={styles.rowBoxContent}>
                            <Text style={styles.rowBoxName}>王剑虹</Text>
                            <Flex align="center" style={styles.rowBoxTextWrap}>
                                <Image style={styles.iconLj} source={require('@/assets/images/family/icon_lj.png')} />
                                <Text style={styles.rowBoxText}>父亲·138****8888</Text>
                            </Flex>
                            <Flex align="center" style={styles.rowBoxTextWrap2}>
                                <Text style={styles.rowBoxText2}>已授权</Text>
                                <Text style={styles.rowBoxText3}>·添加于2026/06/23</Text>
                            </Flex>
                        </View>
                    </Flex>
                    <Image style={styles.rightImg} source={require('@/assets/images/family/fz.png')} />
                </Flex>

                <Text style={styles.rowBoxInfoText}>授权权限（点击开关即可修改）</Text>

                <View style={[styles.rowBox, styles.permissionBox]}>
                    {FAMILY_PERMISSION_DETAIL_OPTIONS.map((item, index) => {
                        const checked = enabledPermissions.includes(item.key);
                        const isLast = index === FAMILY_PERMISSION_DETAIL_OPTIONS.length - 1;
                        return (
                            <Flex
                                key={item.key}
                                align="center"
                                justify="between"
                                style={[
                                    styles.rowBoxInfoItem,
                                    !isLast && styles.rowBoxInfoItemBorder,
                                ]}>
                                <Flex align="center" style={styles.rowBoxInfoItemLeft}>
                                    <Image
                                        style={styles.rowBoxInfoItemIcon}
                                        source={item.icon}
                                        tintColor="#333333"
                                    />
                                    <View style={styles.rowBoxInfoItemText}>
                                        <Text style={styles.rowBoxInfoItemTitle}>{item.detailTitle}</Text>
                                        <Text style={styles.rowBoxInfoItemDesc}>{item.detailDesc}</Text>
                                    </View>
                                </Flex>
                                <Switch
                                    style={styles.permissionSwitch}
                                    checked={checked}
                                    onChange={next => handleToggle(item.key, next)}
                                    color={AppTheme.primaryColor}
                                />
                            </Flex>
                        );
                    })}
                </View>
                <Text style={styles.rowBoxInfoText}>危险操作</Text>
                <TouchableOpacity
                    style={styles.dangerBtnRevoke}
                    activeOpacity={0.8}
                    onPress={() => setEnabledPermissions([])}>
                    <Flex justify='center'>
                        <Image style={styles.dangerBtnRevokeIcon} source={require("@/assets/images/family/sz.png")} />
                        <Text style={styles.dangerBtnRevokeText}>解除全部授权（保留家人关系）</Text>
                    </Flex>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerBtnDelete} activeOpacity={0.8} onPress={() => { }}>
                    <Flex justify='center'>
                        <Image style={styles.dangerBtnRevokeIcon} source={require("@/assets/images/family/del.png")} />
                        <Text style={styles.dangerBtnDeleteText}>删除家人（移除后须重新添加）</Text>
                    </Flex>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomBarButtonLeft}
                    activeOpacity={0.7}
                    onPress={() => {
                        navigation.goBack();
                    }}>
                    <Flex style={{ flex: 1 }}>
                        <Image
                            style={styles.bottomBarButtonImg}
                            source={require('@/assets/images/schedule/save.png')}
                        />
                        <Text style={styles.bottomBarButtonTextLeft}>保存修改</Text>
                    </Flex>
                </TouchableOpacity>
            </View>
        </PageLayout>
    );
}
