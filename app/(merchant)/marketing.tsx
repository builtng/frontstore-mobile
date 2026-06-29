import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Users, Zap, Clock, CheckCircle, XCircle, MessageCircle } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Broadcast } from '@/types/merchant';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { format } from 'date-fns';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Customers', desc: 'Everyone who has ever ordered', Icon: Users },
  { value: 'buyers', label: 'Recent Buyers', desc: 'Ordered in last 30 days', Icon: CheckCircle },
  { value: 'recent', label: 'Inactive', desc: 'No orders in 60+ days', Icon: Clock },
];

const getBroadcastBadge = (status: string) => {
  const map: Record<string, any> = { sent: 'success', scheduled: 'info', draft: 'neutral', failed: 'danger' };
  return map[status] ?? 'neutral';
};

export default function MarketingScreen() {
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [audience, setAudience] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: merchantApi.getBroadcasts,
    select: (r) => r.data ?? [],
  });

  const { mutate: createBroadcast, isPending } = useMutation({
    mutationFn: merchantApi.createBroadcast,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast.success('Broadcast sent!');
      haptics.success();
      setSheetOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    },
    onError: () => toast.error('Failed to send broadcast'),
  });

  const broadcasts: Broadcast[] = data ?? [];
  const charCount = broadcastMessage.length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Marketing</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Engage your customers</Text>
        </View>
        <TouchableOpacity style={[styles.newBtn, { backgroundColor: Colors.primary }]} onPress={() => setSheetOpen(true)}>
          <Plus size={20} color={Colors.white} strokeWidth={2.5} />
          <Text style={styles.newBtnText}>Broadcast</Text>
        </TouchableOpacity>
      </View>

      {/* Pro tip banner */}
      <View style={[styles.banner, { backgroundColor: Colors.primaryDim }]}>
        <Zap size={20} color={Colors.primary} fill={Colors.primary} />
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: Colors.primary }]}>Reach customers directly on WhatsApp</Text>
          <Text style={[styles.bannerSub, { color: Colors.primaryLight ?? Colors.primary }]}>
            Broadcast promotions, restocks, and announcements to your customer list.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Broadcasts</Text>

        {isLoading ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)
        ) : broadcasts.length ? (
          broadcasts.map((b) => (
            <View key={b.id} style={[styles.broadcastCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
              <View style={styles.broadcastTop}>
                <View style={[styles.broadcastIcon, { backgroundColor: Colors.primaryDim }]}>
                  <MessageCircle size={18} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.broadcastInfo}>
                  <Text style={[styles.broadcastTitle, { color: theme.text }]}>{b.title}</Text>
                  <Text style={[styles.broadcastDate, { color: theme.textTertiary }]}>
                    {b.sent_at ? format(new Date(b.sent_at), 'MMM d, yyyy') : format(new Date(b.created_at), 'MMM d, yyyy')}
                  </Text>
                </View>
                <Badge label={b.status} variant={getBroadcastBadge(b.status)} size="sm" />
              </View>
              <Text style={[styles.broadcastMsg, { color: theme.textSecondary }]} numberOfLines={2}>
                {b.message}
              </Text>
              {b.recipient_count !== undefined && (
                <View style={styles.broadcastMeta}>
                  <Users size={13} color={theme.textTertiary} />
                  <Text style={[styles.broadcastMetaText, { color: theme.textTertiary }]}>
                    {b.recipient_count} recipients
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <EmptyState
            type="generic"
            title="No broadcasts yet"
            description="Send your first WhatsApp broadcast to your customer list and boost your sales."
            actionLabel="Create Broadcast"
            onAction={() => setSheetOpen(true)}
          />
        )}
      </ScrollView>

      {/* New broadcast sheet */}
      <BottomSheet isVisible={sheetOpen} onClose={() => setSheetOpen(false)} title="New Broadcast" snapPoint={0.85} scrollable>
        <View style={styles.form}>
          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Audience</Text>
          <View style={styles.audienceGrid}>
            {AUDIENCE_OPTIONS.map(({ value, label, desc, Icon }) => (
              <TouchableOpacity
                key={value}
                onPress={() => setAudience(value)}
                style={[
                  styles.audienceCard,
                  {
                    backgroundColor: audience === value ? Colors.primaryDim : theme.card,
                    borderColor: audience === value ? Colors.primary : theme.border,
                  },
                ]}
              >
                <Icon size={18} color={audience === value ? Colors.primary : theme.textTertiary} strokeWidth={2} />
                <Text style={[styles.audienceLabel, { color: audience === value ? Colors.primary : theme.text }]}>{label}</Text>
                <Text style={[styles.audienceDesc, { color: theme.textTertiary }]}>{desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Subject / Title</Text>
          <View style={[styles.formInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.inputText, { color: theme.text }]}
              placeholder="e.g. Flash Sale — 30% off everything!"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="sentences"
              autoCorrect={false}
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
            />
          </View>

          <View style={styles.msgHeader}>
            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Message</Text>
            <Text style={[styles.charCount, { color: charCount > 160 ? Colors.danger : theme.textTertiary }]}>
              {charCount}/320
            </Text>
          </View>
          <View style={[styles.formInput, styles.msgInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.inputText, { color: theme.text }]}
              placeholder="Write your broadcast message here..."
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="sentences"
              autoCorrect={false}
              value={broadcastMessage}
              onChangeText={setBroadcastMessage}
              multiline
              numberOfLines={5}
              maxLength={320}
              textAlignVertical="top"
            />
          </View>

          <Button
            title="Send Broadcast"
            onPress={() => createBroadcast({ title: broadcastTitle, message: broadcastMessage, audience })}
            isLoading={isPending}
            disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
            size="xl"
            icon={<Send size={18} color={Colors.white} />}
            iconPosition="right"
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5 },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderRadius: Radius.lg },
  newBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },
  banner: { marginHorizontal: Spacing[6], borderRadius: Radius.lg, padding: Spacing[4], flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[4] },
  bannerText: { flex: 1 },
  bannerTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: 3 },
  bannerSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, lineHeight: 16 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 100 },
  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginBottom: Spacing[4] },
  broadcastCard: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], gap: Spacing[3] },
  broadcastTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  broadcastIcon: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  broadcastInfo: { flex: 1 },
  broadcastTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.base },
  broadcastDate: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
  broadcastMsg: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20 },
  broadcastMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  broadcastMetaText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  form: { gap: Spacing[4], paddingBottom: Spacing[8] },
  formLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  audienceGrid: { flexDirection: 'row', gap: Spacing[3] },
  audienceCard: { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing[3], gap: 4, alignItems: 'center' },
  audienceLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, textAlign: 'center' },
  audienceDesc: { fontFamily: FontFamily.bodyRegular, fontSize: 10, textAlign: 'center' },
  formInput: { borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  msgInput: { minHeight: 120 },
  inputText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
});
