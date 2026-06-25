import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    AppState,
    Linking,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '@/css/medication/deal/recognition';
import type { RootStackParamList } from '@/route/router';

export default function MealRecognitionPage() {
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<RootStackParamList, 'MealRecognitionPage'>>();
    const recognizeText = route.params?.text?.trim() ?? '';
    const isFocused = useIsFocused();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [tipVisible, setTipVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);

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
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => setTipVisible(true)}>
                    <Flex justify="center" style={{ width: 44, height: 44 }}>
                        <Text style={{ fontSize: 18, color: '#FFFFFF' }}>?</Text>
                    </Flex>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            if (nextState === 'active' && isFocused) {
                initCamera();
            }
        });
        return () => subscription.remove();
    }, [initCamera, isFocused]);

    const takePicture = async () => {
        if (!cameraRef.current || isCapturing || !cameraReady) return;

        try {
            setIsCapturing(true);
            const result = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: false });
            navigation.replace('MealRecognizingPage', {
                mode: 'image',
                imageUri: result.uri,
                text: recognizeText,
            });
        } catch {
            setIsCapturing(false);
            Toast.fail('拍照失败');
        }
    };

    if (!permission) {
        return (
            <View style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.page} edges={['bottom']}>
            <Flex justify="center">
                <View style={styles.cameraWrap}>
                    {cameraReady && permission.granted ? (
                        <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
                    ) : (
                        <View style={[styles.cameraPreview, styles.loadingBox]}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                            <Text style={styles.loadingText}>相机准备中...</Text>
                        </View>
                    )}
                </View>
            </Flex>

            <Flex justify="center" style={styles.shutterWrap}>
                <TouchableOpacity onPress={takePicture} disabled={isCapturing || !cameraReady}>
                    <View style={styles.shutterBtn}>
                        <View style={styles.shutterInner} />
                    </View>
                </TouchableOpacity>
            </Flex>

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
