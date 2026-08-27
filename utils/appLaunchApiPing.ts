import { baseURL } from '@/utils/config';

/** App 启动时请求 API 根地址，预热连接 */
export async function pingApiOnAppLaunch() {
  try {
    await fetch(baseURL, { method: 'GET' });
  } catch {
    /* ignore */
  }
}
