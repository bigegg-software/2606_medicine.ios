import { Platform, StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const baseText = {
  color: AppTheme.textPrimary,
  backgroundColor: 'transparent',
  lineHeight: 24,
  fontSize: 16,
  fontWeight: '400',
};

const styles = StyleSheet.create({
  markdownStyles: {
    body: baseText,
    text: baseText,
    heading1: {
      ...baseText,
      fontSize: 20,
      fontWeight: '600',
      marginTop: 8,
      marginBottom: 4,
    },
    heading2: {
      ...baseText,
      fontSize: 18,
      fontWeight: '600',
      marginTop: 8,
      marginBottom: 4,
    },
    heading3: {
      ...baseText,
      fontSize: 17,
      fontWeight: '600',
      marginTop: 6,
      marginBottom: 4,
    },
    heading4: {
      ...baseText,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
      marginBottom: 4,
    },
    heading5: {
      ...baseText,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
      marginBottom: 4,
    },
    heading6: {
      ...baseText,
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
      marginBottom: 4,
    },
    strong: {
      ...baseText,
      fontWeight: '600',
    },
    em: {
      ...baseText,
      fontStyle: 'italic',
      color: AppTheme.primaryColor,
    },
    blockquote: {
      ...baseText,
      borderLeftWidth: 3,
      borderLeftColor: AppTheme.primaryColor,
      paddingLeft: 10,
      color: AppTheme.textSecondary,
    },
    code_inline: {
      ...baseText,
      backgroundColor: '#F5F8FF',
      borderRadius: 4,
      paddingHorizontal: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    code_block: {
      ...baseText,
      backgroundColor: '#F5F8FF',
      borderRadius: 8,
      padding: 10,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    fence: {
      ...baseText,
      backgroundColor: '#F5F8FF',
      borderColor: AppTheme.borderColor,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    link: {
      ...baseText,
      color: AppTheme.primaryColor,
      textDecorationLine: 'underline',
    },
    list_item: baseText,
    bullet_list: {
      ...baseText,
      marginTop: 0,
      marginBottom: 0,
    },
    ordered_list: {
      ...baseText,
      marginTop: 0,
      marginBottom: 0,
    },
    bullet_list_icon: {
      color: AppTheme.primaryColor,
    },
    ordered_list_icon: {
      color: AppTheme.primaryColor,
    },
    paragraph: {
      ...baseText,
      marginTop: 0,
      marginBottom: 0,
    },
    table: {
      borderColor: AppTheme.borderColor,
      borderWidth: 1,
    },
    thead: {
      borderColor: AppTheme.borderColor,
    },
    tr: {
      borderColor: AppTheme.borderColor,
    },
    th: {
      ...baseText,
      fontWeight: '600',
      borderColor: AppTheme.borderColor,
      backgroundColor: '#F5F8FF',
      padding: 6,
    },
    td: {
      ...baseText,
      borderColor: AppTheme.borderColor,
      padding: 6,
    },
    hr: {
      borderBottomColor: AppTheme.borderColor,
      borderBottomWidth: 1,
      marginVertical: 8,
    },
  },
  streamCursor: {
    ...baseText,
    marginTop: 2,
  },
});

export default styles;
