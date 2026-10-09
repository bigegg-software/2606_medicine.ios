import * as FileSystem from 'expo-file-system/legacy';
import CryptoJS from 'crypto-js';

const CACHE_DIR = `${FileSystem.cacheDirectory ?? ''}remote-image/`;

function guessImageExt(url: string) {
  try {
    const path = url.split('?')[0] ?? url;
    const match = path.match(/\.(jpe?g|png|webp|gif|bmp)$/i);
    if (!match?.[1]) return '.img';
    const ext = match[1].toLowerCase();
    return `.${ext === 'jpeg' ? 'jpg' : ext}`;
  } catch {
    return '.img';
  }
}

/** 远程图片落盘缓存；已缓存则直接返回本地路径，失败回退原 URL */
export async function resolveCachedImageUri(remoteUrl: string): Promise<string> {
  const url = remoteUrl.trim();
  if (!url) return url;
  if (url.startsWith('file://') || url.startsWith('data:')) return url;
  if (!FileSystem.cacheDirectory) return url;

  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    const localPath = `${CACHE_DIR}${CryptoJS.MD5(url).toString()}${guessImageExt(url)}`;
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;
    const result = await FileSystem.downloadAsync(url, localPath);
    return result.uri?.trim() || url;
  } catch {
    return url;
  }
}
