import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';
import { TodoistLabel } from '@/lib/todoist-api';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';
import { FloatingActionButton } from '@/components/floating-action-button';

// Todoist label colors
const LABEL_COLORS = [
  { name: 'Berry Red', value: 'berry_red' },
  { name: 'Red', value: 'red' },
  { name: 'Orange', value: 'orange' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Olive Green', value: 'olive_green' },
  { name: 'Lime Green', value: 'lime_green' },
  { name: 'Green', value: 'green' },
  { name: 'Mint Green', value: 'mint_green' },
  { name: 'Teal', value: 'teal' },
  { name: 'Sky Blue', value: 'sky_blue' },
  { name: 'Light Blue', value: 'light_blue' },
  { name: 'Blue', value: 'blue' },
  { name: 'Grape', value: 'grape' },
  { name: 'Violet', value: 'violet' },
  { name: 'Lavender', value: 'lavender' },
  { name: 'Magenta', value: 'magenta' },
  { name: 'Salmon', value: 'salmon' },
  { name: 'Charcoal', value: 'charcoal' },
  { name: 'Grey', value: 'grey' },
  { name: 'Taupe', value: 'taupe' },
];

// Color mapping for display
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

export default function LabelsScreen() {
  const { apiClient, isAuthenticated } = useAuth();
  const [labels, setLabels] = useState<TodoistLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLabel, setEditingLabel] = useState<TodoistLabel | null>(null);
  const [labelName, setLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState('charcoal');
  const colors = useColors();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    loadLabels();
  }, [isAuthenticated]);

  async function loadLabels() {
    if (!apiClient) return;

    try {
      const allLabels = await apiClient.getLabels();
      setLabels(allLabels);
    } catch (error) {
      console.error('Failed to load labels:', error);
      Alert.alert('Error', 'Failed to load labels. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  function handleRefresh() {
    setIsRefreshing(true);
    loadLabels();
  }

  function openCreateModal() {
    setEditingLabel(null);
    setLabelName('');
    setSelectedColor('charcoal');
    setIsModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openEditModal(label: TodoistLabel) {
    setEditingLabel(label);
    setLabelName(label.name);
    setSelectedColor(label.color || 'charcoal');
    setIsModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSaveLabel() {
    if (!apiClient || !labelName.trim()) {
      Alert.alert('Error', 'Please enter a label name');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (editingLabel) {
        // Update existing label
        const updated = await apiClient.updateLabel(editingLabel.id, {
          name: labelName.trim(),
          color: selectedColor,
        });
        setLabels(labels.map(l => l.id === updated.id ? updated : l));
      } else {
        // Create new label
        const newLabel = await apiClient.createLabel({
          name: labelName.trim(),
          color: selectedColor,
        });
        setLabels([...labels, newLabel]);
      }

      setIsModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to save label:', error);
      Alert.alert('Error', 'Failed to save label. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  async function handleDeleteLabel(label: TodoistLabel) {
    Alert.alert(
      'Delete Label',
      `Are you sure you want to delete "${label.name}"? This will remove the label from all tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!apiClient) return;

            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await apiClient.deleteLabel(label.id);
              setLabels(labels.filter(l => l.id !== label.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Failed to delete label:', error);
              Alert.alert('Error', 'Failed to delete label. Please try again.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  }

  function renderLabel({ item }: { item: TodoistLabel }) {
    const hexColor = COLOR_HEX_MAP[item.color || 'charcoal'] || '#808080';

    return (
      <TouchableOpacity
        className="bg-surface border border-border rounded-xl p-4 mb-3 flex-row items-center active:opacity-70"
        onPress={() => openEditModal(item)}
      >
        <View
          className="w-8 h-8 rounded-full mr-3"
          style={{ backgroundColor: hexColor }}
        />
        <View className="flex-1">
          <Text className="text-base font-medium text-foreground">{item.name}</Text>
        </View>
        <TouchableOpacity
          className="ml-2 px-3 py-1"
          onPress={() => handleDeleteLabel(item)}
        >
          <Text className="text-sm text-error">Delete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 px-4 pt-6">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground">Labels</Text>
          {labels.length > 0 && (
            <Text className="text-sm text-muted mt-2">
              {labels.length} {labels.length === 1 ? 'label' : 'labels'}
            </Text>
          )}
        </View>

        {/* Labels List */}
        <FlatList
          data={labels}
          renderItem={renderLabel}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-lg text-muted text-center">
                No labels yet.{'\n'}Tap + to create your first label.
              </Text>
            </View>
          }
        />

        {/* FAB */}
        <FloatingActionButton onPress={openCreateModal} />

        {/* Create/Edit Label Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
              <Text className="text-2xl font-bold text-foreground mb-4">
                {editingLabel ? 'Edit Label' : 'New Label'}
              </Text>

              {/* Label Name */}
              <Text className="text-sm font-medium text-foreground mb-2">Label Name</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
                placeholder="Enter label name"
                placeholderTextColor={colors.muted}
                value={labelName}
                onChangeText={setLabelName}
                autoFocus
              />

              {/* Color Picker */}
              <Text className="text-sm font-medium text-foreground mb-2">Color</Text>
              <FlatList
                data={LABEL_COLORS}
                numColumns={5}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const hexColor = COLOR_HEX_MAP[item.value] || '#808080';
                  const isSelected = selectedColor === item.value;

                  return (
                    <TouchableOpacity
                      className="items-center justify-center m-2"
                      onPress={() => {
                        setSelectedColor(item.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <View
                        className="w-12 h-12 rounded-full"
                        style={{
                          backgroundColor: hexColor,
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: colors.primary,
                        }}
                      />
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 16 }}
              />

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  className="flex-1 bg-surface border border-border rounded-xl py-3 items-center active:opacity-70"
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text className="text-base font-semibold text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-xl py-3 items-center active:opacity-80"
                  onPress={handleSaveLabel}
                >
                  <Text className="text-base font-semibold text-background">
                    {editingLabel ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
