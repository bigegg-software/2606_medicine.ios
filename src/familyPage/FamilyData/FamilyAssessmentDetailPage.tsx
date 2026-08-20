import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getUserQuestionDetail,
  type UserQuestionDetailResult,
  type UserQuestionRecord,
} from '@/api/questionTemplate';
import qStyles from '@/css/questionnaire/index';
import resultStyles from '@/css/family/assessmentResult';
import { AppTheme } from '@/common/theme';
import { apiResourceData } from '@/src/utils/apiHelpers';
import type { RootStackParamList } from '@/route/router';
import {
  formatAssessmentDate,
  formatEq5dScore,
  getRiskPercent,
  getScoreLevel,
  QUESTIONNAIRE_TITLES,
} from '@/src/features/profile/questionnaire/utils/helpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import FamilyRelationHeaderBadge from '@/src/familyPage/components/FamilyRelationHeaderBadge';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import { getFamilyRiskGaugeIcon } from './utils/familyDataAssessmentHelpers';
import { renderFamilyAssessmentQuestionBlock } from './utils/familyAssessmentDetailHelpers';

type Route = RouteProp<RootStackParamList, 'FamilyAssessmentDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyAssessmentDetailPage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;
  const { patientUserId = '', relationLabel, viewNavParams } = resolveFamilyReadOnlyView(
    route.params,
  );
  const [detail, setDetail] = useState<UserQuestionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const boundPatientUserIdRef = useRef(patientUserId);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <FamilyRelationHeaderBadge label={relationLabel} />,
    });
  }, [navigation, relationLabel]);

  // 切换家人后回到该家人的评估历史
  useEffect(() => {
    if (!patientUserId || patientUserId === boundPatientUserIdRef.current) return;
    boundPatientUserIdRef.current = patientUserId;
    navigation.replace('FamilyAssessmentHistory', {
      patientUserId,
      ...(viewNavParams ?? {}),
    });
  }, [navigation, patientUserId, viewNavParams]);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await getUserQuestionDetail(id, {
        patientUserId,
      })) as unknown as UserQuestionDetailResult;
      setDetail(apiResourceData<UserQuestionRecord>(res) ?? null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, patientUserId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const scoreLevel = useMemo(() => {
    if (detail?.type == null || detail.score == null) return undefined;
    return getScoreLevel(detail.type, detail.score);
  }, [detail]);

  const resultText = scoreLevel?.result?.trim() || '--';
  const gaugeIcon = getFamilyRiskGaugeIcon(scoreLevel?.statusStyle);
  const riskPercent =
    detail?.type != null && detail.score != null
      ? getRiskPercent(detail.type, detail.score)
      : 0;
  const scoreText =
    detail?.score != null
      ? detail.type === 3
        ? formatEq5dScore(detail.score)
        : String(detail.score)
      : '--';
  const title =
    detail?.type != null ? QUESTIONNAIRE_TITLES[detail.type] : '评估问卷';
  const assessmentDate = detail ? formatAssessmentDate(detail) : '';

  if (loading) {
    return (
      <PageLayout style={resultStyles.container}>
        <Flex justify="center" style={{ flex: 1 }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </Flex>
      </PageLayout>
    );
  }

  if (!detail) {
    return (
      <PageLayout style={resultStyles.container}>
        <View style={resultStyles.emptyWrap}>
          <EmptyRecord text="暂无问卷详情" />
        </View>
      </PageLayout>
    );
  }

  const questionsAnswer = detail.questionsAnswer ?? [];

  return (
    <PageLayout style={resultStyles.container}>
      <ScrollView contentContainerStyle={[resultStyles.body, { paddingBottom: 24 }]}>
        <View style={resultStyles.resultCard}>
          <Text style={resultStyles.resultTitle}>{title}</Text>
          <View style={resultStyles.resultGaugeOuter}>
            <View style={resultStyles.resultGaugeInner}>
              <Image source={gaugeIcon} style={resultStyles.resultGauge} resizeMode="contain" />
            </View>
          </View>
          <Text style={resultStyles.resultLevel}>{resultText}</Text>
          {assessmentDate ? (
            <Text style={resultStyles.resultTime}>评估时间：{assessmentDate}</Text>
          ) : null}
          <View style={resultStyles.resultDivider} />
          <Flex style={resultStyles.resultStatsRow}>
            <View style={resultStyles.resultStatItem}>
              <Text style={resultStyles.resultStatValue}>{riskPercent}</Text>
              <Text style={resultStyles.resultStatLabel}>风险评分(%）</Text>
            </View>
            <View style={resultStyles.resultStatItem}>
              <Text style={resultStyles.resultStatValue}>{scoreText}</Text>
              <Text style={resultStyles.resultStatLabel}>总分(分)</Text>
            </View>
          </Flex>
        </View>
        <View style={resultStyles.answerCard}>
          <Text style={resultStyles.answerCardTitle}>作答详情</Text>
          {questionsAnswer.length > 0
            ? questionsAnswer.map((item, index) =>
                renderFamilyAssessmentQuestionBlock(item, index, detail.type),
              )
            : null}
        </View>

        <Text style={qStyles.detailBottomText}>本结果仅为参考，不能替代专业医疗诊所建议</Text>
      </ScrollView>
    </PageLayout>
  );
}
