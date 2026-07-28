import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Modal, Toast } from '@ant-design/react-native';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '@/css/profile/camera';
import type { RootStackParamList } from '@/route/router';
import { pushPendingIdCardCapture } from '@/src/utils/idCardCaptureSession';

export default function IdCardCameraPage() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'IdCardCameraPage'>>();
  const side = route.params.side;
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const isCapturingRef = useRef(false);

  const initCamera = useCallback(async () => {
    try {
      const perm = await requestPermission();
      if (!perm) return;

      if (!perm.granted) {
        setCameraReady(false);
        Modal.alert(
          '开启相机权限',
          <Text style={{ color: '#A1A1AA', width: 240, textAlign: 'center' }}>
            需要相机权限才能拍摄身份证
          </Text>,
          [
            { text: '知道了', onPress: () => navigation.goBack(), style: 'cancel' },
            { text: '去设置', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      setCameraReady(true);
    } catch {
      Toast.show('相机初始化失败');
    }
  }, [navigation, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      setIsCapturing(false);
      isCapturingRef.current = false;
      void initCamera();
    }, [initCamera]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && isFocused) {
        void initCamera();
      }
    });
    return () => subscription.remove();
  }, [initCamera, isFocused]);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturingRef.current || !cameraReady || !permission?.granted) {
      return;
    }

    isCapturingRef.current = true;
    setIsCapturing(true);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        exif: false,
      });
      if (!result?.uri) {
        Toast.show('拍照失败');
        return;
      }
      pushPendingIdCardCapture({
        side,
        uri: result.uri,
        name: `idcard_${side}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      navigation.goBack();
    } catch {
      Toast.show('拍照失败');
    } finally {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  };

  const showCamera = Boolean(isFocused && permission?.granted && cameraReady);
  const hintText = side === 'front' ? '请拍摄身份证正面' : '请拍摄身份证反面';

  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.cameraContainer}>
        {showCamera ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="picture"
            active={isFocused}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={{ color: 'white', marginTop: 10 }}>相机准备中...</Text>
          </View>
        )}

        <View style={localStyles.hintWrap} pointerEvents="none">
          <Text style={localStyles.hintText}>{hintText}</Text>
        </View>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => {
            void takePicture();
          }}
          disabled={isCapturing || !showCamera}
          activeOpacity={0.8}>
          <View style={[styles.captureInner, (isCapturing || !showCamera) && styles.disabledButton]} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  hintWrap: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  hintText: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.45)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
