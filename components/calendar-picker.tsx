/**
 * Calendar Date Picker Component
 * 
 * A month-view calendar for selecting dates
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface CalendarPickerProps {
  selectedDate?: string; // YYYY-MM-DD format
  onSelectDate: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function CalendarPicker({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const colors = useColors();
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get days in month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Build calendar grid
  const days: (number | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  function formatDate(day: number): string {
    const date = new Date(year, month, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isDateSelected(day: number): boolean {
    if (!selectedDate) return false;
    return formatDate(day) === selectedDate;
  }

  function isToday(day: number): boolean {
    const date = new Date(year, month, day);
    return date.toDateString() === today.toDateString();
  }

  function handlePrevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  function handleQuickSelect(daysOffset: number) {
    const date = new Date(today);
    date.setDate(date.getDate() + daysOffset);
    const formatted = formatDate(date.getDate());
    onSelectDate(formatted);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View className="bg-surface rounded-xl p-4">
      {/* Quick Select Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="px-4 py-2 rounded-full border active:opacity-70"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => handleQuickSelect(0)}
          >
            <Text className="text-sm font-medium text-foreground">Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-2 rounded-full border active:opacity-70"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => handleQuickSelect(1)}
          >
            <Text className="text-sm font-medium text-foreground">Tomorrow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-2 rounded-full border active:opacity-70"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            onPress={() => handleQuickSelect(7)}
          >
            <Text className="text-sm font-medium text-foreground">Next Week</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Month Navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={handlePrevMonth}
          className="p-2 active:opacity-60"
        >
          <Text className="text-xl font-bold" style={{ color: colors.primary }}>‹</Text>
        </TouchableOpacity>
        
        <Text className="text-lg font-semibold text-foreground">
          {monthNames[month]} {year}
        </Text>
        
        <TouchableOpacity
          onPress={handleNextMonth}
          className="p-2 active:opacity-60"
        >
          <Text className="text-xl font-bold" style={{ color: colors.primary }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View className="flex-row mb-2">
        {dayNames.map(name => (
          <View key={name} className="flex-1 items-center">
            <Text className="text-xs font-semibold text-muted">{name}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
          }

          const dateStr = formatDate(day);
          const selected = isDateSelected(day);
          const isTodayDate = isToday(day);

          return (
            <View key={day} className="w-[14.28%] aspect-square p-1">
              <TouchableOpacity
                className="flex-1 items-center justify-center rounded-lg active:opacity-70"
                style={{
                  backgroundColor: selected
                    ? colors.primary
                    : isTodayDate
                    ? colors.primary + '20'
                    : 'transparent',
                }}
                onPress={() => onSelectDate(dateStr)}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: selected
                      ? '#FFFFFF'
                      : isTodayDate
                      ? colors.primary
                      : colors.foreground,
                  }}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
