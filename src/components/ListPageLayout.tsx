import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { AppTheme } from '@/common/theme';
import styles from '@/css/components/listPageLayout';

export default function ListPageLayout({
  title,
  loading,
  refreshing,
  onRefresh,
  emptyText,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyText?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AppTheme.primaryColor} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity onPress={onAction}>
            <Text style={styles.action}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}>
        {children}
        {emptyText ? <Text style={styles.empty}>{emptyText}</Text> : null}
      </ScrollView>
    </View>
  );
}

export function ListCard({
  title,
  subtitle,
  onPress,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
      </View>
      {onDelete ? (
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.delete}>删除</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}
