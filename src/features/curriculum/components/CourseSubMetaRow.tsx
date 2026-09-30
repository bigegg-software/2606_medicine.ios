import React from 'react';
import { Image, Text } from 'react-native';
import { Flex } from '@ant-design/react-native';
import styles from '@/css/curriculum/onlineCourseDetail';

type Props = {
  parts: string[];
};

/** 课程详情：标题上方时间 / 分类行 */
export default function CourseSubMetaRow({ parts }: Props) {
  const list = parts.filter(Boolean);
  if (list.length === 0) return null;
  return (
    <Flex align="center" style={styles.privateSubMetaRow}>
      <Image
        style={styles.privateSubMetaIcon}
        source={require('@/assets/images/curriculum/time_meta.png')}
      />
      {list.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {index > 0 ? <Text style={styles.privateSubMetaDivider}>｜</Text> : null}
          <Text
            style={[styles.privateSubMetaText, index > 0 ? { marginLeft: 0 } : null]}
            numberOfLines={1}
          >
            {part}
          </Text>
        </React.Fragment>
      ))}
    </Flex>
  );
}
