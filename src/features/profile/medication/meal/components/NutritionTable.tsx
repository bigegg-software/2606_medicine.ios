import React from 'react';
import { Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/medication/deal/mealResult';
import {
    chunkPairs,
    formatNutritionValue,
    type NutritionEntry,
} from '@/src/features/profile/medication/meal/utils/mealNutritionHelpers';

function NutritionCol({ entry }: { entry: NutritionEntry }) {
    return (
        <Flex style={styles.colBox} justify="between">
            <Text style={styles.wssText}>{entry.label}</Text>
            <Text style={styles.wssValue}>{formatNutritionValue(entry.value, entry.unit)}</Text>
        </Flex>
    );
}

export default function NutritionTable({
    entries,
    isContinuation = false,
}: {
    entries: NutritionEntry[];
    isContinuation?: boolean;
}) {
    const rows = chunkPairs(entries);
    if (rows.length === 0) {
        return null;
    }

    return (
        <View style={isContinuation ? styles.expandSection : styles.nutritionTable}>
            {rows.map((row, rowIndex) => (
                <Flex
                    key={row.map(item => item.key).join('-')}
                    justify="between"
                    style={rowIndex > 0 || isContinuation ? styles.expandRow : styles.btmBox}>
                    {row.map(entry => (
                        <NutritionCol key={entry.key} entry={entry} />
                    ))}
                    {row.length === 1 ? <View style={styles.colBox} /> : null}
                </Flex>
            ))}
        </View>
    );
}
