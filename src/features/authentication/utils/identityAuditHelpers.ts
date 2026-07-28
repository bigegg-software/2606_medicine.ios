import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadOss } from '@/api/oss';
import {
  aiIdentifyIdCard,
  type IdCardIdentifyData,
  type SubmitIdentityAuditParams,
} from '@/api/identityAudit';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { displayCityName } from '@/src/utils/regionData';

export type PickedIdCardImage = {
  uri: string;
  name: string;
  type: string;
};

export type IdCardSide = 'front' | 'back';

export type PersonalAuthForm = {
  name: string;
  idCard: string;
  residentialProvince: string;
  residentialCity: string;
  residentialDistrict: string;
  residentialStreet: string;
  residentialDetail: string;
  idCardFrontOssId?: string;
  idCardBackOssId?: string;
};

const ID_CARD_REG = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

export function formatRegionLabel(form: Pick<
  PersonalAuthForm,
  'residentialProvince' | 'residentialCity' | 'residentialDistrict' | 'residentialStreet'
>): string {
  const province = form.residentialProvince.trim();
  return [
    province,
    displayCityName(province, form.residentialCity.trim()),
    form.residentialDistrict.trim(),
    form.residentialStreet.trim(),
  ]
    .filter(Boolean)
    .join('/');
}

export function validatePersonalAuthForm(
  form: PersonalAuthForm,
  phonenumber?: string,
): string | null {
  if (!form.idCardFrontOssId) {
    return '请上传身份证正面照片';
  }
  if (!form.idCardBackOssId) {
    return '请上传身份证反面照片';
  }
  const name = form.name.trim();
  if (!name) {
    return '请输入姓名';
  }
  if (!form.residentialProvince.trim() || !form.residentialCity.trim()
    || !form.residentialDistrict.trim() || !form.residentialStreet.trim()) {
    return '请完善居住地区（省/市/区县/街道）';
  }
  const detail = form.residentialDetail.trim();
  if (!detail) {
    return '请输入详细地址';
  }
  if (detail.length > 50) {
    return '详细地址最多50字';
  }
  const idCard = form.idCard.trim();
  if (!idCard) {
    return '请输入身份证号';
  }
  if (!ID_CARD_REG.test(idCard)) {
    return '请输入正确的18位身份证号';
  }
  if (!phonenumber?.trim()) {
    return '未获取到账号手机号，请重新登录后再试';
  }
  return null;
}

export function buildPersonalAuditPayload(
  form: PersonalAuthForm,
  phonenumber: string,
): SubmitIdentityAuditParams {
  const province = form.residentialProvince.trim();
  return {
    auditType: 'personal',
    name: form.name.trim(),
    phonenumber: phonenumber.trim(),
    idCard: form.idCard.trim().toUpperCase(),
    idCardFrontOssId: form.idCardFrontOssId,
    idCardBackOssId: form.idCardBackOssId,
    residentialProvince: province,
    residentialCity: displayCityName(province, form.residentialCity.trim()),
    residentialDistrict: form.residentialDistrict.trim(),
    residentialStreet: form.residentialStreet.trim(),
    residentialDetail: form.residentialDetail.trim(),
  };
}

export async function pickIdCardImageFromLibrary(side: IdCardSide): Promise<PickedIdCardImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('提示', '需要相册权限');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `idcard_${side}_${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

export async function uploadIdCardImage(
  file: PickedIdCardImage,
): Promise<{ ossId: string; url: string } | null> {
  const res = await uploadOss(file);
  const data = apiResourceData<{ url?: string; ossId?: string | number }>(
    res as { code?: number; data?: { url?: string; ossId?: string | number } },
  );
  if (!data?.url || data.ossId == null || data.ossId === '') {
    return null;
  }
  const ossId = String(data.ossId);
  if (!ossId) {
    return null;
  }
  return { ossId, url: data.url };
}

/** 识别身份证照片，返回结构化信息与 oss */
export async function identifyIdCardImage(file: PickedIdCardImage): Promise<IdCardIdentifyData | null> {
  const res = await aiIdentifyIdCard(file);
  return apiResourceData<IdCardIdentifyData>(res as { code?: number; data?: IdCardIdentifyData }) ?? null;
}

export type ApplyIdCardIdentifyResult = {
  previewUrl: string;
  ossId: string;
  name?: string;
  idCard?: string;
  address?: string;
};

/** 将识别结果整理为表单可回显字段 */
export function normalizeIdCardIdentifyResult(
  data: IdCardIdentifyData,
  fallbackPreviewUri: string,
): ApplyIdCardIdentifyResult | null {
  const ossId = data.ossId != null ? String(data.ossId) : '';
  if (!ossId) {
    return null;
  }
  const previewUrl = data.ossUrl?.trim() || fallbackPreviewUri;
  if (!previewUrl) {
    return null;
  }
  return {
    previewUrl,
    ossId,
    name: data.name?.trim() || undefined,
    idCard: data.idCard?.trim().toUpperCase() || undefined,
    address: data.address?.trim() || undefined,
  };
}
