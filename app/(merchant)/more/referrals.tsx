import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Share2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Package,
  Instagram,
  Twitter,
  ArrowUpRight,
  TrendingUp,
  Award,
  RefreshCw,
  Wallet,
  ExternalLink,
} from 'lucide-react-native';

import { merchantApi } from '@/services/merchantApi';
import { useAuthStore } from '@/stores/authStore';
import { useHaptics } from '@/hooks/useHaptics';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import {
  ReferralStatusData,
  ReferredMerchantItem,
  ReferralEarningsLog,
} from '@/types/merchant';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function ReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const [instagramInput, setInstagramInput] = useState('');
  const [twitterInput, setTwitterInput] = useState('');

  // Fetch live referral status
  const {
    data: referralRes,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<{ status: string; data: ReferralStatusData }>({
    queryKey: ['merchant-referral-status'],
    queryFn: merchantApi.getReferralStatus,
    staleTime: 1000 * 60, // 1 minute
  });

  const referralData = referralRes?.data;
  const criteriaStatus = referralData?.criteria_status;
  const isApproved = referralData?.is_approved || criteriaStatus?.is_approved;
  const isPending = criteriaStatus?.is_pending;
  const criteria = criteriaStatus?.criteria;
  const stats = referralData?.stats ?? {
    total_earned: 0,
    referrals_count: 0,
    active_subscriptions_count: 0,
    pending_verifications_count: 0,
    is_withdrawal_unlocked: false,
    minimum_withdrawal_threshold: 1000,
    needed_for_withdrawal: 1000,
  };
  const referrals = referralData?.referrals ?? [];
  const earningsHistory = referralData?.earnings_history ?? [];

  const storeUsername = referralData?.referral_code || user?.store?.username || '';
  const referralLink =
    referralData?.referral_link ||
    (storeUsername ? `https://frontstore.ng/ref/${storeUsername}` : 'https://frontstore.ng');

  // Application Mutation
  const applyMutation = useMutation({
    mutationFn: (payload: { instagram_handle?: string; twitter_handle?: string }) =>
      merchantApi.applyForReferral(payload),
    onSuccess: (data: any) => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['merchant-referral-status'] });
      Alert.alert(
        'Application Submitted! 🎉',
        data?.message ||
          'Thank you! Our merchant partnerships team is reviewing your store. You will be notified as soon as your referral link is active.'
      );
    },
    onError: (err: any) => {
      haptics.error();
      Alert.alert(
        'Submission Failed',
        err?.response?.data?.message ||
          'Could not submit your referral application. Please ensure your store satisfies all criteria.'
      );
    },
  });

  const handleCopyLink = async () => {
    if (!referralLink) return;
    haptics.success();
    await Clipboard.setStringAsync(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleShareWhatsApp = async () => {
    haptics.selection();
    const msg = `Hey! I run my online store on FrontStore. It is fast, has instant WhatsApp orders and seamless payouts. Start your store today: ${referralLink}`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const webFallback = `https://wa.me/?text=${encodeURIComponent(msg)}`;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(webFallback);
    }
  };

  const handleShareGeneral = async () => {
    haptics.selection();
    if (Platform.OS === 'web') {
      await handleCopyLink();
    } else {
      try {
        await Share.share({
          title: 'Join FrontStore Commerce',
          message: `Hey! I run my online store on FrontStore. It is fast, has instant WhatsApp orders and seamless payouts. Start your store today: ${referralLink}`,
          url: referralLink,
        });
      } catch {
        await handleCopyLink();
      }
    }
  };

  const handleApply = () => {
    haptics.selection();
    applyMutation.mutate({
      instagram_handle: instagramInput.trim() || undefined,
      twitter_handle: twitterInput.trim() || undefined,
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: '#F8FAFC' }]}>
      {/* Navigation Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: insets.top > 0 ? insets.top + 8 : Spacing[4] },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            haptics.light();
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <Text style={styles.headerSubtitle}>Merchant Partner Program</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            haptics.light();
            refetch();
          }}
          disabled={isRefetching}
          activeOpacity={0.7}
        >
          <RefreshCw
            size={18}
            color={isRefetching ? '#94A3B8' : '#0F766E'}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor="#0F766E"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading referral program details...</Text>
          </View>
        ) : (
          <>
            {/* Hero Partner Banner */}
            <LinearGradient
              colors={['#ECFDF5', '#F0FDF4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBanner}
            >
              <View style={styles.heroPill}>
                <Sparkles size={13} color="#059669" strokeWidth={2.5} />
                <Text style={styles.heroPillText}>IN-HOUSE MERCHANT REFERRALS</Text>
              </View>

              <Text style={styles.heroTitle}>
                Refer Fellow Merchants & Earn up to ₦1,000
              </Text>

              <Text style={styles.heroDescription}>
                Grow the FrontStore community together. Earn{' '}
                <Text style={styles.boldText}>₦100</Text> when your referred
                merchant lists their 1st verified product,{' '}
                <Text style={styles.boldText}>₦400</Text> when they upgrade to Pro,
                and <Text style={styles.boldText}>₦500</Text> on Legend — capped at{' '}
                <Text style={styles.boldText}>₦1,000 lifetime</Text> per merchant.
              </Text>
            </LinearGradient>

            {/* ── STATE 1: APPLICATION UNDER REVIEW ── */}
            {isPending && (
              <View style={[styles.card, Shadow.sm as any, styles.pendingCard]}>
                <View style={styles.pendingIconWrapper}>
                  <Clock size={32} color="#D97706" strokeWidth={2.2} />
                </View>

                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Under Review</Text>
                </View>

                <Text style={styles.pendingTitle}>Application Under Review</Text>
                <Text style={styles.pendingDesc}>
                  Our merchant safety and partnerships team is currently reviewing your
                  store details, product catalog quality, and background check. You
                  will be notified as soon as your referral link is activated!
                </Text>

                <TouchableOpacity
                  style={styles.checkStatusBtn}
                  onPress={() => {
                    haptics.light();
                    refetch();
                  }}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={15} color="#0F766E" strokeWidth={2.2} />
                  <Text style={styles.checkStatusBtnText}>Check Status</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STATE 2: NOT YET APPROVED (CRITERIA CHECKLIST) ── */}
            {!isApproved && !isPending && criteria && (
              <View style={styles.section}>
                <View style={styles.criteriaHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Unlock Referral Partner Status</Text>
                    <Text style={styles.sectionSubtitle}>
                      Fulfill the 4 merchant authenticity criteria below to unlock your
                      referral link.
                    </Text>
                  </View>
                </View>

                {/* Criteria 1: 5 Products */}
                <View style={[styles.criteriaCard, Shadow.sm as any]}>
                  <View style={styles.criteriaTopRow}>
                    <View
                      style={[
                        styles.criteriaIconBox,
                        criteria.min_products.fulfilled
                          ? styles.criteriaIconFulfilled
                          : styles.criteriaIconPending,
                      ]}
                    >
                      <Package
                        size={20}
                        color={criteria.min_products.fulfilled ? '#10B981' : '#64748B'}
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.min_products.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={15} color="#10B981" strokeWidth={2.4} />
                        <Text style={styles.fulfilledText}>Fulfilled</Text>
                      </View>
                    ) : (
                      <View style={styles.unfulfilledBadge}>
                        <AlertCircle size={14} color="#D97706" strokeWidth={2.2} />
                        <Text style={styles.unfulfilledText}>
                          {criteria.min_products.current} / 5 items
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.criteriaTitle}>
                    {criteria.min_products.title}
                  </Text>
                  <Text style={styles.criteriaDesc}>
                    {criteria.min_products.description}
                  </Text>

                  {!criteria.min_products.fulfilled && (
                    <TouchableOpacity
                      style={styles.criteriaActionLink}
                      onPress={() => {
                        haptics.light();
                        router.push('/(merchant)/products');
                      }}
                    >
                      <Text style={styles.criteriaActionText}>Upload Products</Text>
                      <ArrowUpRight size={14} color="#0F766E" strokeWidth={2.2} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Criteria 2: Social Media */}
                <View style={[styles.criteriaCard, Shadow.sm as any]}>
                  <View style={styles.criteriaTopRow}>
                    <View
                      style={[
                        styles.criteriaIconBox,
                        criteria.social_media.fulfilled
                          ? styles.criteriaIconFulfilled
                          : styles.criteriaIconPending,
                      ]}
                    >
                      <Instagram
                        size={20}
                        color={criteria.social_media.fulfilled ? '#10B981' : '#64748B'}
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.social_media.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={15} color="#10B981" strokeWidth={2.4} />
                        <Text style={styles.fulfilledText}>Fulfilled</Text>
                      </View>
                    ) : (
                      <View style={styles.unfulfilledBadge}>
                        <AlertCircle size={14} color="#D97706" strokeWidth={2.2} />
                        <Text style={styles.unfulfilledText}>Link Account</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.criteriaTitle}>
                    {criteria.social_media.title}
                  </Text>
                  <Text style={styles.criteriaDesc}>
                    {criteria.social_media.description}
                  </Text>

                  {criteria.social_media.fulfilled ? (
                    <View style={styles.handlesRow}>
                      {Object.entries(criteria.social_media.handles || {}).map(
                        ([platform, handle]) => (
                          <View key={platform} style={styles.handlePill}>
                            <Text style={styles.handlePillText}>
                              {platform}: {handle}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  ) : (
                    <View style={styles.inputsWrapper}>
                      <TextInput
                        style={styles.handleInput}
                        placeholder="Instagram handle (e.g. @mystore)"
                        placeholderTextColor="#94A3B8"
                        value={instagramInput}
                        onChangeText={setInstagramInput}
                        autoCapitalize="none"
                      />
                      <TextInput
                        style={styles.handleInput}
                        placeholder="X / Twitter handle (optional)"
                        placeholderTextColor="#94A3B8"
                        value={twitterInput}
                        onChangeText={setTwitterInput}
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                </View>

                {/* Criteria 3: Platform Age (1 Week) */}
                <View style={[styles.criteriaCard, Shadow.sm as any]}>
                  <View style={styles.criteriaTopRow}>
                    <View
                      style={[
                        styles.criteriaIconBox,
                        criteria.platform_age.fulfilled
                          ? styles.criteriaIconFulfilled
                          : styles.criteriaIconPending,
                      ]}
                    >
                      <Clock
                        size={20}
                        color={criteria.platform_age.fulfilled ? '#10B981' : '#64748B'}
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.platform_age.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={15} color="#10B981" strokeWidth={2.4} />
                        <Text style={styles.fulfilledText}>Fulfilled</Text>
                      </View>
                    ) : (
                      <View style={styles.unfulfilledBadge}>
                        <Clock size={14} color="#D97706" strokeWidth={2.2} />
                        <Text style={styles.unfulfilledText}>
                          {criteria.platform_age.days} / 7 days
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.criteriaTitle}>
                    {criteria.platform_age.title}
                  </Text>
                  <Text style={styles.criteriaDesc}>
                    Registered {criteria.platform_age.days} days ago. Merchants must
                    be active on FrontStore for at least 7 days before referring peers.
                  </Text>
                </View>

                {/* Criteria 4: Background Check */}
                <View style={[styles.criteriaCard, Shadow.sm as any]}>
                  <View style={styles.criteriaTopRow}>
                    <View
                      style={[
                        styles.criteriaIconBox,
                        criteria.background_check.fulfilled
                          ? styles.criteriaIconFulfilled
                          : styles.criteriaIconPending,
                      ]}
                    >
                      <ShieldCheck
                        size={20}
                        color={criteria.background_check.fulfilled ? '#10B981' : '#64748B'}
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.background_check.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={15} color="#10B981" strokeWidth={2.4} />
                        <Text style={styles.fulfilledText}>Passed</Text>
                      </View>
                    ) : (
                      <View style={styles.infoBadge}>
                        <ShieldCheck size={14} color="#0284C7" strokeWidth={2.2} />
                        <Text style={styles.infoBadgeText}>On Submission</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.criteriaTitle}>
                    {criteria.background_check.title}
                  </Text>
                  <Text style={styles.criteriaDesc}>
                    {criteria.background_check.fulfilled
                      ? 'Your store authenticity has been confirmed by our safety team.'
                      : 'Our safety team verifies your store credibility automatically upon application submission.'}
                  </Text>
                </View>

                {/* Apply Action Card */}
                <View style={[styles.applyCard, Shadow.sm as any]}>
                  <Text style={styles.applyCardTitle}>
                    Ready to become a FrontStore Referral Partner?
                  </Text>
                  <Text style={styles.applyCardSub}>
                    Submit your application for review by our merchant relations team.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.applyBtn,
                      applyMutation.isPending && styles.applyBtnDisabled,
                    ]}
                    onPress={handleApply}
                    disabled={applyMutation.isPending}
                    activeOpacity={0.85}
                  >
                    {applyMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
                        <Text style={styles.applyBtnText}>
                          Apply for Referral Program
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STATE 3: APPROVED REFERRAL PARTNER DASHBOARD ── */}
            {isApproved && (
              <>
                {/* Referral Link & Hub */}
                <View style={[styles.card, Shadow.sm as any]}>
                  <View style={styles.approvedHeaderRow}>
                    <View>
                      <View style={styles.activePartnerPill}>
                        <CheckCircle2 size={12} color="#059669" strokeWidth={2.5} />
                        <Text style={styles.activePartnerText}>
                          ACTIVE REFERRAL PARTNER
                        </Text>
                      </View>
                      <Text style={styles.cardTitle}>Your Unique Referral Link</Text>
                    </View>
                  </View>

                  {/* Link Box */}
                  <View style={styles.linkBox}>
                    <Text style={styles.linkText} numberOfLines={2}>
                      {referralLink}
                    </Text>
                    <View style={styles.codeTag}>
                      <Text style={styles.codeTagText}>
                        Code: <Text style={{ fontWeight: '800' }}>{storeUsername}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Share Action Buttons */}
                  <View style={styles.actionButtonRow}>
                    <TouchableOpacity
                      style={[styles.shareBtn, styles.copyBtnHighlight]}
                      onPress={handleCopyLink}
                      activeOpacity={0.8}
                    >
                      {copied ? (
                        <>
                          <Check size={16} color="#047857" strokeWidth={2.5} />
                          <Text style={[styles.shareBtnText, { color: '#047857' }]}>
                            Copied!
                          </Text>
                        </>
                      ) : (
                        <>
                          <Copy size={16} color="#0F766E" strokeWidth={2.2} />
                          <Text style={[styles.shareBtnText, { color: '#0F766E' }]}>
                            Copy Link
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.shareBtn, styles.waBtn]}
                      onPress={handleShareWhatsApp}
                      activeOpacity={0.85}
                    >
                      <Share2 size={16} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={[styles.shareBtnText, { color: '#FFFFFF' }]}>
                        WhatsApp
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.shareBtn, styles.moreShareBtn]}
                      onPress={handleShareGeneral}
                      activeOpacity={0.8}
                    >
                      <ExternalLink size={16} color="#475569" strokeWidth={2.2} />
                      <Text style={[styles.shareBtnText, { color: '#475569' }]}>
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ₦1,000 Minimum Withdrawal Unlock Threshold Card */}
                <LinearGradient
                  colors={
                    stats.is_withdrawal_unlocked
                      ? ['#ECFDF5', '#F0FDF4']
                      : ['#FFFBEB', '#FEF3C7']
                  }
                  style={[
                    styles.thresholdCard,
                    {
                      borderColor: stats.is_withdrawal_unlocked
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(245, 158, 11, 0.35)',
                    },
                  ]}
                >
                  <View style={styles.thresholdTopRow}>
                    <View style={styles.thresholdIconContainer}>
                      {stats.is_withdrawal_unlocked ? (
                        <CheckCircle2 size={22} color="#059669" strokeWidth={2.4} />
                      ) : (
                        <Award size={22} color="#D97706" strokeWidth={2.2} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.thresholdTitle}>
                        {stats.is_withdrawal_unlocked
                          ? 'Withdrawals Unlocked! 🎉'
                          : 'Withdrawal Threshold: ₦1,000'}
                      </Text>
                      <Text style={styles.thresholdSub}>
                        {stats.is_withdrawal_unlocked
                          ? 'Your referral earnings have reached ₦1,000 and are available for payout in your wallet.'
                          : `Referral rewards unlock for payout once your total referral earnings reach ₦1,000.`}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar towards ₦1,000 */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(
                            100,
                            Math.round(((stats.total_earned || 0) / 1000) * 100)
                          )}%`,
                          backgroundColor: stats.is_withdrawal_unlocked
                            ? '#10B981'
                            : '#F59E0B',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.thresholdBottomRow}>
                    <Text style={styles.thresholdProgressText}>
                      Earned: {formatCurrency(stats.total_earned || 0)} / ₦1,000
                    </Text>

                    {stats.is_withdrawal_unlocked ? (
                      <TouchableOpacity
                        style={styles.walletShortcutBtn}
                        onPress={() => {
                          haptics.selection();
                          router.push('/(merchant)/more/wallet');
                        }}
                      >
                        <Text style={styles.walletShortcutText}>Open Wallet</Text>
                        <ArrowUpRight size={13} color="#047857" strokeWidth={2.4} />
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.thresholdNeededText}>
                        {formatCurrency(
                          stats.needed_for_withdrawal ??
                            Math.max(0, 1000 - (stats.total_earned || 0))
                        )}{' '}
                        more to unlock
                      </Text>
                    )}
                  </View>
                </LinearGradient>

                {/* Metrics 4-Grid */}
                <View style={styles.metricsGrid}>
                  <View style={[styles.metricCard, Shadow.sm as any]}>
                    <Text style={styles.metricLabel}>Total Earned</Text>
                    <Text style={[styles.metricValue, { color: '#059669' }]}>
                      {formatCurrency(stats.total_earned || 0)}
                    </Text>
                  </View>

                  <View style={[styles.metricCard, Shadow.sm as any]}>
                    <Text style={styles.metricLabel}>Total Referrals</Text>
                    <Text style={styles.metricValue}>{stats.referrals_count || 0}</Text>
                  </View>

                  <View style={[styles.metricCard, Shadow.sm as any]}>
                    <Text style={styles.metricLabel}>Pro / Legend</Text>
                    <Text style={[styles.metricValue, { color: '#0F766E' }]}>
                      {stats.active_subscriptions_count || 0}
                    </Text>
                  </View>

                  <View style={[styles.metricCard, Shadow.sm as any]}>
                    <Text style={styles.metricLabel}>Pending Items</Text>
                    <Text style={[styles.metricValue, { color: '#D97706' }]}>
                      {stats.pending_verifications_count || 0}
                    </Text>
                  </View>
                </View>

                {/* Reward Breakdown Tier Explanation */}
                <View style={[styles.card, Shadow.sm as any]}>
                  <Text style={styles.cardTitle}>How Referral Earnings Work</Text>
                  <Text style={styles.cardSub}>
                    Get rewarded at every growth milestone your referee achieves:
                  </Text>

                  <View style={styles.breakdownList}>
                    <View style={styles.breakdownItem}>
                      <View style={styles.breakdownPill}>
                        <Text style={styles.breakdownPillText}>₦100</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownItemTitle}>
                          1st Verified Product Listed
                        </Text>
                        <Text style={styles.breakdownItemSub}>
                          Earned when your referred merchant posts their first genuine item.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.breakdownDivider} />

                    <View style={styles.breakdownItem}>
                      <View style={styles.breakdownPill}>
                        <Text style={styles.breakdownPillText}>₦400</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownItemTitle}>
                          Pro Tier Upgrade
                        </Text>
                        <Text style={styles.breakdownItemSub}>
                          Earned when they activate a Pro subscription plan.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.breakdownDivider} />

                    <View style={styles.breakdownItem}>
                      <View style={styles.breakdownPill}>
                        <Text style={styles.breakdownPillText}>₦500</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownItemTitle}>
                          Legend Tier Upgrade
                        </Text>
                        <Text style={styles.breakdownItemSub}>
                          Earned when they upgrade to FrontStore Legend.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.capNotice}>
                    <Sparkles size={14} color="#0F766E" strokeWidth={2.2} />
                    <Text style={styles.capNoticeText}>
                      Maximum reward cap: <Text style={{ fontWeight: '700' }}>₦1,000</Text>{' '}
                      lifetime per referred merchant.
                    </Text>
                  </View>
                </View>

                {/* Referred Merchants List */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Your Referred Merchants ({referrals.length})
                  </Text>

                  {referrals.length === 0 ? (
                    <View style={[styles.emptyCard, Shadow.sm as any]}>
                      <View style={styles.emptyIconCircle}>
                        <Users size={28} color="#94A3B8" strokeWidth={2} />
                      </View>
                      <Text style={styles.emptyTitle}>No Referrals Yet</Text>
                      <Text style={styles.emptyDesc}>
                        Share your unique link with vendors, creators, and online sellers.
                        As soon as they create a store, they will appear here!
                      </Text>
                      <TouchableOpacity
                        style={styles.emptyShareBtn}
                        onPress={handleShareWhatsApp}
                        activeOpacity={0.85}
                      >
                        <Share2 size={15} color="#FFFFFF" strokeWidth={2.2} />
                        <Text style={styles.emptyShareBtnText}>Share Link on WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    referrals.map((item: ReferredMerchantItem) => (
                      <View
                        key={item.id}
                        style={[styles.merchantItemCard, Shadow.sm as any]}
                      >
                        <View style={styles.merchantTopRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.merchantStoreName}>
                              {item.store_name || item.referee_name}
                            </Text>
                            <Text style={styles.merchantUsername}>
                              @{item.store_username || 'store'}
                            </Text>
                          </View>

                          <View style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>
                              {item.plan?.toUpperCase() || 'FREE'}
                            </Text>
                          </View>
                        </View>

                        {/* Status Pills */}
                        <View style={styles.merchantMetaRow}>
                          <View style={styles.statusChip}>
                            <Text style={styles.statusChipText}>
                              Product:{' '}
                              {item.first_product_status === 'verified'
                                ? '✓ Verified'
                                : item.first_product_status === 'pending_verification'
                                ? '⏳ Pending'
                                : 'None yet'}
                            </Text>
                          </View>

                          <View style={styles.earnedChip}>
                            <Text style={styles.earnedChipText}>
                              Earned: {formatCurrency(item.total_earned || 0)} / ₦1,000
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Recent Earnings Activity */}
                {earningsHistory.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Referral Activity</Text>
                    <View style={[styles.card, Shadow.sm as any]}>
                      {earningsHistory.map((e: ReferralEarningsLog, idx: number) => (
                        <View
                          key={e.id || idx}
                          style={[
                            styles.earningRow,
                            idx < earningsHistory.length - 1 && styles.earningRowBorder,
                          ]}
                        >
                          <View style={styles.earningIcon}>
                            <Award size={16} color="#059669" strokeWidth={2.2} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.earningReferee}>
                              {e.referee || 'Referred Merchant'}
                            </Text>
                            <Text style={styles.earningEvent}>
                              {e.event_type.replace(/_/g, ' ')}
                            </Text>
                          </View>
                          <Text style={styles.earningAmount}>
                            +{formatCurrency(e.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13.5,
    color: '#64748B',
  },

  // Hero Banner
  heroBanner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 20,
    marginBottom: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 10,
  },
  heroPillText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: '#047857',
  },
  heroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 21,
    letterSpacing: -0.4,
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 27,
  },
  heroDescription: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  boldText: {
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },

  // Common Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: '#0F172A',
  },
  cardSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
  },

  // Pending State Card
  pendingCard: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  pendingIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 10,
  },
  pendingBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#D97706',
  },
  pendingTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  checkStatusBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12.5,
    color: '#0F766E',
  },

  // Criteria Section
  section: {
    marginBottom: 20,
  },
  criteriaHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  criteriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 16,
    marginBottom: 12,
  },
  criteriaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  criteriaIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaIconFulfilled: {
    backgroundColor: '#ECFDF5',
  },
  criteriaIconPending: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fulfilledText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#059669',
  },
  unfulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  unfulfilledText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#D97706',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  infoBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#0284C7',
  },
  criteriaTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14.5,
    color: '#0F172A',
    marginBottom: 3,
  },
  criteriaDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  criteriaActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  criteriaActionText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12.5,
    color: '#0F766E',
  },
  handlesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  handlePill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  handlePillText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: '#475569',
  },
  inputsWrapper: {
    gap: 8,
    marginTop: 10,
  },
  handleInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#0F172A',
  },

  // Apply Card
  applyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 18,
    marginTop: 4,
  },
  applyCardTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 3,
  },
  applyCardSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyBtnDisabled: {
    opacity: 0.65,
  },
  applyBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },

  // Approved Partner Hub
  approvedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activePartnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
    marginBottom: 6,
  },
  activePartnerText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: '#059669',
    letterSpacing: 0.6,
  },
  linkBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  linkText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12.5,
    color: '#0F766E',
  },
  codeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeTagText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: '#64748B',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyBtnHighlight: {
    backgroundColor: '#F0FDFA',
    borderColor: 'rgba(15, 118, 110, 0.25)',
  },
  waBtn: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  moreShareBtn: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  shareBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
  },

  // Threshold Card
  thresholdCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  thresholdTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thresholdIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thresholdTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14.5,
    color: '#0F172A',
  },
  thresholdSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  thresholdBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdProgressText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11.5,
    color: '#475569',
  },
  thresholdNeededText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11.5,
    color: '#D97706',
  },
  walletShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(4, 120, 87, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  walletShortcutText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#047857',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 14,
  },
  metricLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  // Reward Breakdown List
  breakdownList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 12,
    marginTop: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  breakdownPill: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  breakdownPillText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  breakdownItemTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: '#0F172A',
  },
  breakdownItemSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  capNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  capNoticeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11.5,
    color: '#0F766E',
  },

  // Referred Merchant Card
  merchantItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 14,
    marginBottom: 10,
  },
  merchantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  merchantStoreName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: '#0F172A',
  },
  merchantUsername: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  planBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  planBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: '#0F766E',
  },
  merchantMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  statusChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: '#475569',
  },
  earnedChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  earnedChipText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#047857',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15.5,
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  emptyShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emptyShareBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },

  // Earnings Activity Row
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  earningRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  earningIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningReferee: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
    color: '#0F172A',
  },
  earningEvent: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  earningAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
    color: '#059669',
  },
});
