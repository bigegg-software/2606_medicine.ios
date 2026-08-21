import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Flex, Modal, Toast } from '@ant-design/react-native';
import { useFocusEffect, useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '@/css/nutrition/recognition';
import type { RootStackParamList } from '@/route/router';
import { pickFamilyRelationProofFromLibrary } from './utils/familyRelationProofHelpers';
import { pushPendingFamilyRelationProofCapture } from './utils/familyRelationProofCaptureSession';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FamilyRelationProofCapturePage'>;

export default function FamilyRelationProofCapturePage() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'FamilyRelationProofCapturePage'>>();
  const remainCount = Math.max(1, route.params?.remainCount ?? 1);
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
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

  const finishWithFiles = useCallback(
    (files: Array<{ uri: string; name: string; type: string }>) => {
      if (files.length === 0) return;
      pushPendingFamilyRelationProofCapture(files);
      navigation.goBack();
    },
    [navigation],
  );

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing || pickingAlbum || !cameraReady || !permission?.granted) {
      return;
    }

    try {
      setIsCapturing(true);
      const result = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: false });
      if (!result?.uri) {
        setIsCapturing(false);
        Toast.show('拍照失败');
        return;
      }
      finishWithFiles([
        {
          uri: result.uri,
          name: `relation_proof_${Date.now()}.jpg`,
          type: 'image/jpeg',
        },
      ]);
    } catch {
      setIsCapturing(false);
      Toast.show('拍照失败');
    }
  };

  const pickFromAlbum = async () => {
    if (isCapturing || pickingAlbum) return;

    setPickingAlbum(true);
    try {
      const files = await pickFamilyRelationProofFromLibrary(remainCount);
      if (files.length === 0) return;

      setIsCapturing(true);
      finishWithFiles(files);
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
          </View>
          <Text style={styles.captureHint}>请拍摄关系证明材料</Text>
        </LinearGradient>
      </View>

      <View style={styles.shutterWrap}>
        <TouchableOpacity
          style={styles.shutterBtnWrap}
          onPress={() => {
            void takePicture();
          }}
          disabled={isCapturing || !showCamera}
        >
          <Image style={styles.shutterBtn} source={require('@/assets/images/camara/camara.png')} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.albumBtn}
          onPress={() => {
            void pickFromAlbum();
          }}
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
        transparent
        visible={alertVisible}
        maskClosable
        onClose={() => setAlertVisible(false)}
      >
        <View style={{ padding: 24, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
          <Text style={styles.tipTitle}>开启相机权限</Text>
          <Text style={styles.tipText}>需要相机权限才能拍摄关系证明。</Text>
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
