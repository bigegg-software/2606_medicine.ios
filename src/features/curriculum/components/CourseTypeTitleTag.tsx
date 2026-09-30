import React from 'react';
import { Text, View } from 'react-native';
import styles from '@/css/curriculum/onlineCourseDetail';

type CourseTypeKind = 'private' | 'group' | 'online';

const TAG_META: Record<
  CourseTypeKind,
  { label: string; wrapStyle: object; textStyle: object }
> = {
  private: {
    label: '私教课',
    wrapStyle: styles.titleTypeTagPrivate,
    textStyle: styles.titleTypeTagTextPrivate,
  },
  group: {
    label: '集体课',
    wrapStyle: styles.titleTypeTagGroup,
    textStyle: styles.titleTypeTagTextGroup,
  },
  online: {
    label: '线上课',
    wrapStyle: styles.titleTypeTagOnline,
    textStyle: styles.titleTypeTagTextOnline,
  },
};

/** 详情标题后的课程类型标签 */
export default function CourseTypeTitleTag({ type }: { type: CourseTypeKind }) {
  const meta = TAG_META[type];
  return (
    <View style={[styles.titleTypeTag, meta.wrapStyle]}>
      <Text style={[styles.titleTypeTagText, meta.textStyle]}>{meta.label}</Text>
    </View>
  );
}
