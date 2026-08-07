import React, { useState } from 'react'
import { View, Text, Image, ScrollView, ImageBackground, TouchableOpacity, type ImageSourcePropType } from 'react-native'
import { Flex } from '@ant-design/react-native'
import { LinearGradient } from 'expo-linear-gradient'
import styles from '@/css/exercise/prescription'

const ICON_COLLAPSE = require('@/assets/images/nutrition/sq.png')
const ICON_EXPAND = require('@/assets/images/nutrition/dk.png')

const PRESCRIPTION_TYPES: ReadonlyArray<{
    key: string
    title: string
    icon: ImageSourcePropType
}> = [
        {
            key: 'aerobic',
            title: '有氧·心肺耐力',
            icon: require('@/assets/images/exercise/exercise3.png'),
        },
        {
            key: 'strength',
            title: '抗阻·力量',
            icon: require('@/assets/images/exercise/exercise2.png'),
        },
        {
            key: 'flexibility',
            title: '柔韧性',
            icon: require('@/assets/images/exercise/exercise1.png'),
        },
        {
            key: 'balance',
            title: '平衡·神经运动',
            icon: require('@/assets/images/exercise/exercise4.png'),
        },
    ]

export default function NutritionPrescriptionPage() {
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(PRESCRIPTION_TYPES.map(item => [item.key, true])),
    )

    const toggleType = (key: string) => {
        setExpandedMap(prev => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

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
                        <Text style={styles.prescriptionMetaText}>生成 2026年7月11日</Text>
                    </Flex>
                    <Flex align="center" style={{ marginLeft: 6, flexShrink: 1 }}>
                        <Image
                            style={styles.prescriptionMetaIcon}
                            source={require('@/assets/images/exercise/icon_up.png')}
                        />
                        <Text style={styles.prescriptionMetaTextGreen}>下次评估 2026年7月25日</Text>
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
                            <Text style={styles.prescriptionSectionBodyTitle}>
                                本方案以有氧为主、力量为辅，兼顾柔韧与平衡
                            </Text>
                            <Text style={styles.prescriptionSectionBodyDesc}>
                                基于你的减脂目标与中级体能水平，AI 将有氧权重设为最高以提升能量消耗，配合抗阻训练保留瘦体重，避免代谢下降。柔韧与神经平衡作为基础保障，降低损伤风险。
                            </Text>

                            <Flex style={styles.prescriptionSectionStats}>
                                <View style={styles.prescriptionSectionStatItem}>
                                    <View style={styles.prescriptionSectionStatBadge}>
                                        <Text style={styles.prescriptionSectionStatBadgeText}>最低训练量</Text>
                                    </View>
                                    <Text style={styles.prescriptionSectionStatTitle}>≥150</Text>
                                    <Text style={styles.prescriptionSectionStatValue}>每周总量（分钟）</Text>
                                </View>
                                <View style={styles.prescriptionSectionStatItem}>
                                    <Text style={styles.prescriptionSectionStatTitle}>≈2100</Text>
                                    <Text style={styles.prescriptionSectionStatValue}>预估周消耗（Kcal）</Text>
                                </View>
                                <View style={styles.prescriptionSectionStatItem}>
                                    <Text style={styles.prescriptionSectionStatTitle}>2-4</Text>
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
                        <View style={[styles.prescriptionWeightBarSeg, styles.prescriptionWeightBarSegFirst, { flex: 45, backgroundColor: '#6D925E' }]} />
                        <View style={[styles.prescriptionWeightBarSeg, { flex: 15, backgroundColor: '#FB4550' }]} />
                        <View style={[styles.prescriptionWeightBarSeg, { flex: 15, backgroundColor: '#EE9C44' }]} />
                        <View style={[styles.prescriptionWeightBarSeg, styles.prescriptionWeightBarSegLast, { flex: 10, backgroundColor: '#72A1C5' }]} />
                    </Flex>
                    <Flex style={styles.prescriptionWeightLegendRow}>
                        <Flex align="center" justify="between" style={styles.prescriptionWeightLegendItem}>
                            <Flex align="center" style={{ flexShrink: 1, minWidth: 0 }}>
                                <View style={[styles.prescriptionWeightDot, { backgroundColor: '#6D925E' }]} />
                                <Text style={styles.prescriptionWeightLegendText} numberOfLines={1}>有氧·心肺耐力</Text>
                            </Flex>
                            <Text style={styles.prescriptionWeightLegendValue}>45%</Text>
                        </Flex>
                        <Flex align="center" justify="between" style={styles.prescriptionWeightLegendItem}>
                            <Flex align="center" style={{ flexShrink: 1, minWidth: 0 }}>
                                <View style={[styles.prescriptionWeightDot, { backgroundColor: '#FB4550' }]} />
                                <Text style={styles.prescriptionWeightLegendText} numberOfLines={1}>抗阻·力量</Text>
                            </Flex>
                            <Text style={styles.prescriptionWeightLegendValue}>15%</Text>
                        </Flex>
                    </Flex>
                    <Flex style={styles.prescriptionWeightLegendRow}>
                        <Flex align="center" justify="between" style={styles.prescriptionWeightLegendItem}>
                            <Flex align="center" style={{ flexShrink: 1, minWidth: 0 }}>
                                <View style={[styles.prescriptionWeightDot, { backgroundColor: '#EE9C44' }]} />
                                <Text style={styles.prescriptionWeightLegendText} numberOfLines={1}>柔韧性</Text>
                            </Flex>
                            <Text style={styles.prescriptionWeightLegendValue}>15%</Text>
                        </Flex>
                        <Flex align="center" justify="between" style={styles.prescriptionWeightLegendItem}>
                            <Flex align="center" style={{ flexShrink: 1, minWidth: 0 }}>
                                <View style={[styles.prescriptionWeightDot, { backgroundColor: '#72A1C5' }]} />
                                <Text style={styles.prescriptionWeightLegendText} numberOfLines={1}>平衡·神经运动</Text>
                            </Flex>
                            <Text style={styles.prescriptionWeightLegendValue}>10%</Text>
                        </Flex>
                    </Flex>
                </View>
                <ImageBackground
                    source={require('@/assets/images/schedule/calendarBack.png')}
                    style={styles.backImage1}
                >
                    <Flex justify='between' style={{ flex: 1, paddingHorizontal: 20 }}>
                        <Text style={styles.prescriptionWeightTitle}>FITT-VP 处方明细</Text>
                        <Text style={styles.prescriptionWeightTagText}>四类分层·六要素</Text>
                    </Flex>
                </ImageBackground>
                {PRESCRIPTION_TYPES.map((item, index) => {
                    const expanded = expandedMap[item.key] !== false
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
                                            <Text style={styles.prescriptionTypePercentText}>30%</Text>
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
                                    <Flex align="center" style={styles.prescriptionTypeItem}>
                                        <Image
                                            style={styles.prescriptionTypeItemIcon}
                                            source={require('@/assets/images/exercise/icon_f.png')}
                                        />
                                        <View style={styles.prescriptionTypeItemInfo}>
                                            <Text style={styles.prescriptionTypeItemTitle}>频率</Text>
                                            <Text style={styles.prescriptionTypeItemValue}>每周5天（中等强度）</Text>
                                        </View>
                                    </Flex>
                                    <Flex align="center" style={styles.prescriptionTypeItem}>
                                        <Image
                                            style={styles.prescriptionTypeItemIcon}
                                            source={require('@/assets/images/exercise/icon_i.png')}
                                        />
                                        <View style={styles.prescriptionTypeItemInfo}>
                                            <Text style={styles.prescriptionTypeItemTitle}>强度</Text>
                                            <Text style={styles.prescriptionTypeItemValue}>目标心率 125–140 bpm · RPE 5–6/0</Text>
                                        </View>
                                    </Flex>
                                    <Flex align="center" style={styles.prescriptionTypeItem}>
                                        <Image
                                            style={styles.prescriptionTypeItemIcon}
                                            source={require('@/assets/images/exercise/icon_t.png')}
                                        />
                                        <View style={styles.prescriptionTypeItemInfo}>
                                            <Text style={styles.prescriptionTypeItemTitle}>时间</Text>
                                            <Text style={styles.prescriptionTypeItemValue}>每次 30–60 分钟</Text>
                                        </View>
                                    </Flex>
                                    <Flex align="center" style={styles.prescriptionTypeItem}>
                                        <Image
                                            style={styles.prescriptionTypeItemIcon}
                                            source={require('@/assets/images/exercise/icon_tt.png')}
                                        />
                                        <View style={styles.prescriptionTypeItemInfo}>
                                            <Text style={styles.prescriptionTypeItemTitle}>类型</Text>
                                            <Text style={styles.prescriptionTypeItemValue}>快走/慢跑/游泳/骑行</Text>
                                        </View>
                                    </Flex>
                                    <Flex align="center" style={styles.prescriptionTypeItem}>
                                        <Image
                                            style={styles.prescriptionTypeItemIcon}
                                            source={require('@/assets/images/exercise/icon_v.png')}
                                        />
                                        <View style={styles.prescriptionTypeItemInfo}>
                                            <Text style={styles.prescriptionTypeItemTitle}>总量</Text>
                                            <Text style={styles.prescriptionTypeItemValue}>每周 ≥150 分钟中等强度</Text>
                                        </View>
                                    </Flex>
                                    <Flex align="center" style={styles.prescriptionTypeItem}>
                                        <Image
                                            style={styles.prescriptionTypeItemIcon}
                                            source={require('@/assets/images/exercise/icon_p.png')}
                                        />
                                        <View style={styles.prescriptionTypeItemInfo}>
                                            <Text style={styles.prescriptionTypeItemTitle}>进阶</Text>
                                            <Text style={styles.prescriptionTypeItemValue}>每 2–4 周：先增时间 → 再增强度</Text>
                                        </View>
                                    </Flex>

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
                        <View style={styles.prescriptionTimelineItem}>
                            <View style={styles.prescriptionTimelineAxis}>
                                <View style={styles.prescriptionTimelineDotWrap}>
                                    <View style={styles.prescriptionTimelineDot} />
                                </View>
                                <View style={styles.prescriptionTimelineLine} />
                            </View>
                            <View style={styles.prescriptionTimelineMain}>
                                <Flex align="center" justify="between" style={styles.prescriptionTimelineHeader}>
                                    <Flex align="center">
                                        <Text style={styles.prescriptionTimelineVersion}>V3</Text>
                                        <View style={styles.prescriptionTimelineActiveBadge}>
                                            <Text style={styles.prescriptionTimelineActiveBadgeText}>生效中</Text>
                                        </View>
                                    </Flex>
                                    <Text style={styles.prescriptionTimelineTime}>2026/07/11</Text>
                                </Flex>
                                <View style={styles.prescriptionTimelineCard}>
                                    <Text style={styles.prescriptionTimelineCardTitle}>有氧时间  15min → 20min</Text>
                                    <Text style={styles.prescriptionTimelineCardDesc}>
                                        静息心率下降，心肺适应良好，按进阶策略增加时间
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.prescriptionTimelineItem}>
                            <View style={styles.prescriptionTimelineAxis}>
                                <View style={styles.prescriptionTimelineDotWrap}>
                                    <View style={styles.prescriptionTimelineDot} />
                                </View>
                                <View style={styles.prescriptionTimelineLine} />
                            </View>
                            <View style={styles.prescriptionTimelineMain}>
                                <Flex align="center" justify="between" style={styles.prescriptionTimelineHeader}>
                                    <Text style={styles.prescriptionTimelineVersion}>V2</Text>
                                    <Text style={styles.prescriptionTimelineTime}>2026/06/20</Text>
                                </Flex>
                                <View style={styles.prescriptionTimelineCard}>
                                    <Text style={styles.prescriptionTimelineCardTitle}>力量负荷 +2.5kg</Text>
                                    <Text style={styles.prescriptionTimelineCardDesc}>
                                        当前负荷可轻松完成 3 组，触发进阶
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.prescriptionTimelineItem, styles.prescriptionTimelineItemLast]}>
                            <View style={styles.prescriptionTimelineAxis}>
                                <View style={styles.prescriptionTimelineDotWrap}>
                                    <View style={styles.prescriptionTimelineDot} />
                                </View>
                            </View>
                            <View style={[styles.prescriptionTimelineMain, styles.prescriptionTimelineItemLastMain]}>
                                <Flex align="center" justify="between" style={styles.prescriptionTimelineHeader}>
                                    <Text style={styles.prescriptionTimelineVersion}>V1</Text>
                                    <Text style={styles.prescriptionTimelineTime}>2026/06/01</Text>
             </Flex>
                                <View style={styles.prescriptionTimelineCard}>
                                    <Text style={styles.prescriptionTimelineCardTitle}>初始处方生成</Text>
                                    <Text style={styles.prescriptionTimelineCardDesc}>
                                        基于 Onboarding 评估，从中低强度阈值起步
                                    </Text>
                                </View>
                            </View>
                        </View>
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
