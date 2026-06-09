import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { AppTheme } from '@/common/theme';

export default function UploadProgressBar() {
  const uploading = useSelector((state: RootState) => state.upload.uploading);
  const progress = useSelector((state: RootState) => state.upload.progress);

  if (!uploading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>正在同步健康数据</Text>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${Math.min(progress, 100)}%` }]} />
      </View>
      <Text style={styles.percent}>{progress}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EAF1FF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(5,58,147,0.08)',
  },
  label: {
    fontSize: 13,
    color: AppTheme.textSecondary,
    marginRight: 10,
  },
  track: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(5,58,147,0.12)',
    overflow: 'hidden',
  },
  bar: {
    height: 7,
    borderRadius: 4,
    backgroundColor: AppTheme.primaryColor,
  },
  percent: {
    width: 42,
    marginLeft: 8,
    fontSize: 13,
    color: AppTheme.primaryColor,
    textAlign: 'right',
  },
});
