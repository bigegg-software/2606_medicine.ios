import { Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';
import { uploadOss } from '@/api/oss';
import {
  aiIdentifyIdCard,
  type IdCardIdentifyData,
  type SubmitIdentityAuditParams,
} from '@/api/identityAudit';
import { apiResourceData } from '@/src/utils/apiHelpers';
import { displayCityName, resolveResidentialRegion } from '@/src/utils/regionData';

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
  if (!formatRegionLabel(form)) {
    return '请选择居住地区';
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
  try {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let permission = current;
    if (!current.granted) {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    if (!permission.granted) {
      Alert.alert('提示', '需要相册权限才能选择身份证照片');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName ?? `idcard_${side}_${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    };
  } catch {
    Alert.alert('提示', '无法打开系统相册，请稍后重试');
    return null;
  }
}

/** 身份证图最长边上限（识别足够，体积更小） */
const ID_CARD_MAX_EDGE = 1280;
/** JPEG 压缩系数，0~1，越小体积越小 */
const ID_CARD_JPEG_COMPRESS = 0.6;

function getLocalImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

/** 将本地图片（含 HEIC）转为 JPEG，并缩放压缩后再上传/识别 */
export async function ensureIdCardImageCompressed(file: PickedIdCardImage): Promise<PickedIdCardImage> {
  const actions: Action[] = [];
  try {
    const { width, height } = await getLocalImageSize(file.uri);
    const maxEdge = Math.max(width, height);
    if (maxEdge > ID_CARD_MAX_EDGE) {
      if (width >= height) {
        actions.push({ resize: { width: ID_CARD_MAX_EDGE } });
      } else {
        actions.push({ resize: { height: ID_CARD_MAX_EDGE } });
      }
    }
  } catch {
    // 取不到尺寸时仍做格式转换与压缩
  }

  const result = await manipulateAsync(
    file.uri,
    actions,
    { format: SaveFormat.JPEG, compress: ID_CARD_JPEG_COMPRESS },
  );
  const baseName = file.name.replace(/\.[^.]+$/, '') || `idcard_${Date.now()}`;
  return {
    uri: result.uri,
    name: `${baseName}.jpg`,
    type: 'image/jpeg',
  };
}

export async function uploadIdCardImage(
  file: PickedIdCardImage,
): Promise<{ ossId: string; url: string } | null> {
  const compressed = await ensureIdCardImageCompressed(file);
  const res = await uploadOss(compressed);
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
  const compressed = await ensureIdCardImageCompressed(file);
  const res = await aiIdentifyIdCard(compressed);
  return apiResourceData<IdCardIdentifyData>(res as { code?: number; data?: IdCardIdentifyData }) ?? null;
}

export type ApplyIdCardIdentifyResult = {
  previewUrl: string;
  ossId: string;
  name?: string;
  idCard?: string;
  residentialProvince?: string;
  residentialCity?: string;
  residentialDistrict?: string;
  residentialStreet?: string;
  residentialDetail?: string;
};

function pickTrimmed(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const text = value?.trim();
    if (text) return text;
  }
  return undefined;
}

function clampDetailAddress(text: string): string {
  return text.length > 50 ? text.slice(0, 50) : text;
}

/** 将识别结果整理为表单可回显字段（兼容新旧接口字段；县级市对齐四级区划） */
export async function normalizeIdCardIdentifyResult(
  data: IdCardIdentifyData,
  fallbackPreviewUri: string,
): Promise<ApplyIdCardIdentifyResult | null> {
  const ossId = data.ossId != null ? String(data.ossId) : '';
  if (!ossId) {
    return null;
  }
  const previewUrl = data.ossUrl?.trim() || fallbackPreviewUri;
  if (!previewUrl) {
    return null;
  }

  const province = pickTrimmed(data.province);
  const cityRaw = pickTrimmed(data.city);
  const city = province && cityRaw ? displayCityName(province, cityRaw) : cityRaw;
  const district = pickTrimmed(data.district);
  const street = pickTrimmed(data.street);
  const resolved = await resolveResidentialRegion({
    province,
    city,
    district,
    street,
  });
  // 优先拆分后的详细地址；兼容旧 address；无省市区时再退回完整地址
  const hasRegion = Boolean(
    resolved.province || resolved.city || resolved.district || resolved.street,
  );
  const detailRaw = pickTrimmed(
    data.detailAddress,
    data.address,
    hasRegion ? undefined : data.fullAddress,
  );

  return {
    previewUrl,
    ossId,
    name: pickTrimmed(data.name),
    idCard: pickTrimmed(data.idCard)?.toUpperCase(),
    residentialProvince: resolved.province || undefined,
    residentialCity: resolved.city || undefined,
    residentialDistrict: resolved.district || undefined,
    residentialStreet: resolved.street || undefined,
    residentialDetail: detailRaw ? clampDetailAddress(detailRaw) : undefined,
  };
}
