import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Modal, Toast } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import styles from '@/css/profile/camera';
import type { RootStackParamList } from '@/route/router';
import { pushPendingIdCardCapture } from '@/src/utils/idCardCaptureSession';

const FRAME_HEIGHT = 208;
const FRAME_BORDER = 4;
const FRAME_RADIUS = 15;
const MASK_COLOR = 'rgba(0,0,0,0.7)';
const FRAME_SIDE_MARGIN = 23;
const FRAME_BORDER_COLOR = '#87B874';

export default function IdCardCameraPage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, 'IdCardCameraPage'>>();
  const side = route.params.side;
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const isCapturingRef = useRef(false);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });

  const frameLayout = useMemo(() => {
    const { width, height } = overlaySize;
    if (width <= 0 || height <= 0) return null;
    const frameWidth = Math.max(0, width - FRAME_SIDE_MARGIN * 2);
    return {
      x: FRAME_SIDE_MARGIN,
      y: Math.max(0, (height - FRAME_HEIGHT) / 2),
      width: frameWidth,
      height: FRAME_HEIGHT,
    };
  }, [overlaySize]);

  const onOverlayLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setOverlaySize(prev =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

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

  if (!permission) {
    return (
      <View style={[styles.container, localStyles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, localStyles.root]} edges={['bottom']}>
      <View style={styles.cameraContainer} onLayout={onOverlayLayout}>
        {showCamera ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="picture"
            active={isFocused}
          />
        ) : (
          <View style={localStyles.loadingCamera}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={localStyles.loadingText}>相机准备中...</Text>
          </View>
        )}

        {frameLayout ? (
          <>
            <Svg
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              width={overlaySize.width}
              height={overlaySize.height}>
              <Defs>
                <Mask id="idCardFrameMask">
                  <Rect
                    x={0}
                    y={0}
                    width={overlaySize.width}
                    height={overlaySize.height}
                    fill="#FFFFFF"
                  />
                  <Rect
                    x={frameLayout.x}
                    y={frameLayout.y}
                    width={frameLayout.width}
                    height={frameLayout.height}
                    rx={FRAME_RADIUS}
                    ry={FRAME_RADIUS}
                    fill="#000000"
                  />
                </Mask>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={overlaySize.width}
                height={overlaySize.height}
                fill={MASK_COLOR}
                mask="url(#idCardFrameMask)"
              />
              <Rect
                x={frameLayout.x}
                y={frameLayout.y}
                width={frameLayout.width}
                height={frameLayout.height}
                rx={FRAME_RADIUS}
                ry={FRAME_RADIUS}
                fill="none"
                stroke={FRAME_BORDER_COLOR}
                strokeWidth={FRAME_BORDER}
              />
            </Svg>
            <View
              pointerEvents="none"
              style={[
                localStyles.hintWrap,
                { height: Math.max(0, frameLayout.y - 28) },
              ]}>
              <Text style={localStyles.hintText}>
                {side === 'front' ? '请拍摄身份证人像面' : '请拍摄身份证国徽面'}
              </Text>
            </View>
            {side === 'front' ? (
              <View
                pointerEvents="none"
                style={[
                  localStyles.guideIcon,
                  {
                    top: frameLayout.y + 26,
                    left: frameLayout.x + frameLayout.width - 12 - 110,
                  },
                ]}>
                <Image
                  source={require('@/assets/images/authentication/icon_rx.png')}
                  style={localStyles.guideIconFront}
                />
              </View>
            ) : (
              <View
                pointerEvents="none"
                style={[
                  localStyles.guideIcon,
                  {
                    top: frameLayout.y + 23,
                    left: frameLayout.x + 18,
                  },
                ]}>
                <Image
                  source={require('@/assets/images/authentication/icon_gh.png')}
                  style={localStyles.guideIconBack}
                />
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity
          style={[localStyles.backBtn, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.captureBtn}
          onPress={() => {
            void takePicture();
          }}
          disabled={isCapturing || !showCamera}
          activeOpacity={0.8}>
          <Image
            source={require('@/assets/images/authentication/icon_camera.png')}
            style={[localStyles.captureIcon, (isCapturing || !showCamera) && styles.disabledButton]}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  root: {
    backgroundColor: '#000000',
  },
  loadingCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  hintWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hintText: {
    fontWeight: '500',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  guideIcon: {
    position: 'absolute',
  },
  guideIconFront: {
    width: 110,
    height: 110,
  },
  guideIconBack: {
    width: 88,
    height: 88,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  captureBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 70,
    height: 70,
    zIndex: 2,
  },
  captureIcon: {
    width: 70,
    height: 70,
  },
});
