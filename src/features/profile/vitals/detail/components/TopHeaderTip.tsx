import React, { useMemo } from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/vitals/bloodPage';
import { useNavigation } from '@react-navigation/native';

export default function TopHeaderTip() {
    const navigation: any = useNavigation();

    return (
        <TouchableOpacity onPress={() => {
            navigation.navigate('ProfilePage');
        }}>
            <Flex justify='between' style={styles.headerTipBox}>
                <Flex>
                    <Image style={styles.headerTipIcon} source={require('@/assets/images/user/icon_warn.png')} />
                    <Text style={styles.headerTipText}>请完善个人信息以更好地分析数据</Text>
                </Flex>
                <Image style={styles.headerTipIcon} source={require('@/assets/images/user/icon_right.png')} />
            </Flex>
        </TouchableOpacity>
    );
}
