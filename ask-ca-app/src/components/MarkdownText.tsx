import React from 'react';
import Markdown from 'react-native-markdown-display';
import { colors, fonts } from '../theme';

const styles = {
  body: { color: colors.textPrimary, fontSize: 15, lineHeight: 24, fontFamily: fonts.body },
  heading1: { fontSize: 20, fontFamily: fonts.heading, color: colors.textPrimary, marginTop: 12, marginBottom: 6 },
  heading2: { fontSize: 17, fontFamily: fonts.heading, color: colors.textPrimary, marginTop: 12, marginBottom: 4 },
  heading3: { fontSize: 15, fontFamily: fonts.semibold, color: colors.textPrimary, marginTop: 10, marginBottom: 4 },
  paragraph: { marginTop: 0, marginBottom: 8, fontFamily: fonts.body, color: colors.textPrimary },
  strong: { fontFamily: fonts.bodySemibold, color: colors.textPrimary },
  em: { fontStyle: 'italic' as const },
  bullet_list: { marginTop: 4, marginBottom: 6 },
  ordered_list: { marginTop: 4, marginBottom: 6 },
  list_item: { marginVertical: 3, flexDirection: 'row' as const },
  bullet_list_icon: { color: colors.brandAction, fontSize: 18, lineHeight: 22, marginRight: 8 },
  ordered_list_icon: { color: colors.brandAction, fontSize: 14, fontFamily: fonts.bodySemibold, marginRight: 8, marginTop: 2 },
  code_inline: { fontFamily: 'Courier', backgroundColor: colors.bgTertiary, color: colors.brandAction, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 13 },
  code_block: { fontFamily: 'Courier', backgroundColor: colors.brandDeep, color: '#E2E8F0', padding: 12, borderRadius: 8, fontSize: 13, marginVertical: 6 },
  fence: { fontFamily: 'Courier', backgroundColor: colors.brandDeep, color: '#E2E8F0', padding: 12, borderRadius: 8, fontSize: 13, marginVertical: 6 },
  blockquote: { backgroundColor: colors.warningBg, borderLeftColor: colors.warning, borderLeftWidth: 4, padding: 10, marginVertical: 6, borderRadius: 6 },
  hr: { backgroundColor: colors.borderLight, height: 1, marginVertical: 8 },
  table: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, marginVertical: 6 },
  th: { padding: 8, backgroundColor: colors.bgSecondary, fontFamily: fonts.bodySemibold },
  td: { padding: 8 },
  link: { color: colors.brandAction, textDecorationLine: 'underline' as const },
};

export default function MarkdownText({ content, color }: { content: string; color?: string }) {
  const merged = color ? { ...styles, body: { ...styles.body, color }, paragraph: { ...styles.paragraph, color }, strong: { ...styles.strong, color } } : styles;
  return <Markdown style={merged as any}>{content}</Markdown>;
}
