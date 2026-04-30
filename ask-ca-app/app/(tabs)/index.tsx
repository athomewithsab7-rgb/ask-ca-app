import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, MessageCircle, BookOpen, Dumbbell, ChevronRight, Trophy, Flame, User as UserIcon, Sparkles, Receipt, Percent, Zap, Target } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth, apiFetch } from '../../src/auth';
import { colors, radii, spacing, fonts, elevation } from '../../src/theme';
import PressableScale from '../../src/components/PressableScale';
import { scheduleDailyReminder } from '../../src/notifications';

const BADGE_ICONS: Record<string, any> = {
  Sparkles, BookOpen, Trophy, Flame, Crown, MessageCircle, Receipt, Percent,
};

export default function HomeTab() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const p = await apiFetch('/progress', {}, token);
      setProgress(p);
    } catch {}
  }, [token]);

  useEffect(() => {
    load();
    scheduleDailyReminder();
  }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUser()]);
    setRefreshing(false);
  };

  const completed = progress?.completed_lessons?.length ?? 0;
  const total = progress?.total_lessons ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const accuracy = progress?.practice_attempts > 0 ? Math.round((progress.practice_correct / progress.practice_attempts) * 100) : 0;
  const streak = progress?.streak_days ?? 0;
  const longest = progress?.longest_streak ?? 0;
  const badges = (progress?.badges as any[]) || [];
  const todayChat = progress?.today_chat_count ?? 0;
  const freeLimit = progress?.free_daily_limit ?? 5;
  const isPremium = progress?.is_premium ?? user?.is_premium ?? false;
  const chatsLeft = isPremium ? '∞' : Math.max(0, freeLimit - todayChat);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgSecondary }} testID="home-screen">
      <LinearGradient colors={['#EFF6FF', colors.bgSecondary]} style={styles.headerGradient} pointerEvents="none" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAction} />}>
          <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Namaste 🙏</Text>
              <Text style={styles.userName} testID="home-username" numberOfLines={1}>{user?.name || 'Student'}</Text>
            </View>
            <PressableScale testID="profile-btn" onPress={() => router.push('/profile')} style={styles.avatarBtn}>
              <UserIcon size={20} color={colors.brandAction} />
            </PressableScale>
          </Animated.View>

          {/* Streak card */}
          <Animated.View entering={FadeInDown.delay(80).duration(450)} testID="streak-card">
            <LinearGradient colors={streak > 0 ? ['#F97316', '#EF4444'] : ['#64748B', '#475569']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.streakCard}>
              <View style={styles.streakGlow} />
              <View style={styles.streakIconBox}>
                <Flame size={28} color="#fff" strokeWidth={2.4} fill={streak > 0 ? 'rgba(255,255,255,0.3)' : 'transparent'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={styles.streakNum}>{streak}</Text>
                  <Text style={styles.streakLabel}>day streak</Text>
                </View>
                <Text style={styles.streakSub}>
                  {streak === 0 ? 'Start your streak today!' : streak === 1 ? 'Great start! Keep going.' : `Longest: ${longest} days · Keep it burning!`}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Premium Banner (hidden if premium) */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(140).duration(450)}>
              <PressableScale testID="premium-banner" onPress={() => router.push('/profile')} scaleTo={0.99}>
                <LinearGradient colors={['#0F172A', '#1E293B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumCard}>
                  <View style={styles.premiumGlow} />
                  <View style={styles.premiumIconBg}>
                    <Crown size={22} color="#FCD34D" strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premiumTitle}>Go Premium</Text>
                    <Text style={styles.premiumSub}>{chatsLeft as any} free chats left today · Unlock unlimited</Text>
                  </View>
                  <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </PressableScale>
            </Animated.View>
          )}

          {/* Progress card */}
          <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.progressCard} testID="progress-card">
            <View style={styles.progressHead}>
              <View>
                <Text style={styles.cardTitle}>Your Progress</Text>
                <Text style={styles.cardSub}>Keep going, you got this! 💪</Text>
              </View>
              <View style={styles.pctBadge}>
                <Text style={styles.pctText}>{pct}%</Text>
              </View>
            </View>

            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>Lessons completed</Text>
              <Text style={styles.progressValue}>{completed} of {total}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}><Flame size={16} color="#D97706" strokeWidth={2.4} /></View>
                <Text style={styles.statNum}>{progress?.chat_count ?? 0}</Text>
                <Text style={styles.statLbl}>Chats</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: colors.successBg }]}><Trophy size={16} color={colors.success} strokeWidth={2.4} /></View>
                <Text style={styles.statNum}>{progress?.practice_correct ?? 0}</Text>
                <Text style={styles.statLbl}>Correct</Text>
              </View>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: colors.brandActionLight }]}><Sparkles size={16} color={colors.brandAction} strokeWidth={2.4} /></View>
                <Text style={styles.statNum}>{accuracy}%</Text>
                <Text style={styles.statLbl}>Accuracy</Text>
              </View>
            </View>
          </Animated.View>

          {/* Badges */}
          {badges.length > 0 && (
            <Animated.View entering={FadeInDown.delay(260).duration(450)} style={styles.badgesSection} testID="badges-section">
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Badges Earned</Text>
                <View style={styles.badgeCountPill}>
                  <Text style={styles.badgeCountText}>{badges.length}</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
                {badges.map((b: any, i: number) => {
                  const Icon = BADGE_ICONS[b.icon] || Sparkles;
                  return (
                    <Animated.View key={b.id} entering={FadeInDown.delay(280 + i * 40).duration(400)} style={styles.badgeCard} testID={`badge-${b.id}`}>
                      <View style={[styles.badgeIconBox, { backgroundColor: `${b.color}1A` }]}>
                        <Icon size={20} color={b.color} strokeWidth={2.4} />
                      </View>
                      <Text style={styles.badgeLabel} numberOfLines={2}>{b.label}</Text>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          <Text style={styles.sectionTitle}>Quick actions</Text>

          <Animated.View entering={FadeInDown.delay(320).duration(450)}>
            <PressableScale testID="quick-ask-ca" onPress={() => router.push('/(tabs)/chat')} style={styles.actionRow} scaleTo={0.98}>
              <View style={[styles.actionIcon, { backgroundColor: colors.brandActionLight }]}>
                <MessageCircle color={colors.brandAction} size={22} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Ask CA Sharma</Text>
                <Text style={styles.actionSub}>{isPremium ? 'Unlimited chats' : `${chatsLeft} free chats left today`}</Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </PressableScale>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(380).duration(450)}>
            <PressableScale testID="quick-learn" onPress={() => router.push('/(tabs)/learn')} style={styles.actionRow} scaleTo={0.98}>
              <View style={[styles.actionIcon, { backgroundColor: colors.successBg }]}>
                <BookOpen color={colors.successDeep} size={22} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Continue Learning</Text>
                <Text style={styles.actionSub}>{Math.max(0, total - completed)} lessons baaki hain</Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </PressableScale>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(440).duration(450)}>
            <PressableScale testID="quick-practice" onPress={() => router.push('/(tabs)/practice')} style={styles.actionRow} scaleTo={0.98}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Target color="#D97706" size={22} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Practice Mode</Text>
                <Text style={styles.actionSub}>Real scenarios + quick drills</Text>
              </View>
              <ChevronRight size={18} color={colors.textTertiary} />
            </PressableScale>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  container: { padding: spacing.xl, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  greeting: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.medium },
  userName: { fontSize: 26, fontFamily: fonts.displayBold, color: colors.textPrimary, marginTop: 2, letterSpacing: -0.5 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight, ...elevation.card },
  streakCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radii.xxl, gap: 14, marginBottom: spacing.xl, overflow: 'hidden' },
  streakGlow: { position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.12)' },
  streakIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  streakNum: { fontSize: 32, fontFamily: fonts.displayBold, color: '#fff', letterSpacing: -1 },
  streakLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontFamily: fonts.semibold },
  streakSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontFamily: fonts.body },
  premiumCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radii.xxl, marginBottom: spacing.xl, gap: 14, overflow: 'hidden' },
  premiumGlow: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(252,211,77,0.08)' },
  premiumIconBg: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(252,211,77,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(252,211,77,0.25)' },
  premiumTitle: { color: '#fff', fontFamily: fonts.heading, fontSize: 17 },
  premiumSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2, fontFamily: fonts.body },
  progressCard: { backgroundColor: '#fff', borderRadius: radii.xxl, padding: spacing.xl, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.xl, ...elevation.card },
  progressHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  cardTitle: { fontSize: 17, fontFamily: fonts.heading, color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontFamily: fonts.body },
  pctBadge: { backgroundColor: colors.brandActionLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pctText: { color: colors.brandAction, fontFamily: fonts.semibold, fontSize: 13 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: colors.textSecondary, fontSize: 13, fontFamily: fonts.body },
  progressValue: { color: colors.textPrimary, fontFamily: fonts.semibold, fontSize: 13 },
  barTrack: { height: 8, backgroundColor: colors.bgTertiary, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.brandAction, borderRadius: 4 },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, gap: 10 },
  statBox: { flex: 1, backgroundColor: colors.bgSecondary, padding: spacing.md, borderRadius: radii.lg, alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNum: { fontSize: 18, fontFamily: fonts.displayBold, color: colors.textPrimary },
  statLbl: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontFamily: fonts.medium },
  badgesSection: { marginBottom: spacing.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionTitle: { fontSize: 12, fontFamily: fonts.bodySemibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  badgeCountPill: { backgroundColor: colors.brandActionLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeCountText: { color: colors.brandAction, fontSize: 11, fontFamily: fonts.bodySemibold },
  badgesRow: { gap: 10, paddingVertical: 4 },
  badgeCard: { width: 96, backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...elevation.card },
  badgeIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  badgeLabel: { fontSize: 11, fontFamily: fonts.semibold, color: colors.textPrimary, textAlign: 'center', lineHeight: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.md, gap: 14, ...elevation.card },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontFamily: fonts.semibold, color: colors.textPrimary },
  actionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontFamily: fonts.body },
});
