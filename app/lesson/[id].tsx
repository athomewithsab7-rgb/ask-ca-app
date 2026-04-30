import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, BookOpen, Lightbulb, ListChecks, Target, Clock } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth, apiFetch } from '../../src/auth';
import { colors, radii, spacing, fonts, elevation } from '../../src/theme';
import PressableScale from '../../src/components/PressableScale';

type Lesson = {
  id: string; title: string; level: string; topic: string; duration: string;
  explanation: string; real_life_example: string; key_points: string[]; practice_questions: string[];
};

const LEVEL_COLOR: Record<string, string> = { beginner: '#10B981', intermediate: '#2563EB', advanced: '#7C3AED' };
const LEVEL_BG: Record<string, string> = { beginner: '#ECFDF5', intermediate: '#EFF6FF', advanced: '#F5F3FF' };

export default function LessonDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [l, p] = await Promise.all([
          apiFetch(`/lessons/${id}`),
          token ? apiFetch('/progress', {}, token) : Promise.resolve({ completed_lessons: [] }),
        ]);
        setLesson(l);
        setCompleted((p.completed_lessons || []).includes(id));
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally { setLoading(false); }
    })();
  }, [id, token]);

  const markComplete = async () => {
    if (!token || completing) return;
    setCompleting(true);
    try {
      await apiFetch('/lessons/complete', { method: 'POST', body: JSON.stringify({ lesson_id: id }) }, token);
      setCompleted(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setCompleting(false); }
  };

  if (loading || !lesson) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={colors.brandAction} /></View></SafeAreaView>;
  }

  const lvColor = LEVEL_COLOR[lesson.level] || colors.brandAction;
  const lvBg = LEVEL_BG[lesson.level] || colors.brandActionLight;

  return (
    <SafeAreaView style={styles.safe} testID="lesson-detail" edges={['top']}>
      <View style={styles.headerBar}>
        <PressableScale testID="lesson-back" onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </PressableScale>
        <View style={[styles.topicTag, { backgroundColor: lvBg }]}>
          <Text style={[styles.topicTagText, { color: lvColor }]}>{lesson.topic}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(50).duration(420)}>
          <View style={styles.metaRow}>
            <View style={[styles.levelChip, { backgroundColor: lvBg }]}>
              <View style={[styles.levelDot, { backgroundColor: lvColor }]} />
              <Text style={[styles.levelText, { color: lvColor }]}>{lesson.level.toUpperCase()}</Text>
            </View>
            <View style={styles.durationRow}>
              <Clock size={12} color={colors.textTertiary} />
              <Text style={styles.duration}>{lesson.duration}</Text>
            </View>
          </View>
          <Text style={styles.title}>{lesson.title}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(420)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.brandActionLight }]}>
              <BookOpen size={16} color={colors.brandAction} strokeWidth={2.4} />
            </View>
            <Text style={styles.sectionTitle}>Simple Explanation</Text>
          </View>
          <Text style={styles.body}>{lesson.explanation}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(420)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FFFBEB' }]}>
              <Lightbulb size={16} color="#D97706" strokeWidth={2.4} />
            </View>
            <Text style={styles.sectionTitle}>Real-life Example</Text>
          </View>
          <View style={styles.exampleBox}>
            <Text style={styles.body}>{lesson.real_life_example}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(240).duration(420)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.successBg }]}>
              <ListChecks size={16} color={colors.success} strokeWidth={2.4} />
            </View>
            <Text style={styles.sectionTitle}>Key Points</Text>
          </View>
          <View style={styles.pointsBox}>
            {lesson.key_points.map((p, i) => (
              <View key={i} style={styles.pointRow}>
                <View style={[styles.bulletNum, { backgroundColor: colors.successBg }]}>
                  <Text style={[styles.bulletNumText, { color: colors.successDeep }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.body, { flex: 1 }]}>{p}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(420)} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Target size={16} color={colors.error} strokeWidth={2.4} />
            </View>
            <Text style={styles.sectionTitle}>Practice Questions</Text>
          </View>
          {lesson.practice_questions.map((q, i) => (
            <View key={i} style={styles.qBox}>
              <View style={styles.qNum}>
                <Text style={styles.qNumText}>Q{i + 1}</Text>
              </View>
              <Text style={[styles.body, { flex: 1 }]}>{q}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(380).duration(420)}>
          <PressableScale
            testID="complete-lesson-btn"
            style={[styles.completeBtn, completed && { backgroundColor: colors.success }]}
            onPress={markComplete}
            disabled={completing || completed}
          >
            {completing ? <ActivityIndicator color="#fff" /> : (
              <>
                <CheckCircle2 size={18} color="#fff" strokeWidth={2.4} />
                <Text style={styles.completeText}>{completed ? '  Lesson Completed' : '  Mark as Complete'}</Text>
              </>
            )}
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
  topicTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  topicTagText: { fontFamily: fonts.semibold, fontSize: 12 },
  container: { padding: spacing.xl, paddingBottom: 60 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  levelChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  levelDot: { width: 7, height: 7, borderRadius: 4 },
  levelText: { fontSize: 10, fontFamily: fonts.bodySemibold, letterSpacing: 0.8 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duration: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.medium },
  title: { fontSize: 28, fontFamily: fonts.displayBold, color: colors.textPrimary, lineHeight: 34, letterSpacing: -0.6 },
  section: { marginTop: spacing.xxl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontFamily: fonts.heading, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary, lineHeight: 24, fontFamily: fonts.body },
  exampleBox: { backgroundColor: '#FFFBEB', padding: spacing.lg, borderRadius: radii.lg, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  pointsBox: { gap: 10 },
  pointRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bulletNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  bulletNumText: { fontSize: 11, fontFamily: fonts.bodySemibold },
  qBox: { flexDirection: 'row', backgroundColor: colors.bgSecondary, padding: spacing.md, borderRadius: radii.md, marginBottom: 8, gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.borderLight },
  qNum: { backgroundColor: colors.brandAction, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  qNumText: { color: '#fff', fontFamily: fonts.bodySemibold, fontSize: 11 },
  completeBtn: { backgroundColor: colors.brandAction, padding: 16, borderRadius: radii.md, marginTop: spacing.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...elevation.brand },
  completeText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 16 },
});
