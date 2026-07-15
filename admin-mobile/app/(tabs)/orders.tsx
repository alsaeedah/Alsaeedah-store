import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/constants/Colors';

// ─── Mock Data ────────────────────────────────────────────────────────────────
type Order = {
  id: string;
  customer: string;
  items: number;
  amount: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'shipping';
};

const ORDERS: Order[] = [
  { id: '#1042', customer: 'أحمد المطيري', items: 3, amount: '320 ر.س', date: '15 يوليو', status: 'completed' },
  { id: '#1041', customer: 'فاطمة الزهراني', items: 1, amount: '185 ر.س', date: '15 يوليو', status: 'pending' },
  { id: '#1040', customer: 'محمد العتيبي', items: 5, amount: '540 ر.س', date: '14 يوليو', status: 'shipping' },
  { id: '#1039', customer: 'نورة السبيعي', items: 2, amount: '95 ر.س', date: '14 يوليو', status: 'cancelled' },
  { id: '#1038', customer: 'عبدالله الشمري', items: 4, amount: '760 ر.س', date: '13 يوليو', status: 'pending' },
  { id: '#1037', customer: 'هيا القحطاني', items: 1, amount: '250 ر.س', date: '13 يوليو', status: 'completed' },
  { id: '#1036', customer: 'سلمان الدوسري', items: 6, amount: '420 ر.س', date: '12 يوليو', status: 'shipping' },
  { id: '#1035', customer: 'ريم الحربي', items: 2, amount: '130 ر.س', date: '12 يوليو', status: 'completed' },
];

const STATUS_CFG = {
  pending: { label: 'قيد الانتظار', color: palette.warning, bg: palette.warningBg, icon: 'time-outline' as const },
  completed: { label: 'مكتمل', color: palette.success, bg: palette.successBg, icon: 'checkmark-circle-outline' as const },
  cancelled: { label: 'ملغي', color: palette.danger, bg: palette.dangerBg, icon: 'close-circle-outline' as const },
  shipping: { label: 'في الشحن', color: palette.info, bg: palette.infoBg, icon: 'car-outline' as const },
};

const FILTERS = ['الكل', 'قيد الانتظار', 'مكتمل', 'ملغي', 'في الشحن'];
const FILTER_STATUS: Record<string, Order['status'] | null> = {
  'الكل': null,
  'قيد الانتظار': 'pending',
  'مكتمل': 'completed',
  'ملغي': 'cancelled',
  'في الشحن': 'shipping',
};

// ─── Summary Cards ─────────────────────────────────────────────────────────────
function SummaryRow() {
  const counts = ORDERS.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={styles.summaryRow}>
      {([
        { key: 'pending', label: 'انتظار' },
        { key: 'shipping', label: 'شحن' },
        { key: 'completed', label: 'مكتمل' },
        { key: 'cancelled', label: 'ملغي' },
      ] as { key: Order['status']; label: string }[]).map(({ key, label }) => {
        const cfg = STATUS_CFG[key];
        return (
          <View key={key} style={[styles.summaryCard, { borderTopColor: cfg.color }]}>
            <Text style={[styles.summaryNum, { color: cfg.color }]}>{counts[key] || 0}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ item }: { item: Order }) {
  const cfg = STATUS_CFG[item.status];
  return (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.75}
      accessibilityLabel={`طلب ${item.id} من ${item.customer}`}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderIdRow}>
          <Text style={styles.orderId}>{item.id}</Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{item.date}</Text>
      </View>
      <View style={styles.orderMid}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.customer[0]}</Text>
          </View>
          <View>
            <Text style={styles.customerName}>{item.customer}</Text>
            <Text style={styles.orderItems}>{item.items} منتج</Text>
          </View>
        </View>
        <Text style={styles.orderAmount}>{item.amount}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const [filter, setFilter] = useState('الكل');
  const [search, setSearch] = useState('');

  const filtered = ORDERS.filter((o) => {
    const statusMatch = FILTER_STATUS[filter] === null || o.status === FILTER_STATUS[filter];
    const searchMatch = o.customer.includes(search) || o.id.includes(search);
    return statusMatch && searchMatch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bgScreen} />

      <View style={styles.header}>
        <Text style={styles.title}>الطلبات</Text>
        <TouchableOpacity style={styles.filterBtn} accessibilityLabel="فرز الطلبات">
          <Ionicons name="funnel-outline" size={20} color={palette.navy} />
        </TouchableOpacity>
      </View>

      <SummaryRow />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={palette.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="بحث باسم العميل أو رقم الطلب..."
          placeholderTextColor={palette.textMuted}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="بحث في الطلبات"
          returnKeyType="search"
        />
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, filter === item && styles.chipActive]}
            onPress={() => setFilter(item)}
            accessibilityLabel={`تصفية: ${item}`}
          >
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.countText}>{filtered.length} طلب</Text>

      {/* Order list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={palette.textMuted} />
            <Text style={styles.emptyText}>لا توجد طلبات</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bgScreen },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: palette.navy },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryNum: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: palette.textMuted, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 13, color: palette.textPrimary, textAlign: 'right' },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: { backgroundColor: palette.navy, borderColor: palette.navy },
  chipText: { fontSize: 12, color: palette.textSecondary, fontWeight: '500' },
  chipTextActive: { color: palette.white },

  countText: {
    fontSize: 13,
    color: palette.textMuted,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  orderCard: {
    backgroundColor: palette.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderId: { fontSize: 14, fontWeight: '700', color: palette.textPrimary },
  orderDate: { fontSize: 12, color: palette.textMuted },

  orderMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.navy + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: palette.navy },
  customerName: { fontSize: 14, fontWeight: '600', color: palette.textPrimary },
  orderItems: { fontSize: 12, color: palette.textMuted, marginTop: 1 },
  orderAmount: { fontSize: 16, fontWeight: '700', color: palette.navy },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: palette.textMuted },
});
