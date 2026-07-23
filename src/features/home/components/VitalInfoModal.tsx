import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AppTheme } from '@/common/theme';
import { getVitalInfoContent, type VitalInfoSection } from '../utils/vitalInfoContent';

export type VitalInfoModalProps = {
  vitalKey: string | null;
  onClose: () => void;
};

function SectionTable({ section }: { section: VitalInfoSection }) {
  const colCount = Math.max(section.headers.length, 1);

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={[styles.tableBox, styles.sectionTableBox]}>
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          {section.headers.map((header, index) => (
            <Text
              key={`${section.title}-h-${header}`}
              style={[
                styles.tableCell,
                styles.tableHeaderText,
                styles.sectionCell,
                index === 0 && styles.sectionFirstCell,
                index === colCount - 1 && colCount > 2 && styles.sectionLastCell,
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
        {section.rows.map((row, rowIndex) => (
          <View key={`${section.title}-r-${rowIndex}`} style={styles.tableRow}>
            {section.headers.map((_, colIndex) => (
              <Text
                key={`${section.title}-r-${rowIndex}-c-${colIndex}`}
                style={[
                  styles.tableCell,
                  styles.sectionCell,
                  colIndex === 0 && styles.sectionFirstCell,
                  colIndex === colCount - 1 && colCount > 2 && styles.sectionLastCell,
                ]}
              >
                {row[colIndex] ?? ''}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function VitalInfoModal({ vitalKey, onClose }: VitalInfoModalProps) {
  const content = vitalKey ? getVitalInfoContent(vitalKey) : null;
  const visible = Boolean(content);
  const levels = content?.levels ?? [];
  const table = content?.table;
  const sections = content?.sections ?? [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <MaterialIcons name="close" size={22} color={AppTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>{content?.title ?? ''}</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.body}>{content?.body ?? ''}</Text>
            {levels.length > 0 ? (
              <View style={styles.levelBox}>
                {levels.map(item => (
                  <View key={item.label} style={styles.levelRow}>
                    <Text style={styles.levelLabel}>{item.label}</Text>
                    <Text style={styles.levelRange}>{item.range}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {table ? (
              <View style={styles.tableBox}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={[styles.tableCell, styles.tableCategory, styles.tableHeaderText]}>
                    {table.headers[0]}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableLabel, styles.tableHeaderText]}>
                    {table.headers[1]}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableValue, styles.tableHeaderText]}>
                    {table.headers[2]}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableValue, styles.tableHeaderText]}>
                    {table.headers[3]}
                  </Text>
                </View>
                {table.rows.map((row, index) => {
                  const showCategory = index === 0 || row.category !== table.rows[index - 1]?.category;
                  return (
                    <View key={`${row.category ?? ''}-${row.label}`} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableCategory]}>
                        {showCategory ? (row.category ?? '') : ''}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableLabel]}>{row.label}</Text>
                      <Text style={[styles.tableCell, styles.tableValue]}>{row.systolic}</Text>
                      <Text style={[styles.tableCell, styles.tableValue]}>{row.diastolic}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
            {sections.map(section => (
              <SectionTable key={section.title} section={section} />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.confirmBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.confirmText}>知道了</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  box: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FEFFFF',
    borderRadius: 12,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  title: {
    fontWeight: '500',
    fontSize: 17,
    color: AppTheme.textPrimary,
    lineHeight: 24,
    paddingRight: 28,
  },
  scroll: {
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  body: {
    marginTop: 12,
    fontWeight: '400',
    fontSize: 14,
    color: AppTheme.textSecondary,
    lineHeight: 22,
  },
  levelBox: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: '#F6F8FB',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  levelLabel: {
    fontWeight: '500',
    fontSize: 14,
    color: AppTheme.textPrimary,
  },
  levelRange: {
    fontWeight: '400',
    fontSize: 13,
    color: AppTheme.textSecondary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  tableBox: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: '#F6F8FB',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  tableHeaderRow: {
    borderTopWidth: 0,
    backgroundColor: 'rgba(109,146,94,0.08)',
  },
  tableCell: {
    fontWeight: '400',
    fontSize: 11,
    color: AppTheme.textSecondary,
    lineHeight: 16,
  },
  tableHeaderText: {
    fontWeight: '500',
    color: AppTheme.textPrimary,
  },
  tableCategory: {
    width: 42,
    fontWeight: '500',
    color: AppTheme.textPrimary,
  },
  tableLabel: {
    flex: 1.4,
    paddingRight: 4,
  },
  tableValue: {
    flex: 1,
    textAlign: 'center',
  },
  sectionWrap: {
    marginTop: 14,
  },
  sectionTitle: {
    fontWeight: '500',
    fontSize: 14,
    color: AppTheme.textPrimary,
    marginBottom: 8,
  },
  sectionTableBox: {
    marginTop: 0,
  },
  sectionCell: {
    flex: 1,
  },
  sectionFirstCell: {
    fontWeight: '500',
    color: AppTheme.textPrimary,
    flex: 0.9,
  },
  sectionLastCell: {
    flex: 1.3,
    textAlign: 'left',
  },
  confirmBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppTheme.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontWeight: '500',
    fontSize: 16,
    color: AppTheme.onPrimaryColor ?? '#FFFFFF',
  },
});
