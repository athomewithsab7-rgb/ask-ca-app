import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Crown, LogOut, User as UserIcon, Mail, Sparkles, Shield, CheckCircle2, CreditCard } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../src/auth';
import { colors, radii, spacing, fonts, elevation } from '../src/theme';
import PressableScale from '../src/components/PressableScale';
import PaymentSheet from '../src/components/PaymentSheet';

export default function Profile() {
  const router = useRouter();
  const { user, signOut, togglePremium } = useAuth();
  const [payOpen, setPayOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleCancelPremium = async () => {
    try { await togglePremium(); } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <SafeAreaView style={styles.safe} testID="profile-screen" edges={['top']}>
      <View style={styles.headerBar}>
        <PressableScale testID="profile-back" onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </PressableScale>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(380)} style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserIcon size={36} color={colors.brandAction} strokeWidth={2.2} />
          </View>
          <Text style={styles.name} testID="profile-name">{user?.name}</Text>
          <View style={styles.emailRow}>
            <Mail size={12} color={colors.textSecondary} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          {user?.is_premium && (
            <View style={styles.premiumBadge}>
              <Crown size={12} color="#92400E" strokeWidth={2.4} />
              <Text style={styles.premiumBadgeText}>PREMIUM MEMBER</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(380)}>
          <LinearGradient colors={['#0A2540', '#1E293B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumPanel} testID="premium-panel">
            <View style={styles.premiumGlow} />
            <View style={styles.premiumGlow2} />
            <View style={styles.premiumHead}>
              <View style={styles.crownBox}>
                <Crown size={22} color="#FCD34D" strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumPanelTitle}>{user?.is_premium ? 'Premium Active' : 'Ask CA AI Premium'}</Text>
                <Text style={styles.premiumPanelSub}>{user?.is_premium ? 'All features unlocked' : '₹199/month · Cancel anytime'}</Text>
              </View>
            </View>

            <View style={styles.benefitsList}>
              {[
                { icon: Sparkles, text: 'Advanced lessons (TDS, P&L, more)' },
                { icon: Shield, text: 'Unlimited AI chats with CA Sharma' },
                { icon: Crown, text: 'Detailed practice feedback' },
              ].map(({ icon: Icon, text }, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Icon size={14} color="#FCD34D" strokeWidth={2.4} />
                  <Text style={styles.benefitText}>{text}</Text>
                </View>
              ))}
            </View>

            {!user?.is_premium ? (
              <PressableScale testID="pay-now-btn" style={styles.payBtn} onPress={() => setPayOpen(true)}>
                <CreditCard size={16} color="#0A2540" strokeWidth={2.4} />
                <Text style={styles.payBtnText}>  Pay ₹199 · Activate Premium</Text>
              </PressableScale>
            ) : (
              <View style={styles.activeRow}>
                <View style={styles.activeStatus}>
                  <CheckCircle2 size={16} color="#FCD34D" strokeWidth={2.4} />
                  <Text style={styles.activeText}>Subscription active</Text>
                </View>
                <PressableScale testID="cancel-premium-btn" onPress={handleCancelPremium} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </PressableScale>
              </View>
            )}
            <Text style={styles.razorpayText}>Payments powered by Razorpay · Test mode</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).duration(380)}>
          <PressableScale testID="signout-btn" style={styles.signoutBtn} onPress={handleSignOut}>
            <LogOut size={18} color={colors.error} strokeWidth={2.2} />
            <Text style={styles.signoutText}>  Sign Out</Text>
          </PressableScale>
        </Animated.View>

        <Text style={styles.tagline}>Ask CA AI · v1.3{'\n'}Made for Indian commerce learners</Text>
      </ScrollView>

      <PaymentSheet visible={payOpen} onClose={() => setPayOpen(false)} onSuccess={() => setPayOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSecondary },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
  headerTitle: { fontSize: 17, fontFamily: fonts.heading, color: colors.textPrimary },
  container: { padding: spacing.xl, paddingBottom: 60 },
  profileCard: { backgroundColor: '#fff', borderRadius: radii.xxl, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...elevation.card },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.brandActionLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 2, borderColor: colors.brandActionMid },
  name: { fontSize: 22, fontFamily: fonts.displayBold, color: colors.textPrimary, letterSpacing: -0.4 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  email: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.body },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: spacing.md, borderWidth: 1, borderColor: '#FCD34D' },
  premiumBadgeText: { fontSize: 11, fontFamily: fonts.bodySemibold, color: '#92400E', letterSpacing: 1 },
  premiumPanel: { borderRadius: radii.xxl, padding: spacing.xl, marginTop: spacing.xl, overflow: 'hidden' },
  premiumGlow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(252,211,77,0.06)' },
  premiumGlow2: { position: 'absolute', bottom: -80, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(37,99,235,0.06)' },
  premiumHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crownBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(252,211,77,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(252,211,77,0.3)' },
  premiumPanelTitle: { color: '#fff', fontSize: 18, fontFamily: fonts.heading },
  premiumPanelSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2, fontFamily: fonts.body },
  benefitsList: { gap: 10, marginTop: spacing.lg, marginBottom: spacing.lg },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: fonts.body },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCD34D', paddingVertical: 14, borderRadius: radii.md },
  payBtnText: { color: '#0A2540', fontFamily: fonts.semibold, fontSize: 15 },
  activeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  activeStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 14 },
  cancelBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.2)' },
  cancelText: { color: '#FCA5A5', fontSize: 12, fontFamily: fonts.semibold },
  razorpayText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center', marginTop: spacing.md, fontFamily: fonts.body },
  signoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 16, borderRadius: radii.md, marginTop: spacing.xl, borderWidth: 1, borderColor: colors.errorBorder },
  signoutText: { color: colors.error, fontFamily: fonts.semibold, fontSize: 15 },
  tagline: { textAlign: 'center', color: colors.textTertiary, fontSize: 11, marginTop: spacing.xxl, fontFamily: fonts.body, lineHeight: 18 },
});
