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
  Zap,
  Gift,
  ChevronRight,
  Info,
} from 'lucide-react-native';

import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { merchantApi } from '@/services/merchantApi';
import { useAuthStore } from '@/stores/authStore';
import { useHaptics } from '@/hooks/useHaptics';
import { FontFamily } from '@/constants/typography';
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

type ActiveTab = 'overview' | 'referrals' | 'criteria';

export default function ReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
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
  const isApproved = Boolean(referralData?.is_approved || criteriaStatus?.is_approved);
  const isPending = Boolean(criteriaStatus?.is_pending);

  // Robust criteria fallback so the screen is never empty
  const rawCriteria = criteriaStatus?.criteria;
  const criteria = {
    min_products: rawCriteria?.min_products ?? {
      title: '5 Active Store Products',
      description: 'Your catalog must have at least 5 genuine items listed',
      current: 0,
      required: 5,
      fulfilled: false,
    },
    social_media: rawCriteria?.social_media ?? {
      title: 'Social Media Accounts',
      description: 'Link your business Instagram, TikTok, or X/Twitter handle',
      handles: {},
      fulfilled: false,
    },
    platform_age: rawCriteria?.platform_age ?? {
      title: '7 Days on FrontStore',
      description: 'Merchant account active for at least 7 days before referring',
      days: 0,
      required: 7,
      fulfilled: false,
    },
    background_check: rawCriteria?.background_check ?? {
      title: 'Merchant Authenticity Verification',
      description: 'Store trust and credibility reviewed by FrontStore safety',
      fulfilled: false,
    },
  };

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

  const storeUsername =
    referralData?.referral_code || user?.store?.username || 'mystore';
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
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareWhatsApp = async () => {
    haptics.selection();
    const msg = `Hey! I run my online store on FrontStore. It is lightning fast, has instant WhatsApp orders, and automated bank payouts. Set up your store in 2 minutes: ${referralLink}`;
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
          message: `Hey! I run my online store on FrontStore. It is lightning fast, has instant WhatsApp orders, and automated bank payouts. Set up your store in 2 minutes: ${referralLink}`,
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

  const progressPercent = Math.min(
    100,
    Math.round(((stats.total_earned || 0) / 1000) * 100)
  );

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
          style={styles.headerIconButton}
          onPress={() => {
            haptics.light();
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0F172A" strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <Text style={styles.headerSubtitle}>Merchant Partner Program</Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconButton}
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor="#0F766E"
          />
        }
      >
        {/* ── 1. FLAGSHIP HERO SHOWCASE ── */}
        <LinearGradient
          colors={['#042F2E', '#064E3B', '#0F766E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Top Pill / Badge */}
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Sparkles size={12} color="#34D399" strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>MERCHANT PARTNER PROGRAM</Text>
            </View>

            <View style={styles.lifetimeCapPill}>
              <Text style={styles.lifetimeCapText}>₦1,000 Cap / Store</Text>
            </View>
          </View>

          {/* Hero Titles */}
          <Text style={styles.heroHeading}>
            Refer Fellow Merchants,{'\n'}Earn Up to ₦1,000
          </Text>

          <Text style={styles.heroSubHeading}>
            Invite online sellers, creators & brands to FrontStore. Earn real cash
            milestones sent right to your store wallet.
          </Text>

          {/* Quick Value Metrics Bar */}
          <View style={styles.heroValueBar}>
            <View style={styles.heroValueCol}>
              <Text style={styles.heroValueNum}>₦100</Text>
              <Text style={styles.heroValueDesc}>1st Product Listed</Text>
            </View>
            <View style={styles.heroValueDivider} />
            <View style={styles.heroValueCol}>
              <Text style={styles.heroValueNum}>₦400</Text>
              <Text style={styles.heroValueDesc}>Pro Upgrade</Text>
            </View>
            <View style={styles.heroValueDivider} />
            <View style={styles.heroValueCol}>
              <Text style={styles.heroValueNum}>₦500</Text>
              <Text style={styles.heroValueDesc}>Legend Tier</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. SEGMENTED NAVIGATION BAR ── */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'overview' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              haptics.selection();
              setActiveTab('overview');
            }}
            activeOpacity={0.8}
          >
            <Zap
              size={15}
              color={activeTab === 'overview' ? '#0F766E' : '#64748B'}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'overview' && styles.segmentBtnTextActive,
              ]}
            >
              Overview & Share
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'referrals' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              haptics.selection();
              setActiveTab('referrals');
            }}
            activeOpacity={0.8}
          >
            <Users
              size={15}
              color={activeTab === 'referrals' ? '#0F766E' : '#64748B'}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'referrals' && styles.segmentBtnTextActive,
              ]}
            >
              Referrals ({referrals.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'criteria' && styles.segmentBtnActive,
            ]}
            onPress={() => {
              haptics.selection();
              setActiveTab('criteria');
            }}
            activeOpacity={0.8}
          >
            <ShieldCheck
              size={15}
              color={activeTab === 'criteria' ? '#0F766E' : '#64748B'}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'criteria' && styles.segmentBtnTextActive,
              ]}
            >
              Partner Status
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════
            TAB 1: OVERVIEW & SHARE
        ══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Share Hub Card */}
            <View style={[styles.card, Shadow.sm as any]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBoxTeal}>
                  <Share2 size={18} color="#0F766E" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Your Referral Link & Code</Text>
                  <Text style={styles.cardSub}>
                    Share this unique link with fellow merchants
                  </Text>
                </View>
                {isApproved && (
                  <View style={styles.activePill}>
                    <CheckCircle2 size={12} color="#059669" strokeWidth={2.5} />
                    <Text style={styles.activePillText}>ACTIVE</Text>
                  </View>
                )}
              </View>

              {/* Link Input Display Box */}
              <View style={styles.linkContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkUrlText} numberOfLines={1}>
                    {referralLink}
                  </Text>
                  <Text style={styles.linkCodeSub}>
                    Invite Code:{' '}
                    <Text style={{ fontWeight: '800', color: '#0F766E' }}>
                      {storeUsername}
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.miniCopyBtn, copied && styles.miniCopyBtnSuccess]}
                  onPress={handleCopyLink}
                  activeOpacity={0.75}
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#FFFFFF" strokeWidth={2.6} />
                      <Text style={styles.miniCopyBtnTextSuccess}>Copied</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={14} color="#0F766E" strokeWidth={2.2} />
                      <Text style={styles.miniCopyBtnText}>Copy</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Primary Action Buttons */}
              <View style={styles.shareButtonsRow}>
                <TouchableOpacity
                  style={styles.whatsAppPrimaryBtn}
                  onPress={handleShareWhatsApp}
                  activeOpacity={0.88}
                >
                  <WhatsAppIcon size={20} color="#FFFFFF" />
                  <Text style={styles.whatsAppPrimaryBtnText}>
                    Share on WhatsApp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.generalShareSecondaryBtn}
                  onPress={handleShareGeneral}
                  activeOpacity={0.75}
                >
                  <ExternalLink size={17} color="#334155" strokeWidth={2.2} />
                  <Text style={styles.generalShareSecondaryBtnText}>More</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ₦1,000 Withdrawal Unlock Threshold Card */}
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
                    ? 'rgba(16, 185, 129, 0.4)'
                    : 'rgba(245, 158, 11, 0.35)',
                },
              ]}
            >
              <View style={styles.thresholdTopRow}>
                <View
                  style={[
                    styles.thresholdIconContainer,
                    stats.is_withdrawal_unlocked
                      ? { backgroundColor: '#D1FAE5' }
                      : { backgroundColor: '#FEF3C7' },
                  ]}
                >
                  {stats.is_withdrawal_unlocked ? (
                    <CheckCircle2 size={24} color="#059669" strokeWidth={2.4} />
                  ) : (
                    <Award size={24} color="#D97706" strokeWidth={2.2} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.thresholdTitle}>
                    {stats.is_withdrawal_unlocked
                      ? 'Withdrawals Unlocked! 🎉'
                      : '₦1,000 Payout Threshold'}
                  </Text>
                  <Text style={styles.thresholdSub}>
                    {stats.is_withdrawal_unlocked
                      ? 'Your earnings are ready! Transfer funds straight to your bank account anytime.'
                      : 'Referral rewards automatically unlock for bank payout once your total reaches ₦1,000.'}
                  </Text>
                </View>
              </View>

              {/* Progress Track */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: stats.is_withdrawal_unlocked
                        ? '#10B981'
                        : '#F59E0B',
                    },
                  ]}
                />
              </View>

              <View style={styles.thresholdBottomRow}>
                <Text style={styles.thresholdProgressText}>
                  Earned: {formatCurrency(stats.total_earned || 0)} / ₦1,000 (
                  {progressPercent}%)
                </Text>

                {stats.is_withdrawal_unlocked ? (
                  <TouchableOpacity
                    style={styles.walletShortcutBtn}
                    onPress={() => {
                      haptics.selection();
                      router.push('/(merchant)/more/wallet');
                    }}
                  >
                    <Wallet size={14} color="#047857" strokeWidth={2.2} />
                    <Text style={styles.walletShortcutText}>Open Wallet</Text>
                    <ArrowUpRight size={13} color="#047857" strokeWidth={2.4} />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.thresholdNeededText}>
                    {formatCurrency(
                      stats.needed_for_withdrawal ??
                        Math.max(0, 1000 - (stats.total_earned || 0))
                    )}{' '}
                    left to unlock
                  </Text>
                )}
              </View>
            </LinearGradient>

            {/* Visual Milestone Journey Pipeline */}
            <View style={[styles.card, Shadow.sm as any]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBoxEmerald}>
                  <TrendingUp size={18} color="#059669" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>How Your Earnings Grow</Text>
                  <Text style={styles.cardSub}>
                    Milestone cash rewards for every merchant you introduce
                  </Text>
                </View>
              </View>

              {/* Milestone 1: First Product */}
              <View style={styles.milestoneRow}>
                <View style={styles.milestoneBadgeContainer}>
                  <View style={[styles.milestoneIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Package size={18} color="#059669" strokeWidth={2.2} />
                  </View>
                  <View style={styles.milestoneStepLine} />
                </View>
                <View style={styles.milestoneContentBox}>
                  <View style={styles.milestoneTitleRow}>
                    <Text style={styles.milestoneName}>1st Product Verified</Text>
                    <View style={styles.rewardPillGreen}>
                      <Text style={styles.rewardPillGreenText}>+₦100</Text>
                    </View>
                  </View>
                  <Text style={styles.milestoneDescription}>
                    Rewarded as soon as your invited merchant uploads their first authentic
                    inventory item.
                  </Text>
                </View>
              </View>

              {/* Milestone 2: Pro Upgrade */}
              <View style={styles.milestoneRow}>
                <View style={styles.milestoneBadgeContainer}>
                  <View style={[styles.milestoneIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Zap size={18} color="#D97706" strokeWidth={2.2} />
                  </View>
                  <View style={styles.milestoneStepLine} />
                </View>
                <View style={styles.milestoneContentBox}>
                  <View style={styles.milestoneTitleRow}>
                    <Text style={styles.milestoneName}>Pro Plan Upgrade</Text>
                    <View style={styles.rewardPillAmber}>
                      <Text style={styles.rewardPillAmberText}>+₦400</Text>
                    </View>
                  </View>
                  <Text style={styles.milestoneDescription}>
                    Rewarded when the merchant activates a Pro plan subscription for their
                    business.
                  </Text>
                </View>
              </View>

              {/* Milestone 3: Legend Upgrade */}
              <View style={styles.milestoneRow}>
                <View style={styles.milestoneBadgeContainer}>
                  <View style={[styles.milestoneIconBox, { backgroundColor: '#F3E8FF' }]}>
                    <Award size={18} color="#7C3AED" strokeWidth={2.2} />
                  </View>
                </View>
                <View style={styles.milestoneContentBox}>
                  <View style={styles.milestoneTitleRow}>
                    <Text style={styles.milestoneName}>Legend Plan Upgrade</Text>
                    <View style={styles.rewardPillPurple}>
                      <Text style={styles.rewardPillPurpleText}>+₦500</Text>
                    </View>
                  </View>
                  <Text style={styles.milestoneDescription}>
                    Rewarded when they upgrade to FrontStore Legend for enterprise scaling.
                  </Text>
                </View>
              </View>

              {/* Lifetime Cap Notice Banner */}
              <View style={styles.capNoticeBanner}>
                <Sparkles size={16} color="#0F766E" strokeWidth={2.2} />
                <Text style={styles.capNoticeBannerText}>
                  Earn up to <Text style={{ fontWeight: '800' }}>₦1,000 lifetime</Text> for
                  every merchant you bring to the platform.
                </Text>
              </View>
            </View>

            {/* Quick Metrics 4-Grid */}
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
          </>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2: REFERRED MERCHANTS & EARNINGS HISTORY
        ══════════════════════════════════════════════════ */}
        {activeTab === 'referrals' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  Your Referred Stores ({referrals.length})
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Real-time status of merchants who signed up via your link
                </Text>
              </View>
            </View>

            {referrals.length === 0 ? (
              <View style={[styles.emptyCard, Shadow.sm as any]}>
                <View style={styles.emptyIconCircle}>
                  <Users size={32} color="#94A3B8" strokeWidth={2} />
                </View>
                <Text style={styles.emptyTitle}>No Referrals Yet</Text>
                <Text style={styles.emptyDesc}>
                  Share your link with vendors, creators, and business owners. As soon as
                  they register their store, they will appear here!
                </Text>
                <TouchableOpacity
                  style={styles.emptyShareBtn}
                  onPress={handleShareWhatsApp}
                  activeOpacity={0.88}
                >
                  <WhatsAppIcon size={18} color="#FFFFFF" />
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
                    <View style={styles.merchantStoreIconBox}>
                      <Text style={styles.merchantStoreInitial}>
                        {(item.store_name || item.referee_name || 'S')
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
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

                  <View style={styles.merchantDivider} />

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

            {/* Recent Activity Log */}
            {earningsHistory.length > 0 && (
              <View style={[styles.section, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Earnings History</Text>
                <View style={[styles.card, Shadow.sm as any, { marginTop: 10 }]}>
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
          </View>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 3: PARTNER STATUS & ELIGIBILITY CHECKLIST
        ══════════════════════════════════════════════════ */}
        {activeTab === 'criteria' && (
          <View style={styles.section}>
            {/* Approved State Banner */}
            {isApproved ? (
              <View style={[styles.card, Shadow.sm as any, styles.approvedPartnerCard]}>
                <View style={styles.approvedPartnerIconWrapper}>
                  <CheckCircle2 size={36} color="#059669" strokeWidth={2.5} />
                </View>
                <Text style={styles.approvedPartnerTitle}>
                  You are an Official Referral Partner!
                </Text>
                <Text style={styles.approvedPartnerDesc}>
                  Your store is fully verified. Every merchant who joins via your link
                  earns you cash milestones straight to your wallet.
                </Text>

                <TouchableOpacity
                  style={styles.viewLinkBtn}
                  onPress={() => setActiveTab('overview')}
                  activeOpacity={0.8}
                >
                  <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.viewLinkBtnText}>View Sharing Hub</Text>
                </TouchableOpacity>
              </View>
            ) : isPending ? (
              /* Pending Review State */
              <View style={[styles.card, Shadow.sm as any, styles.pendingCard]}>
                <View style={styles.pendingIconWrapper}>
                  <Clock size={34} color="#D97706" strokeWidth={2.2} />
                </View>

                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>APPLICATION UNDER REVIEW</Text>
                </View>

                <Text style={styles.pendingTitle}>
                  Your Application is Under Review
                </Text>
                <Text style={styles.pendingDesc}>
                  Our merchant partnerships and trust team is checking your product catalog
                  and store authenticity. You will receive an instant push notification
                  once approved!
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
                  <Text style={styles.checkStatusBtnText}>Refresh Status</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Not Approved Yet - Requirements Checklist */
              <>
                <View style={styles.criteriaIntroCard}>
                  <Text style={styles.criteriaIntroTitle}>
                    Unlock Partner Privileges
                  </Text>
                  <Text style={styles.criteriaIntroSub}>
                    To keep the FrontStore community authentic and safe, merchants complete
                    these 4 verification milestones before inviting peers:
                  </Text>
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
                        color={
                          criteria.min_products.fulfilled ? '#10B981' : '#64748B'
                        }
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.min_products.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={14} color="#10B981" strokeWidth={2.4} />
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
                        color={
                          criteria.social_media.fulfilled ? '#10B981' : '#64748B'
                        }
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.social_media.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={14} color="#10B981" strokeWidth={2.4} />
                        <Text style={styles.fulfilledText}>Fulfilled</Text>
                      </View>
                    ) : (
                      <View style={styles.unfulfilledBadge}>
                        <AlertCircle size={14} color="#D97706" strokeWidth={2.2} />
                        <Text style={styles.unfulfilledText}>Add Handle</Text>
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

                {/* Criteria 3: Platform Age */}
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
                        color={
                          criteria.platform_age.fulfilled ? '#10B981' : '#64748B'
                        }
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.platform_age.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={14} color="#10B981" strokeWidth={2.4} />
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
                    Registered {criteria.platform_age.days} days ago. Merchants must be
                    active on FrontStore for at least 7 days before inviting peers.
                  </Text>
                </View>

                {/* Criteria 4: Safety Check */}
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
                        color={
                          criteria.background_check.fulfilled ? '#10B981' : '#64748B'
                        }
                        strokeWidth={2.2}
                      />
                    </View>

                    {criteria.background_check.fulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={14} color="#10B981" strokeWidth={2.4} />
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
                      : 'Our safety team verifies your store credibility automatically upon submission.'}
                  </Text>
                </View>

                {/* Submit Application Card */}
                <View style={[styles.applyCard, Shadow.sm as any]}>
                  <Text style={styles.applyCardTitle}>Ready to Unlock Your Link?</Text>
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
                          Apply for Referral Partner Status
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
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
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconButton: {
    width: 40,
    height: 40,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  heroBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: '#A7F3D0',
  },
  lifetimeCapPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  lifetimeCapText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 11,
    color: '#F0FDFA',
  },
  heroHeading: {
    fontFamily: FontFamily.headingBold,
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubHeading: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: '#CCFBF1',
    marginBottom: 18,
  },
  heroValueBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroValueCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroValueNum: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: '#34D399',
    marginBottom: 2,
  },
  heroValueDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10.5,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  heroValueDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Segmented Bar
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#0F766E',
  },

  // Card Structure
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  cardIconBoxTeal: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxEmerald: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15.5,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePillText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: '#059669',
  },

  // Link Share Container
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  linkUrlText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12.5,
    color: '#0F766E',
    marginBottom: 2,
  },
  linkCodeSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
  },
  miniCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  miniCopyBtnSuccess: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  miniCopyBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#0F766E',
  },
  miniCopyBtnTextSuccess: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Share Action Buttons
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsAppPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  whatsAppPrimaryBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  generalShareSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generalShareSecondaryBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 13,
    color: '#334155',
  },

  // Threshold Card
  thresholdCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  thresholdTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thresholdIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thresholdTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: '#0F172A',
  },
  thresholdSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  progressTrack: {
    height: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
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
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(4, 120, 87, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  walletShortcutText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11.5,
    color: '#047857',
  },

  // Milestones
  milestoneRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  milestoneBadgeContainer: {
    alignItems: 'center',
    width: 38,
  },
  milestoneIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneStepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  milestoneContentBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 12,
  },
  milestoneTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  rewardPillGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  rewardPillGreenText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#059669',
  },
  rewardPillAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  rewardPillAmberText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#D97706',
  },
  rewardPillPurple: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  rewardPillPurpleText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#7C3AED',
  },
  milestoneDescription: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  capNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  capNoticeBannerText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: '#0F766E',
    flex: 1,
    lineHeight: 17,
  },

  // Metrics 4-Grid
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

  // Section
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
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
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Merchant List Cards
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
    alignItems: 'center',
  },
  merchantStoreIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
  },
  merchantStoreInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: '#0F766E',
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
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: '#0F766E',
  },
  merchantDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  merchantMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
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
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  earnedChipText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#047857',
  },

  // Empty Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 28,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 11,
  },
  emptyShareBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Earnings Activity
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

  // Partner Status: Approved Card
  approvedPartnerCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  approvedPartnerIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  approvedPartnerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  approvedPartnerDesc: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  viewLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewLinkBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },

  // Partner Status: Pending Card
  pendingCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  pendingIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  pendingBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10.5,
    color: '#D97706',
    letterSpacing: 0.5,
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
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 11,
  },
  checkStatusBtnText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12.5,
    color: '#0F766E',
  },

  // Criteria Section Cards
  criteriaIntroCard: {
    marginBottom: 14,
  },
  criteriaIntroTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 4,
  },
  criteriaIntroSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
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

  // Apply Action Card
  applyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    padding: 18,
    marginTop: 6,
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
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  applyBtnDisabled: {
    opacity: 0.65,
  },
  applyBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});
