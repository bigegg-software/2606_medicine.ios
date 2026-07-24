import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickedMealImage = {
  uri: string;
  name: string;
  type: string;
};

/** 从相册选择餐食图片（权限与 ProfileEdit 一致） */
export async function pickMealImageFromLibrary(): Promise<PickedMealImage | null> {
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
    name: asset.fileName ?? `meal_${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}
