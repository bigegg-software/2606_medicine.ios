import { Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';
import { uploadOss } from '@/api/oss';
import {
  submitIdentityAudit,
  type SubmitIdentityAuditParams,
} from '@/api/identityAudit';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

export const FAMILY_RELATION_PROOF_MAX_COUNT = 5;

export type FamilyRelationProofFile = {
  uri: string;
  name: string;
  type: string;
};

export type FamilyRelationProofItem = {
  key: string;
  uri: string;
  ossId: string;
};

export type FamilyRelationProofSlotLayout = {
  size: number;
  gap: number;
};

export const FAMILY_RELATION_PROOF_SLOT_GAP = 12;
export const FAMILY_RELATION_PROOF_SLOT_DEFAULT_SIZE = 105;

/**
 * 槽位布局：间距固定 12，左对齐。
 * 1～2 个：按三列基准算宽 `(rowWidth - gap * 2) / 3`；
 * 3～5 个：按当前数量均分 `(rowWidth - gap * (n - 1)) / n`。
 */
export function getFamilyRelationProofSlotLayout(
  slotCount: number,
  rowWidth = 0,
): FamilyRelationProofSlotLayout {
  const count = Math.max(1, Math.min(slotCount, FAMILY_RELATION_PROOF_MAX_COUNT));
  const gap = FAMILY_RELATION_PROOF_SLOT_GAP;

  if (rowWidth <= 0) {
    return { size: FAMILY_RELATION_PROOF_SLOT_DEFAULT_SIZE, gap };
  }

  if (count <= 2) {
    const size = Math.floor((rowWidth - gap * 2) / 3);
    return { size: Math.max(1, size), gap };
  }

  const size = Math.floor((rowWidth - gap * (count - 1)) / count);
  return { size: Math.max(1, size), gap };
}

const PROOF_MAX_EDGE = 1600;
const PROOF_JPEG_COMPRESS = 0.7;

function getLocalImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

export async function compressFamilyRelationProofFile(
  file: FamilyRelationProofFile,
): Promise<FamilyRelationProofFile> {
  const actions: Action[] = [];
  try {
    const { width, height } = await getLocalImageSize(file.uri);
    const maxEdge = Math.max(width, height);
    if (maxEdge > PROOF_MAX_EDGE) {
      if (width >= height) {
        actions.push({ resize: { width: PROOF_MAX_EDGE } });
      } else {
        actions.push({ resize: { height: PROOF_MAX_EDGE } });
      }
    }
  } catch {
    // ignore size lookup failure
  }

  const result = await manipulateAsync(file.uri, actions, {
    format: SaveFormat.JPEG,
    compress: PROOF_JPEG_COMPRESS,
  });
  const baseName = file.name.replace(/\.[^.]+$/, '') || `relation_proof_${Date.now()}`;
  return {
    uri: result.uri,
    name: `${baseName}.jpg`,
    type: 'image/jpeg',
  };
}

export async function pickFamilyRelationProofFromLibrary(
  remainCount: number,
): Promise<FamilyRelationProofFile[]> {
  if (remainCount <= 0) {
    Alert.alert('提示', `最多上传${FAMILY_RELATION_PROOF_MAX_COUNT}张`);
    return [];
  }
  try {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let permission = current;
    if (!current.granted) {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    if (!permission.granted) {
      Alert.alert('提示', '需要相册权限才能选择照片');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: remainCount > 1,
      selectionLimit: remainCount,
    });
    if (result.canceled || !result.assets?.length) return [];

    return result.assets.slice(0, remainCount).map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName ?? `relation_proof_${Date.now()}_${index}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    }));
  } catch {
    Alert.alert('提示', '无法打开系统相册，请稍后重试');
    return [];
  }
}

export async function pickFamilyRelationProofFromCamera(): Promise<FamilyRelationProofFile | null> {
  try {
    const current = await ImagePicker.getCameraPermissionsAsync();
    let permission = current;
    if (!current.granted) {
      permission = await ImagePicker.requestCameraPermissionsAsync();
    }
    if (!permission.granted) {
      Alert.alert('提示', '需要相机权限才能拍照');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName ?? `relation_proof_${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    };
  } catch {
    Alert.alert('提示', '无法打开相机，请稍后重试');
    return null;
  }
}

export async function uploadFamilyRelationProofFile(
  file: FamilyRelationProofFile,
): Promise<FamilyRelationProofItem | null> {
  const compressed = await compressFamilyRelationProofFile(file);
  const res = await uploadOss(compressed);
  const data = apiResourceData<{ url?: string; ossId?: string | number }>(
    res as { code?: number; data?: { url?: string; ossId?: string | number } },
  );
  if (!data?.url || data.ossId == null || data.ossId === '') return null;
  const ossId = String(data.ossId);
  if (!ossId) return null;
  return {
    key: ossId,
    uri: data.url || compressed.uri,
    ossId,
  };
}

export function buildFamilyRelationProofDesc(displayName?: string | null): string {
  const name = displayName?.trim() || '家人';
  return `请上传与「${name}」的关系证明(如户口本、出生证明等)，最多${FAMILY_RELATION_PROOF_MAX_COUNT}张，提交后由管理端审核。`;
}

export function validateFamilyRelationProofSubmit(input: {
  phonenumber?: string | null;
  name?: string | null;
  patientBindId?: string | null;
  relationType?: string | null;
  proofItems: FamilyRelationProofItem[];
}): string | null {
  if (!input.phonenumber?.trim()) return '未获取到账号手机号，请重新登录后再试';
  if (!input.name?.trim()) return '未获取到用户姓名，请完善个人信息后再试';
  if (!input.patientBindId?.trim()) return '缺少家人绑定信息';
  if (!input.relationType?.trim()) return '缺少关系信息';
  if (input.proofItems.length === 0) return '请至少上传1张关系证明';
  if (input.proofItems.length > FAMILY_RELATION_PROOF_MAX_COUNT) {
    return `最多上传${FAMILY_RELATION_PROOF_MAX_COUNT}张`;
  }
  return null;
}

export function buildFamilyRelationAuditPayload(input: {
  phonenumber: string;
  name: string;
  patientBindId: string;
  relationType: string;
  proofItems: FamilyRelationProofItem[];
}): SubmitIdentityAuditParams {
  return {
    auditType: 'family',
    name: input.name.trim(),
    phonenumber: input.phonenumber.trim(),
    patientBindId: String(input.patientBindId),
    relationType: String(input.relationType),
    relationProofOssIds: input.proofItems.map(item => String(item.ossId)),
  };
}

export async function submitFamilyRelationProof(
  payload: SubmitIdentityAuditParams,
): Promise<{ ok: boolean; msg?: string }> {
  try {
    const res = await submitIdentityAudit(payload);
    if (!isResourceApiOk(res as { code?: number })) {
      return {
        ok: false,
        msg: (res as { msg?: string })?.msg ?? '提交失败，请稍后重试',
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, msg: '网络错误，请稍后重试' };
  }
}
