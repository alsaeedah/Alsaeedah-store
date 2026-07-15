import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/constants/Colors';

// ─── Mock Data ────────────────────────────────────────────────────────────────
type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: 'active' | 'low' | 'out';
};

const PRODUCTS: Product[] = [
  { id: 'P001', name: 'عطر الفاخر', category: 'عطور', price: '250 ر.س', stock: 42, status: 'active' },
  { id: 'P002', name: 'كريم المرطب الفاخر', category: 'عناية', price: '120 ر.س', stock: 8, status: 'low' },
  { id: 'P003', name: 'بخور العود الأصيل', category: 'بخور', price: '180 ر.س', stock: 0, status: 'out' },
  { id: 'P004', name: 'دهن العود السعودي', category: 'عطور', price: '350 ر.س', stock: 25, status: 'active' },
  { id: 'P005', name: 'صابون الغار الطبيعي', category: 'عناية', price: '45 ر.س', stock: 60, status: 'active' },
  { id: 'P006', name: 'زيت الأرغان المغربي', category: 'عناية', price: '95 ر.س', stock: 5, status: 'low' },
  { id: 'P007', name: 'بخور الشجرة النادرة', category: 'بخور', price: '220 ر.س', stock: 18, status: 'active' },
  { id: 'P008', name: 'عطر الياسمين الطبيعي', category: 'عطور', price: '160 ر.س', stock: 0, status: 'out' },
];

const CATEGORIES = ['الكل', 'عطور', 'عناية', 'بخور'];

const STATUS_CFG = {
  active: { label: 'متاح', color: palette.success, bg: palette.successBg },
  low: { label: 'منخفض', color: palette.warning, bg: palette.warningBg },
  out: { label: 'نفد', color: palette.danger, bg: palette.dangerBg },
};

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ item }: { item: Product }) {
  const s = STATUS_CFG[item.status];
  return (
    <View style={styles.productCard}>
      <View style={styles.productIconWrap}>
        <Ionicons name="cube-outline" size={28} color={palette.navy} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCat}>{item.category} • {item.id}</Text>
        <View style={styles.productBottom}>
          <Text style={styles.productPrice}>{item.price}</Text>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.editBtn} accessibilityLabel={`تعديل ${item.name}`}>
        <Ionicons name="create-outline" size={18} color={palette.navy} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = activeCategory === 'الكل' || p.category === activeCategory;
    const matchSearch = p.name.includes(search) || p.id.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bgScreen} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>المنتجات</Text>
        <TouchableOpacity style={styles.addBtn} accessibilityLabel="إضافة منتج">
          <Ionicons name="add" size={22} color={palette.white} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={palette.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="بحث عن منتج..."
          placeholderTextColor={palette.textMuted}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="بحث عن منتج"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="مسح البحث">
            <Ionicons name="close-circle" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => setActiveCategory(cat)}
            accessibilityLabel={`تصفية: ${cat}`}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Count ── */}
      <Text style={styles.countText}>{filtered.length} منتج</Text>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={palette.textMuted} />
            <Text style={styles.emptyText}>لا توجد منتجات</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.navy,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: palette.textPrimary,
    textAlign: 'right',
  },

  catRow: { marginBottom: 8, maxHeight: 48 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  catChipActive: {
    backgroundColor: palette.navy,
    borderColor: palette.navy,
  },
  catText: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  catTextActive: { color: palette.white },

  countText: {
    fontSize: 13,
    color: palette.textMuted,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  productCard: {
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
  productIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: palette.navy + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 3,
  },
  productCat: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: 6,
  },
  productBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.navy,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.navy + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: palette.textMuted,
  },
});
