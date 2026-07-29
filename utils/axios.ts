import axios, { type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseURL } from '@/utils/config';
import store from '@/store/store';
import { SET_LOGIN, SET_LOGIN_EXPIRED } from '@/store/type/login';
import { SET_UPLOADING, SET_UPLOAD_PROGRESS } from '@/store/type/upload';
import { clearAll } from '@/services/storage';

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  validateStatus: status => status !== undefined && status < 500,
});

const AUTH_SKIP_PATHS = ['/auth/login', '/auth/logout', '/resource/sms/code'];
let isHandling401 = false;

export function resetUnauthorizedHandling() {
  isHandling401 = false;
}

type ApiPayload = {
  code?: number;
  msg?: string;
  message?: string;
};

function shouldSkipUnauthorizedHandler(url?: string) {
  if (!url) return false;
  return AUTH_SKIP_PATHS.some(path => url.includes(path));
}

function isUnauthorized(status?: number, data?: ApiPayload) {
  return status === 401 || data?.code === 401;
}

function parseResponseData(data: unknown): ApiPayload | undefined {
  if (data == null) return undefined;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as ApiPayload;
    } catch {
      return undefined;
    }
  }
  if (typeof data === 'object') {
    return data as ApiPayload;
  }
  return undefined;
}

async function handleUnauthorized(config?: InternalAxiosRequestConfig) {
  if (shouldSkipUnauthorizedHandler(config?.url)) {
    return;
  }
  if (isHandling401 || store.getState().login.loginExpired) {
    return;
  }

  const token = await AsyncStorage.getItem('token');
  if (!token) {
    return;
  }

  isHandling401 = true;
  store.dispatch({ type: SET_LOGIN, payload: false });
  store.dispatch({ type: SET_LOGIN_EXPIRED, payload: true });
  store.dispatch({ type: SET_UPLOADING, payload: false });
  store.dispatch({ type: SET_UPLOAD_PROGRESS, payload: 0 });
  await clearAll();
}

apiClient.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const clientId = await AsyncStorage.getItem('clientId');
    if (clientId) config.headers.clientId = clientId;
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => {
    const data = parseResponseData(response.data);
    if (isUnauthorized(response.status, data)) {
      void handleUnauthorized(response.config);
    }
    return data ?? response.data;
  },
  error => {
    const data = parseResponseData(error.response?.data);
    if (isUnauthorized(error.response?.status, data)) {
      void handleUnauthorized(error.config);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
