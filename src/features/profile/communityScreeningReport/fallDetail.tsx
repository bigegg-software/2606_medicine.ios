import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Flex } from '@ant-design/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PageLayout from '@/src/components/PageLayout';
import {
  getCommunityScreenReportInfo,
  type CommunityScreenReportDetail,
} from '@/api/communityScreenReport';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/communityScreeningReport';
import fallStyles from '@/css/profile/communityScreeningReportFall';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import type { RootStackParamList } from '@/route/router';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import {
  FALL_RISK_REF_ROWS,
  formatFallItemScoreRows,
  formatFallNextStep,
  formatFallPrescription,
  formatFallProfile,
  formatFallRemark,
  formatFallRiskPoints,
  formatFallRiskResult,
  pickFallResult,
} from './utils/fallHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityScreeningReportFallDetail'>;

export default function CommunityScreeningReportFallDetailPage({ route }: Props) {
  const reportId = route.params?.reportId;
  const { patientUserId } = resolveFamilyReadOnlyView(route.params);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CommunityScreenReportDetail | null>(null);

  const loadDetail = useCallback(async () => {
    if (!reportId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    try {
      const res = await getCommunityScreenReportInfo(
        reportId,
        patientUserId ? { patientUserId } : undefined,
      );
      setDetail(apiResourceData(res) ?? null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [patientUserId, reportId]);

  const loadDetailRef = useRef(loadDetail);
  loadDetailRef.current = loadDetail;

  useEffect(() => {
    setLoading(true);
    void loadDetailRef.current();
  }, [loadDetail]);

  const fallResult = useMemo(() => pickFallResult(detail), [detail]);
  const profile = useMemo(() => formatFallProfile(fallResult), [fallResult]);
  const riskResult = useMemo(() => formatFallRiskResult(fallResult), [fallResult]);
  const itemScoreRows = useMemo(() => formatFallItemScoreRows(fallResult), [fallResult]);
  const riskPoints = useMemo(() => formatFallRiskPoints(fallResult), [fallResult]);
  const prescription = useMemo(() => formatFallPrescription(fallResult), [fallResult]);
  const nextStep = useMemo(() => formatFallNextStep(fallResult), [fallResult]);
  const remark = useMemo(() => formatFallRemark(detail), [detail]);

  if (loading) {
    return (
      <PageLayout style={styles.container} edges={[]}>
        <View style={fallStyles.center}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  if (!fallResult) {
    return (
      <PageLayout style={styles.container} edges={[]}>
        <Text style={fallStyles.emptyTip}>暂无报告数据</Text>
      </PageLayout>
    );
  }

  return (
    <PageLayout style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCard}>
          <Flex align="start">
            <Image style={styles.avatar} source={getDefaultAvatarByGender()} />
            <View style={styles.topCardRight}>
              <Flex align="center">
                <Text style={styles.nameText}>{profile.name}</Text>
                {profile.ageText ? (
                  <Text style={styles.ageText}>{profile.ageText}</Text>
                ) : null}
              </Flex>
              {profile.tag ? (
                <View style={styles.livingTag}>
                  <Text style={styles.livingTagText}>{profile.tag}</Text>
                </View>
              ) : null}
              <Flex align="center" style={styles.reportRow}>
                <Image
                  style={styles.reportIcon}
                  source={require('@/assets/images/profile/icon_screening_report.png')}
                />
                <Text style={styles.reportLabel}>{profile.reportLabel}</Text>
              </Flex>
            </View>
          </Flex>
          <View style={styles.divider} />
          <Text style={styles.dateRangeText}>{profile.dateRangeText}</Text>
        </View>

        <View style={styles.scoreModule}>
          <LinearGradient
            colors={['#FEFFFF', 'rgba(254,255,255,0)']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.scoreModuleHeader}
          >
            <Text style={styles.scoreModuleTitle}>风险分级结果</Text>
          </LinearGradient>
          <View style={styles.scoreModuleContent}>
            <Flex align="start">
              <View style={[styles.conclusionDot, fallStyles.riskDotAccent]} />
              <Text style={fallStyles.riskLevelText}>{riskResult.levelText}</Text>
            </Flex>
            {riskResult.rows.map((row, index) => (
              <Flex
                key={row.label}
                align="start"
                style={styles.conclusionRowSpaced}
              >
                <View style={styles.conclusionDot} />
                <Text style={styles.conclusionRowText}>
                  <Text style={styles.conclusionLabel}>{row.label}</Text>
                  <Text style={styles.conclusionValue}>{row.value}</Text>
                  {'subValue' in row && row.subValue ? (
                    <Text style={fallStyles.subValue}>{`\n${row.subValue}`}</Text>
                  ) : null}
                </Text>
              </Flex>
            ))}
            <View style={styles.conclusionSummaryBox}>
              <Text style={styles.conclusionSummaryText}>{riskResult.summaryText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.scoreModule}>
          <LinearGradient
            colors={['#FEFFFF', 'rgba(254,255,255,0)']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.scoreModuleHeader}
          >
            <Text style={styles.scoreModuleTitle}>分项评分</Text>
          </LinearGradient>
          <View style={styles.scoreModuleContent}>
            <Flex align="center" style={fallStyles.itemTableHeader}>
              <Text style={[fallStyles.itemTableHeaderText, fallStyles.itemColName]}>
                项目
              </Text>
              <Text style={[fallStyles.itemTableHeaderText, fallStyles.itemColResult]}>
                结果
              </Text>
              <Text style={[fallStyles.itemTableHeaderText, fallStyles.itemColScore]}>
                计分
              </Text>
              <Text style={[fallStyles.itemTableHeaderText, fallStyles.itemColWeight]}>
                权重
              </Text>
            </Flex>
            <View style={styles.scoreTableDivider} />

            {itemScoreRows.map((item, index) => (
              <View key={item.key}>
                {index > 0 ? <View style={styles.scoreRowDivider} /> : null}
                <Flex align="center" style={fallStyles.itemRow}>
                  <View style={fallStyles.itemColName}>
                    <Text style={fallStyles.itemTitle}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={fallStyles.itemSubtitle}>{item.subtitle}</Text>
                    ) : null}
                    {!item.isTotal ? (
                      <View style={fallStyles.itemBarTrack}>
                        <View
                          style={[fallStyles.itemBarFill, { width: `${item.barPercent}%` }]}
                        />
                      </View>
                    ) : null}
                  </View>
                  <View style={fallStyles.itemColResult}>
                    {item.resultText ? (
                      <Text style={fallStyles.itemResultLabel}>{item.resultText}</Text>
                    ) : null}
                  </View>
                  <Text style={[fallStyles.itemScoreText, fallStyles.itemColScore]}>
                    {item.score}
                  </Text>
                  <View style={fallStyles.itemColWeight}>
                    {item.weight != null ? (
                      <Flex align="center">
                        <Text style={fallStyles.itemWeightX}>x</Text>
                        <Text style={fallStyles.itemWeightNum}>{item.weight}</Text>
                      </Flex>
                    ) : (
                      <Text style={fallStyles.itemScoreText}>--</Text>
                    )}
                  </View>
                </Flex>
              </View>
            ))}
          </View>
        </View>

        {riskPoints.rows.length > 0 || riskPoints.summaryText ? (
          <View style={styles.scoreModule}>
            <LinearGradient
              colors={['#FEFFFF', 'rgba(254,255,255,0)']}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.scoreModuleHeader}
            >
              <Text style={styles.scoreModuleTitle}>风险点</Text>
            </LinearGradient>
            <View style={styles.scoreModuleContent}>
              {riskPoints.rows.map((point, index) => (
                <Flex
                  key={`${point.label}-${index}`}
                  align="start"
                  style={index > 0 ? styles.conclusionRowSpaced : undefined}
                >
                  <View style={fallStyles.riskDot} />
                  <Text style={styles.conclusionRowText}>
                    <Text style={fallStyles.riskPointLabel}>{point.label}</Text>
                    <Text style={fallStyles.riskPointValue}>{point.value}</Text>
                  </Text>
                </Flex>
              ))}
              {riskPoints.summaryText ? (
                <View style={styles.conclusionSummaryBox}>
                  <Text style={styles.conclusionSummaryText}>{riskPoints.summaryText}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {prescription ? (
          <>
            <View style={styles.scoreModule}>
              <LinearGradient
                colors={['#FEFFFF', 'rgba(254,255,255,0)']}
                locations={[0, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.scoreModuleHeader}
              >
                <Text style={styles.scoreModuleTitle}>初步运动处方与动作建议</Text>
              </LinearGradient>
              <View style={styles.scoreModuleContent}>
                <Text style={styles.prescriptionDirectionTitle}>
                  {prescription.directionTitle}
                </Text>
                {prescription.rows.map((row, index) => (
                  <Flex
                    key={row.label}
                    align="start"
                    style={
                      index === 0 ? styles.prescriptionRowFirst : styles.prescriptionRowSpaced
                    }
                  >
                    <View style={styles.conclusionDot} />
                    <Text style={styles.prescriptionRowText}>
                      <Text style={styles.conclusionLabel}>{row.label}</Text>
                      <Text style={styles.conclusionValue}>{row.value}</Text>
                    </Text>
                  </Flex>
                ))}
              </View>
              <View style={[styles.scoreModuleContent, { marginTop: 13 }]}>
                <Text style={styles.prescriptionDirectionTitle}>
                  {prescription.actionTitle}
                </Text>
                <Flex align="center" style={styles.actionTableHeader}>
                  <Text style={[styles.scoreTableHeaderText, styles.actionColModule]}>
                    模块
                  </Text>
                  <Text style={[styles.scoreTableHeaderText, styles.actionColContent]}>
                    建议动作（示例）
                  </Text>
                </Flex>
                <View style={styles.scoreTableDivider} />
                {prescription.actionSuggestions.map((item, index) => (
                  <View key={`${item.module}-${index}`}>
                    {index > 0 ? <View style={styles.scoreRowDivider} /> : null}
                    <Flex align="center" style={styles.actionTableRow}>
                      <View style={styles.actionColModule}>
                        <Text style={styles.actionModuleText}>{item.module}</Text>
                      </View>
                      <View style={styles.actionColContent}>
                        <Text style={styles.actionContentText}>{item.content}</Text>
                      </View>
                    </Flex>
                  </View>
                ))}
              </View>
              <View style={[styles.scoreModuleContent, { marginTop: 13 }]}>
                <Text style={styles.prescriptionDirectionTitle}>
                  {prescription.weekPlanTitle}
                </Text>
                <Flex align="center" style={styles.actionTableHeader}>
                  <Text style={[styles.scoreTableHeaderText, styles.actionColModule]}>日</Text>
                  <Text style={[styles.scoreTableHeaderText, styles.actionColContent]}>
                    内容
                  </Text>
                </Flex>
                <View style={styles.scoreTableDivider} />
                {prescription.weekPlan.map((item, index) => (
                  <View key={`${item.module}-${index}`}>
                    {index > 0 ? <View style={styles.scoreRowDivider} /> : null}
                    <Flex align="center" style={styles.actionTableRow}>
                      <View style={styles.actionColModule}>
                        <Text style={styles.actionModuleText}>{item.module}</Text>
                      </View>
                      <View style={styles.actionColContent}>
                        <Text style={styles.actionContentText}>{item.content}</Text>
                      </View>
                    </Flex>
                  </View>
                ))}
                <Flex align="start" style={styles.scoreTipBox}>
                  <Image
                    style={styles.scoreTipIcon}
                    source={require('@/assets/images/user/icon_warn.png')}
                  />
                  <Text style={styles.scoreTipText}>{prescription.tipText}</Text>
                </Flex>
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.scoreModule}>
          <LinearGradient
            colors={['#FEFFFF', 'rgba(254,255,255,0)']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.scoreModuleHeader}
          >
            <Text style={styles.scoreModuleTitle}>下一步与到店权益</Text>
          </LinearGradient>
          <View style={styles.scoreModuleContent}>
            <Flex align="start">
              <View style={styles.conclusionDot} />
              <Text style={styles.nextStepText}>{nextStep.text}</Text>
            </Flex>
            <Flex align="start" style={styles.nextStepBenefitBox}>
              <Image
                style={styles.nextStepBenefitIcon}
                source={require('@/assets/images/curriculum/qy.png')}
              />
              <View style={styles.nextStepBenefitTextWrap}>
                <Text style={styles.nextStepBenefitText}>{nextStep.benefit}</Text>
              </View>
            </Flex>
          </View>
        </View>

        <View style={styles.scoreModule}>
          <LinearGradient
            colors={['#FEFFFF', 'rgba(254,255,255,0)']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.scoreModuleHeader}
          >
            <Text style={styles.scoreModuleTitle}>风险分级参照</Text>
          </LinearGradient>
          <View style={[styles.scoreModuleContent,{paddingBottom:0}]}>
            <Flex align="center" style={fallStyles.refTableHeader}>
              <Text style={[fallStyles.itemTableHeaderText, fallStyles.refColLevel]}>
                分级
              </Text>
              <Text style={[fallStyles.itemTableHeaderText, fallStyles.refColCriteria]}>
                判定
              </Text>
              <Text
                style={[
                  fallStyles.itemTableHeaderText,
                  fallStyles.refColAction,
                  fallStyles.refColActionTitle,
                ]}
              >
                处置
              </Text>
            </Flex>
            <View style={styles.scoreTableDivider} />
            {FALL_RISK_REF_ROWS.map((row, index) => (
              <View key={row.level}>
                {index > 0 ? <View style={styles.scoreRowDivider} /> : null}
                <Flex align="center" style={fallStyles.refRow}>
                  <View style={fallStyles.refColLevel}>
                    <Text style={fallStyles.refLevelText}>{row.level}</Text>
                  </View>
                  <View style={fallStyles.refColCriteria}>
                    <Text style={fallStyles.refCriteriaText}>{row.criteria}</Text>
                  </View>
                  <View style={fallStyles.refColAction}>
                    <Text style={fallStyles.refActionText}>{row.action}</Text>
                  </View>
                </Flex>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.scoreModule}>
          <LinearGradient
            colors={['#FEFFFF', 'rgba(254,255,255,0)']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.scoreModuleHeader}
          >
            <Flex justify="between" align="center" style={styles.remarkHeaderRow}>
              <Text style={styles.scoreModuleTitle}>备注</Text>
              <Text style={styles.remarkTimeText}>{remark.timeText}</Text>
            </Flex>
          </LinearGradient>
          <View style={styles.scoreModuleContent}>
            <Flex align="start">
              <View style={styles.conclusionDot} />
              <Text style={styles.nextStepText}>{remark.text}</Text>
            </Flex>
          </View>
        </View>
      </ScrollView>
    </PageLayout>
  );
}
