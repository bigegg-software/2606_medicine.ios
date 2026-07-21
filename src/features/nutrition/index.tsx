import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '@/common/theme';
import styles from '@/css/nutrition';
import DietPage from './components/DietPage';
import NutritionPrescriptionPage from './components/NutritionPrescriptionPage';


export default function CommunityPage() {
  const navigation: any = useNavigation();

  const [activeNav, setActiveNav] = useState(0);
  const pageList = [
    {
      title: '今日食谱',
      component: 'DietPage',
      icon: require('@/assets/images/nutrition/day.png'),

    },
    {
      title: '营养处方',
      component: 'NutritionPrescriptionPage',
      icon: require('@/assets/images/nutrition/cf.png'),
    }
  ]
  return (
    <PageLayout style={styles.container} edges={[]}>
      <View style={styles.topBox}>
        <Flex>
          <Image style={styles.topBoxImage} source={require('@/assets/images/nutrition/model.png')} />
          <Text style={styles.topBoxText}>阜外 My Nutrition 模型</Text>
        </Flex>
        <View style={styles.topNameBox}>
          <Flex style={{ marginTop: 7 }}>
            <Text style={styles.topNameText}>王建国</Text>
            <Flex style={styles.containerBox}>
              <Image style={styles.topNameImage} source={require('@/assets/images/nutrition/star.png')} />
              <Text style={styles.cfText}>处方V3</Text>
            </Flex>
          </Flex>
          <Flex style={styles.topInfoBox}>
            <Flex style={styles.brBox}>
              <Text style={styles.brText}>本人</Text>
            </Flex>
            <Text style={styles.topInfoText}>56岁 | 男 | 高血压 | 支架术后 | 目标76kg</Text>
          </Flex>
          <Image style={styles.rightImg} source={require('@/assets/images/nutrition/order.png')} />
        </View>
       
      </View>
      <Flex style={styles.navBox}>
          {pageList.map((page, index) => (
            <Flex
              key={index}
              style={[styles.navItem, activeNav === index && styles.activeNavItem]}
              justify='center'
              onPress={() => setActiveNav(index)}
            >
              <Image style={styles.navIcon} source={page.icon} />
              <Text style={[styles.navText, activeNav === index && styles.activeNavText]}>{page.title}</Text>
            </Flex>
          ))}
        </Flex>
      {activeNav === 0 ? (
        <DietPage />
      ) : (
        <NutritionPrescriptionPage />
      )}
    </PageLayout>
  );
}
