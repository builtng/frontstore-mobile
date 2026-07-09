import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Share, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  ArrowLeft, Share2, Star, CheckCircle,
  ShoppingBag, MapPin, Clock, Instagram, Globe, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { publicApi } from '@/services/publicApi';
import { PublicProduct, PublicStore, StoreFaq, StoreReview } from '@/types/buyer';
import { useCartStore } from '@/stores/cartStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/components/ui/Toast';

const { width } = Dimensions.get('window');

const formatCurrency = (n: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const PERSONA_LABELS: Record<string, string> = {
  'general-store': 'General Store',
  'retail-groceries': 'Retail & Groceries',
  'fashion-apparel': 'Fashion & Apparel',
  'food-vendor': 'Food Vendor',
  'creator-digital': 'Creator & Digital',
  'faith-community': 'Faith & Community',
  'school-education': 'School & Education',
  'pharmacy-health': 'Pharmacy & Health',
  'beauty-service': 'Beauty Service',
  'barber-shop': 'Barber Shop',
  'home-services': 'Home Services',
  'auto-repair': 'Auto Repair',
  'cleaning-service': 'Cleaning Service',
  'event-services': 'Event Services',
  'tech-store': 'Tech Store',
  'thrift-store': 'Thrift Store',
  'laundry-service': 'Laundry Service',
  'photographer-service': 'Photography',
  'whatsapp-tv': 'WhatsApp TV',
  'estate-agent': 'Estate Agent',
  'fashion-clothing': 'Fashion & Clothing',
  'gadgets-and-repairs': 'Gadgets & Repairs',
  'thrift-preloved': 'Thrift / Pre-loved',
  'restaurant-bars': 'Restaurant & Bars',
};

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function FaqItem({ faq, theme }: { faq: StoreFaq; theme: any }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      style={[styles.faqCard, { backgroundColor: theme.card }]}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: theme.text, flex: 1 }]}>{faq.question}</Text>
        {open ? <ChevronUp size={16} color={theme.textTertiary} /> : <ChevronDown size={16} color={theme.textTertiary} />}
      </View>
      {open && <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.answer}</Text>}
    </TouchableOpacity>
  );
}

function ProductCard({ product, storeUsername, onPress }: { product: PublicProduct; storeUsername: string; onPress: () => void }) {
  const { theme } = useTheme();
  const { addItem } = useCartStore();
  const toast = useToast();
  const haptics = useHaptics();
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];

  const handleAddToCart = () => {
    haptics.success();
    addItem({
      productId: product.id,
      storeUsername,
      storeName: product.store?.name ?? '',
      storeLogo: product.store?.logo_url,
      productName: product.name,
      productSlug: product.slug,
      productImage: primaryImage?.url,
      price: product.price,
      type: product.type,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.card }, Shadow.sm as any]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.productImage}>
        {primaryImage ? (
          <Image source={{ uri: primaryImage.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 28 }}>📦</Text>
          </View>
        )}
        {product.compare_price && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>SALE</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: Colors.primary }]}>{formatCurrency(product.price)}</Text>
          {product.compare_price && (
            <Text style={[styles.comparePrice, { color: theme.textTertiary }]}>{formatCurrency(product.compare_price)}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.primaryDim }]}
          onPress={handleAddToCart}
        >
          <Text style={[styles.addBtnText, { color: Colors.primary }]}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function StoreScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['public-store', username],
    queryFn: () => publicApi.getStore(username),
    select: (r) => r.data,
    enabled: !!username,
  });

  const store: PublicStore | undefined = storeData?.store;
  // Backend returns products as a flat array (not paginated)
  const products: PublicProduct[] = storeData?.products ?? [];
  // Reviews are embedded in the getStore payload — no extra network call needed
  const reviews: StoreReview[] = storeData?.reviews ?? [];
  const faqs: StoreFaq[] = storeData?.faqs ?? [];

  const handleShare = async () => {
    await Share.share({ message: `Shop at ${store?.name} on FrontStore!\nhttps://frontstore.ng/${username}` });
  };

  const handleWhatsApp = () => {
    if (store?.whatsapp_number) {
      const phone = store.whatsapp_number.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${phone}`);
    }
  };

  const handleInstagram = () => {
    if (store?.instagram_handle) {
      Linking.openURL(`https://instagram.com/${store.instagram_handle.replace('@', '')}`);
    }
  };

  const handleTikTok = () => {
    if (store?.tiktok_handle) {
      Linking.openURL(`https://tiktok.com/@${store.tiktok_handle.replace('@', '')}`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.loadingHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.pad}>
          <Skeleton height={200} radius={0} style={{ marginHorizontal: -Spacing[6], marginBottom: Spacing[5] }} />
          <Skeleton height={56} radius={28} width={56} style={{ marginBottom: Spacing[4] }} />
          <Skeleton height={24} width="60%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="80%" style={{ marginBottom: Spacing[5] }} />
          <Skeleton height={180} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!store) return null;

  const personaLabel = store.business_persona ? (PERSONA_LABELS[store.business_persona] ?? store.business_persona) : null;

  // Sort working hours by day order
  const sortedHours = store.working_hours
    ? [...store.working_hours].sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day))
    : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Floating back button */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.navy} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floatingBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]} onPress={handleShare}>
          <Share2 size={18} color={Colors.navy} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          {store.banner_url ? (
            <Image source={{ uri: store.banner_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? Colors.navyLight : Colors.primaryDim }]} />
          )}
        </View>

        <View style={styles.content}>
          {/* Store header */}
          <View style={styles.storeHeader}>
            <View style={styles.logoWrapper}>
              {store.logo_url ? (
                <Image source={{ uri: store.logo_url }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={[styles.logo, { backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 28 }}>🏪</Text>
                </View>
              )}
              {store.is_verified && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={16} color={Colors.white} fill={Colors.info} />
                </View>
              )}
            </View>

            <View style={styles.storeInfo}>
              <Text style={[styles.storeName, { color: theme.text }]}>{store.name}</Text>
              <Text style={[styles.storeUsername, { color: theme.textTertiary }]}>@{store.username}</Text>
              {personaLabel && (
                <View style={[styles.personaTag, { backgroundColor: Colors.primaryDim }]}>
                  <Text style={[styles.personaTagText, { color: Colors.primary }]}>{personaLabel}</Text>
                </View>
              )}
              {store.rating !== undefined && (
                <View style={styles.ratingRow}>
                  <Star size={13} color={Colors.amber} fill={Colors.amber} />
                  <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                    {store.rating.toFixed(1)} · {store.review_count ?? 0} reviews
                  </Text>
                </View>
              )}
            </View>
          </View>

          {store.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>{store.description}</Text>
          )}

          {/* Meta row: location · since */}
          {(store.location || store.since) && (
            <View style={styles.metaRow}>
              {store.location && (
                <View style={styles.metaItem}>
                  <MapPin size={12} color={theme.textTertiary} />
                  <Text style={[styles.metaText, { color: theme.textTertiary }]}>{store.location}</Text>
                </View>
              )}
              {store.since && (
                <View style={styles.metaItem}>
                  <Clock size={12} color={theme.textTertiary} />
                  <Text style={[styles.metaText, { color: theme.textTertiary }]}>Since {store.since}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Shop Now"
              onPress={() => setActiveTab('products')}
              size="md"
              icon={<ShoppingBag size={16} color={Colors.white} />}
              style={styles.shopBtn}
            />
            {store.whatsapp_number && (
              <TouchableOpacity
                style={[styles.waBtn, { backgroundColor: '#25D366' }]}
                onPress={handleWhatsApp}
              >
                <WhatsAppIcon size={18} color={Colors.white} />
                <Text style={styles.waBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
            {(['products', 'about', 'reviews'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && { borderBottomColor: Colors.primary, borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? Colors.primary : theme.textTertiary }, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'products' && products.length > 0 ? ` (${products.length})` : ''}
                  {tab === 'reviews' && reviews.length > 0 ? ` (${reviews.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Products tab ── */}
          {activeTab === 'products' && (
            products.length > 0 ? (
              <View style={styles.productsGrid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeUsername={username}
                    onPress={() => router.push(`/(public)/store/${username}/${product.slug}` as any)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState type="products" title="No products yet" description="This store hasn't added any products yet. Check back soon!" />
            )
          )}

          {/* ── About tab ── */}
          {activeTab === 'about' && (
            <View style={styles.aboutSection}>
              {store.description && (
                <AboutCard label="About" theme={theme}>
                  <Text style={[styles.aboutText, { color: theme.text }]}>{store.description}</Text>
                </AboutCard>
              )}

              {(store.location || store.address) && (
                <AboutCard label="Location" theme={theme}>
                  {store.location && <Text style={[styles.aboutText, { color: theme.text }]}>{store.location}</Text>}
                  {store.address && <Text style={[styles.aboutTextSub, { color: theme.textSecondary }]}>{store.address}</Text>}
                </AboutCard>
              )}

              {sortedHours.length > 0 && (
                <AboutCard label="Opening Hours" theme={theme}>
                  {sortedHours.map((h) => (
                    <View key={h.day} style={styles.hoursRow}>
                      <Text style={[styles.hoursDay, { color: theme.textSecondary }]}>{h.day}</Text>
                      <Text style={[styles.hoursTime, { color: h.is_open ? theme.text : theme.textTertiary }]}>
                        {h.is_open ? `${h.open} – ${h.close}` : 'Closed'}
                      </Text>
                    </View>
                  ))}
                </AboutCard>
              )}

              {(store.return_policy || store.delivery_info) && (
                <AboutCard label="Policies" theme={theme}>
                  {store.return_policy && (
                    <>
                      <Text style={[styles.policyLabel, { color: theme.textTertiary }]}>Returns</Text>
                      <Text style={[styles.aboutText, { color: theme.text }]}>{store.return_policy}</Text>
                    </>
                  )}
                  {store.delivery_info && (
                    <>
                      <Text style={[styles.policyLabel, { color: theme.textTertiary, marginTop: Spacing[2] }]}>Delivery</Text>
                      <Text style={[styles.aboutText, { color: theme.text }]}>{store.delivery_info}</Text>
                    </>
                  )}
                </AboutCard>
              )}

              {/* Founder section */}
              {store.founder_name && (
                <AboutCard label="Meet the Founder" theme={theme}>
                  <View style={styles.founderRow}>
                    {store.founder_avatar_url && (
                      <Image source={{ uri: store.founder_avatar_url }} style={styles.founderAvatar} contentFit="cover" />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.founderName, { color: theme.text }]}>{store.founder_name}</Text>
                      {store.founder_role && (
                        <Text style={[styles.founderRole, { color: theme.textTertiary }]}>{store.founder_role}</Text>
                      )}
                    </View>
                  </View>
                  {store.founder_bio && (
                    <Text style={[styles.aboutText, { color: theme.textSecondary, marginTop: Spacing[3] }]}>{store.founder_bio}</Text>
                  )}
                </AboutCard>
              )}

              {/* About facts */}
              {store.about_facts && store.about_facts.length > 0 && (
                <AboutCard label="Quick Facts" theme={theme}>
                  {store.about_facts.map((fact, i) => (
                    <View key={i} style={styles.factRow}>
                      <Text style={[styles.factLabel, { color: theme.textTertiary }]}>{fact.label}</Text>
                      <Text style={[styles.factValue, { color: theme.text }]}>{fact.value}</Text>
                    </View>
                  ))}
                </AboutCard>
              )}

              {/* Social & contact links */}
              {(store.instagram_handle || store.tiktok_handle || store.twitter_handle || store.whatsapp_number) && (
                <AboutCard label="Find Us" theme={theme}>
                  {store.whatsapp_number && (
                    <TouchableOpacity style={styles.socialRow} onPress={handleWhatsApp}>
                      <WhatsAppIcon size={16} color="#25D366" />
                      <Text style={[styles.socialText, { color: Colors.primary }]}>{store.whatsapp_number}</Text>
                    </TouchableOpacity>
                  )}
                  {store.instagram_handle && (
                    <TouchableOpacity style={styles.socialRow} onPress={handleInstagram}>
                      <Instagram size={16} color="#E1306C" />
                      <Text style={[styles.socialText, { color: Colors.primary }]}>@{store.instagram_handle.replace('@', '')}</Text>
                    </TouchableOpacity>
                  )}
                  {store.tiktok_handle && (
                    <TouchableOpacity style={styles.socialRow} onPress={handleTikTok}>
                      <Globe size={16} color={theme.textSecondary} />
                      <Text style={[styles.socialText, { color: Colors.primary }]}>TikTok: @{store.tiktok_handle.replace('@', '')}</Text>
                    </TouchableOpacity>
                  )}
                </AboutCard>
              )}

              <AboutCard label="Store URL" theme={theme}>
                <Text style={[styles.aboutText, { color: Colors.primary }]}>frontstore.ng/{store.username}</Text>
              </AboutCard>

              {/* FAQs */}
              {faqs.length > 0 && (
                <View>
                  <Text style={[styles.sectionHeading, { color: theme.textTertiary }]}>FAQ</Text>
                  {faqs.map((faq) => (
                    <FaqItem key={faq.id} faq={faq} theme={theme} />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Reviews tab ── */}
          {activeTab === 'reviews' && (
            <View style={styles.reviewsSection}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.card }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewCustomer, { color: theme.text }]}>{review.reviewer_name}</Text>
                      <View style={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} color={i < review.rating ? Colors.amber : theme.border} fill={i < review.rating ? Colors.amber : 'none'} />
                        ))}
                      </View>
                    </View>
                    {review.body ? (
                      <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>{review.body}</Text>
                    ) : null}
                    {review.reply && (
                      <View style={[styles.reviewReply, { backgroundColor: Colors.primaryDim }]}>
                        <Text style={[styles.reviewReplyLabel, { color: Colors.primary }]}>Store reply</Text>
                        <Text style={[styles.reviewReplyText, { color: theme.textSecondary }]}>{review.reply}</Text>
                      </View>
                    )}
                    {review.product && (
                      <Text style={[styles.reviewProduct, { color: theme.textTertiary }]}>On: {review.product.name}</Text>
                    )}
                  </View>
                ))
              ) : (
                <EmptyState type="reviews" />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutCard({ label, children, theme }: { label: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={[styles.aboutCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.aboutLabel, { color: theme.textTertiary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingHeader: { paddingHorizontal: Spacing[6], paddingTop: Spacing[5] },
  pad: { paddingHorizontal: Spacing[6] },
  floatingHeader: { position: 'absolute', top: 56, left: Spacing[6], right: Spacing[6], flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  floatingBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  banner: { height: 180, backgroundColor: Colors.gray100 },
  content: { paddingHorizontal: Spacing[6] },

  storeHeader: { flexDirection: 'row', gap: Spacing[4], marginTop: -28, marginBottom: Spacing[4] },
  logoWrapper: { position: 'relative' },
  logo: { width: 72, height: 72, borderRadius: Radius.xl, borderWidth: 3, borderColor: Colors.white },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  storeInfo: { flex: 1, paddingTop: Spacing[5], gap: 3 },
  storeName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  storeUsername: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  personaTag: { alignSelf: 'flex-start', borderRadius: Radius.sm, paddingHorizontal: Spacing[2], paddingVertical: 2, marginTop: 2 },
  personaTagText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  ratingText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },

  description: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24, marginBottom: Spacing[3] },

  metaRow: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[4] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  metaText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  actionRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[5] },
  shopBtn: { flex: 1 },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderRadius: Radius.lg },
  waBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: Spacing[5] },
  tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  tabTextActive: { color: Colors.primary },

  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[4] },
  productCard: { width: (width - Spacing[6] * 2 - Spacing[4]) / 2, borderRadius: Radius.lg, overflow: 'hidden' },
  productImage: { height: 140, position: 'relative' },
  saleBadge: { position: 'absolute', top: Spacing[2], left: Spacing[2], backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingHorizontal: Spacing[2], paddingVertical: 2 },
  saleBadgeText: { fontFamily: FontFamily.headingBold, fontSize: 9, color: Colors.white },
  productInfo: { padding: Spacing[3], gap: Spacing[2] },
  productName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing[2] },
  productPrice: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base },
  comparePrice: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textDecorationLine: 'line-through' },
  addBtn: { paddingVertical: Spacing[2], borderRadius: Radius.sm, alignItems: 'center' },
  addBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },

  aboutSection: { gap: Spacing[3], paddingBottom: Spacing[8] },
  sectionHeading: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing[2], marginBottom: Spacing[2] },
  aboutCard: { borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[2] },
  aboutLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  aboutText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },
  aboutTextSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20 },

  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  hoursDay: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, width: 100 },
  hoursTime: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },

  policyLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.6 },

  founderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  founderAvatar: { width: 48, height: 48, borderRadius: 24 },
  founderName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },
  founderRole: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  factRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  factLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  factValue: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },

  socialRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[2] },
  socialText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },

  faqCard: { borderRadius: Radius.lg, padding: Spacing[4] },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, lineHeight: 20 },
  faqAnswer: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing[2] },

  reviewsSection: { gap: Spacing[3], paddingBottom: Spacing[8] },
  reviewCard: { borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[2] },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewCustomer: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20 },
  reviewReply: { borderRadius: Radius.sm, padding: Spacing[3], gap: 4 },
  reviewReplyLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  reviewReplyText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 18 },
  reviewProduct: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
});
