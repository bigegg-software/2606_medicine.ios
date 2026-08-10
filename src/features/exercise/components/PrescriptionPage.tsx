import React, { useCallback, useEffect, useState } from 'react'
import {
    View,
    Text,
    Image,
    ScrollView,
    ImageBackground,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native'
import { Flex } from '@ant-design/react-native'
import { LinearGradient } from 'expo-linear-gradient'
import styles from '@/css/exercise/prescription'
import type { InUseExPatientRule } from '@/api/schedule'
import {
    EXERCISE_TYPE_ORDER,
    buildPrescriptionTypeSections,
    buildPrescriptionWeightItems,
    formatFirstAdvanceWeeksStat,
    formatPrescriptionGeneratedText,
    formatPrescriptionNextAssessText,
    formatWeekDurationStat,
    formatWeekKcalStat,
    getAiAnalysisSummary,
    getAiAnalysisTitle,
} from '../utils/prescriptionHelpers'
import {
    loadPrescriptionTimelineItems,
    type PrescriptionTimelineItem,
} from '../utils/prescriptionTimelineHelpers'

const ICON_COLLAPSE = require('@/assets/images/nutrition/sq.png')
const ICON_EXPAND = require('@/assets/images/nutrition/dk.png')

type Props = {
    exerciseRule?: InUseExPatientRule | null
}

export default function PrescriptionPage({ exerciseRule }: Props) {
    const typeSections = buildPrescriptionTypeSections(exerciseRule)
    const weightItems = buildPrescriptionWeightItems(exerciseRule)

    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(EXERCISE_TYPE_ORDER.map(key => [key, false])),
    )
    const [timelineItems, setTimelineItems] = useState<PrescriptionTimelineItem[]>([])
    const [timelineLoading, setTimelineLoading] = useState(true)

    const loadTimeline = useCallback(async () => {
        setTimelineLoading(true)
        try {
            const items = await loadPrescriptionTimelineItems()
            setTimelineItems(items)
        } catch {
            setTimelineItems([])
        } finally {
            setTimelineLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadTimeline()
    }, [loadTimeline])

    const toggleType = (key: string) => {
        setExpandedMap(prev => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    const generatedText = formatPrescriptionGeneratedText(exerciseRule)
    const nextAssessText = formatPrescriptionNextAssessText(exerciseRule)
    const weekDurationText = formatWeekDurationStat(exerciseRule?.weekDuration)
    const weekKcalText = formatWeekKcalStat(exerciseRule?.weekKcal)
    const firstAdvanceText = formatFirstAdvanceWeeksStat(exerciseRule?.firstAdvanceWeeks)
    const aiTitle = getAiAnalysisTitle(exerciseRule)
    const aiSummary = getAiAnalysisSummary(exerciseRule)
    const weightBarItems = weightItems.filter(item => item.ratio > 0)
    const barSegments = weightBarItems.length > 0 ? weightBarItems : weightItems

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled">
                <Flex style={styles.prescriptionMetaCard}>
                    <Flex align="center" style={{ flexShrink: 1 }}>
                        <Image
                            style={styles.prescriptionMetaIcon}
                            source={require('@/assets/images/exercise/icon_file.png')}
                        />
                        <Text style={styles.prescriptionMetaText}>{generatedText}</Text>
                    </Flex>
                    <Flex align="center" style={{ marginLeft: 6, flexShrink: 1 }}>
                        <Image
                            style={styles.prescriptionMetaIcon}
                            source={require('@/assets/images/exercise/icon_up.png')}
                        />
                        <Text style={styles.prescriptionMetaTextGreen}>{nextAssessText}</Text>
                    </Flex>
                </Flex>

                <View style={styles.prescriptionSectionOuter}>
                    <LinearGradient
                        colors={['#F1F7EF', '#F7F7F9']}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.prescriptionSectionWrap}>
                        <View style={styles.prescriptionSectionCard}>
                            <View style={styles.prescriptionSectionHeader}>
                                <Image
                                    style={styles.prescriptionSectionHeaderIcon}
                                    source={require('@/assets/images/exercise/icon_left.png')}
                                />
                                <Text style={styles.prescriptionSectionHeaderTitle}>AI 洞察 · 结论先行</Text>
                            </View>
                        </View>
                        <View style={styles.prescriptionSectionBody}>
                            <Text style={styles.prescriptionSectionBodyTitle}>{aiTitle}</Text>
                            <Text style={styles.prescriptionSectionBodyDesc}>{aiSummary}</Text>

                            <Flex style={styles.prescriptionSectionStats}>
                                <View style={styles.prescriptionSectionStatItem}>
                                    <View style={styles.prescriptionSectionStatBadge}>
                                        <Text style={styles.prescriptionSectionStatBadgeText}>最低训练量</Text>
                                    </View>
                                    <Text style={styles.prescriptionSectionStatTitle}>{weekDurationText}</Text>
                                    <Text style={styles.prescriptionSectionStatValue}>每周总量（分钟）</Text>
                                </View>
                                <View style={styles.prescriptionSectionStatItem}>
                                    <Text style={styles.prescriptionSectionStatTitle}>{weekKcalText}</Text>
                                    <Text style={styles.prescriptionSectionStatValue}>预估周消耗（Kcal）</Text>
                                </View>
                                <View style={styles.prescriptionSectionStatItem}>
                                    <Text style={styles.prescriptionSectionStatTitle}>{firstAdvanceText}</Text>
                                    <Text style={styles.prescriptionSectionStatValue}>首次进阶（周）后</Text>
                                </View>
                            </Flex>
                        </View>
                    </LinearGradient>
                    <Image
                        style={styles.prescriptionSectionAiIcon}
                        source={require('@/assets/images/exercise/icon_ai.png')}
                    />
                </View>

                <View style={styles.prescriptionWeightCard}>
                    <Flex align="center" justify="between">
                        <Text style={styles.prescriptionWeightTitle}>运动类型权重配比</Text>
                        <Flex align="center">
                            <Image
                                style={styles.prescriptionWeightTagIcon}
                                source={require('@/assets/images/exercise/icon_mb.png')}
                            />
                            <Text style={styles.prescriptionWeightTagText}>依目标分配</Text>
                        </Flex>
                    </Flex>
                    <Flex style={styles.prescriptionWeightBar}>
                        {barSegments.map((item, index) => (
                            <View
                                key={item.key}
                                style={[
                                    styles.prescriptionWeightBarSeg,
                                    index === 0 && styles.prescriptionWeightBarSegFirst,
                                    index === barSegments.length - 1 && styles.prescriptionWeightBarSegLast,
                                    {
                                        flex: Math.max(item.ratio, 1),
                                        backgroundColor: item.color,
                                    },
                                ]}
                            />
                        ))}
                    </Flex>
                    <Flex style={styles.prescriptionWeightLegendRow}>
                        {weightItems.slice(0, 2).map(item => (
                            <Flex
                                key={item.key}
                                align="center"
                                justify="between"
                                style={styles.prescriptionWeightLegendItem}>
                                <Flex align="center" style={{ flexShrink: 1, minWidth: 0 }}>
                                    <View style={[styles.prescriptionWeightDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.prescriptionWeightLegendText} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                </Flex>
                                <Text style={styles.prescriptionWeightLegendValue}>{item.ratioText}</Text>
                            </Flex>
                        ))}
                    </Flex>
                    <Flex style={styles.prescriptionWeightLegendRow}>
                        {weightItems.slice(2, 4).map(item => (
                            <Flex
                                key={item.key}
                                align="center"
                                justify="between"
                                style={styles.prescriptionWeightLegendItem}>
                                <Flex align="center" style={{ flexShrink: 1, minWidth: 0 }}>
                                    <View style={[styles.prescriptionWeightDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.prescriptionWeightLegendText} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                </Flex>
                                <Text style={styles.prescriptionWeightLegendValue}>{item.ratioText}</Text>
                            </Flex>
                        ))}
                    </Flex>
                </View>

                <ImageBackground
                    source={require('@/assets/images/schedule/calendarBack.png')}
                    style={styles.backImage1}>
                    <Flex justify="between" style={{ flex: 1, paddingHorizontal: 20 }}>
                        <Text style={styles.prescriptionWeightTitle}>FITT-VP 处方明细</Text>
                        <Text style={styles.prescriptionWeightTagText}>四类分层·六要素</Text>
                    </Flex>
                </ImageBackground>

                {typeSections.map((item, index) => {
                    const expanded = expandedMap[item.key] === true
                    return (
                        <View
                            key={item.key}
                            style={[
                                styles.prescriptionTypeCard,
                                index === 0 && styles.prescriptionTypeCardFirst,
                            ]}>
                            <TouchableOpacity activeOpacity={0.7} onPress={() => toggleType(item.key)}>
                                <Flex align="center" justify="between">
                                    <Flex align="center" style={{ flexShrink: 1 }}>
                                        <Image
                                            style={styles.prescriptionTypeIcon}
                                            tintColor="#333"
                                            source={item.icon}
                                        />
                                        <View style={styles.prescriptionTypeTitleWrap}>
                                            <LinearGradient
                                                colors={['#6D925E', 'rgba(109,146,94,0)']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.prescriptionTypeUnderline}
                                            />
                                            <Text style={styles.prescriptionTypeTitle}>{item.title}</Text>
                                        </View>
                                        <View style={styles.prescriptionTypePercent}>
                                            <Text style={styles.prescriptionTypePercentText}>{item.ratioText}</Text>
                                        </View>
                                    </Flex>
                                    <Image
                                        style={styles.prescriptionTypeToggle}
                                        source={expanded ? ICON_EXPAND : ICON_COLLAPSE}
                                    />
                                </Flex>
                            </TouchableOpacity>
                            {expanded ? (
                                <View style={styles.prescriptionTypeBody}>
                                    {item.fittItems.map(fitt => (
                                        <Flex key={fitt.key} align="center" style={styles.prescriptionTypeItem}>
                                            <Image
                                                style={styles.prescriptionTypeItemIcon}
                                                source={fitt.icon}
                                            />
                                            <View style={styles.prescriptionTypeItemInfo}>
                                                <Text style={styles.prescriptionTypeItemTitle}>{fitt.label}</Text>
                                                <Text style={styles.prescriptionTypeItemValue}>{fitt.value}</Text>
                                            </View>
                                        </Flex>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    )
                })}

                <View style={styles.prescriptionTypeCard}>
                    <Flex align="center" style={{ flexShrink: 1 }}>
                        <Image
                            style={styles.prescriptionTypeIcon}
                            tintColor="#333"
                            source={require('@/assets/images/exercise/icon_menu.png')}
                        />
                        <View style={styles.prescriptionTypeTitleWrap}>
                            <LinearGradient
                                colors={['#6D925E', 'rgba(109,146,94,0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.prescriptionTypeUnderline}
                            />
                            <Text style={styles.prescriptionTypeTitle}>处方演变时间线</Text>
                        </View>
                    </Flex>

                    <View style={styles.prescriptionTimeline}>
                        {timelineLoading ? (
                            <View style={styles.prescriptionTimelineLoading}>
                                <ActivityIndicator color="#6D925E" />
                            </View>
                        ) : timelineItems.length === 0 ? (
                            <View style={styles.prescriptionTimelineEmpty}>
                                <Image
                                    style={styles.prescriptionTimelineEmptyIcon}
                                    source={require('@/assets/images/exercise/icon_yd_empty.png')}
                                />
                                <Text style={styles.prescriptionTimelineEmptyTitle}>暂无处方演变记录</Text>
                                <Text style={styles.prescriptionTimelineEmptyDesc}>
                                    处方调整后，版本变化将在此展示
                                </Text>
                            </View>
                        ) : (
                            timelineItems.map((item, index) => {
                                const isLast = index === timelineItems.length - 1
                                return (
                                    <View
                                        key={item.key}
                                        style={[
                                            styles.prescriptionTimelineItem,
                                            isLast && styles.prescriptionTimelineItemLast,
                                        ]}>
                                        <View style={styles.prescriptionTimelineAxis}>
                                            <View style={styles.prescriptionTimelineDotWrap}>
                                                <View style={styles.prescriptionTimelineDot} />
                                            </View>
                                            {!isLast ? <View style={styles.prescriptionTimelineLine} /> : null}
                                        </View>
                                        <View
                                            style={[
                                                styles.prescriptionTimelineMain,
                                                isLast && styles.prescriptionTimelineItemLastMain,
                                            ]}>
                                            <Flex
                                                align="center"
                                                justify="between"
                                                style={styles.prescriptionTimelineHeader}>
                                                <Flex align="center">
                                                    <Text style={styles.prescriptionTimelineVersion}>
                                                        {item.versionLabel}
                                                    </Text>
                                                    {item.isActive ? (
                                                        <View style={styles.prescriptionTimelineActiveBadge}>
                                                            <Text style={styles.prescriptionTimelineActiveBadgeText}>
                                                                生效中
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </Flex>
                                                <Text style={styles.prescriptionTimelineTime}>{item.dateText}</Text>
                                            </Flex>
                                            <View style={styles.prescriptionTimelineCard}>
                                                <Text style={styles.prescriptionTimelineCardTitle}>{item.title}</Text>
                                                {item.desc ? (
                                                    <Text style={styles.prescriptionTimelineCardDesc}>{item.desc}</Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    </View>
                                )
                            })
                        )}
                    </View>
                </View>

                <View style={styles.prescriptionDisclaimer}>
                    <Image
                        style={styles.prescriptionDisclaimerIcon}
                        source={require('@/assets/images/exercise/icon_zd.png')}
                    />
                    <View style={styles.prescriptionDisclaimerTextWrap}>
                        <Text style={styles.prescriptionDisclaimerText}>
                            本处方基于 ACSM《运动测试与运动处方指南》第12版 FITT-VP 框架由 AI 生成，仅供参考。如有慢性疾病或不适，请在专业医师指导下运动。
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}
