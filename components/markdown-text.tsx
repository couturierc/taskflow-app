/**
 * Markdown Text Component
 * 
 * Renders markdown content in task titles and descriptions
 */

import { View, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useColors } from '@/hooks/use-colors';

interface MarkdownTextProps {
  content: string;
  variant?: 'title' | 'description';
  numberOfLines?: number;
}

export function MarkdownText({ content, variant = 'description', numberOfLines }: MarkdownTextProps) {
  const colors = useColors();

  if (!content) {
    return null;
  }

  const markdownStyles = {
    body: {
      color: variant === 'title' ? colors.foreground : colors.foreground,
      fontSize: variant === 'title' ? 16 : 14,
      fontWeight: (variant === 'title' ? '600' : '400') as any,
    },
    text: {
      color: variant === 'title' ? colors.foreground : colors.foreground,
    },
    strong: {
      fontWeight: 'bold' as any,
      color: colors.foreground,
    },
    em: {
      fontStyle: 'italic' as any,
      color: colors.foreground,
    },
    code_inline: {
      backgroundColor: colors.surface,
      color: colors.primary,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: variant === 'title' ? 14 : 12,
    },
    code_block: {
      backgroundColor: colors.surface,
      color: colors.primary,
      padding: 8,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 12,
      marginVertical: 4,
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline' as any,
    },
    list_item: {
      color: colors.foreground,
      marginVertical: 2,
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1 as any,
      marginVertical: 8 as any,
    } as any,
    blockquote: {
      borderLeftColor: colors.primary,
      borderLeftWidth: 4 as any,
      paddingLeft: 8 as any,
      marginVertical: 4 as any,
      color: colors.muted,
    } as any,
  };

  try {
    return (
      <Markdown
        style={markdownStyles}
      >
        {content}
      </Markdown>
    );
  } catch (error) {
    console.error('Markdown rendering error:', error);
    // Fallback to plain text if markdown rendering fails
    return (
      <Text
        className={variant === 'title' ? 'text-base font-semibold' : 'text-sm'}
        style={{ color: variant === 'title' ? colors.foreground : colors.foreground }}
        numberOfLines={numberOfLines}
      >
        {content}
      </Text>
    );
  }
}
