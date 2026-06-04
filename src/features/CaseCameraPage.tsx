import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Text,
  Linking,
  AppState,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Modal from '@ant-design/react-native/lib/modal';
import NoticeBar from '@ant-design/react-native/lib/notice-bar';
import Toast from '@ant-design/react-native/lib/toast';
import Flex from '@ant-design/react-native/lib/flex';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import styles from '@/css/profile/camera';
import { pushPendingAttachments } from '@/src/utils/attachmentUploadSession';
import { uploadFileToAttachment } from '@/src/utils/uploadAttachment';

type ImageItem = {
  uri: string;
  size: number;
};

const MAX_PHOTOS = 30;
const MAX_SIZE_MB = 30;
const THUMBNAIL_MARGIN = 8;

export default function CaseCameraPage() {
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [imgList, setImgList] = useState<ImageItem[]>([]);
  const totalSize = useMemo(
    () => +(imgList.reduce((acc, i) => acc + i.size, 0).toFixed(1)),
    [imgList],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const isCapturingRef = useRef(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const { width } = Dimensions.get('window');
  const thumbnailSize = width / 4 - THUMBNAIL_MARGIN;

  const initialize = async () => {
    try {
      const perm = await requestPermission();
      if (!perm) return;

      if (!perm.granted) {
        setCameraReady(false);
        Modal.alert(
          '开启相机权限',
          <Text style={{ color: '#A1A1AA', width: 240, textAlign: 'center' }}>
            需要相机权限才能拍照上传附件
          </Text>,
          [
            { text: '知道了', onPress: () => navigation.goBack(), style: 'cancel' },
            { text: '去设置', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      setCameraReady(true);
    } catch (error) {
      console.error('Camera init error:', error);
      Toast.show('相机初始化失败');
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        initialize();
      }
    });
    return () => subscription.remove();
  }, []);

  const getImageSize = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error('File not found');
      return fileInfo.size / (1024 * 1024);
    } catch {
      return 0;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || imgList.length >= MAX_PHOTOS || isCapturingRef.current) return;

    isCapturingRef.current = true;
    setIsCapturing(true);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        exif: false,
      });

      const sizeMB = await getImageSize(result.uri);
      if (sizeMB === 0) throw new Error('Invalid image size');

      let limitRejected = false;
      setImgList(prev => {
        if (prev.length >= MAX_PHOTOS) return prev;
        const runningTotal = prev.reduce((acc, i) => acc + i.size, 0);
        if (runningTotal + sizeMB > MAX_SIZE_MB) {
          limitRejected = true;
          return prev;
        }
        return [...prev, { uri: result.uri, size: sizeMB }];
      });
      if (limitRejected) {
        Toast.show(`最多 ${MAX_PHOTOS} 张，总大小不超过 ${MAX_SIZE_MB}MB`);
      }
    } catch (error) {
      console.error('Take picture error:', error);
      Toast.show('拍照失败');
    } finally {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  };

  const handleUpload = async () => {
    if (imgList.length > MAX_PHOTOS || totalSize > MAX_SIZE_MB) {
      Toast.show(`最多 ${MAX_PHOTOS} 张，总大小不超过 ${MAX_SIZE_MB}MB`);
      return;
    }
    if (isUploading || imgList.length === 0) return;

    setIsUploading(true);
    const loadingKey = Toast.loading('上传中', 120);
    try {
      const uploaded = [];
      for (let i = 0; i < imgList.length; i++) {
        const img = imgList[i];
        const item = await uploadFileToAttachment({
          uri: img.uri,
          name: `image_${Date.now()}_${i}.jpg`,
          type: 'image/jpeg',
        });
        if (item) uploaded.push(item);
      }

      if (uploaded.length === 0) {
        Toast.show('上传失败');
        return;
      }

      pushPendingAttachments(uploaded);
      Toast.show('上传成功');
      setImgList([]);
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Toast.show('上传失败');
    } finally {
      Toast.remove(loadingKey);
      setIsUploading(false);
    }
  };

  const handleDelete = (index: number) => {
    setImgList(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFlash = () => {
    setFlashMode(prev => {
      const sequence: FlashMode[] = ['off', 'on', 'auto'];
      const currentIndex = sequence.indexOf(prev);
      return sequence[(currentIndex + 1) % sequence.length];
    });
  };

  const noticeStyle = {
    background: { backgroundColor: '#252534' },
    font: { color: '#FFF' },
  };

  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NoticeBar styles={noticeStyle} style={styles.notice}>
        <Text style={styles.noticeText}>
          最多上传 {MAX_PHOTOS} 张，总大小不超过 {MAX_SIZE_MB}MB
        </Text>
      </NoticeBar>

      <View style={[styles.cameraContainer, { flex: 1 }]}>
        {cameraReady && permission.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={false}
              flash={flashMode}
            />
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              <Ionicons
                name={flashMode === 'on' ? 'flash' : flashMode === 'auto' ? 'flash-outline' : 'flash-off'}
                size={40}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={imgList.length >= MAX_PHOTOS || isCapturing}>
              <View
                style={[
                  styles.captureInner,
                  (imgList.length >= MAX_PHOTOS || isCapturing) && styles.disabledButton,
                ]}
              />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={{ color: 'white', marginTop: 10 }}>相机准备中...</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPanel}>
        <Flex justify="between" style={styles.btnBox}>
          <Text style={styles.sort}>已拍 {imgList.length} 张</Text>
          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.disabledButton]}
            onPress={handleUpload}
            disabled={isUploading || imgList.length === 0}>
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.uploadButtonText}>
                完成 ({imgList.length}, {totalSize.toFixed(1)}MB)
              </Text>
            )}
          </TouchableOpacity>
        </Flex>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
          {imgList.map((item, index) => (
            <View
              key={item.uri}
              style={[
                styles.thumbnail,
                { width: thumbnailSize, height: thumbnailSize, marginRight: THUMBNAIL_MARGIN },
              ]}>
              <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <TouchableOpacity style={styles.thumbnailRemove} onPress={() => handleDelete(index)}>
                <MaterialIcons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
