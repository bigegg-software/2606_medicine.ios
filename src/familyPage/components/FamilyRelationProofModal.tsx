import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import { AppTheme } from '@/common/theme';
import {
  FAMILY_RELATION_PROOF_MAX_COUNT,
  buildFamilyRelationAuditPayload,
  buildFamilyRelationProofDesc,
  pickFamilyRelationProofFromCamera,
  pickFamilyRelationProofFromLibrary,
  submitFamilyRelationProof,
  uploadFamilyRelationProofFile,
  validateFamilyRelationProofSubmit,
  type FamilyRelationProofItem,
} from '../utils/familyRelationProofHelpers';

type Props = {
  visible: boolean;
  displayName: string;
  patientBindId: string;
  relationType: string;
  phonenumber?: string | null;
  submitterName?: string | null;
  onClose: () => void;
  onSubmitted?: () => void;
};

type PendingSource = 'camera' | 'album' | null;

export default function FamilyRelationProofModal({
  visible,
  displayName,
  patientBindId,
  relationType,
  phonenumber,
  submitterName,
  onClose,
  onSubmitted,
}: Props) {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [proofItems, setProofItems] = useState<FamilyRelationProofItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const pendingSourceRef = useRef<PendingSource>(null);

  useEffect(() => {
    if (visible) {
      setProofItems([]);
      setUploading(false);
      setSubmitting(false);
      pendingSourceRef.current = null;
      setSheetOpen(true);
      return;
    }
    pendingSourceRef.current = null;
    setSheetOpen(false);
  }, [visible]);

  const remainCount = FAMILY_RELATION_PROOF_MAX_COUNT - proofItems.length;
  const busy = uploading || submitting;

  const appendFiles = useCallback(async (files: Array<{ uri: string; name: string; type: string }>) => {
    if (files.length === 0) return;
    setUploading(true);
    const loadingKey = Toast.loading('上传中', 0);
    try {
      const nextItems: FamilyRelationProofItem[] = [];
      for (const file of files) {
        const uploaded = await uploadFamilyRelationProofFile(file);
        if (!uploaded) {
          Toast.show('上传失败，请稍后重试');
          continue;
        }
        nextItems.push(uploaded);
      }
      if (nextItems.length > 0) {
        setProofItems(prev => [...prev, ...nextItems].slice(0, FAMILY_RELATION_PROOF_MAX_COUNT));
      }
    } finally {
      Toast.remove(loadingKey);
      setUploading(false);
    }
  }, []);

  const handleSheetDismissed = useCallback(() => {
    const source = pendingSourceRef.current;
    if (!source) return;
    pendingSourceRef.current = null;
    void (async () => {
      if (source === 'camera') {
        const file = await pickFamilyRelationProofFromCamera();
        if (file) await appendFiles([file]);
      } else {
        const files = await pickFamilyRelationProofFromLibrary(remainCount);
        if (files.length > 0) await appendFiles(files);
      }
      if (visible) setSheetOpen(true);
    })();
  }, [appendFiles, remainCount, visible]);

  const requestSource = useCallback(
    (source: Exclude<PendingSource, null>) => {
      if (busy) return;
      if (remainCount <= 0) {
        Alert.alert('提示', `最多上传${FAMILY_RELATION_PROOF_MAX_COUNT}张`);
        return;
      }
      pendingSourceRef.current = source;
      setSheetOpen(false);
    },
    [busy, remainCount],
  );

  const handleRemove = useCallback((key: string) => {
    if (busy) return;
    setProofItems(prev => prev.filter(item => item.key !== key));
  }, [busy]);

  const handleSubmit = useCallback(async () => {
    if (busy) return;
    const error = validateFamilyRelationProofSubmit({
      phonenumber,
      name: submitterName,
      patientBindId,
      relationType,
      proofItems,
    });
    if (error) {
      Alert.alert('提示', error);
      return;
    }
    setSubmitting(true);
    const loadingKey = Toast.loading('提交中', 0);
    try {
      const payload = buildFamilyRelationAuditPayload({
        phonenumber: String(phonenumber),
        name: String(submitterName),
        patientBindId,
        relationType,
        proofItems,
      });
      const result = await submitFamilyRelationProof(payload);
      if (!result.ok) {
        Alert.alert('提交失败', result.msg ?? '请稍后重试');
        return;
      }
      Toast.show('已提交审核');
      onClose();
      onSubmitted?.();
    } finally {
      Toast.remove(loadingKey);
      setSubmitting(false);
    }
  }, [
    busy,
    onClose,
    onSubmitted,
    patientBindId,
    phonenumber,
    proofItems,
    relationType,
    submitterName,
  ]);

  return (
    <BottomSheetModal
      visible={sheetOpen}
      onClose={busy ? () => undefined : onClose}
      onDismissed={handleSheetDismissed}
      dismissOnBackdropPress={!busy}
      sheetStyle={styles.sheet}
    >
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.header}>
          <Text style={styles.title}>上传家属关系证明</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.8}
            disabled={busy}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={busy ? undefined : onClose}
          >
            <Image
              source={require('@/assets/images/schedule/close.png')}
              style={styles.closeIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <Text style={styles.desc}>{buildFamilyRelationProofDesc(displayName)}</Text>

        <Flex justify="center" style={styles.sourceRow}>
          <TouchableOpacity
            style={styles.sourceItem}
            activeOpacity={0.8}
            disabled={busy}
            onPress={() => requestSource('camera')}
          >
            <View style={styles.sourceDash}>
              <Image
                source={require('@/assets/images/case/icon_camera.png')}
                style={styles.sourceIcon}
              />
              <Text style={styles.sourceTitle}>拍照识别</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sourceItem}
            activeOpacity={0.8}
            disabled={busy}
            onPress={() => requestSource('album')}
          >
            <View style={styles.sourceDash}>
              <Image
                source={require('@/assets/images/case/icon_image.png')}
                style={styles.sourceIcon}
              />
              <Text style={styles.sourceTitle}>上传照片</Text>
            </View>
          </TouchableOpacity>
        </Flex>

        {proofItems.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
          >
            {proofItems.map(item => (
              <View key={item.key} style={styles.previewItem}>
                <Image source={{ uri: item.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.previewRemove}
                  activeOpacity={0.8}
                  disabled={busy}
                  onPress={() => handleRemove(item.key)}
                >
                  <Image
                    source={require('@/assets/images/case/icon_del.png')}
                    style={styles.previewRemoveIcon}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, (busy || proofItems.length === 0) && styles.submitBtnDisabled]}
          activeOpacity={0.8}
          disabled={busy || proofItems.length === 0}
          onPress={() => {
            void handleSubmit();
          }}
        >
          <Flex align="center" justify="center">
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>提交审核</Text>
            )}
          </Flex>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    paddingHorizontal: 36,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  divider: {
    marginTop: 16,
    height: 1,
    backgroundColor: 'rgba(23,63,125,0.08)',
  },
  desc: {
    marginTop: 16,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 20,
    color: '#666666',
    textAlign: 'left',
  },
  sourceRow: {
    marginTop: 20,
    gap: 24,
  },
  sourceItem: {
    width: 99,
    height: 100,
  },
  sourceDash: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sourceIcon: {
    width: 44,
    height: 44,
  },
  sourceTitle: {
    marginTop: 10,
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
  },
  previewScroll: {
    marginTop: 16,
  },
  previewContent: {
    paddingRight: 8,
  },
  previewItem: {
    width: 72,
    height: 72,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRemoveIcon: {
    width: 12,
    height: 12,
  },
  submitBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppTheme.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
