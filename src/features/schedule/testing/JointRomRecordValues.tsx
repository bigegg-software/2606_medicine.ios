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
  objValue?: Record<string, number | string | null> | null;
  previousObjValue?: Record<string, number | string | null> | null;
  unit?: string;
  improveDirection?: number | null;
};

function readFieldValue(
  objValue: Record<string, number | string | null> | null | undefined,
  key: JointRomFieldKey,
) {
  const parsed = parseJointRomObjValue(objValue);
  const value = parsed[key];
  return value != null && Number.isFinite(Number(value)) ? Number(value) : null;
}

/** 关节活动度测试记录：六个关节数值分别展示 */
export default function JointRomRecordValues({
  objValue,
  previousObjValue,
  unit = '°',
  improveDirection,
}: Props) {
  return (
    <View style={styles.jointRomRecordValues}>
      {JOINT_ROM_FIELDS.map(field => {
        const currentValue = readFieldValue(objValue, field.key);
        const previousValue = readFieldValue(previousObjValue, field.key);
        const tone = resolveRecordTrendTone({
          currentValue,
          previousValue,
          improveDirection,
        });
        return (
          <Flex
            key={field.key}
            justify="between"
            align="center"
            style={styles.jointRomRecordRow}
          >
            <Text style={styles.jointRomRecordLabel}>{field.label}</Text>
            <Flex align="center">
              {tone ? (
                <Image
                  style={styles.infoRecordUpImg}
                  source={
                    tone === 'up'
                      ? require('@/assets/images/schedule/icon_gs.png')
                      : require('@/assets/images/schedule/icon_xx.png')
                  }
                />
              ) : null}
              <Text style={styles.jointRomRecordValue}>
                {formatTestValue(currentValue, unit)}
              </Text>
            </Flex>
          </Flex>
        );
      })}
    </View>
  );
}
