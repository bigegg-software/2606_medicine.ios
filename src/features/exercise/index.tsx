import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/exercise';
import type { RootState } from '@/store/store';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import { formatExerciseUserInfoText } from './utils/exerciseHelpers';
import TrainingPage from './components/TrainingPage';
import PrescriptionPage from './components/PrescriptionPage';


export default function CommunityPage() {
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const userExtr = useSelector((s: RootState) => s.user.userExtr);
  const displayName = getDisplayUserName(user, systemUser);
  const infoText = formatExerciseUserInfoText(user, userExtr);

  const [activeNav, setActiveNav] = useState(0);
  const pageList = [
    {
      title: '今日训练',
      component: 'TrainingPage',
      icon: require('@/assets/images/exercise/model.png'),

    },
    {
      title: '运动处方',
      component: 'PrescriptionPage',
      icon: require('@/assets/images/exercise/sport.png'),
    }
  ]
  return (
    <PageLayout style={styles.container} edges={[]}>
      <View style={styles.topBox}>
        <Flex>
          <Image style={styles.topBoxImage} source={require('@/assets/images/nutrition/model.png')} />
          <Text style={styles.topBoxText}>北体运动模型</Text>
        </Flex>
        <View style={styles.topNameBox}>
          <Flex style={{ marginTop: 7 }}>
            <Text style={styles.topNameText}>{displayName}</Text>
            <Flex style={styles.containerBox}>
              <Image style={styles.topNameImage} source={require('@/assets/images/nutrition/star.png')} />
              <Text style={styles.cfText}>处方V3</Text>
            </Flex>
          </Flex>
          <Flex style={styles.topInfoBox}>
            <Flex style={styles.brBox}>
              <Text style={styles.brText}>本人</Text>
            </Flex>
            <Text style={styles.topInfoText}>{infoText}</Text>
            {/* <Text style={styles.topInfoText}>56岁 | 男 | 高血压 | 支架术后 | 目标76kg</Text> */}
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
        <TrainingPage />
      ) : (
        <PrescriptionPage />
      )}
    </PageLayout>
  );
}
