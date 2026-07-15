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
type Customer = {
  id: string;
  name: string;
  phone: string;
  orders: number;
  spent: string;
  joined: string;
  vip: boolean;
};

const CUSTOMERS: Customer[] = [
  { id: 'U001', name: 'أحمد المطيري', phone: '05x-xxx-1234', orders: 12, spent: '3,840 ر.س', joined: 'يناير 2024', vip: true },
  { id: 'U002', name: 'فاطمة الزهراني', phone: '05x-xxx-5678', orders: 5, spent: '925 ر.س', joined: 'مارس 2024', vip: false },
  { id: 'U003', name: 'محمد العتيبي', phone: '05x-xxx-9012', orders: 8, spent: '2,160 ر.س', joined: 'فبراير 2024', vip: true },
  { id: 'U004', name: 'نورة السبيعي', phone: '05x-xxx-3456', orders: 2, spent: '380 ر.س', joined: 'أبريل 2024', vip: false },
  { id: 'U005', name: 'عبدالله الشمري', phone: '05x-xxx-7890', orders: 15, spent: '5,200 ر.س', joined: 'ديسمبر 2023', vip: true },
  { id: 'U006', name: 'هيا القحطاني', phone: '05x-xxx-1111', orders: 3, spent: '610 ر.س', joined: 'مايو 2024', vip: false },
  { id: 'U007', name: 'سلمان الدوسري', phone: '05x-xxx-2222', orders: 7, spent: '1,890 ر.س', joined: 'يناير 2024', vip: false },
  { id: 'U008', name: 'ريم الحربي', phone: '05x-xxx-3333', orders: 20, spent: '7,450 ر.س', joined: 'نوفمبر 2023', vip: true },
];

// ─── Customer Card ─────────────────────────────────────────────────────────────
function CustomerCard({ item }: { item: Customer }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      accessibilityLabel={`عميل: ${item.name}`}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, item.vip && styles.avatarVip]}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        {item.vip && (
          <View style={styles.vipBadge}>
            <Ionicons name="star" size={9} color={palette.gold} />
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.customerName}>{item.name}</Text>
          {item.vip && <Text style={styles.vipLabel}>VIP</Text>}
        </View>
        <Text style={styles.phone}>{item.phone}</Text>
        <Text style={styles.meta}>انضم: {item.joined}</Text>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.spent}>{item.spent}</Text>
        <Text style={styles.ordersCount}>{item.orders} طلبات</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function UsersScreen() {
  const [search, setSearch] = useState('');
  const [showVipOnly, setShowVipOnly] = useState(false);

  const filtered = CUSTOMERS.filter((c) => {
    const searchMatch = c.name.includes(search) || c.phone.includes(search);
    const vipMatch = !showVipOnly || c.vip;
    return searchMatch && vipMatch;
  });

  const totalSpent = CUSTOMERS.reduce((sum, c) => {
    const num = parseInt(c.spent.replace(/[^0-9]/g, ''), 10);
    return sum + num;
  }, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bgScreen} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>العملاء</Text>
        <Text style={styles.subtitle}>{CUSTOMERS.length} عميل مسجل</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color={palette.navy} />
          <Text style={styles.statNum}>{CUSTOMERS.length}</Text>
          <Text style={styles.statLabel}>إجمالي</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={20} color={palette.gold} />
          <Text style={styles.statNum}>{CUSTOMERS.filter((c) => c.vip).length}</Text>
          <Text style={styles.statLabel}>VIP</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="wallet" size={20} color={palette.success} />
          <Text style={styles.statNum}>{(totalSpent / 1000).toFixed(1)}k</Text>
          <Text style={styles.statLabel}>إجمالي ر.س</Text>
        </View>
      </View>

      {/* Search & VIP toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={palette.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم..."
            placeholderTextColor={palette.textMuted}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="بحث عن عميل"
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={[styles.vipToggle, showVipOnly && styles.vipToggleActive]}
          onPress={() => setShowVipOnly(!showVipOnly)}
          accessibilityLabel="عرض VIP فقط"
        >
          <Ionicons name="star" size={16} color={showVipOnly ? palette.white : palette.gold} />
          <Text style={[styles.vipToggleText, showVipOnly && styles.vipToggleTextActive]}>VIP</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.countText}>{filtered.length} عميل</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CustomerCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={palette.textMuted} />
            <Text style={styles.emptyText}>لا يوجد عملاء</Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '700', color: palette.navy },
  subtitle: { fontSize: 13, color: palette.textMuted, marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginVertical: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statNum: { fontSize: 18, fontWeight: '700', color: palette.textPrimary },
  statLabel: { fontSize: 11, color: palette.textMuted },

  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 13, color: palette.textPrimary, textAlign: 'right' },

  vipToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.gold,
    backgroundColor: palette.white,
  },
  vipToggleActive: { backgroundColor: palette.gold, borderColor: palette.gold },
  vipToggleText: { fontSize: 13, fontWeight: '600', color: palette.gold },
  vipToggleTextActive: { color: palette.white },

  countText: {
    fontSize: 13,
    color: palette.textMuted,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cardLeft: { marginRight: 12, position: 'relative' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.navy + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarVip: { backgroundColor: palette.gold + '22', borderWidth: 1.5, borderColor: palette.gold },
  avatarText: { fontSize: 18, fontWeight: '700', color: palette.navy },
  vipBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.gold,
  },

  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  customerName: { fontSize: 14, fontWeight: '600', color: palette.textPrimary },
  vipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: palette.gold,
    borderWidth: 1,
    borderColor: palette.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  phone: { fontSize: 12, color: palette.textMuted, marginBottom: 2 },
  meta: { fontSize: 11, color: palette.textMuted },

  cardRight: { alignItems: 'flex-end' },
  spent: { fontSize: 14, fontWeight: '700', color: palette.navy },
  ordersCount: { fontSize: 12, color: palette.textMuted, marginTop: 3 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: palette.textMuted },
});
