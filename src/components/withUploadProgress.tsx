import React from 'react';
import { View } from 'react-native';
import UploadProgressBar from '@/src/components/UploadProgressBar';

export default function withUploadProgress<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    return (
      <View style={{ flex: 1 }}>
        <UploadProgressBar />
        <Component {...props} />
      </View>
    );
  };
}
