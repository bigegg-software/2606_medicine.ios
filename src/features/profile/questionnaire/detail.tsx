import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Flex } from '@ant-design/react-native';
import PageLayout from '@/src/components/PageLayout';
import {
  getUserQuestionDetail,
  type UserQuestionDetailResult,
  type UserQuestionRecord,
} from '@/api/questionTemplate';
import qStyles from '@/css/questionnaire/index';
import resultStyles from '@/css/family/assessmentResult';
import { AppTheme } from '@/common/theme';
import { apiResourceData } from '@/src/utils/apiHelpers';
import EmptyRecord from '@/src/components/EmptyRecord';
import { getFamilyRiskGaugeIcon } from '@/src/familyPage/FamilyData/utils/familyDataAssessmentHelpers';
import { renderFamilyAssessmentQuestionBlock } from '@/src/familyPage/FamilyData/utils/familyAssessmentDetailHelpers';
import {
  formatAssessmentDate,
  formatHealthDiagnosisTip,
  formatHealthPrescriptionStatus,
  formatQuestionnaireScoreDisplay,
  getRiskPercent,
  getScoreLevel,
  getScoreTip,
  isUserHealthInfoQuestionnaire,
  QUESTIONNAIRE_TITLES,
} from './utils/helpers';
import { filterHealthInfoVisibleAnswerItems } from './utils/healthInfoQuestionnaireHelpers';

/**
 * 问卷详情：顶部结果卡对齐教练端 results.vue，
 * 下方保留作答详情（健康信息问卷按跳题规则过滤）
 */
export default function QuestionnaireDetailPage({
  route,
}: {
  route: { params: { id: string; patientUserId?: string } };
}) {
  const { id, patientUserId } = route.params;
  const [detail, setDetail] = useState<UserQuestionRecord | null>(null);
  const [loading, setLoading] = useState(true);

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

  const isHealthInfo = isUserHealthInfoQuestionnaire(detail?.type);
  const diagnosisResult = detail?.diagnosisResult ?? null;

  const scoreLevel = useMemo(() => {
    if (detail?.type == null || detail.score == null) return undefined;
    return getScoreLevel(detail.type, detail.score);
  }, [detail]);

  /** 与教练端 results：健康信息展示处置建议，其它问卷展示风险档位 */
  const levelText = isHealthInfo
    ? formatHealthPrescriptionStatus(diagnosisResult, detail?.score)
    : (scoreLevel?.result?.trim() || '--');

  const gaugeIcon = getFamilyRiskGaugeIcon(
    isHealthInfo
      ? (levelText.includes('有红旗') ? 'rowStatusError' : 'rowStatus')
      : scoreLevel?.statusStyle,
  );

  const riskPercent =
    detail?.type != null && detail.score != null
      ? getRiskPercent(detail.type, detail.score)
      : 0;
  const scoreText =
    detail?.type != null
      ? formatQuestionnaireScoreDisplay(detail.type, detail.score, diagnosisResult)
      : '--';
  const scoreTip =
    !isHealthInfo && detail?.type != null && scoreLevel
      ? getScoreTip(detail.type, scoreLevel)
      : null;
  const healthTipText = isHealthInfo ? formatHealthDiagnosisTip(diagnosisResult) : '';
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

  const questionsAnswerRaw = detail.questionsAnswer ?? [];
  const questionsAnswer = isHealthInfo
    ? filterHealthInfoVisibleAnswerItems(questionsAnswerRaw)
    : questionsAnswerRaw;

  return (
    <PageLayout style={resultStyles.container}>
      <ScrollView contentContainerStyle={[resultStyles.body, { paddingBottom: 24 }]}>
        {/* 顶部结果卡：结构对齐教练端 questionnaire/results.vue */}
        <View style={resultStyles.resultCard}>
          <Flex justify="between" align="start" style={{ alignSelf: 'stretch' }}>
            <Text style={[resultStyles.resultTitle, { flex: 1, marginRight: 12 }]}>
              {title}
            </Text>
            {assessmentDate ? (
              <Text style={[resultStyles.resultTime, { marginTop: 0, textAlign: 'right' }]}>
                测评时间：{assessmentDate}
              </Text>
            ) : null}
          </Flex>
          <View style={resultStyles.resultGaugeOuter}>
            <View style={resultStyles.resultGaugeInner}>
              <Image source={gaugeIcon} style={resultStyles.resultGauge} resizeMode="contain" />
            </View>
          </View>
          <Text style={resultStyles.resultLevel}>{levelText}</Text>

          {isHealthInfo ? (
            <View style={resultStyles.resultTipBox}>
              <View style={resultStyles.resultTipRow}>
                <View style={resultStyles.resultTipDot} />
                <Text style={resultStyles.resultTipText}>{healthTipText}</Text>
              </View>
            </View>
          ) : (
            <>
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
              {scoreTip ? (
                <View style={resultStyles.resultTipBox}>
                  <View style={resultStyles.resultTipRow}>
                    <View style={resultStyles.resultTipDot} />
                    <Text style={resultStyles.resultTipText}>{scoreTip.summary}</Text>
                  </View>
                  <View style={[resultStyles.resultTipRow, resultStyles.resultTipAdvice]}>
                    <View style={resultStyles.resultTipDot} />
                    <Text style={resultStyles.resultTipText}>{scoreTip.advice}</Text>
                  </View>
                </View>
              ) : null}
            </>
          )}
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
