import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, Text, TouchableOpacity, View, } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '@/css/nutrition/recognition';
import type { RootStackParamList } from '@/route/router';
import { pickMealImageFromLibrary } from './utils/recognitionHelpers';

export default function MealRecognitionPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'MealRecognitionPage'>>();
    const recognizeText = route.params?.text?.trim() ?? '';
    const mealCategory = route.params?.mealCategory;
    const isFocused = useIsFocused();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [tipVisible, setTipVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [pickingAlbum, setPickingAlbum] = useState(false);

    const initCamera = useCallback(async () => {
        try {
            const perm = await requestPermission();
            if (!perm) return;

            if (!perm.granted) {
                setCameraReady(false);
                setTimeout(() => setAlertVisible(true), 300);
                return;
            }

            setCameraReady(true);
        } catch (error) {
            console.error('Camera init error:', error);
            Toast.show('相机初始化失败');
        }
    }, [requestPermission]);

    useFocusEffect(
        useCallback(() => {
            setIsCapturing(false);
            initCamera();
        }, [initCamera]),
    );

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            if (nextState === 'active' && isFocused) {
                initCamera();
            }
        });
        return () => subscription.remove();
    }, [initCamera, isFocused]);

    const takePicture = async () => {
        if (!cameraRef.current || isCapturing || pickingAlbum || !cameraReady || !permission?.granted) {
            return;
        }

        try {
            setIsCapturing(true);
            const result = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: false });
            navigation.replace('MealRecognizingPage', {
                mode: 'image',
                imageUri: result.uri,
                text: recognizeText,
                mealCategory,
            });
        } catch {
            setIsCapturing(false);
            Toast.show('拍照失败');
        }
    };

    const pickFromAlbum = async () => {
        if (isCapturing || pickingAlbum) return;

        setPickingAlbum(true);
        try {
            const file = await pickMealImageFromLibrary();
            if (!file) return;

            setIsCapturing(true);
            navigation.replace('MealRecognizingPage', {
                mode: 'image',
                imageUri: file.uri,
                text: recognizeText,
                mealCategory,
            });
        } catch {
            setIsCapturing(false);
            Toast.show('选择图片失败');
        } finally {
            setPickingAlbum(false);
        }
    };

    const showCamera = Boolean(isFocused && permission?.granted && cameraReady);

    return (
        <SafeAreaView style={styles.page} edges={['bottom']}>
            <View style={styles.cameraWrap}>
                <View style={styles.cameraSquareBox}>
                    {showCamera ? (
                        <CameraView
                            ref={cameraRef}
                            style={styles.cameraPreview}
                            facing="back"
                            mode="picture"
                            active={isFocused}
                        />
                    ) : (
                        <View style={[styles.cameraPreview, styles.loadingBox]}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                            <Text style={styles.loadingText}>
                                {!permission
                                    ? '相机准备中...'
                                    : permission.granted
                                        ? '相机准备中...'
                                        : '等待相机权限...'}
                            </Text>
                        </View>
                    )}
                </View>

                <LinearGradient
                    pointerEvents="box-none"
                    colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.topFade}
                >
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.topBtn}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.8}
                        >
                            <Image
                                style={styles.closeIcon}
                                source={require('@/assets/images/camara/close.png')}
                            />
                        </TouchableOpacity>
                        {/* <TouchableOpacity
                            style={styles.topBtn}
                            onPress={() => setTipVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.tipIconText}>?</Text>
                        </TouchableOpacity> */}
                    </View>
                    <Text style={styles.captureHint}>去拍照，记录您的餐食</Text>
                </LinearGradient>
            </View>

            <View style={styles.shutterWrap}>
                <TouchableOpacity
                    style={styles.shutterBtnWrap}
                    onPress={takePicture}
                    disabled={isCapturing || !showCamera}
                >
                    <Image style={styles.shutterBtn} source={require('@/assets/images/camara/camara.png')} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.albumBtn}
                    onPress={pickFromAlbum}
                    disabled={isCapturing || pickingAlbum}
                    activeOpacity={0.8}
                >
                    <Image
                        style={styles.albumIcon}
                        source={require('@/assets/images/camara/image.png')}
                    />
                </TouchableOpacity>
            </View>

            <Modal
                popup
                visible={tipVisible}
                maskClosable
                animationType="slide-up"
                onClose={() => setTipVisible(false)}>
                <View style={{ padding: 20 }}>
                    <Text style={styles.tipTitle}>拍照提示</Text>
                    <Text style={styles.tipText}>1. 将食物放在光线充足的位置拍摄。</Text>
                    <Text style={styles.tipText}>2. 尽量让食物完整出现在画面中央。</Text>
                    <Text style={styles.tipText}>3. 避免遮挡、反光或过度模糊。</Text>
                    <TouchableOpacity style={styles.tipBtn} onPress={() => setTipVisible(false)}>
                        <Text style={styles.tipBtnText}>知道了</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <Modal
                transparent
                visible={alertVisible}
                maskClosable
                onClose={() => setAlertVisible(false)}>
                <View style={{ padding: 24, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
                    <Text style={styles.tipTitle}>开启相机权限</Text>
                    <Text style={styles.tipText}>需要相机权限才能进行用餐识别。</Text>
                    <Flex style={{ marginTop: 20 }}>
                        <TouchableOpacity
                            style={[styles.tipBtn, { flex: 1, marginRight: 8, backgroundColor: '#F5F5F5' }]}
                            onPress={() => {
                                setAlertVisible(false);
                                navigation.goBack();
                            }}>
                            <Text style={[styles.tipBtnText, { color: '#666666' }]}>知道了</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tipBtn, { flex: 1, marginLeft: 8 }]}
                            onPress={() => {
                                setAlertVisible(false);
                                Linking.openSettings();
                            }}>
                            <Text style={styles.tipBtnText}>去设置</Text>
                        </TouchableOpacity>
                    </Flex>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
