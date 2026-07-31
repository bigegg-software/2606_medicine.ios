import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheetModal from '@/src/components/BottomSheetModal';
import {
  getVitalInfoContent,
  type VitalInfoSection,
  type VitalInfoTableRow,
} from '../utils/vitalInfoContent';

export type VitalInfoModalProps = {
  vitalKey: string | null;
  onClose: () => void;
};

const SHEET_PADDING_H = 18;
const LABEL_COL_WIDTH = 72;
const VALUE_COL_MIN_WIDTH = 68;

function buildTransposedMatrix(headers: string[], rows: string[][]): string[][] {
  return headers.map((header, colIndex) => [header, ...rows.map(row => row[colIndex] ?? '')]);
}

function TransposedTable({
  matrix,
  style,
}: {
  matrix: string[][];
  style?: StyleProp<ViewStyle>;
}) {
  const { width: windowWidth } = useWindowDimensions();
  if (matrix.length === 0) return null;

  const colCount = Math.max(...matrix.map(row => row.length), 1);
  const valueColCount = Math.max(colCount - 1, 1);
  const availableWidth = windowWidth - SHEET_PADDING_H * 2;
  const equalValueWidth = (availableWidth - LABEL_COL_WIDTH) / valueColCount;
  const valueColWidth = Math.max(VALUE_COL_MIN_WIDTH, equalValueWidth);
  const tableWidth = LABEL_COL_WIDTH + valueColWidth * valueColCount;
  const needsScroll = tableWidth > availableWidth + 1;

  const table = (
    <View style={[styles.tableBox, { width: needsScroll ? tableWidth : availableWidth }]}>
      {matrix.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.tableRow}>
          {Array.from({ length: colCount }, (_, colIndex) => {
            const isLabel = colIndex === 0;
            const isLastCol = colIndex === colCount - 1;
            const isLastRow = rowIndex === matrix.length - 1;
            return (
              <View
                key={`cell-${rowIndex}-${colIndex}`}
                style={[
                  styles.tableCell,
                  {
                    width: isLabel
                      ? LABEL_COL_WIDTH
                      : needsScroll
                        ? valueColWidth
                        : undefined,
                    flex: !isLabel && !needsScroll ? 1 : undefined,
                  },
                  isLabel ? styles.tableLabelCell : styles.tableValueCell,
                  isLastCol && styles.tableCellLastCol,
                  isLastRow && styles.tableCellLastRow,
                ]}>
                <Text style={isLabel ? styles.tableLabelText : styles.tableValueText}>
                  {row[colIndex] ?? ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );

  if (!needsScroll) {
    return <View style={[styles.tableScroll, style]}>{table}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.tableScroll, style]}>
      {table}
    </ScrollView>
  );
}

function SectionTable({ section }: { section: VitalInfoSection }) {
  const matrix = useMemo(
    () => buildTransposedMatrix(section.headers, section.rows),
    [section.headers, section.rows],
  );

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <TransposedTable matrix={matrix} style={styles.tableAfterTitle} />
    </View>
  );
}

function LevelsTable({
  levels,
}: {
  levels: Array<{ label: string; range: string }>;
}) {
  const matrix = useMemo(
    () =>
      buildTransposedMatrix(
        ['状态', '范围'],
        levels.map(item => [item.label, item.range]),
      ),
    [levels],
  );

  return (
    <View style={styles.sectionWrap}>
      <TransposedTable matrix={matrix} />
    </View>
  );
}

function BloodPressureTable({
  headers,
  rows,
}: {
  headers: [string, string, string, string];
  rows: VitalInfoTableRow[];
}) {
  const matrix = useMemo(
    () =>
      buildTransposedMatrix(
        [...headers],
        rows.map(row => [row.category ?? '', row.label, row.systolic, row.diastolic]),
      ),
    [headers, rows],
  );

  return (
    <View style={styles.sectionWrap}>
      <TransposedTable matrix={matrix} />
    </View>
  );
}

export default function VitalInfoModal({ vitalKey, onClose }: VitalInfoModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const content = vitalKey ? getVitalInfoContent(vitalKey) : null;
  const visible = Boolean(content);
  const levels = content?.levels ?? [];
  const table = content?.table;
  const sections = content?.sections ?? [];
  const sheetMaxHeight = Math.round(windowHeight * 0.8);
  const bottomPad = Math.max(insets.bottom, 16);
  // title + divider + paddings + button area，保证「知道了」始终贴在弹层底部可见
  const scrollMaxHeight = Math.max(120, sheetMaxHeight - 20 - 21 - 16 - 1 - 16 - 48 - bottomPad);

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{content?.title ?? ''}</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={22} color="#999999" />
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <ScrollView
          style={[styles.scroll, { maxHeight: scrollMaxHeight }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled>
          {content?.body ? <Text style={styles.body}>{content.body}</Text> : null}
          {levels.length > 0 ? <LevelsTable levels={levels} /> : null}
          {table ? <BloodPressureTable headers={table.headers} rows={table.rows} /> : null}
          {sections.map(section => (
            <SectionTable key={section.title} section={section} />
          ))}
        </ScrollView>
        <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.confirmBtnWrap}>
          <LinearGradient
            colors={['#9BBD8E', '#6D925E']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.confirmBtn}>
            <Text style={styles.confirmText}>知道了</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: SHEET_PADDING_H,
    overflow: 'hidden',
  },
  titleRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    flexShrink: 0,
  },
  title: {
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 32,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    marginTop: 16,
    height: 1,
    backgroundColor: 'rgba(23,63,125,0.08)',
    flexShrink: 0,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 4,
    flexGrow: 0,
  },
  body: {
    marginTop: 15,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
    lineHeight: 21,
  },
  sectionWrap: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  tableScroll: {
    marginTop: 0,
    width: '100%',
  },
  tableAfterTitle: {
    marginTop: 12,
  },
  tableBox: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellLastCol: {
    borderRightWidth: 0,
  },
  tableCellLastRow: {
    borderBottomWidth: 0,
  },
  tableLabelCell: {
    backgroundColor: '#F6F8FB',
  },
  tableValueCell: {
    backgroundColor: '#FFFFFF',
  },
  tableLabelText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  tableValueText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
  },
  confirmBtnWrap: {
    marginTop: 16,
    flexShrink: 0,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
