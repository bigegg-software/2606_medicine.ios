import { AppTheme } from '@/common/theme';
import { getFontSizeScale, type FontSizeOption } from '@/common/fontSize';

export const antdTheme = {
  brand_primary: AppTheme.primaryColor,
  brand_primary_tap: '#A84E3F',
  color_text_base: AppTheme.textPrimary,
  color_text_paragraph: AppTheme.textPrimary,
  color_text_caption: AppTheme.textSecondary,
  color_text_placeholder: AppTheme.hintTextColor,
  color_link: AppTheme.primaryColor,
  fill_body: AppTheme.backgroundColor,
  fill_base: '#FFFFFF',
  border_color_base: AppTheme.borderColor,
  border_color_thin: AppTheme.borderColor,
  primary_button_fill: AppTheme.primaryColor,
  primary_button_fill_tap: '#A84E3F',
  brand_error: AppTheme.dangerColor,
  radius_md: AppTheme.radiusMedium,
  radius_lg: AppTheme.radiusLarge,
};

const ANTD_FONT_SIZES = {
  font_size_icontext: 10,
  font_size_caption_sm: 12,
  font_size_base: 14,
  font_size_subhead: 15,
  font_size_caption: 16,
  font_size_heading: 17,
  actionsheet_item_font_size: 18,
  button_font_size: 18,
  button_font_size_sm: 13,
  link_button_font_size: 16,
  modal_font_size_heading: 18,
  modal_button_font_size: 18,
  tabs_font_size_heading: 15,
  search_bar_font_size: 15,
} as const;

export function buildScaledAntdTheme(option: FontSizeOption) {
  const scale = getFontSizeScale(option);
  const scaledFonts = Object.fromEntries(
    Object.entries(ANTD_FONT_SIZES).map(([key, size]) => [key, Math.round(size * scale)]),
  );
  return { ...antdTheme, ...scaledFonts };
}
