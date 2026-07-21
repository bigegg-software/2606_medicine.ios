import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, ImageBackground, TextInput, Keyboard, Platform, type KeyboardEvent } from 'react-native'
import { Flex } from '@ant-design/react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import styles from '@/css/nutrition'
import NutrientProgressRing from './NutrientProgressRing'
import { getMealNotePlaceholder } from '@/src/features/profile/medication/meal/utils/mealDetailHelpers'

const NUTRIENT_ITEMS = [
    {
        key: 'protein',
        title: '蛋白质',
        color: '#0951AE',
        icon: require('@/assets/images/nutrition/dbz.png'),
        progress: 60,
        desc: '≈3个鸡蛋+2掌心瘦肉',
    },
    {
        key: 'carb',
        title: '碳水',
        color: '#72A1C5',
        icon: require('@/assets/images/nutrition/ts.png'),
        progress: 45,
        desc: '≈3个鸡蛋+2掌心瘦肉',
    },
    {
        key: 'fat',
        title: '脂肪',
        color: '#FB4550',
        icon: require('@/assets/images/nutrition/zf.png'),
        progress: 30,
        desc: '≈3个鸡蛋+2掌心瘦肉',
    },
] as const

const ADVICE_ITEMS = [
    {
        key: 'breakfast',
        title: '重建早餐',
        icon: require('@/assets/images/nutrition/icon_zc.png'),
        background: require('@/assets/images/nutrition/back1.png'),
        tips: [
            '长期不吃早餐会导致上午血糖波动、下午暴食，建议7-9点进食。',
            '早餐组合：全谷主食+优质蛋白+蔬果，例如燕麦粥+水煮蛋+低脂奶。',
        ],
        defaultExpanded: true,
        color: "#886D47",
        dotColor: "#694F2B",
    },
    {
        key: 'heart',
        title: '控钠护心',
        icon: require('@/assets/images/nutrition/icon_hx.png'),
        background: require('@/assets/images/nutrition/back2.png'),
        tips: [
            '长期不吃早餐会导致上午血糖波动、下午暴食，建议7-9点进食。',
            '早餐组合：全谷主食+优质蛋白+蔬果，例如燕麦粥+水煮蛋+低脂奶。',
        ],
        defaultExpanded: false,
        color: "#666666",
        dotColor: "#81796F",
    },
    {
        key: 'liver',
        title: '肝脏支持',
        icon: require('@/assets/images/nutrition/icon_gz.png'),
        background: require('@/assets/images/nutrition/back3.png'),
        tips: [
            '长期不吃早餐会导致上午血糖波动、下午暴食，建议7-9点进食。',
            '早餐组合：全谷主食+优质蛋白+蔬果，例如燕麦粥+水煮蛋+低脂奶。',
        ],
        defaultExpanded: true,
        color: "#608847",
        dotColor: "#48692B",
    },
] as const

const ICON_COLLAPSE = require('@/assets/images/nutrition/sq.png')
const ICON_EXPAND = require('@/assets/images/nutrition/dk.png')

const MONITOR_CARDS = [
    {
        key: 'interaction',
        title: '药物与营养交互',
        icon: require('@/assets/images/nutrition/icon_yw.png'),
        badge: '医学内容',
        text: '您正在服用氨氯地平（钙通道阻滞剂）。您正在服用氨氯地平（钙通道阻滞剂）。请避免大量食用西柚及西柚汁，其成分会抑制药物',
        colors: ['#EAF4FF', '#F4F9FF', '#FEFFFF'] as const,
        contentStyle: [styles.jcContent, { marginTop: 0 }],
    },
    {
        key: 'monitor',
        title: '监测建议',
        icon: require('@/assets/images/nutrition/icon_jc.png'),
        badge: '医学内容',
        text: '您正在服用氨氯地平（钙通道阻滞剂）。您正在服用氨氯地平（钙通道阻滞剂）。请避免大量食用西柚及西柚汁，其成分会抑制药物',
        colors: ['#EAF4FF', '#F4F9FF', '#FEFFFF'] as const,
        contentStyle: styles.jcContent,
    },
    {
        key: 'exercise',
        title: '运动建议',
        icon: require('@/assets/images/nutrition/icon_jy.png'),
        badge: null,
        text: '您正在服用氨氯地平（钙通道阻滞剂）。您正在服用氨氯地平（钙通道阻滞剂）。请避免大量食用西柚及西柚汁，其成分会抑制药物',
        colors: ['#F2F6EF', '#FDFFFB', '#FEFFFF'] as const,
        contentStyle: styles.jcContent,
    },
] as const

function ExpandableMonitorCard({
    title,
    icon,
    badge,
    text,
    colors,
    contentStyle,
}: {
    title: string
    icon: number
    badge: string | null
    text: string
    colors: readonly [string, string, string]
    contentStyle: object | object[]
}) {
    const [expanded, setExpanded] = useState(false)
    const [canExpand, setCanExpand] = useState(false)

    return (
        <LinearGradient
            colors={[...colors]}
            locations={[0, 0.3, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={contentStyle}>
            <Flex justify="between">
                <Flex>
                    <Image style={styles.navIcon} source={icon} />
                    <Text style={styles.calendarContentTitle}>{title}</Text>
                </Flex>
                {badge ? (
                    <Flex style={styles.jcRightBox}>
                        <Text style={styles.jcRightText}>{badge}</Text>
                    </Flex>
                ) : null}
            </Flex>
            <View style={styles.jcTextWrap}>
                {!expanded ? (
                    <Text
                        style={[styles.jcText, styles.jcTextMeasure]}
                        onTextLayout={e => {
                            if (e.nativeEvent.lines.length > 2) {
                                setCanExpand(true)
                            }
                        }}>
                        {text}
                    </Text>
                ) : null}
                <Text style={styles.jcText} numberOfLines={expanded ? undefined : 2}>
                    {text}
                </Text>
                {canExpand || expanded ? (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.jcExpandBtn}
                        onPress={() => setExpanded(prev => !prev)}>
                        <LinearGradient
                            colors={['rgba(254,255,255,0)', '#FEFFFF', '#FEFFFF']}
                            locations={[0, 0.35, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.jcExpandGradient}>
                            <Flex align="center">
                                <Image
                                    tintColor="#6D925E"
                                    style={styles.jcExpandIcon}
                                    source={expanded ? ICON_EXPAND : ICON_COLLAPSE}
                                />
                                <Text style={styles.jcExpandText}>
                                    {expanded ? '收起' : '展开'}
                                </Text>
                            </Flex>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : null}
            </View>
        </LinearGradient>
    )
}

export default function NutritionPrescriptionPage() {
    const insets = useSafeAreaInsets()
    const navigation: any = useNavigation()
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(ADVICE_ITEMS.map(item => [item.key, item.defaultExpanded])),
    )
    const [mealNote, setMealNote] = useState('')
    const [keyboardHeight, setKeyboardHeight] = useState(0)
    const mealNotePlaceholder = useMemo(() => getMealNotePlaceholder(), [])

    const toggleAdvice = (key: string) => {
        setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }))
    }

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
        const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
            setKeyboardHeight(e.endCoordinates.height)
        })
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0)
        })
        return () => {
            showSub.remove()
            hideSub.remove()
        }
    }, [])

    const bottomBarBottom = useMemo(() => {
        if (keyboardHeight <= 0) return Math.max(insets.bottom, 16)
        return Math.max(0, keyboardHeight - insets.bottom) + 8
    }, [insets.bottom, keyboardHeight])

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={[styles.scroll, { paddingHorizontal: 0 }]}
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled">
                <ImageBackground source={require('@/assets/images/nutrition/back.png')} style={styles.backImage}>
                    <Flex>
                        <Image style={styles.navIcon} source={require('@/assets/images/nutrition/kll.png')} />
                        <Text style={styles.calendarContentTitle}>每日推荐热量</Text>
                    </Flex>
                    <Flex style={styles.kcalBox}>
                        <Text style={styles.kcalValue}>1200</Text>
                        <Text style={styles.kcalText}>kcal</Text>
                    </Flex>
                    <Flex style={styles.kcalInfoBox}>
                        <Image style={styles.kcalInfoIcon} source={require('@/assets/images/nutrition/kllInfo.png')} />
                        <Text style={styles.kcalInfoText}>≈ 2 碗米饭 + 1 块鸡胸 + 2 份蔬菜 + 1 份水果</Text>
                    </Flex>
                </ImageBackground>
                <View style={styles.nutritionContent}>
                    <Flex justify='between'>
                        <Text style={styles.calendarContentTitle}>三大营养素目标</Text>
                        <Text style={[styles.calendarContentSubtitle, { color: "#999999" }]}>克数·生活化翻译</Text>
                    </Flex>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                        {NUTRIENT_ITEMS.map(item => (
                            <View key={item.key} style={styles.colBox}>
                                <Flex justify="center" style={styles.colValueBox}>
                                    <NutrientProgressRing
                                        progress={item.progress}
                                        color={item.color}
                                    />
                                    <Text style={styles.colValue}>90<Text style={styles.colValueText}>g</Text></Text>
                                </Flex>
                                <Flex style={{ marginTop: 8 }} justify='center'>
                                    <Image style={styles.colImg} source={item.icon} />
                                    <Text style={styles.colTitle}>{item.title}</Text>
                                </Flex>
                                <Text style={styles.colText}>{item.desc}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
                <View style={styles.nutritionContent}>
                    <Text style={styles.calendarContentTitle}>推荐饮食模式</Text>
                    <View style={styles.modeBox}>
                        <Flex>
                            <Flex style={styles.tipBox}>
                                <Text style={styles.tipBoxTitle}>DASH</Text>
                            </Flex>
                            <Text style={styles.tipBoxText}>DASH 护心饮食模式</Text>
                        </Flex>
                        <Text style={styles.tipBoxText1}>强调低盐、富含蔬果与全谷物、限制饱和脂肪，经临床验证有助于控制血压。</Text>
                        <Flex align="start" style={styles.tipBox1}>
                            <Image source={require('@/assets/images/nutrition/star1.png')} style={styles.tipBox1Img} />
                            <Text style={styles.tipBox1Text}>中式改良：用醋、柠檬、香料替代部分食盐；主食一半换成糙米燕麦；红肉改为鱼禽。</Text>
                        </Flex>
                    </View>
                </View>
                <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.backImage1}>
                    <Flex align='center' style={{ flex: 1, paddingLeft: 20 }}><Text style={styles.backImage1Text}>三大营养素来源建议</Text></Flex>
                </ImageBackground>
                <View style={[styles.nutritionContent, { marginTop: 0 }]}>
                    <Flex style={{ marginBottom: 8 }}>
                        <Image style={styles.navIcon} source={require('@/assets/images/nutrition/dbz.png')} />
                        <Text style={styles.calendarContentTitle}>蛋白质</Text>
                    </Flex>
                    <Text style={styles.dietListText}>优先低脂优质蛋白，保护心脏与瘦体重</Text>
                    <Flex style={styles.tabBox}>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>低脂奶</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>深海鱼</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>鸡胸肉</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>豆腐</Text>
                        </Flex>
                    </Flex>
                </View>
                <View style={styles.nutritionContent}>
                    <Flex style={{ marginBottom: 8 }}>
                        <Image style={styles.navIcon} source={require('@/assets/images/nutrition/ts.png')} />
                        <Text style={styles.calendarContentTitle}>碳水</Text>
                    </Flex>
                    <Text style={styles.dietListText}>优先低脂优质蛋白，保护心脏与瘦体重</Text>
                    <Flex style={styles.tabBox}>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>低脂奶</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>深海鱼</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>鸡胸肉</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>豆腐</Text>
                        </Flex>
                    </Flex>
                </View>
                <View style={styles.nutritionContent}>
                    <Flex style={{ marginBottom: 8 }}>
                        <Image style={styles.navIcon} source={require('@/assets/images/nutrition/zf.png')} />
                        <Text style={styles.calendarContentTitle}>脂肪</Text>
                    </Flex>
                    <Text style={styles.dietListText}>优先低脂优质蛋白，保护心脏与瘦体重</Text>
                    <Flex style={styles.tabBox}>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>低脂奶</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>深海鱼</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>鸡胸肉</Text>
                        </Flex>
                        <Flex style={styles.tabItem}>
                            <Text style={styles.tabItemText}>豆腐</Text>
                        </Flex>
                    </Flex>
                </View>
                <View style={styles.nutritionContent}>
                    <Flex>
                        <Image style={styles.navIcon} source={require('@/assets/images/nutrition/icon1.png')} />
                        <Text style={styles.calendarContentTitle}>分项健康建议</Text>
                    </Flex>
                    {ADVICE_ITEMS.map(item => {
                        const expanded = expandedMap[item.key]
                        return (
                            <View key={item.key}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => toggleAdvice(item.key)}>
                                    <Flex justify="between" style={styles.fxBox}>
                                        <Flex>
                                            <Image style={styles.fxIcon} source={item.icon} />
                                            <Text style={styles.fxTitle}>{item.title}</Text>
                                        </Flex>
                                        <Image
                                            style={styles.fxIcon}
                                            source={expanded ? ICON_EXPAND : ICON_COLLAPSE}
                                        />
                                    </Flex>
                                </TouchableOpacity>
                                {expanded ? (
                                    <ImageBackground source={item.background} style={styles.fxBackBox}>
                                        <View style={styles.fxBackBoxContent}>
                                            {item.tips.map((tip, tipIndex) => (
                                                <Flex
                                                    key={`${item.key}-tip-${tipIndex}`}
                                                    align="start"
                                                    style={styles.fxTextCol}>
                                                    <View style={[styles.fxBackBoxContentImg, { backgroundColor: item.dotColor }]} />
                                                    <Text style={[styles.fxText, { color: item.color }]}>{tip}</Text>
                                                </Flex>
                                            ))}
                                        </View>
                                    </ImageBackground>
                                ) : null}
                            </View>
                        )
                    })}
                </View>
                <ImageBackground source={require('@/assets/images/schedule/calendarBack.png')} style={styles.backImage1}>
                    <Flex align='center' style={{ flex: 1, paddingLeft: 20 }}>
                        <Text style={styles.backImage1Text}>药物与监测</Text>
                    </Flex>
                </ImageBackground>
                {MONITOR_CARDS.map(card => (
                    <ExpandableMonitorCard
                        key={card.key}
                        title={card.title}
                        icon={card.icon}
                        badge={card.badge}
                        text={card.text}
                        colors={card.colors}
                        contentStyle={card.contentStyle}
                    />
                ))}
            </ScrollView>
            <Flex
                justify="between"
                style={[
                    styles.mealBottomBar,
                    { bottom: bottomBarBottom },
                ]}>
                <Flex style={styles.bottomInputWrapper}>
                    <Image
                        style={styles.mealInputIcon}
                        source={require('@/assets/images/nutrition/icon_gb.png')}
                    />
                    <TextInput
                        style={styles.mealInput}
                        value={mealNote}
                        onChangeText={setMealNote}
                        placeholder={mealNotePlaceholder}
                        placeholderTextColor="#999999"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                </Flex>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('MealRecognitionPage', { text: mealNote })}>
                    <Image
                        style={styles.mealBtmIcon}
                        source={require('@/assets/images/nutrition/icon_camera.png')}
                    />
                </TouchableOpacity>
            </Flex>
        </View>
    )
}
