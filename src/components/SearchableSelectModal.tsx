import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  TextInput,
  View,
} from 'react-native';
import { Check, Search, X } from 'lucide-react-native';
import { T, cx } from '@/components/ui';

export type SelectItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  metadata?: any;
};

export type SearchableSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: SelectItem[];
  selectedId?: string;
  onSelect: (item: SelectItem) => void;
  placeholder?: string;
  loading?: boolean;
};

export function SearchableSelectModal({
  visible,
  onClose,
  title,
  subtitle,
  items,
  selectedId,
  onSelect,
  placeholder = 'Search...',
  loading = false,
}: SearchableSelectModalProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleSelect = (item: SelectItem) => {
    onSelect(item);
    setSearch('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="max-h-[85%] rounded-t-[32px] bg-surface pb-6 shadow-2xl"
        >
          <SafeAreaView className="flex-initial">
            {/* Grab handle */}
            <View className="items-center pt-3 pb-2">
              <View className="h-1.5 w-10 rounded-full bg-line-2" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
              <View className="flex-1 pr-3">
                <T className="font-display text-[20px] text-ink">{title}</T>
                {subtitle ? (
                  <T className="mt-0.5 text-xs text-muted-2">{subtitle}</T>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                className="h-9 w-9 items-center justify-center rounded-full bg-bg"
              >
                <X size={18} color="#0E1A15" strokeWidth={2.4} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View className="px-5 pb-3 pt-1">
              <View className="h-12 flex-row items-center rounded-2xl border border-line-2 bg-bg px-3.5">
                <Search size={18} color="#8A938E" strokeWidth={2.2} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={placeholder}
                  placeholderTextColor="#8A938E"
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  className="ml-2.5 h-full flex-1 font-sans text-base text-ink"
                />
                {search.length > 0 && Platform.OS !== 'ios' ? (
                  <Pressable onPress={() => setSearch('')} className="p-1">
                    <X size={16} color="#8A938E" strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Results List */}
            {loading ? (
              <View className="h-48 items-center justify-center gap-2">
                <ActivityIndicator size="small" color="#0B6E4F" />
                <T className="text-xs text-muted">Loading options...</T>
              </View>
            ) : filtered.length === 0 ? (
              <View className="h-44 items-center justify-center px-6">
                <T className="font-sans-medium text-base text-ink">No results found</T>
                <T className="mt-1 text-center text-xs text-muted-2">
                  We couldn't find any match for "{search}". Try searching something else.
                </T>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                keyboardShouldPersistTaps="handled"
                className="max-h-[380px] px-3"
                renderItem={({ item, index }) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}`}
                      onPress={() => handleSelect(item)}
                      className={cx(
                        'my-0.5 flex-row items-center justify-between rounded-2xl px-4 py-3.5 transition-colors',
                        isSelected ? 'bg-[#E8F3EE]' : 'bg-surface active:bg-bg'
                      )}
                    >
                      <View className="flex-1 flex-row items-center gap-3">
                        {item.icon ? (
                          <View className="h-9 w-9 items-center justify-center rounded-xl bg-bg">
                            {item.icon}
                          </View>
                        ) : null}
                        <View className="flex-1">
                          <T
                            className={cx(
                              'text-base',
                              isSelected ? 'font-sans-bold text-ink' : 'font-sans-medium text-ink'
                            )}
                          >
                            {item.title}
                          </T>
                          {item.subtitle ? (
                            <T className="mt-0.5 text-xs text-muted-2">{item.subtitle}</T>
                          ) : null}
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2.5">
                        {item.badge ? (
                          <View className="rounded-full bg-bg px-2.5 py-1 border border-line">
                            <T className="font-sans-bold text-[11px] text-muted-2 tracking-wider">
                              {item.badge}
                            </T>
                          </View>
                        ) : null}
                        {isSelected ? (
                          <View className="h-6 w-6 items-center justify-center rounded-full bg-green">
                            <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
