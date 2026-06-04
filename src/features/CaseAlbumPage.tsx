import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Text,
  Linking,
  AppState,
  Image,
  FlatList,
  Platform,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  InteractionManager,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NoticeBar from '@ant-design/react-native/lib/notice-bar';
import Modal from '@ant-design/react-native/lib/modal';
import { Toast, Flex } from '@ant-design/react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addListener } from 'expo-media-library';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import styles from '@/css/profile/camera';
import { pushPendingAttachments } from '@/src/utils/attachmentUploadSession';
import { uploadFileToAttachment } from '@/src/utils/uploadAttachment';

type ImageItem = {
  id: string;
  uri: string;
  size: number;
  filename: string;
};

const MAX_PHOTOS = 30;
const MAX_SIZE_MB = 30;
const THUMBNAIL_MARGIN = 8;
const ADD_ACCESSIBLE_TILE_ID = '__add_accessible_tile__';

type AddAccessibleTile = { id: typeof ADD_ACCESSIBLE_TILE_ID; __addAccessibleTile: true };
type AlbumGridItem = MediaLibrary.Asset | AddAccessibleTile;
type PermissionPhase = 'checking' | 'undetermined' | 'granted' | 'denied';

function lowercaseExtensionPath(path: string) {
  return path.replace(/\.[^/.]+$/, ext => ext.toLowerCase());
}

function isDisplayableUri(uri: string) {
  return uri.startsWith('file://') || uri.startsWith('http://') || uri.startsWith('https://');
}

const displayUriCache = new Map<string, string>();

async function resolveAssetUri(asset: MediaLibrary.Asset): Promise<string> {
  const cached = displayUriCache.get(asset.id);
  if (cached && isDisplayableUri(cached)) {
    return cached;
  }

  if (isDisplayableUri(asset.uri)) {
    displayUriCache.set(asset.id, asset.uri);
    return asset.uri;
  }

  const info = await MediaLibrary.getAssetInfoAsync(asset.id, {
    shouldDownloadFromNetwork: true,
  });
  const resolved = info.localUri ?? info.uri ?? asset.uri;
  if (isDisplayableUri(resolved)) {
    displayUriCache.set(asset.id, resolved);
  }
  return resolved;
}

type AlbumGridThumbnailProps = {
  asset: MediaLibrary.Asset;
};

function AlbumGridThumbnail({ asset }: AlbumGridThumbnailProps) {
  const [displayUri, setDisplayUri] = useState<string | null>(() => {
    const cached = displayUriCache.get(asset.id);
    return cached && isDisplayableUri(cached) ? cached : null;
  });

  useEffect(() => {
    let cancelled = false;

    if (isDisplayableUri(asset.uri)) {
      displayUriCache.set(asset.id, asset.uri);
      setDisplayUri(asset.uri);
      return;
    }

    resolveAssetUri(asset)
      .then(uri => {
        if (!cancelled && isDisplayableUri(uri)) {
          setDisplayUri(uri);
        }
      })
      .catch(error => {
        console.error('resolveAssetUri error:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [asset.id, asset.uri]);

  if (!displayUri) {
    return (
      <View style={[styles.image, { backgroundColor: '#2a2a3a', alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color="#576EB4" />
      </View>
    );
  }

  return <Image source={{ uri: displayUri }} style={styles.image} />;
}

type SelectedPhotoThumbnailProps = {
  item: ImageItem;
};

function SelectedPhotoThumbnail({ item }: SelectedPhotoThumbnailProps) {
  const [displayUri, setDisplayUri] = useState<string | null>(
    isDisplayableUri(item.uri) ? item.uri : null,
  );

  useEffect(() => {
    let cancelled = false;

    if (isDisplayableUri(item.uri)) {
      setDisplayUri(item.uri);
      return;
    }

    resolveAssetUri({ id: item.id, uri: item.uri, filename: item.filename } as MediaLibrary.Asset)
      .then(uri => {
        if (!cancelled && isDisplayableUri(uri)) {
          setDisplayUri(uri);
        }
      })
      .catch(error => {
        console.error('resolve selected thumbnail error:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.uri, item.filename]);

  if (!displayUri) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2a2a3a', alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color="#576EB4" />
      </View>
    );
  }

  return <Image source={{ uri: displayUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
}

export default function CaseAlbumPage() {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionPhase>('checking');
  const { width } = Dimensions.get('window');
  const thumbnailSize = width / 4 - THUMBNAIL_MARGIN;
  const [selectedPhotos, setSelectedPhotos] = useState<ImageItem[]>([]);
  const [limited, setLimited] = useState(false);
  const limitedRef = useRef(false);
  const loadingRef = useRef(false);
  const hasNextPageRef = useRef(true);
  const endCursorRef = useRef<string | null>(null);
  const deniedAlertShownRef = useRef(false);

  useEffect(() => {
    limitedRef.current = limited;
  }, [limited]);

  const albumGridData: AlbumGridItem[] = limited
    ? [...photos, { id: ADD_ACCESSIBLE_TILE_ID, __addAccessibleTile: true }]
    : photos;

  const loadPhotos = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    if (!reset && !hasNextPageRef.current) return;

    loadingRef.current = true;
    try {
      const { assets, endCursor: newEndCursor, hasNextPage: newHasNextPage } =
        await MediaLibrary.getAssetsAsync({
          first: 21,
          after: reset ? undefined : endCursorRef.current ?? undefined,
          sortBy: MediaLibrary.SortBy.creationTime,
          mediaType: MediaLibrary.MediaType.photo,
        });

      endCursorRef.current = newEndCursor;
      hasNextPageRef.current = newHasNextPage;
      setPhotos(prev => (reset ? assets : [...prev, ...assets]));
    } catch (error) {
      console.error('loadPhotos error:', error);
      Toast.show('加载相册失败');
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const applyPermissionResult = useCallback(
    async (perm: MediaLibrary.PermissionResponse, showDeniedAlert = false) => {
      setLimited(perm.accessPrivileges === 'limited');

      if (perm.status === 'granted') {
        setPermissionStatus('granted');
        endCursorRef.current = null;
        hasNextPageRef.current = true;
        await loadPhotos(true);
        return;
      }

      if (perm.status === 'denied') {
        setPermissionStatus('denied');
        setPhotos([]);
        if (showDeniedAlert && !deniedAlertShownRef.current) {
          deniedAlertShownRef.current = true;
          Modal.alert(
            '开启相册权限',
            <Text style={{ color: '#A1A1AA', width: 240, textAlign: 'center' }}>
              需要相册权限才能选择照片上传附件
            </Text>,
            [
              { text: '知道了', style: 'cancel' },
              { text: '去设置', onPress: () => Linking.openSettings() },
            ],
          );
        }
        return;
      }

      setPermissionStatus('undetermined');
      setPhotos([]);
    },
    [loadPhotos],
  );

  const initializePermissions = useCallback(async () => {
    setPermissionStatus('checking');
    try {
      let perm = await MediaLibrary.getPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await MediaLibrary.requestPermissionsAsync();
      }
      await applyPermissionResult(perm, true);
    } catch (error) {
      console.error('Album permission error:', error);
      setPermissionStatus('denied');
      Toast.show('相册权限检查失败');
    }
  }, [applyPermissionResult]);

  const refreshPermissionStatus = useCallback(async () => {
    try {
      const perm = await MediaLibrary.getPermissionsAsync();
      await applyPermissionResult(perm, false);
    } catch (error) {
      console.error('Refresh album permission error:', error);
    }
  }, [applyPermissionResult]);

  const requestAlbumPermission = useCallback(async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      await applyPermissionResult(perm, true);
    } catch (error) {
      console.error('Request album permission error:', error);
      Toast.show('无法请求相册权限');
    }
  }, [applyPermissionResult]);

  useEffect(() => {
    initializePermissions();
  }, [initializePermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        refreshPermissionStatus();
      }
    });
    return () => subscription.remove();
  }, [refreshPermissionStatus]);

  const refreshPhotosGridFromStart = useCallback(async () => {
    try {
      const perm = await MediaLibrary.getPermissionsAsync();
      if (perm.status !== 'granted') {
        await applyPermissionResult(perm);
        return;
      }
      setLimited(perm.accessPrivileges === 'limited');

      endCursorRef.current = null;
      hasNextPageRef.current = true;

      const { assets, endCursor: newEndCursor, hasNextPage: newHasNextPage } =
        await MediaLibrary.getAssetsAsync({
          first: 21,
          sortBy: MediaLibrary.SortBy.creationTime,
          mediaType: MediaLibrary.MediaType.photo,
        });
      endCursorRef.current = newEndCursor;
      hasNextPageRef.current = newHasNextPage;
      setPhotos(assets);
    } catch (error) {
      console.error('Refresh photos grid:', error);
      Toast.show('刷新相册失败');
    }
  }, [applyPermissionResult]);

  useEffect(() => {
    const subscription = addListener(event => {
      const inserted = event.insertedAssets?.length ?? 0;
      if (!event.hasIncrementalChanges || (limitedRef.current && inserted > 0)) {
        refreshPhotosGridFromStart();
      }
    });
    return () => subscription.remove();
  }, [refreshPhotosGridFromStart]);

  const resolveLocalImageForUpload = async (localUri: string, filename: string) => {
    const uri = localUri;
    const fn = filename || `photo_${Date.now()}.jpg`;

    if (Platform.OS === 'ios' && uri.toLowerCase().endsWith('.heic')) {
      throw new Error('HEIC');
    }

    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    const sizeMB = fileInfo.size / (1024 * 1024);
    return { localUri: uri, filename: fn, sizeMB };
  };

  const getFileSize = async (asset: MediaLibrary.Asset) => {
    const localUri = await resolveAssetUri(asset);
    if (!isDisplayableUri(localUri)) {
      throw new Error('Cannot resolve asset uri');
    }
    const filename = asset.filename || `photo_${Date.now()}.jpg`;
    return resolveLocalImageForUpload(localUri, filename);
  };

  const expandAccessiblePhotos = async () => {
    try {
      await MediaLibrary.presentPermissionsPickerAsync(['photo']);
    } catch (error) {
      console.error('presentPermissionsPickerAsync:', error);
      Toast.show('无法打开相册权限设置');
      return;
    }
    await refreshPhotosGridFromStart();
    InteractionManager.runAfterInteractions(() => {
      refreshPhotosGridFromStart();
    });
  };

  const toggleSelect = async (asset: MediaLibrary.Asset) => {
    const index = selectedPhotos.findIndex(item => item.id === asset.id);

    if (index > -1) {
      const newSelected = selectedPhotos.filter(item => item.id !== asset.id);
      const removedSize = selectedPhotos[index].size;
      setSelectedPhotos(newSelected);
      setTotalSize(+(totalSize - removedSize).toFixed(1));
    } else {
      if (selectedPhotos.length >= MAX_PHOTOS) {
        Toast.show(`最多选择 ${MAX_PHOTOS} 张`);
        return;
      }

      try {
        const { localUri, filename, sizeMB } = await getFileSize(asset);
        const newTotal = +(totalSize + sizeMB).toFixed(1);

        if (newTotal > MAX_SIZE_MB) {
          Toast.show(`总大小不能超过 ${MAX_SIZE_MB}MB`);
          return;
        }

        setSelectedPhotos(prev => [
          ...prev,
          {
            id: asset.id,
            uri: localUri,
            size: sizeMB,
            filename: lowercaseExtensionPath(filename),
          },
        ]);
        setTotalSize(newTotal);
      } catch (error) {
        console.error('Error selecting image:', error);
        if (error instanceof Error && error.message === 'HEIC') {
          Toast.show('暂不支持 HEIC 格式，请选择其他照片');
        } else {
          Toast.show('无法处理该图片');
        }
      }
    }
  };

  const addAccessibleTileInner = {
    backgroundColor: '#2a2a3a',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#576EB4',
    borderRadius: 4,
  };

  const renderAlbumGridItem = ({ item }: { item: AlbumGridItem }) => {
    if ('__addAccessibleTile' in item && item.__addAccessibleTile) {
      return (
        <TouchableOpacity style={styles.imageContainer} onPress={expandAccessiblePhotos} activeOpacity={0.75}>
          <View style={[styles.image, addAccessibleTileInner]}>
            <Text style={{ color: '#576EB4', fontSize: 50, fontWeight: '300' }}>+</Text>
            <Text
              numberOfLines={2}
              style={{
                color: '#A1A1AA',
                fontSize: 12,
                textAlign: 'center',
                marginTop: 4,
                paddingHorizontal: 4,
              }}>
              添加可访问照片
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    const asset = item as MediaLibrary.Asset;
    const isSelected = selectedPhotos.some(selected => selected.id === asset.id);

    return (
      <TouchableOpacity onPress={() => toggleSelect(asset)} style={styles.imageContainer}>
        <AlbumGridThumbnail asset={asset} />
        {isSelected ? (
          <View style={styles.selectionNumber}>
            <Text style={styles.numberText}>
              {selectedPhotos.findIndex(selected => selected.id === asset.id) + 1}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const handleUpload = async () => {
    if (selectedPhotos.length === 0) {
      Toast.show('请选择照片');
      return;
    }
    if (selectedPhotos.length > MAX_PHOTOS || totalSize > MAX_SIZE_MB) {
      Toast.show(`最多 ${MAX_PHOTOS} 张，总大小不超过 ${MAX_SIZE_MB}MB`);
      return;
    }
    if (isUploading) return;

    setIsUploading(true);
    const loadingKey = Toast.loading('上传中', 120);
    try {
      const uploaded = [];
      for (const img of selectedPhotos) {
        const item = await uploadFileToAttachment({
          uri: img.uri,
          name: lowercaseExtensionPath(img.filename),
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
      setSelectedPhotos([]);
      setTotalSize(0);
      navigation.goBack();
    } catch (err) {
      console.error('Upload error:', err);
      Toast.show('上传失败');
    } finally {
      Toast.remove(loadingKey);
      setIsUploading(false);
    }
  };

  const handleDelete = (index: number) => {
    const newSelectedPhotos = [...selectedPhotos];
    const deletedImage = newSelectedPhotos.splice(index, 1)[0];
    const newTotalSize = +(totalSize - deletedImage.size).toFixed(1);
    setSelectedPhotos(newSelectedPhotos);
    setTotalSize(newTotalSize);
  };

  const noticeStyle = {
    background: { backgroundColor: '#252534' },
    font: { color: '#FFF' },
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NoticeBar styles={noticeStyle} style={styles.notice}>
        <Text style={styles.noticeText}>
          最多上传 {MAX_PHOTOS} 张，总大小不超过 {MAX_SIZE_MB}MB
        </Text>
      </NoticeBar>
      {limited ? (
        <NoticeBar styles={noticeStyle} style={styles.notice} onPress={() => Linking.openSettings()}>
          <Text style={styles.noticeText}>当前为受限相册访问，可在设置中允许访问更多照片</Text>
        </NoticeBar>
      ) : null}

      <View style={styles.cameraContainer}>
        {permissionStatus === 'checking' ? (
          <View style={styles.noPerBox}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={[styles.noPerIntro, { marginTop: 16 }]}>正在检查相册权限...</Text>
          </View>
        ) : permissionStatus === 'undetermined' ? (
          <View style={styles.noPerBox}>
            <Text style={styles.noPerTitle}>需要相册权限</Text>
            <Text style={styles.noPerIntro}>请授权访问相册，以便选择照片上传</Text>
            <TouchableOpacity style={[styles.uploadButton, { marginTop: 24 }]} onPress={requestAlbumPermission}>
              <Text style={styles.uploadButtonText}>授权相册</Text>
            </TouchableOpacity>
          </View>
        ) : permissionStatus === 'denied' ? (
          <View style={styles.noPerBox}>
            <Text style={styles.noPerTitle}>需要相册权限</Text>
            <Text style={styles.noPerIntro}>
              {Platform.OS === 'ios'
                ? '相册权限已被关闭，请在系统设置中允许访问照片'
                : '请在系统设置中允许访问相册，以便选择照片上传'}
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, { position: 'absolute', bottom: 30 }]}
              onPress={() => Linking.openSettings()}>
              <Text style={styles.uploadButtonText}>去设置</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={albumGridData}
            renderItem={renderAlbumGridItem}
            keyExtractor={item => item.id}
            numColumns={3}
            onEndReached={() => loadPhotos(false)}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.noPerBox}>
                <Text style={styles.noPerIntro}>相册暂无照片</Text>
              </View>
            }
            ListFooterComponent={photos.length === 0 ? null : <View style={{ height: 50 }} />}
          />
        )}
      </View>

      <View style={styles.bottomPanel}>
        <Flex justify="between" style={styles.btnBox}>
          <Text style={styles.sort}>已选 {selectedPhotos.length} 张</Text>
          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.disabledButton]}
            onPress={handleUpload}
            disabled={isUploading || selectedPhotos.length === 0}>
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.uploadButtonText}>
                完成 ({selectedPhotos.length}, {totalSize.toFixed(1)}MB)
              </Text>
            )}
          </TouchableOpacity>
        </Flex>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
          {selectedPhotos.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.thumbnail,
                { width: thumbnailSize, height: thumbnailSize, marginRight: THUMBNAIL_MARGIN },
              ]}>
              <SelectedPhotoThumbnail item={item} />
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
