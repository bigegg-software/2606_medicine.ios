import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseURL } from '@/utils/config';
import store from '@/store/store';
import { SET_LOGIN_EXPIRED } from '@/store/type/login';

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  validateStatus: status => status !== undefined && status < 500,
});

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
    let data = response.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        /* keep */
      }
    }
    if (data?.code === 401) {
      store.dispatch({ type: SET_LOGIN_EXPIRED, payload: true });
    }
    return data;
  },
  error => Promise.reject(error),
);

export default apiClient;
