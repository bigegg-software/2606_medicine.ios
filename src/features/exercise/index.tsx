import React, { useCallback, useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import PageLayout from '@/src/components/PageLayout';
import { Flex } from '@ant-design/react-native';
import { useFocusEffect } from '@react-navigation/native';
import styles from '@/css/exercise';
import type { AppDispatch, RootState } from '@/store/store';
import { fetchUserBaseInfo } from '@/store/actions/user';
import { getDisplayUserName } from '@/src/utils/userHelpers';
import { formatExerciseUserInfoText } from './utils/exerciseHelpers';
import TrainingPage from './components/TrainingPage';
import PrescriptionPage from './components/PrescriptionPage';
import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { AppTheme } from '@/common/theme';
import { isUserBaseInfoComplete } from '@/src/features/profile/healthRecord/utils/profileCompletenessHelpers';
import CompleteProfileLink from '@/src/features/profile/healthRecord/components/CompleteProfileLink';


export default function CommunityPage() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.user.info);
  const systemUser = useSelector((s: RootState) => s.user.systemUser);
  const userExtr = useSelector((s: RootState) => s.user.userExtr);
  const displayName = getDisplayUserName(user, systemUser);
  const infoText = formatExerciseUserInfoText(user, userExtr);
  const profileComplete = isUserBaseInfoComplete(user);

  const [activeNav, setActiveNav] = useState(0);
  const [exerciseRule, setExerciseRule] = useState<InUseExPatientRule | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExerciseRule = useCallback(async () => {
    try {
      const res = await getInUseExPatientRuleInfo();
      if (!isResourceApiOk(res as unknown as { code?: number })) {
        setExerciseRule(null);
        return;
      }
      setExerciseRule(
        apiResourceData<InUseExPatientRule>(res as unknown as never) ?? null,
      );
    } catch {
      setExerciseRule(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void dispatch(fetchUserBaseInfo());
      void loadExerciseRule();
    }, [dispatch, loadExerciseRule]),
  );

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
              <Text style={styles.cfText}>--</Text>
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
      {loading && !exerciseRule ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      ) : !exerciseRule ? (
        <View style={styles.emptyPrescription}>
          <Image
            source={require('@/assets/images/exercise/icon_yd_empty.png')}
            style={styles.emptyPrescriptionIcon}
          />
          {profileComplete ? (
            <Text style={styles.emptyPrescriptionText}>
              暂无运动处方，如需开方，请联系工作人员
            </Text>
          ) : (
            <Flex style={styles.emptyPrescriptionTextRow}>
              <Text style={styles.emptyPrescriptionTextInline}>暂无运动处方，请先</Text>
              <CompleteProfileLink color='#6D925E' />
            </Flex>
          )}
        </View>
      ) : activeNav === 0 ? (
        <TrainingPage />
      ) : (
        <PrescriptionPage />
      )}
    </PageLayout>
  );
}
