/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { APP_BACKGROUND, APP_TEXT } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'background' | 'text'
) {
  const colorFromProps = props.light || props.dark;
  if (colorFromProps) {
    return colorFromProps;
  } else {
    return colorName === 'background' ? APP_BACKGROUND : APP_TEXT;
  }
}
