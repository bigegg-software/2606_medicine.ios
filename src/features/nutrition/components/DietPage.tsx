import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Flex } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import styles from '@/css/nutrition';
import { buildDietWeekDays } from './utils/dietCalendarHelpers';
import DietProgressRing from './DietProgressRing';

export default function DietPage() {
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState(() => moment().format('YYYY-MM-DD'));
    const weekDays = useMemo(() => buildDietWeekDays(selectedDate), [selectedDate]);

    const onPressDatePicker = () => {
        // TODO: 打开日期选择
    };

    const onPressCheckIn = () => {
        // TODO: 完成今日打卡
    };

    const onPressRefresh = () => {
        // TODO: 换一换
    };

    function DietListLine({ progress, color }: { progress: number, color: string }) {
        return (
            <Flex style={styles.dietListLine}>
                <Flex style={{ width: progress + "%", backgroundColor: color, height: 6, borderRadius: 3 }} />
            </Flex>
        )
    }
    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>
                <Flex justify="between" style={styles.calendarBox}>
                    {weekDays.map(item => {
                        const isActive = item.key === selectedDate;
                        return (
                            <TouchableOpacity
                                key={item.key}
                                activeOpacity={0.7}
                                style={[styles.calendarCol, isActive && styles.calendarColActive]}
                                onPress={() => setSelectedDate(item.key)}>
                                <Text style={isActive ? styles.calendarTitleActive : styles.calendarTitle}>
                                    {item.label}
                                </Text>
                                <Text style={isActive ? styles.calendarSubtitleActive : styles.calendarSubtitle}>
                                    {item.day}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.calendarCol}
                        onPress={onPressDatePicker}>
                        <Text style={styles.calendarTitle}>日期</Text>
                        <Image
                            style={styles.calendarImage}
                            source={require('@/assets/images/nutrition/time.png')}
                        />
                    </TouchableOpacity>
                </Flex>
                <View style={styles.calendarContent}>
                    <Text style={styles.calendarContentTitle}>今日营养目标</Text>
                    <Flex style={styles.calendarContentProgress}>
                        <Flex direction="column" style={styles.valueBox}>
                            <Text style={styles.valueTitle}>已摄入</Text>
                            <Text style={styles.valueText}>360</Text>
                        </Flex>
                        <View style={styles.calendarContentProgressRing}>
                            <DietProgressRing progress={20} />
                            <View style={styles.calendarContentTitleBox}>
                                <Text style={styles.title1}>还可吃 (千卡)</Text>
                                <Text style={styles.title2}>1812</Text>
                                <Text style={styles.title3}>推荐预算1812</Text>
                            </View>
                        </View>
                        <Flex direction="column" style={styles.valueBox}>
                            <Text style={styles.valueTitle}>完成度</Text>
                            <Text style={styles.valueText}>36.01%</Text>
                        </Flex>
                    </Flex>
                    <View style={styles.lineBox}></View>
                    <Flex justify='between' style={styles.dietListBox}>
                        <View style={styles.dietList}>
                            <Flex >
                                <Image style={styles.dietListImage} source={require("@/assets/images/nutrition/dbz.png")} />
                                <Text style={styles.dietListText}>蛋白质</Text>
                            </Flex>
                            <DietListLine progress={20} color="#0851ae" />
                            <Text style={styles.btmBox}>12<Text style={styles.btmBoxText}>/90g</Text></Text>
                        </View>
                        <View style={styles.dietList}>
                            <Flex>
                                <Image style={styles.dietListImage} source={require("@/assets/images/nutrition/ts.png")} />
                                <Text style={styles.dietListText}>碳水</Text>
                            </Flex>
                            <DietListLine progress={20} color="#72a1c5" />
                            <Text style={styles.btmBox}>12<Text style={styles.btmBoxText}>/90g</Text></Text>
                        </View>
                        <View style={styles.dietList}>
                            <Flex>
                                <Image style={styles.dietListImage} source={require("@/assets/images/nutrition/zf.png")} />
                                <Text style={styles.dietListText}>脂肪</Text>
                            </Flex>
                            <DietListLine progress={20} color="#fb4550" />
                            <Text style={styles.btmBox}>12<Text style={styles.btmBoxText}>/90g</Text></Text>
                        </View>
                    </Flex>
                </View>
                <View style={styles.calendarContent}>
                    <Flex justify='between'>
                        <Flex>
                            <Image style={styles.dietListImage} source={require('@/assets/images/schedule/zc.png')} />
                            <Text style={styles.calendarContentTitle}>早餐</Text>
                        </Flex>
                        <Text style={styles.calendarContentSubtitle}>计划353 kcal</Text>
                    </Flex>
                    <Flex style={styles.dietMapBox}>
                        <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default.png')} />
                        <View style={styles.mapCenBox}>
                            <Text style={styles.mapTitle}>燕麦粥</Text>
                            <Flex style={styles.mapCenBoxList}>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#0951AE" }]}></View>
                                    <Text style={styles.mapText}>蛋 5g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#72A1C5" }]}></View>
                                    <Text style={styles.mapText}>碳 27g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#FB4550" }]}></View>
                                    <Text style={styles.mapText}>脂 1g</Text>
                                </Flex>
                            </Flex>
                        </View>
                        <Flex direction="column" justify="between" align='end' style={{ height: "100%" }}>
                            <Text style={styles.mapValue}>50g</Text>
                            <Text style={styles.mapValueText}>185 kcal</Text>
                        </Flex>
                    </Flex>
                    <Flex style={styles.dietMapBox}>
                        <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default.png')} />
                        <View style={styles.mapCenBox}>
                            <Text style={styles.mapTitle}>燕麦粥</Text>
                            <Flex style={styles.mapCenBoxList}>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#0951AE" }]}></View>
                                    <Text style={styles.mapText}>蛋 5g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#72A1C5" }]}></View>
                                    <Text style={styles.mapText}>碳 27g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#FB4550" }]}></View>
                                    <Text style={styles.mapText}>脂 1g</Text>
                                </Flex>
                            </Flex>
                        </View>
                        <Flex direction="column" justify="between" align='end' style={{ height: "100%" }}>
                            <Text style={styles.mapValue}>50g</Text>
                            <Text style={styles.mapValueText}>185 kcal</Text>
                        </Flex>
                    </Flex>
                    <TouchableOpacity style={styles.btnBox}>
                        <Flex style={{ flex: 1 }} justify='center'>
                            <Image style={styles.btnImg} source={require('@/assets/images/nutrition/camera.png')} />
                            <Text style={styles.btnText}>拍照记录这一餐</Text>
                        </Flex>
                    </TouchableOpacity>
                </View>

                <View style={styles.calendarContent}>
                    <Flex justify='between'>
                        <Flex>
                            <Image style={styles.dietListImage} source={require('@/assets/images/schedule/wwc.png')} />
                            <Text style={styles.calendarContentTitle}>午餐</Text>
                        </Flex>
                        <Text style={styles.calendarContentSubtitle}>计划353 kcal</Text>
                    </Flex>
                    <Flex style={styles.dietMapBox}>
                        <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default.png')} />
                        <View style={styles.mapCenBox}>
                            <Text style={styles.mapTitle}>燕麦粥</Text>
                            <Flex style={styles.mapCenBoxList}>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#0951AE" }]}></View>
                                    <Text style={styles.mapText}>蛋 5g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#72A1C5" }]}></View>
                                    <Text style={styles.mapText}>碳 27g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#FB4550" }]}></View>
                                    <Text style={styles.mapText}>脂 1g</Text>
                                </Flex>
                            </Flex>
                        </View>
                        <Flex direction="column" justify="between" align='end' style={{ height: "100%" }}>
                            <Text style={styles.mapValue}>50g</Text>
                            <Text style={styles.mapValueText}>185 kcal</Text>
                        </Flex>
                    </Flex>
                    <Flex style={styles.dietMapBox}>
                        <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default.png')} />
                        <View style={styles.mapCenBox}>
                            <Text style={styles.mapTitle}>燕麦粥</Text>
                            <Flex style={styles.mapCenBoxList}>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#0951AE" }]}></View>
                                    <Text style={styles.mapText}>蛋 5g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#72A1C5" }]}></View>
                                    <Text style={styles.mapText}>碳 27g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#FB4550" }]}></View>
                                    <Text style={styles.mapText}>脂 1g</Text>
                                </Flex>
                            </Flex>
                        </View>
                        <Flex direction="column" justify="between" align='end' style={{ height: "100%" }}>
                            <Text style={styles.mapValue}>50g</Text>
                            <Text style={styles.mapValueText}>185 kcal</Text>
                        </Flex>
                    </Flex>
                    <TouchableOpacity style={styles.btnBox}>
                        <Flex style={{ flex: 1 }} justify='center'>
                            <Image style={styles.btnImg} source={require('@/assets/images/nutrition/camera.png')} />
                            <Text style={styles.btnText}>拍照记录这一餐</Text>
                        </Flex>
                    </TouchableOpacity>
                </View>

                <View style={styles.calendarContent}>
                    <Flex justify='between'>
                        <Flex>
                            <Image style={styles.dietListImage} source={require('@/assets/images/schedule/ws.png')} />
                            <Text style={styles.calendarContentTitle}>晚餐</Text>
                        </Flex>
                        <Text style={styles.calendarContentSubtitle}>计划353 kcal</Text>
                    </Flex>
                    <Flex style={styles.dietMapBox}>
                        <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default.png')} />
                        <View style={styles.mapCenBox}>
                            <Text style={styles.mapTitle}>燕麦粥</Text>
                            <Flex style={styles.mapCenBoxList}>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#0951AE" }]}></View>
                                    <Text style={styles.mapText}>蛋 5g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#72A1C5" }]}></View>
                                    <Text style={styles.mapText}>碳 27g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#FB4550" }]}></View>
                                    <Text style={styles.mapText}>脂 1g</Text>
                                </Flex>
                            </Flex>
                        </View>
                        <Flex direction="column" justify="between" align='end' style={{ height: "100%" }}>
                            <Text style={styles.mapValue}>50g</Text>
                            <Text style={styles.mapValueText}>185 kcal</Text>
                        </Flex>
                    </Flex>
                    <Flex style={styles.dietMapBox}>
                        <Image style={styles.mapImg} source={require('@/assets/images/nutrition/default.png')} />
                        <View style={styles.mapCenBox}>
                            <Text style={styles.mapTitle}>燕麦粥</Text>
                            <Flex style={styles.mapCenBoxList}>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#0951AE" }]}></View>
                                    <Text style={styles.mapText}>蛋 5g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#72A1C5" }]}></View>
                                    <Text style={styles.mapText}>碳 27g</Text>
                                </Flex>
                                <Flex>
                                    <View style={[styles.mapBor, { backgroundColor: "#FB4550" }]}></View>
                                    <Text style={styles.mapText}>脂 1g</Text>
                                </Flex>
                            </Flex>
                        </View>
                        <Flex direction="column" justify="between" align='end' style={{ height: "100%" }}>
                            <Text style={styles.mapValue}>50g</Text>
                            <Text style={styles.mapValueText}>185 kcal</Text>
                        </Flex>
                    </Flex>
                    <TouchableOpacity style={styles.btnBox}>
                        <Flex style={{ flex: 1 }} justify='center'>
                            <Image style={styles.btnImg} source={require('@/assets/images/nutrition/camera.png')} />
                            <Text style={styles.btnText}>拍照记录这一餐</Text>
                        </Flex>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Flex
                justify="between"
                align="center"
                style={[
                    styles.bottomBar,
                    { paddingBottom: Math.max(insets.bottom, 8) },
                ]}>
                <TouchableOpacity
                    style={styles.bottomBarButtonLeft}
                    activeOpacity={0.7}
                    onPress={onPressCheckIn}>
                    <Flex justify="center" style={{ flex: 1 }}>
                        <Image style={styles.btnImgSize} source={require('@/assets/images/nutrition/wc.png')} />
                        <Text style={styles.bottomBarButtonTextLeft}>完成今日打卡</Text>
                    </Flex>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.bottomBarButtonRight}
                    activeOpacity={0.7}
                    onPress={onPressRefresh}>
                    <Flex justify="center" style={{ flex: 1 }}>
                        <Image style={styles.btnImgSize} source={require('@/assets/images/nutrition/hyh.png')} />
                        <Text style={styles.bottomBarButtonTextRight}>换一换</Text>
                    </Flex>
                </TouchableOpacity>
            </Flex>
        </View>
    );
}
