import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, ImageBackground, TextInput, Keyboard, Platform, type KeyboardEvent } from 'react-native'
import { Flex } from '@ant-design/react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import styles from '@/css/exercise'


export default function NutritionPrescriptionPage() {


    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={[styles.scroll, { paddingHorizontal: 0 }]}
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled">
             
          </ScrollView>
        </View>
    )
}
