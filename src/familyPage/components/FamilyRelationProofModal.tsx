import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  type LayoutChangeEvent,
} from 'react-native';
import { Flex, Toast } from '@ant-design/react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import { AppTheme } from '@/common/theme';
import type { RootStackParamList } from '@/route/router';
import {
  FAMILY_RELATION_PROOF_MAX_COUNT,
  FAMILY_RELATION_PROOF_SLOT_GAP,
  buildFamilyRelationAuditPayload,
  buildFamilyRelationProofDesc,
  getFamilyRelationProofSlotLayout,
  submitFamilyRelationProof,
  uploadFamilyRelationProofFile,
  validateFamilyRelationProofSubmit,
  type FamilyRelationProofItem,
} from '../utils/familyRelationProofHelpers';
import { consumePendingFamilyRelationProofCapture } from '../utils/familyRelationProofCaptureSession';

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

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [proofItems, setProofItems] = useState<FamilyRelationProofItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofRowWidth, setProofRowWidth] = useState(0);
  const pendingCaptureNavRef = useRef(false);
  const remainCountRef = useRef(FAMILY_RELATION_PROOF_MAX_COUNT);

  useEffect(() => {
    if (visible) {
      setProofItems([]);
      setUploading(false);
      setSubmitting(false);
      pendingCaptureNavRef.current = false;
      setSheetOpen(true);
      return;
    }
    pendingCaptureNavRef.current = false;
    setSheetOpen(false);
  }, [visible]);

  const remainCount = FAMILY_RELATION_PROOF_MAX_COUNT - proofItems.length;
  remainCountRef.current = remainCount;
  const busy = uploading || submitting;
  const showAddSlot = remainCount > 0;
  const slotCount = proofItems.length + (showAddSlot ? 1 : 0);
  const { size: slotSize, gap: slotGap } = getFamilyRelationProofSlotLayout(
    slotCount,
    proofRowWidth,
  );

  const handleProofRowLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = Math.round(e.nativeEvent.layout.width);
    setProofRowWidth(prev => (prev === nextWidth ? prev : nextWidth));
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      if (!visible) return;
      const files = consumePendingFamilyRelationProofCapture();
      if (files.length > 0) {
        void appendFiles(files);
      }
      setSheetOpen(true);
    }, [appendFiles, visible]),
  );

  const handleSheetDismissed = useCallback(() => {
    if (!pendingCaptureNavRef.current) return;
    pendingCaptureNavRef.current = false;
    navigation.navigate('FamilyRelationProofCapturePage', {
      remainCount: remainCountRef.current,
    });
  }, [navigation]);

  const handlePressAdd = useCallback(() => {
    if (busy) return;
    if (remainCount <= 0) {
      Alert.alert('提示', `最多上传${FAMILY_RELATION_PROOF_MAX_COUNT}张`);
      return;
    }
    pendingCaptureNavRef.current = true;
    setSheetOpen(false);
  }, [busy, remainCount]);

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

        <View
          style={[styles.proofRow, { gap: slotGap || FAMILY_RELATION_PROOF_SLOT_GAP }]}
          onLayout={handleProofRowLayout}
        >
          {proofItems.map(item => (
            <View key={item.key} style={[styles.proofItem, { width: slotSize, height: slotSize }]}>
              <Image source={{ uri: item.uri }} style={styles.proofImage} />
              <TouchableOpacity
                style={styles.proofRemove}
                activeOpacity={0.8}
                disabled={busy}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => handleRemove(item.key)}
              >
                <Image
                  source={require('@/assets/family/profile/icon_close.png')}
                  style={styles.proofRemoveIcon}
                />
              </TouchableOpacity>
            </View>
          ))}
          {showAddSlot ? (
            <TouchableOpacity
              style={[styles.proofAdd, { width: slotSize, height: slotSize }]}
              activeOpacity={0.8}
              disabled={busy}
              onPress={handlePressAdd}
            >
              <View style={[styles.proofAddPlus, { width: slotSize * 0.28, height: slotSize * 0.28 }]}>
                <View
                  style={[
                    styles.proofAddPlusH,
                    { width: slotSize * 0.22, height: Math.max(2, slotSize * 0.03) },
                  ]}
                />
                <View
                  style={[
                    styles.proofAddPlusV,
                    { width: Math.max(2, slotSize * 0.03), height: slotSize * 0.22 },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

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
  proofRow: {
    marginTop: 10,
    height: 150,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  proofItem: {
    borderRadius: 8,
    overflow: 'visible',
    backgroundColor: '#F5F5F5',
  },
  proofImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  proofRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofRemoveIcon: {
    width: 25,
    height: 25,
  },
  proofAdd: {
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofAddPlus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofAddPlusH: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: '#C8C8C8',
  },
  proofAddPlusV: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: '#C8C8C8',
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
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
