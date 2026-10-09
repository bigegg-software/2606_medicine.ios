import React, { useEffect, useState } from 'react';
import {
  Image,
  type ImageResizeMode,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { resolveCachedImageUri } from '../utils/cachedImageHelpers';

type Props = {
  uri?: string;
  fallback: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

/** 远程图优先读本地缓存，无缓存时边显示边落盘 */
export default function CachedRemoteImage({
  uri,
  fallback,
  style,
  resizeMode = 'cover',
}: Props) {
  const remote = uri?.trim() || '';
  const [source, setSource] = useState<ImageSourcePropType>(() =>
    remote ? { uri: remote } : fallback,
  );

  useEffect(() => {
    if (!remote) {
      setSource(fallback);
      return;
    }
    let cancelled = false;
    setSource({ uri: remote });
    void resolveCachedImageUri(remote).then(local => {
      if (!cancelled && local) setSource({ uri: local });
    });
    return () => {
      cancelled = true;
    };
  }, [fallback, remote]);

  return <Image source={source} style={style} resizeMode={resizeMode} />;
}
