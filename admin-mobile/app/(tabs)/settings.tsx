import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/constants/Colors';

// ─── Types ────────────────────────────────────────────────────────────────────
type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
};

// ─── Row Component ────────────────────────────────────────────────────────────
function SettingRow({ icon, iconColor, iconBg, label, subtitle, onPress, rightElement, danger }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityLabel={label}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ?? (
        onPress ? <Ionicons name="chevron-back" size={16} color={palette.textMuted} /> : null
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const [notifEnabled, setNotifEnabled] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bgScreen} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>م</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>مدير المتجر</Text>
            <Text style={styles.profileRole}>المسؤول الرئيسي</Text>
            <View style={styles.profileBadge}>
              <Ionicons name="shield-checkmark" size={12} color={palette.success} />
              <Text style={styles.profileBadgeText}>محقق</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} accessibilityLabel="تعديل الملف الشخصي">
            <Ionicons name="create-outline" size={18} color={palette.navy} />
          </TouchableOpacity>
        </View>

        {/* ── Store ── */}
        <SectionHeader title="المتجر" />
        <View style={styles.section}>
          <SettingRow
            icon="storefront-outline"
            iconColor={palette.navy}
            iconBg="#EEF2FF"
            label="معلومات المتجر"
            subtitle="اسم المتجر والشعار والعنوان"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="card-outline"
            iconColor={palette.success}
            iconBg={palette.successBg}
            label="طرق الدفع"
            subtitle="إدارة بوابات الدفع"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="car-outline"
            iconColor={palette.info}
            iconBg={palette.infoBg}
            label="خيارات الشحن"
            subtitle="مناطق الشحن والأسعار"
            onPress={() => {}}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionHeader title="الإشعارات" />
        <View style={styles.section}>
          <SettingRow
            icon="notifications-outline"
            iconColor={palette.warning}
            iconBg={palette.warningBg}
            label="إشعارات الطلبات"
            subtitle="تنبيه عند كل طلب جديد"
            rightElement={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: palette.border, true: palette.navy + '80' }}
                thumbColor={notifEnabled ? palette.navy : palette.textMuted}
                accessibilityLabel="تفعيل إشعارات الطلبات"
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="volume-high-outline"
            iconColor={palette.info}
            iconBg={palette.infoBg}
            label="صوت الإشعارات"
            rightElement={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: palette.border, true: palette.navy + '80' }}
                thumbColor={soundEnabled ? palette.navy : palette.textMuted}
                accessibilityLabel="تفعيل صوت الإشعارات"
              />
            }
          />
        </View>

        {/* ── Support ── */}
        <SectionHeader title="الدعم" />
        <View style={styles.section}>
          <SettingRow
            icon="help-circle-outline"
            iconColor={palette.gold}
            iconBg={palette.warningBg}
            label="مركز المساعدة"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbubble-ellipses-outline"
            iconColor={palette.navy}
            iconBg="#EEF2FF"
            label="تواصل مع الدعم"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="star-outline"
            iconColor={palette.gold}
            iconBg={palette.warningBg}
            label="قيّم التطبيق"
            onPress={() => {}}
          />
        </View>

        {/* ── App Info ── */}
        <SectionHeader title="التطبيق" />
        <View style={styles.section}>
          <SettingRow
            icon="information-circle-outline"
            iconColor={palette.textSecondary}
            iconBg={palette.bgScreen}
            label="الإصدار"
            subtitle="1.0.0"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="document-text-outline"
            iconColor={palette.textSecondary}
            iconBg={palette.bgScreen}
            label="سياسة الخصوصية"
            onPress={() => {}}
          />
        </View>

        {/* ── Logout ── */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <SettingRow
            icon="log-out-outline"
            iconColor={palette.danger}
            iconBg={palette.dangerBg}
            label="تسجيل الخروج"
            danger
            onPress={handleLogout}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bgScreen },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.navy,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: { fontSize: 22, fontWeight: '700', color: palette.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: palette.white },
  profileRole: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 6 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileBadgeText: { fontSize: 11, color: palette.successBg, fontWeight: '600' },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  section: {
    backgroundColor: palette.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.textPrimary,
  },
  rowSubtitle: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  dangerText: { color: palette.danger },

  divider: {
    height: 1,
    backgroundColor: palette.borderLight,
    marginHorizontal: 16,
  },
});
