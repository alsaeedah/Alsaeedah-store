import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/constants/Colors';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  color: string;
  bg: string;
};

type OrderRowProps = {
  id: string;
  customer: string;
  amount: string;
  status: 'pending' | 'completed' | 'cancelled';
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STATS: StatCardProps[] = [
  {
    icon: 'wallet-outline',
    label: 'الإيرادات',
    value: '12,450 ر.س',
    change: '+8.2%',
    positive: true,
    color: palette.navy,
    bg: '#EEF2FF',
  },
  {
    icon: 'bag-handle-outline',
    label: 'الطلبات',
    value: '148',
    change: '+12.5%',
    positive: true,
    color: palette.success,
    bg: palette.successBg,
  },
  {
    icon: 'people-outline',
    label: 'العملاء',
    value: '923',
    change: '+3.1%',
    positive: true,
    color: palette.info,
    bg: palette.infoBg,
  },
  {
    icon: 'cube-outline',
    label: 'المنتجات',
    value: '64',
    change: '-2',
    positive: false,
    color: palette.warning,
    bg: palette.warningBg,
  },
];

const RECENT_ORDERS: OrderRowProps[] = [
  { id: '#1042', customer: 'أحمد المطيري', amount: '320 ر.س', status: 'completed' },
  { id: '#1041', customer: 'فاطمة الزهراني', amount: '185 ر.س', status: 'pending' },
  { id: '#1040', customer: 'محمد العتيبي', amount: '540 ر.س', status: 'completed' },
  { id: '#1039', customer: 'نورة السبيعي', amount: '95 ر.س', status: 'cancelled' },
  { id: '#1038', customer: 'عبدالله الشمري', amount: '760 ر.س', status: 'pending' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: 'قيد الانتظار', color: palette.warning, bg: palette.warningBg },
  completed: { label: 'مكتمل', color: palette.success, bg: palette.successBg },
  cancelled: { label: 'ملغي', color: palette.danger, bg: palette.dangerBg },
};

function StatusBadge({ status }: { status: OrderRowProps['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, change, positive, color, bg }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statChangeRow}>
        <Ionicons
          name={positive ? 'trending-up' : 'trending-down'}
          size={13}
          color={positive ? palette.success : palette.danger}
        />
        <Text style={[styles.statChange, { color: positive ? palette.success : palette.danger }]}>
          {' '}{change}
        </Text>
      </View>
    </View>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────
function OrderRow({ id, customer, amount, status }: OrderRowProps) {
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderLeft}>
        <View style={styles.orderAvatar}>
          <Text style={styles.orderAvatarText}>{customer[0]}</Text>
        </View>
        <View>
          <Text style={styles.orderCustomer}>{customer}</Text>
          <Text style={styles.orderId}>{id}</Text>
        </View>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderAmount}>{amount}</Text>
        <StatusBadge status={status} />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bgScreen} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>مرحباً 👋</Text>
            <Text style={styles.storeName}>متجر السعيدة</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} accessibilityLabel="الإشعارات">
            <Ionicons name="notifications-outline" size={22} color={palette.navy} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Grid ── */}
        <Text style={styles.sectionTitle}>نظرة عامة</Text>
        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow}>
          {[
            { icon: 'add-circle-outline' as const, label: 'منتج جديد', color: palette.navy },
            { icon: 'receipt-outline' as const, label: 'الطلبات', color: palette.success },
            { icon: 'people-outline' as const, label: 'العملاء', color: palette.info },
            { icon: 'stats-chart-outline' as const, label: 'التقارير', color: palette.gold },
            { icon: 'settings-outline' as const, label: 'الإعدادات', color: palette.textSecondary },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionChip} accessibilityLabel={a.label}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Recent Orders ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>آخر الطلبات</Text>
          <TouchableOpacity accessibilityLabel="عرض الكل">
            <Text style={styles.seeAll}>عرض الكل</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {RECENT_ORDERS.map((order, idx) => (
            <View key={order.id}>
              <OrderRow {...order} />
              {idx < RECENT_ORDERS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ── Revenue Banner ── */}
        <View style={styles.revenueBanner}>
          <View>
            <Text style={styles.bannerLabel}>إجمالي الإيرادات هذا الشهر</Text>
            <Text style={styles.bannerValue}>12,450 ريال سعودي</Text>
            <Text style={styles.bannerSub}>↑ 8.2% مقارنة بالشهر الماضي</Text>
          </View>
          <Ionicons name="trending-up" size={40} color={palette.goldLight} />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_W = (width - 48 - 12) / 2;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.bgScreen,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.navy,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: palette.textMuted,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.danger,
    borderWidth: 1.5,
    borderColor: palette.white,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: palette.navy,
    fontWeight: '500',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: CARD_W,
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  statChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Actions
  actionsRow: {
    marginBottom: 24,
  },
  actionChip: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 64,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Orders card
  card: {
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.navy + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.navy,
  },
  orderCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  orderId: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 1,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: palette.borderLight,
    marginHorizontal: 16,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Revenue Banner
  revenueBanner: {
    backgroundColor: palette.navy,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  bannerValue: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: palette.goldLight,
    fontWeight: '500',
  },
});
