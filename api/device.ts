import request from '@/utils/axios';
import type { ApiResult } from '@/src/utils/apiHelpers';

/** 我的设备 */
export type PatientDevice = {
  /** 主键ID（删除用） */
  id?: number | string;
  userId?: number | string;
  /** 设备类型 */
  deviceType?: string;
  /** 设备名称 */
  deviceName?: string;
  /** 设备ID（业务侧设备标识，如蓝牙 deviceId） */
  deviceId?: string;
  /** 扩展字段 */
  extr?: Record<string, unknown> | null;
  createTime?: string;
  updateTime?: string;
};

export type AddPatientDevicePayload = {
  /** 主键ID（可选；同 deviceType+deviceId 存在则覆盖更新） */
  id?: number | string;
  /** 设备类型 */
  deviceType: string;
  /** 设备名称 */
  deviceName?: string;
  /** 设备ID（业务侧设备标识） */
  deviceId: string;
  /** 扩展字段 */
  extr?: Record<string, unknown>;
};

export type PatientDeviceListResult = ApiResult<PatientDevice[]>;
export type AddPatientDeviceResult = ApiResult;
export type RemovePatientDeviceResult = ApiResult;

/** 我的设备列表 */
export const getPatientDeviceList = () =>
  request.get<PatientDeviceListResult>('/patient/device/list');

/**
 * 添加设备（同设备类型 + 设备ID 存在则覆盖更新）
 * id 统一按 string 传给后端
 */
export const addPatientDevice = (data: AddPatientDevicePayload) =>
  request.post<AddPatientDeviceResult>('/patient/device/add', {
    ...data,
    deviceId: String(data.deviceId),
    ...(data.id != null && data.id !== '' ? { id: String(data.id) } : {}),
  });

/** 删除我的设备（逻辑删除） */
export const removePatientDeviceById = (id: string | number) =>
  request.delete<RemovePatientDeviceResult>('/patient/device/removeById', {
    params: { id: String(id) },
  });
