export type ApiResult<T = unknown> = { code?: number; message?: string; msg?: string; data?: T };

export function isApiOk(res: ApiResult | null | undefined): boolean {
  return res != null && res.code === 0;
}

/** 资源/认证类接口（短信、登录等）成功时 code 为 1 或 200 */
export function isResourceApiOk(res: ApiResult | null | undefined): boolean {
  return res != null && (res.code === 1 || res.code === 200);
}

export type LoginData = {
  access_token?: string;
  refresh_token?: string;
  expire_in?: number;
  refresh_expire_in?: number;
  client_id?: string;
  scope?: string;
  openid?: string;
};

export function apiData<T>(res: ApiResult<T>): T | undefined {
  return res.data;
}

export function apiResourceData<T>(res: ApiResult<T> | null | undefined): T | undefined {
  if (!isResourceApiOk(res)) return undefined;
  return (res as ApiResult<T>).data;
}

/** 病历列表等分页接口：成功时顶层含 rows */
export function getResourceRows<T>(
  res: (ApiResult & { rows?: T[] }) | null | undefined,
): T[] {
  if (!isResourceApiOk(res)) return [];
  return Array.isArray(res?.rows) ? res.rows : [];
}
