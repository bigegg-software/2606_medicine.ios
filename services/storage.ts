import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveToken(token: string) {
  await AsyncStorage.setItem('token', token);
}

export async function getToken() {
  return AsyncStorage.getItem('token');
}

export async function removeToken() {
  await AsyncStorage.removeItem('token');
}

export async function saveUserId(userId: string | number) {
  await AsyncStorage.setItem('userId', String(userId));
}

export async function saveRefreshToken(token: string) {
  await AsyncStorage.setItem('refreshToken', token);
}

export async function saveClientId(clientId: string) {
  await AsyncStorage.setItem('clientId', clientId);
}

export async function clearAll() {
  await Promise.all([
    AsyncStorage.removeItem('token'),
    AsyncStorage.removeItem('refreshToken'),
    AsyncStorage.removeItem('clientId'),
    AsyncStorage.removeItem('userId'),
    AsyncStorage.removeItem('userRole'),
  ]);
}
