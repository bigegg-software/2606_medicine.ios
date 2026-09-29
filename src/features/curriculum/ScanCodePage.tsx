import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '@/css/curriculum/scanCode';
import {
  checkInByScanCode,
  isValidScanPayload,
  normalizeScanPayload,
} from './utils/scanCodeHelpers';

/** 课程页扫码：相机挂载对齐用餐识别，取景为 240 小框 + 四角样式 */
export default function ScanCodePage() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const handledRef = useRef(false);

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
      handledRef.current = false;
      setScanned(false);
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

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (handledRef.current || !isFocused || scanned || submitting) return;
      const data = normalizeScanPayload(result?.data);
      if (!isValidScanPayload(data)) return;
      handledRef.current = true;
      setScanned(true);
      setSubmitting(true);
      void (async () => {
        try {
          const checkIn = await checkInByScanCode(data);
          if (!checkIn.ok) {
            Toast.show(checkIn.msg || '签到失败', 1.5);
            handledRef.current = false;
            setScanned(false);
            return;
          }
          Toast.show(checkIn.msg || '签到成功', 1.5);
          navigation.goBack();
        } catch {
          Toast.show('签到失败，请稍后重试', 1.5);
          handledRef.current = false;
          setScanned(false);
        } finally {
          setSubmitting(false);
        }
      })();
    },
    [isFocused, navigation, scanned, submitting],
  );

  const showCamera = Boolean(isFocused && permission?.granted && cameraReady);

  return (
    <SafeAreaView style={styles.page} edges={['bottom']}>
      <View style={styles.cameraWrap}>
        <View style={[styles.headerArea, { paddingTop: Math.max(insets.top, 12) }]}>
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
          </View>
          <Text style={styles.title}>扫描二维码</Text>
        </View>

        <View style={styles.frameArea}>
          <View style={styles.frameOuter}>
            <View style={styles.cameraSquareBox}>
              {showCamera ? (
                <CameraView
                  ref={cameraRef}
                  style={styles.cameraPreview}
                  facing="back"
                  mode="picture"
                  active={isFocused}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
                />
              ) : (
                <View style={[styles.cameraPreview, styles.loadingBox]}>
                  <ActivityIndicator size="large" color="#87B874" />
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
            {submitting ? (
              <View style={styles.submittingMask} pointerEvents="none">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submittingText}>签到中...</Text>
              </View>
            ) : null}
            <View pointerEvents="none" style={[styles.corner, styles.cornerTL]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerTR]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerBL]} />
            <View pointerEvents="none" style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        <View style={styles.tipArea}>
          <Text style={styles.tipBelow}>将二维码放入框内，即可自动扫描</Text>
        </View>
      </View>

      <Modal
        transparent
        visible={alertVisible}
        maskClosable
        onClose={() => setAlertVisible(false)}
      >
        <View style={{ padding: 24, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
          <Text style={styles.tipTitle}>开启相机权限</Text>
          <Text style={styles.tipText}>需要相机权限才能扫码。</Text>
          <Flex style={{ marginTop: 20 }}>
            <TouchableOpacity
              style={[styles.tipBtn, { flex: 1, marginRight: 8, backgroundColor: '#F5F5F5' }]}
              onPress={() => {
                setAlertVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={[styles.tipBtnText, { color: '#666666' }]}>知道了</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipBtn, { flex: 1, marginLeft: 8 }]}
              onPress={() => {
                setAlertVisible(false);
                Linking.openSettings();
              }}
            >
              <Text style={styles.tipBtnText}>去设置</Text>
            </TouchableOpacity>
          </Flex>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
