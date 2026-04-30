import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { BookOpen, ChevronRight, CheckCircle2, Clock, Lock, GraduationCap } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth, apiFetch } from '../../src/auth';
import { colors, radii, spacing, fonts, elevation } from '../../src/theme';
import PressableScale from '../../src/components/PressableScale';

type Lesson = { id: string; title: string; level: string; topic: string; duration: string; order: number };

const LEVEL_LABEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const LEVEL_COLOR: Record<string, string> = { beginner: '#10B981', intermediate: '#2563EB', advanced: '#7C3AED' };
const LEVEL_BG: Record<string, string> = { beginner: '#ECFDF5', intermediate: '#EFF6FF', advanced: '#F5F3FF' };

export default function LearnTab() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [lessonsRes, prog] = await Promise.all([
        apiFetch('/lessons'),
        token ? apiFetch('/progress', {}, token) : Promise.resolve({ completed_lessons: [] }),
      ]);
      setLessons(lessonsRes.lessons || []);
      setCompleted(prog.completed_lessons || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const grouped: Record<string, Lesson[]> = { beginner: [], intermediate: [], advanced: [] };
  lessons.forEach(l => { (grouped[l.level] = grouped[l.level] || []).push(l); });

  if (loading) {
    return <SafeAreaView style={styles.safe} testID="learn-screen"><View style={styles.center}><ActivityIndicator color={colors.brandAction} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} testID="learn-screen" edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAction} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Learn</Text>
            <Text style={styles.subTop}>Step-by-step accounting · in Hinglish</Text>
          </View>
          <View style={styles.headerIcon}>
            <GraduationCap size={22} color={colors.brandAction} strokeWidth={2.2} />
          </View>
        </View>

        {(['beginner', 'intermediate', 'advanced'] as const).map((level, lvIdx) => {
          const levelLessons = grouped[level] || [];
          const levelCompleted = levelLessons.filter(l => completed.includes(l.id)).length;
          const levelPct = levelLessons.length ? Math.round((levelCompleted / levelLessons.length) * 100) : 0;
          return (
            <Animated.View key={level} entering={FadeInUp.delay(100 + lvIdx * 80).duration(420)} style={{ marginTop: spacing.xl }}>
              <View style={styles.levelHead}>
                <View style={[styles.levelBadge, { backgroundColor: LEVEL_BG[level] }]}>
                  <View style={[styles.levelDot, { backgroundColor: LEVEL_COLOR[level] }]} />
                  <Text style={[styles.levelTitle, { color: LEVEL_COLOR[level] }]}>{LEVEL_LABEL[level]}</Text>
                </View>
                <Text style={styles.levelMeta}>{levelCompleted}/{levelLessons.length} · {levelPct}%</Text>
              </View>

              {levelLessons.map((l, i) => {
                const isCompleted = completed.includes(l.id);
                const isLocked = level === 'advanced' && !user?.is_premium;
                return (
                  <Animated.View key={l.id} entering={FadeInUp.delay(150 + i * 50).duration(380)}>
                    <PressableScale
                      testID={`lesson-${l.id}`}
                      onPress={() => {
                        if (isLocked) { router.push('/profile'); return; }
                        router.push({ pathname: '/lesson/[id]', params: { id: l.id } });
                      }}
                      style={[styles.lessonCard, isLocked && { opacity: 0.7 }]}
                      scaleTo={0.98}
                    >
                      <View style={[styles.lessonIcon, { backgroundColor: LEVEL_BG[level] }]}>
                        {isLocked ? <Lock size={20} color={LEVEL_COLOR[level]} strokeWidth={2.2} /> : <BookOpen size={20} color={LEVEL_COLOR[level]} strokeWidth={2.2} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.lessonTitle} numberOfLines={1}>{l.title}</Text>
                          {isCompleted && <CheckCircle2 size={14} color={colors.success} />}
                        </View>
                        <View style={styles.metaRow}>
                          <Text style={[styles.metaTopic, { color: LEVEL_COLOR[level] }]}>{l.topic}</Text>
                          <Text style={styles.dotSep}>·</Text>
                          <Clock size={11} color={colors.textTertiary} />
                          <Text style={styles.metaText}>{l.duration}</Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color={colors.textTertiary} />
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </Animated.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSecondary },
  container: { padding: spacing.xl, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h1: { fontSize: 30, fontFamily: fonts.displayBold, color: colors.textPrimary, letterSpacing: -0.8 },
  subTop: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontFamily: fonts.body },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brandActionLight, alignItems: 'center', justifyContent: 'center' },
  levelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  levelTitle: { fontSize: 13, fontFamily: fonts.semibold },
  levelMeta: { fontSize: 12, color: colors.textTertiary, fontFamily: fonts.medium },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.md, gap: 14, ...elevation.card },
  lessonIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { fontSize: 15, fontFamily: fonts.semibold, color: colors.textPrimary, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  metaTopic: { fontSize: 12, fontFamily: fonts.semibold },
  metaText: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.body },
  dotSep: { color: colors.textTertiary, fontSize: 12 },
});
