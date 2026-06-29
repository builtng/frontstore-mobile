import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '@/components/ui/SearchBar';
import { StoreCard } from '@/components/buyer/StoreCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { publicApi } from '@/services/publicApi';
import { PublicStore } from '@/types/buyer';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const TRENDING = ['Fashion Lagos', 'Cloud Kitchen', 'Skincare', 'Custom Shoes', 'Electronics'];

export default function SearchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['stores-search', query],
    queryFn: () => publicApi.getStores({ search: query || undefined }),
    enabled: query.length >= 2,
  });

  const results: PublicStore[] = data?.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Search</Text>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search stores, products..."
          autoFocus={false}
          style={styles.searchBar}
        />
      </View>

      {query.length < 2 ? (
        <View style={styles.trendingSection}>
          <Text style={[styles.trendingTitle, { color: theme.textSecondary }]}>TRENDING SEARCHES</Text>
          <View style={styles.trendingChips}>
            {TRENDING.map((term) => (
              <TouchableOpacity
                key={term}
                style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setQuery(term)}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>🔥 {term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StoreCard
              store={item}
              horizontal
              onPress={() => router.push(`/(public)/store/${item.username}` as any)}
            />
          )}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
              {results.length} stores for "{query}"
            </Text>
          }
        />
      ) : (
        <EmptyState
          title={`No results for "${query}"`}
          description="Try a different search term or browse categories on the home tab."
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[3], gap: Spacing[4] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5 },
  searchBar: { borderRadius: 14 },
  trendingSection: { paddingHorizontal: Spacing[6], paddingTop: Spacing[4] },
  trendingTitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, letterSpacing: 1, marginBottom: Spacing[4] },
  trendingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  list: { paddingHorizontal: Spacing[6], paddingBottom: 100 },
  resultCount: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginBottom: Spacing[4] },
});
