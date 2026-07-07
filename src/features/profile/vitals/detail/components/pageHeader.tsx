import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/vitals/bloodPage';
type VitalsChartRange = 'today' | 'week' | 'month';

const TYPE_LIST: { label: string; value: VitalsChartRange }[] = [
    { label: '今日', value: 'today' },
    { label: '近7天', value: 'week' },
    { label: '近30天', value: 'month' },
];

type Props = {
    selectedType: VitalsChartRange;
    onSelectedTypeChange: (value: VitalsChartRange) => void;
};

export default function PageHeader({ selectedType, onSelectedTypeChange }: Props) {
    return (
        <Flex style={styles.typeListBox}>
            {TYPE_LIST.map((item) => (
                <TouchableOpacity style={selectedType === item.value ? styles.typeItemActive : styles.typeItem} key={item.value} onPress={() => {
                    onSelectedTypeChange(item.value);
                }}>
                    <Flex justify='center' style={{ flex: 1 }}>
                        <Text style={styles.typeItemText}>{item.label}</Text>
                    </Flex>
                </TouchableOpacity>
            ))}
        </Flex>
    );
}
