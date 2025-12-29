/**
 * Label Badges Component
 * 
 * Displays colored label badges for tasks
 */

import { View, Text } from 'react-native';
import { TodoistLabel } from '@/lib/todoist-api';

const COLOR_HEX_MAP: Record<string, string> = {
  berry_red: '#B8256F',
  red: '#DB4035',
  orange: '#FF9933',
  yellow: '#FAD000',
  olive_green: '#AFB83B',
  lime_green: '#7ECC49',
  green: '#299438',
  mint_green: '#6ACCBC',
  teal: '#158FAD',
  sky_blue: '#14AAF5',
  light_blue: '#96C3EB',
  blue: '#4073FF',
  grape: '#884DFF',
  violet: '#AF38EB',
  lavender: '#EB96EB',
  magenta: '#E05194',
  salmon: '#FF8D85',
  charcoal: '#808080',
  grey: '#B8B8B8',
  taupe: '#CCAC93',
};

interface LabelBadgesProps {
  labelNames: string[];
  labels: TodoistLabel[];
  maxDisplay?: number;
}

export function LabelBadges({ labelNames, labels, maxDisplay = 3 }: LabelBadgesProps) {
  if (!labelNames || labelNames.length === 0) {
    return null;
  }

  // Match label names with label objects to get colors
  const matchedLabels = labelNames
    .map(name => labels.find(l => l.name === name))
    .filter((l): l is TodoistLabel => l !== undefined);

  if (matchedLabels.length === 0) {
    return null;
  }

  const displayLabels = matchedLabels.slice(0, maxDisplay);
  const remainingCount = matchedLabels.length - maxDisplay;

  return (
    <View className="flex-row flex-wrap gap-1 mt-2">
      {displayLabels.map((label) => {
        const hexColor = COLOR_HEX_MAP[label.color || 'charcoal'] || '#808080';
        
        return (
          <View
            key={label.id}
            className="flex-row items-center gap-1 px-2 py-1 rounded-full"
            style={{ backgroundColor: hexColor + '20' }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hexColor }}
            />
            <Text
              className="text-xs font-medium"
              style={{ color: hexColor }}
            >
              {label.name}
            </Text>
          </View>
        );
      })}
      {remainingCount > 0 && (
        <View className="px-2 py-1 rounded-full bg-muted/20">
          <Text className="text-xs font-medium text-muted">
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}
