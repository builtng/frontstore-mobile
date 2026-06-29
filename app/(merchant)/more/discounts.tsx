import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl, TextInput, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Percent, DollarSign, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

const schema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20).toUpperCase(),
  type: z.enum(['percentage', 'fixed']),
  value: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid value'),
  min_order_amount: z.string().optional(),
  max_uses: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function DiscountsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['discounts'],
    queryFn: merchantApi.getDiscounts,
    select: (r) => r.data ?? [],
  });

  const { mutate: createDiscount, isPending } = useMutation({
    mutationFn: merchantApi.createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount code created!');
      haptics.success();
      setSheetOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create discount'),
  });

  const { mutate: toggleDiscount } = useMutation({
    mutationFn: merchantApi.toggleDiscount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discounts'] }),
    onError: () => toast.error('Failed to update discount'),
  });

  const { mutate: deleteDiscount } = useMutation({
    mutationFn: merchantApi.deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount deleted');
      haptics.success();
    },
    onError: () => toast.error('Failed to delete discount'),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'percentage' },
  });

  const onSubmit = (data: FormData) => {
    createDiscount({
      code: data.code.toUpperCase(),
      type: discountType,
      value: Number(data.value),
      min_order_amount: data.min_order_amount ? Number(data.min_order_amount) : undefined,
      max_uses: data.max_uses ? Number(data.max_uses) : undefined,
    });
  };

  const discounts: any[] = data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Discounts</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.primary }]}
          onPress={() => setSheetOpen(true)}
        >
          <Plus size={20} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : discounts.length ? (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {discounts.map((d: any) => (
            <View key={d.id} style={[styles.card, { backgroundColor: theme.card }, Shadow.sm as any]}>
              <View style={styles.cardTop}>
                <View style={[styles.codeTag, { backgroundColor: Colors.primaryDim }]}>
                  <Tag size={14} color={Colors.primary} />
                  <Text style={[styles.code, { color: Colors.primary }]}>{d.code}</Text>
                </View>
                <Badge
                  label={d.is_active ? 'Active' : 'Inactive'}
                  variant={d.is_active ? 'success' : 'neutral'}
                  size="sm"
                  dot
                />
              </View>

              <View style={styles.cardMid}>
                <View style={[styles.valueBox, { backgroundColor: theme.background }]}>
                  {d.type === 'percentage' ? (
                    <Percent size={16} color={Colors.success} />
                  ) : (
                    <DollarSign size={16} color={Colors.success} />
                  )}
                  <Text style={[styles.value, { color: Colors.success }]}>
                    {d.type === 'percentage' ? `${d.value}% off` : `₦${d.value} off`}
                  </Text>
                </View>

                <View style={styles.metaCol}>
                  {d.min_order_amount > 0 && (
                    <Text style={[styles.meta, { color: theme.textTertiary }]}>
                      Min. order: ₦{d.min_order_amount}
                    </Text>
                  )}
                  {d.max_uses && (
                    <Text style={[styles.meta, { color: theme.textTertiary }]}>
                      {d.uses_count ?? 0}/{d.max_uses} used
                    </Text>
                  )}
                  {d.expires_at && (
                    <Text style={[styles.meta, { color: theme.textTertiary }]}>
                      Expires {format(new Date(d.expires_at), 'MMM d, yyyy')}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.cardActions}>
                <Switch
                  value={d.is_active}
                  onValueChange={() => toggleDiscount(d.id)}
                  trackColor={{ false: theme.border, true: Colors.primaryDim }}
                  thumbColor={d.is_active ? Colors.primary : Colors.gray400}
                />
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: Colors.dangerLight }]}
                  onPress={() => deleteDiscount(d.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <EmptyState
          type="generic"
          title="No discount codes yet"
          description="Create discount codes to reward customers and boost sales."
          actionLabel="Create Code"
          onAction={() => setSheetOpen(true)}
        />
      )}

      {/* Create discount bottom sheet */}
      <BottomSheet isVisible={sheetOpen} onClose={() => setSheetOpen(false)} title="Create Discount Code" snapPoint={0.82} scrollable>
        <View style={styles.form}>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Discount Code"
                placeholder="e.g. SAVE20"
                autoCapitalize="characters"
                value={value?.toUpperCase()}
                onChangeText={(t) => onChange(t.toUpperCase())}
                onBlur={onBlur}
                error={errors.code?.message}
                hint="Customers enter this at checkout"
              />
            )}
          />

          {/* Discount type */}
          <View style={styles.typeSection}>
            <Text style={[styles.typeLabel, { color: theme.textSecondary }]}>Discount Type</Text>
            <View style={styles.typeRow}>
              {[
                { value: 'percentage', label: 'Percentage', Icon: Percent },
                { value: 'fixed', label: 'Fixed Amount', Icon: DollarSign },
              ].map(({ value, label, Icon }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setDiscountType(value as any)}
                  style={[
                    styles.typeChip,
                    { backgroundColor: discountType === value ? Colors.primaryDim : theme.card, borderColor: discountType === value ? Colors.primary : theme.border },
                  ]}
                >
                  <Icon size={16} color={discountType === value ? Colors.primary : theme.textSecondary} strokeWidth={2} />
                  <Text style={[styles.typeChipText, { color: discountType === value ? Colors.primary : theme.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Controller
            control={control}
            name="value"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label={discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount (₦)'}
                placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.value?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="min_order_amount"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Minimum Order Amount (₦)"
                placeholder="e.g. 5000"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                optional
              />
            )}
          />

          <Controller
            control={control}
            name="max_uses"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Maximum Uses"
                placeholder="Leave empty for unlimited"
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                optional
              />
            )}
          />

          <Button
            title="Create Discount Code"
            onPress={handleSubmit(onSubmit)}
            isLoading={isPending}
            size="xl"
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing[6], paddingBottom: 100 },

  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], gap: Spacing[3] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeTag: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.sm },
  code: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base, letterSpacing: 1 },

  cardMid: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[4] },
  valueBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.md },
  value: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  metaCol: { flex: 1, gap: 3 },
  meta: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  form: { gap: Spacing[4], paddingBottom: Spacing[8] },
  typeSection: { gap: Spacing[2] },
  typeLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  typeRow: { flexDirection: 'row', gap: Spacing[3] },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], paddingVertical: Spacing[3], borderRadius: Radius.md, borderWidth: 1.5 },
  typeChipText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
});
