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
import { getUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { AppTheme } from '@/common/theme';
import styles from '@/css/profile/communityScreeningReport';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { getDefaultAvatarByGender } from '@/src/utils/userHelpers';
import type { RootStackParamList } from '@/route/router';
import { resolveFamilyReadOnlyView } from '@/src/familyPage/utils/familyReadOnlyView';
import {
  formatPilatesConclusion,
  formatPilatesNextStep,
  formatPilatesPrescription,
  formatPilatesProfile,
  formatPilatesRemark,
  formatPilatesScoreRows,
  formatPilatesScoreTip,
  pickPilatesResult,
  resolvePilatesScoreVisualWidth,
} from './utils/pilatesHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityScreeningReportPilatesDetail'>;

export default function CommunityScreeningReportPilatesDetailPage({ route }: Props) {
  const reportId = route.params?.reportId;
  const { patientUserId } = resolveFamilyReadOnlyView(route.params);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CommunityScreenReportDetail | null>(null);
  const [userInfo, setUserInfo] = useState<UserBaseInfo | null>(null);

  const loadDetail = useCallback(async () => {
    if (!reportId) {
      setDetail(null);
      setUserInfo(null);
      setLoading(false);
      return;
    }
    try {
      const patientOpts = patientUserId ? { patientUserId } : undefined;
      const [reportRes, userRes] = await Promise.all([
        getCommunityScreenReportInfo(reportId, patientOpts),
        getUserBaseInfo(patientOpts).catch(() => null),
      ]);
      setDetail(apiResourceData(reportRes) ?? null);
      setUserInfo(apiResourceData(userRes as { code?: number; data?: UserBaseInfo }) ?? null);
    } catch {
      setDetail(null);
      setUserInfo(null);
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

  const pilatesResult = useMemo(() => pickPilatesResult(detail), [detail]);
  const profile = useMemo(() => formatPilatesProfile(pilatesResult), [pilatesResult]);
  const scoreRows = useMemo(() => formatPilatesScoreRows(pilatesResult), [pilatesResult]);
  const scoreTip = useMemo(() => formatPilatesScoreTip(pilatesResult), [pilatesResult]);
  const conclusion = useMemo(() => formatPilatesConclusion(pilatesResult), [pilatesResult]);
  const prescription = useMemo(() => formatPilatesPrescription(pilatesResult), [pilatesResult]);
  const nextStep = useMemo(() => formatPilatesNextStep(pilatesResult), [pilatesResult]);
  const remark = useMemo(() => formatPilatesRemark(detail), [detail]);
  const avatarOssUrl = String(userInfo?.avatarOssUrl ?? '').trim();
  const avatarSource = avatarOssUrl
    ? { uri: avatarOssUrl }
    : getDefaultAvatarByGender(userInfo?.gender);

  if (loading) {
    return (
      <PageLayout style={styles.container} edges={[]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={AppTheme.primaryColor} />
        </View>
      </PageLayout>
    );
  }

  if (!pilatesResult) {
    return (
      <PageLayout style={styles.container} edges={[]}>
        <Text
          style={{
            marginTop: 80,
            textAlign: 'center',
            fontSize: 14,
            color: '#999999',
          }}
        >
          暂无报告数据
        </Text>
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
            <Image style={styles.avatar} source={avatarSource} />
            <View style={styles.topCardRight}>
              <Flex align="center">
                <Text style={styles.nameText}>{profile.name}</Text>
                {profile.tag ? (
                  <View style={styles.nameTag}>
                    <Text style={styles.nameTagText}>{profile.tag}</Text>
                  </View>
                ) : null}
              </Flex>
              {profile.metaText ? (
                <Text style={styles.metaText}>{profile.metaText}</Text>
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
            <Text style={styles.scoreModuleTitle}>8维功能评分</Text>
          </LinearGradient>

          <View style={styles.scoreModuleContent}>
            <Flex align="center" style={styles.scoreTableHeader}>
              <Text style={[styles.scoreTableHeaderText, styles.scoreColDimension]}>维度</Text>
              <Text style={[styles.scoreTableHeaderText, styles.scoreColVisual]}>可视化</Text>
              <Text style={[styles.scoreTableHeaderText, styles.scoreColResult]}>结果</Text>
              <Text style={[styles.scoreTableHeaderText, styles.scoreColScore]}>得分(0-3)</Text>
            </Flex>
            <View style={styles.scoreTableDivider} />

            {scoreRows.map((row, index) => {
              const fillWidth = resolvePilatesScoreVisualWidth(row.visual);
              return (
                <View key={row.key}>
                  {index > 0 ? <View style={styles.scoreRowDivider} /> : null}
                  <Flex align="center" style={styles.scoreRow}>
                    <View style={styles.scoreColDimension}>
                      <Text style={styles.scoreRowTitle}>{row.title}</Text>
                      {row.subtitle ? (
                        <Text style={styles.scoreRowSubtitle}>{row.subtitle}</Text>
                      ) : null}
                    </View>
                    <View style={styles.scoreColVisual}>
                      <View style={styles.scoreBarTrack}>
                        <View style={[styles.scoreBarFill, { width: fillWidth }]} />
                      </View>
                    </View>
                    <Text style={[styles.scoreResultText, styles.scoreColResult]}>
                      {row.result}
                    </Text>
                    <Text style={[styles.scoreValueText, styles.scoreColScore]}>
                      {row.score}
                    </Text>
                  </Flex>
                </View>
              );
            })}

            <Flex align="start" style={styles.scoreTipBox}>
              <Image
                style={styles.scoreTipIcon}
                source={require('@/assets/images/user/icon_warn.png')}
              />
              <Text style={styles.scoreTipText}>{scoreTip}</Text>
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
            <Text style={styles.scoreModuleTitle}>评估结论</Text>
          </LinearGradient>

          <View style={styles.scoreModuleContent}>
            {conclusion.rows.map((row, index) => (
              <Flex
                key={row.label}
                align="start"
                style={index > 0 ? styles.conclusionRowSpaced : undefined}
              >
                <View style={styles.conclusionDot} />
                <Text style={styles.conclusionRowText}>
                  <Text style={styles.conclusionLabel}>{row.label}</Text>
                  <Text style={styles.conclusionValue}>{row.value}</Text>
                </Text>
              </Flex>
            ))}
            <View style={styles.conclusionSummaryBox}>
              <Text style={styles.conclusionSummaryText}>{conclusion.summaryText}</Text>
            </View>
          </View>
        </View>

        {prescription ? (
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
            <View style={[styles.scoreModuleContent, { marginTop: 13 ,paddingBottom:0}]}>
              <Text style={styles.prescriptionDirectionTitle}>
                {prescription.actionTitle}
              </Text>
              <Flex align="center" style={styles.actionTableHeader}>
                <Text style={[styles.scoreTableHeaderText, styles.actionColModule]}>模块</Text>
                <Text style={[styles.scoreTableHeaderText, styles.actionColContent]}>内容</Text>
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
                <Text style={[styles.scoreTableHeaderText, styles.actionColContent]}>内容</Text>
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
