import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styles from '@/css/chronicDisease/detail';
import type { RootStackParamList } from '@/route/router';
import type { AssociatedMedicationRow } from './chronicData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
    medications: AssociatedMedicationRow[];
    recordId?: number;
};

export default function MedicationPlanSection({ medications, recordId }: Props) {
    const navigation = useNavigation<Nav>();

    return (
        <>
            <Flex justify="between" style={{ marginTop: 18 }}>
                <Text style={styles.sectionTitle}>用药方案</Text>
            </Flex>
            <View style={styles.infoBox}>
                {medications.length === 0 ? (
                    <Text style={styles.emptyText}>暂无关联用药</Text>
                ) : (
                    medications.map((item, index) => (
                        <Flex
                            key={item.key}
                            justify="between"
                            align="center"
                            style={index > 0 ? { marginTop: 19 } : undefined}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                                <Flex align="center">
                                    <Text style={styles.medicationName}>{item.name}</Text>
                                    <Flex style={item.planType === 1 ? styles.planBadgeCF : styles.planBadgeGR}>
                                        <Text
                                            style={
                                                item.planType === 1 ? styles.planBadgeCFText : styles.planBadgeGRText
                                            }>
                                            {item.planTypeLabel}
                                        </Text>
                                    </Flex>
                                </Flex>
                                <Text style={[styles.medicationTimeText, { marginLeft: 0, marginTop: 6 }]}>
                                    {item.doseText}
                                </Text>
                            </View>
                            <Flex style={item.taken ? styles.yfy : styles.dfy}>
                                <Text style={item.taken ? styles.yfyText : styles.dfyText}>
                                    {item.taken ? '已服用' : '待服用'}
                                </Text>
                            </Flex>
                        </Flex>
                    ))
                )}
            </View>
        </>
    );
}
