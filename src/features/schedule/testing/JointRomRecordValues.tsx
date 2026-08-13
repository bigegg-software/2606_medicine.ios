import React from 'react';
import { Image, Text, View } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/schedule/testingPage';
import {
  formatTestValue,
  JOINT_ROM_FIELDS,
  parseJointRomObjValue,
  resolveRecordTrendTone,
  type JointRomFieldKey,
} from './testingHelpers';

type Props = {
  /** 大卡片标题，默认「关节活动度测量」 */
  title?: string;
  dateText: string;
  objValue?: Record<string, number | string | null> | null;
  previousObjValue?: Record<string, number | string | null> | null;
  unit?: string;
  improveDirection?: number | null;
  style?: object | object[] | null;
  /**
   * 测试详情页预览：不显示左侧标题、时间居左、六项无外边框底。
   * 记录列表页保持默认样式（不传即可）。
   */
  compact?: boolean;
};

function readFieldValue(
  objValue: Record<string, number | string | null> | null | undefined,
  key: JointRomFieldKey,
) {
  const parsed = parseJointRomObjValue(objValue);
  const value = parsed[key];
  return value != null && Number.isFinite(Number(value)) ? Number(value) : null;
}

function resolveRowStatusText(
  currentValue: number | null,
  previousValue: number | null,
  tone: 'up' | 'down' | null,
) {
  if (currentValue == null) return '待评估';
  if (previousValue == null) return '首次评估';
  if (tone === 'up') return '接近目标达成';
  if (tone === 'down') return '需关注';
  return '持平';
}

/**
 * 关节活动度记录结构：
 * 大卡片（标题 + 时间）
 *   └ 6 个小卡片（关节名 | 状态 | icon+数值）
 */
export default function JointRomRecordValues({
  title = '关节活动度测量',
  dateText,
  objValue,
  previousObjValue,
  unit = '°',
  improveDirection,
  style,
  compact = false,
}: Props) {
  return (
    <View style={[styles.jointRomRecordCard, compact && styles.jointRomRecordCardCompact, style]}>
      {compact ? (
        <Text style={styles.jointRomRecordCardDateLeft}>{dateText}</Text>
      ) : (
        <Flex justify="between" align="center">
          <Text style={styles.jointRomRecordCardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.jointRomRecordCardDate}>{dateText}</Text>
        </Flex>
      )}

      <View style={styles.jointRomRecordInnerList}>
        {JOINT_ROM_FIELDS.map((field, index) => {
          const currentValue = readFieldValue(objValue, field.key);
          const previousValue = readFieldValue(previousObjValue, field.key);
          const tone = resolveRecordTrendTone({
            currentValue,
            previousValue,
            improveDirection,
          });
          const statusText = resolveRowStatusText(currentValue, previousValue, tone);
          const isWarn = tone === 'down';

          return (
            <View
              key={field.key}
              style={[
                styles.jointRomRecordInner,
                compact ? styles.jointRomRecordInnerFlat : null,
                index === 0
                  ? styles.jointRomRecordInnerFirst
                  : styles.jointRomRecordInnerSpacing,
              ]}
            >
              <Flex justify="between" align="center">
                <Text style={styles.jointRomRecordLabel} numberOfLines={1}>
                  {field.label}
                </Text>
                <Text
                  style={[
                    styles.jointRomRecordStatus,
                    isWarn ? styles.jointRomRecordStatusWarn : null,
                  ]}
                  numberOfLines={1}
                >
                  {statusText}
                </Text>
                <Flex align="center" style={styles.jointRomRecordValueWrap}>
                  {tone ? (
                    <Image
                      style={styles.jointRomRecordTrendIcon}
                      source={
                        tone === 'up'
                          ? require('@/assets/images/schedule/icon_up.png')
                          : require('@/assets/images/schedule/icon_down1.png')
                      }
                    />
                  ) : null}
                  <Text style={styles.jointRomRecordValue}>
                    {formatTestValue(currentValue, unit)}
                  </Text>
                </Flex>
              </Flex>
            </View>
          );
        })}
      </View>
    </View>
  );
}
