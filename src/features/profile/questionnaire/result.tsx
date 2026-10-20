import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getUserQuestionDetail,
  type QuestionnaireType,
  type UserQuestionDetailResult,
  type UserQuestionRecord,
} from '@/api/questionTemplate';
import { AppTheme } from '@/common/theme';
import { apiResourceData } from '@/src/utils/apiHelpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import styles from '@/css/family/assessmentResult';
import { getFamilyRiskGaugeIcon } from '@/src/familyPage/FamilyData/utils/familyDataAssessmentHelpers';
import {
  formatAssessmentDate,
  formatHealthDiagnosisTip,
  formatHealthPrescriptionStatus,
  formatQuestionnaireScoreDisplay,
  getScoreLevel,
  getScoreTip,
  isUserHealthInfoQuestionnaire,
  QUESTIONNAIRE_TITLES,
} from './utils/helpers';

const DISCLAIMER_ICON = require('@/assets/family/data/icon_warn.png');

/** 提交后结果页：对齐教练端 questionnaire/results.vue */
export default function QuestionnaireResultPage({
  route,
}: {
  route: { params: { id: string; type: QuestionnaireType } };
}) {
  const { id, type } = route.params;
  const navigation: any = useNavigation();
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<UserQuestionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(async () => {
    if (!id) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = (await getUserQuestionDetail(id)) as unknown as UserQuestionDetailResult;
      setDetail(apiResourceData<UserQuestionRecord>(res) ?? null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const questionnaireType = (detail?.type ?? type) as QuestionnaireType | undefined;
  const isHealthInfo = isUserHealthInfoQuestionnaire(questionnaireType);
  const diagnosisResult = detail?.diagnosisResult ?? null;

  const scoreLevel = useMemo(() => {
    if (questionnaireType == null || detail?.score == null) return undefined;
    return getScoreLevel(questionnaireType, detail.score);
  }, [detail?.score, questionnaireType]);

  const levelText = isHealthInfo
    ? formatHealthPrescriptionStatus(diagnosisResult, detail?.score)
    : (scoreLevel?.result?.trim() || '--');

  const scoreTip =
    !isHealthInfo && questionnaireType != null && scoreLevel
      ? getScoreTip(questionnaireType, scoreLevel)
      : null;
  const healthTipText = isHealthInfo ? formatHealthDiagnosisTip(diagnosisResult) : '';
  const gaugeIcon = getFamilyRiskGaugeIcon(
    isHealthInfo
      ? (levelText.includes('有红旗') ? 'rowStatusError' : 'rowStatus')
      : scoreLevel?.statusStyle,
  );
  const typeTitle =
    questionnaireType != null ? QUESTIONNAIRE_TITLES[questionnaireType] : '评估问卷';
  const assessmentDate = detail ? formatAssessmentDate(detail) : '';
  const scoreText =
    questionnaireType != null
      ? formatQuestionnaireScoreDisplay(questionnaireType, detail?.score, diagnosisResult)
      : '--';

  if (loading) {
    return (
      <PageLayout style={styles.container}>
        <Flex justify="center" style={{ flex: 1 }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </Flex>
      </PageLayout>
    );
  }

  if (!detail) {
    return (
      <PageLayout style={styles.container}>
        <View style={styles.emptyWrap}>
          <EmptyRecord text="暂无评估结果" />
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container} edges={[]}>
      <View style={styles.pageContent}>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.resultCard}>
            <Flex justify="between" align="start" style={{ alignSelf: 'stretch' }}>
              <Text style={[styles.resultTitle, { flex: 1, marginRight: 12 }]}>
                {typeTitle}
              </Text>
              {assessmentDate ? (
                <Text style={[styles.resultTime, { marginTop: 0, textAlign: 'right' }]}>
                  测评时间：{assessmentDate}
                </Text>
              ) : null}
            </Flex>
            <View style={styles.resultGaugeOuter}>
              <View style={styles.resultGaugeInner}>
                <Image source={gaugeIcon} style={styles.resultGauge} resizeMode="contain" />
              </View>
            </View>
            <Text style={styles.resultLevel}>{levelText}</Text>
            {isHealthInfo ? (
              <View style={styles.resultTipBox}>
                <View style={styles.resultTipRow}>
                  <View style={styles.resultTipDot} />
                  <Text style={styles.resultTipText}>{healthTipText}</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.resultDivider} />
                <Flex style={styles.resultStatsRow}>
                  <View style={styles.resultStatItem}>
                    <Text style={styles.resultStatValue}>{scoreText}</Text>
                    <Text style={styles.resultStatLabel}>评分(分)</Text>
                  </View>
                </Flex>
                {scoreTip ? (
                  <View style={styles.resultTipBox}>
                    <View style={styles.resultTipRow}>
                      <View style={styles.resultTipDot} />
                      <Text style={styles.resultTipText}>{scoreTip.summary}</Text>
                    </View>
                    <View style={[styles.resultTipRow, styles.resultTipAdvice]}>
                      <View style={styles.resultTipDot} />
                      <Text style={styles.resultTipText}>{scoreTip.advice}</Text>
                    </View>
                  </View>
                ) : null}
              </>
            )}
          </View>
          <View style={styles.resultDisclaimer}>
            <Image
              source={DISCLAIMER_ICON}
              style={styles.resultDisclaimerIcon}
              resizeMode="contain"
            />
            <Text style={styles.resultDisclaimerText}>
              本结果仅为参考，不能替代专业医疗诊所建议
            </Text>
          </View>
        </ScrollView>
        <Flex
          justify="between"
          style={[styles.bottomBar, { height: 86 + insets.bottom, paddingBottom: insets.bottom }]}
        >
          <TouchableOpacity
            style={styles.bottomBarButtonCancel}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('QuestionnaireDetail', { id })}
          >
            <Flex justify="center" align="center" style={{ flex: 1 }}>
              <Text style={styles.bottomBarButtonTextCancel}>查看详情</Text>
            </Flex>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomBarButtonConfirm}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Flex justify="center" align="center" style={{ flex: 1 }}>
              <Text style={styles.bottomBarButtonTextConfirm}>返回列表</Text>
            </Flex>
          </TouchableOpacity>
        </Flex>
      </View>
    </PageLayout>
  );
}
