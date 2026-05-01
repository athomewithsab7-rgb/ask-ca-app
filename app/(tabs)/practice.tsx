import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, ChevronRight, CheckCircle2, XCircle, Send, RotateCcw, ArrowLeft, Target, Lightbulb, Building2, Briefcase } from 'lucide-react-native';
import Animated, { FadeInUp, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useAuth, apiFetch } from '../../src/auth';
import { colors, radii, spacing, fonts, elevation } from '../../src/theme';
import PressableScale from '../../src/components/PressableScale';
import MarkdownText from '../../src/components/MarkdownText';

type Problem = { id: string; topic: string; difficulty: string; question: string; is_scenario?: boolean; scenario_title?: string };
type Result = { is_correct: boolean; score: number; feedback: string; correct_answer: string };

const DIFF_COLOR: Record<string, string> = { beginner: '#10B981', intermediate: '#2563EB', advanced: '#7C3AED' };
const DIFF_BG: Record<string, string> = { beginner: '#ECFDF5', intermediate: '#EFF6FF', advanced: '#F5F3FF' };

export default function PracticeTab() {
  const { token } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [active, setActive] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/practice/problems');
      setProblems(r.problems || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startProblem = (p: Problem) => { setActive(p); setAnswer(''); setResult(null); };
  const back = () => { setActive(null); setAnswer(''); setResult(null); };

  const check = async () => {
    if (!active || !answer.trim() || checking) return;
    setChecking(true);
    try {
      const r = await apiFetch('/practice/check', { method: 'POST', body: JSON.stringify({ problem_id: active.id, user_answer: answer }) }, token);
      setResult(r);
    } catch (e: any) {
      setResult({ is_correct: false, score: 0, feedback: `Error: ${e.message}`, correct_answer: '' });
    } finally { setChecking(false); }
  };

  if (loading) {
    return <SafeAreaView style={styles.safe} testID="practice-screen"><View style={styles.center}><ActivityIndicator color={colors.brandAction} /></View></SafeAreaView>;
  }

  if (active) {
    return (
      <SafeAreaView style={styles.safe} testID="practice-active" edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.detailHeader}>
            <PressableScale onPress={back} testID="practice-back" style={styles.backBtn}>
              <ArrowLeft size={20} color={colors.textPrimary} />
            </PressableScale>
            <Text style={styles.detailHeaderTitle}>{active.is_scenario ? 'Real Scenario' : 'Practice'}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.activeContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInUp.duration(400)} style={styles.problemCard}>
              {active.is_scenario && active.scenario_title && (
                <View style={styles.scenarioBanner}>
                  <Briefcase size={14} color="#D97706" strokeWidth={2.4} />
                  <Text style={styles.scenarioBannerText}>{active.scenario_title}</Text>
                </View>
              )}
              <View style={[styles.diffPill, { backgroundColor: DIFF_BG[active.difficulty] }]}>
                <Target size={12} color={DIFF_COLOR[active.difficulty]} strokeWidth={2.4} />
                <Text style={[styles.diffText, { color: DIFF_COLOR[active.difficulty] }]}>{active.topic} · {active.difficulty}</Text>
              </View>
              <Text style={styles.qText} testID="problem-question">{active.question}</Text>
            </Animated.View>

            <Text style={styles.label}>Your Answer</Text>
            <TextInput
              testID="answer-input"
              value={answer}
              onChangeText={setAnswer}
              multiline
              placeholder="Type your solution here in Hinglish or English..."
              placeholderTextColor={colors.textTertiary}
              style={styles.answerInput}
              editable={!checking && !result}
            />

            {!result ? (
              <PressableScale testID="check-answer-btn" style={[styles.primaryBtn, (!answer.trim() || checking) && { opacity: 0.5 }]} onPress={check} disabled={!answer.trim() || checking}>
                {checking ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Send size={16} color="#fff" strokeWidth={2.4} />
                    <Text style={styles.primaryBtnText}>  Check Answer</Text>
                  </>
                )}
              </PressableScale>
            ) : (
              <Animated.View entering={FadeIn.duration(400)} style={[styles.resultCard, result.is_correct ? styles.successBox : styles.errorBox]} testID="result-card">
                <View style={styles.resultHead}>
                  <Animated.View entering={ZoomIn.duration(400)} style={[styles.resultIcon, { backgroundColor: result.is_correct ? colors.successBg : colors.errorBg }]}>
                    {result.is_correct ? <CheckCircle2 size={28} color={colors.success} strokeWidth={2.2} /> : <XCircle size={28} color={colors.error} strokeWidth={2.2} />}
                  </Animated.View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultTitle, { color: result.is_correct ? colors.successDeep : colors.error }]}>
                      {result.is_correct ? 'Bilkul Sahi!' : 'Almost there!'}
                    </Text>
                    <Text style={styles.resultScore}>Score: <Text style={{ fontFamily: fonts.displayBold, color: colors.textPrimary }}>{result.score}</Text>/100</Text>
                  </View>
                </View>

                <View style={styles.scoreBarTrack}>
                  <Animated.View entering={FadeIn.delay(200)} style={[styles.scoreBarFill, { width: `${result.score}%`, backgroundColor: result.is_correct ? colors.success : colors.error }]} />
                </View>

                <View style={styles.feedbackBlock}>
                  <View style={styles.feedbackHead}>
                    <Lightbulb size={14} color={colors.brandAction} strokeWidth={2.4} />
                    <Text style={styles.feedbackLabel}>Feedback</Text>
                  </View>
                  <View style={styles.feedbackBody}>
                    <MarkdownText content={result.feedback} />
                  </View>
                </View>

                {!!result.correct_answer && (
                  <View style={styles.feedbackBlock}>
                    <View style={styles.feedbackHead}>
                      <CheckCircle2 size={14} color={colors.success} strokeWidth={2.4} />
                      <Text style={styles.feedbackLabel}>Correct Answer</Text>
                    </View>
                    <View style={[styles.feedbackBody, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
                      <MarkdownText content={result.correct_answer} />
                    </View>
                  </View>
                )}

                <PressableScale testID="try-again-btn" style={styles.secondaryBtn} onPress={() => { setAnswer(''); setResult(null); }}>
                  <RotateCcw size={14} color={colors.brandAction} strokeWidth={2.4} />
                  <Text style={styles.secondaryBtnText}>  Try Another</Text>
                </PressableScale>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const scenarios = problems.filter(p => p.is_scenario);
  const drills = problems.filter(p => !p.is_scenario);

  return (
    <SafeAreaView style={styles.safe} testID="practice-screen" edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Practice</Text>
            <Text style={styles.subTop}>Real scenarios · AI-checked answers</Text>
          </View>
          <View style={styles.headerIcon}>
            <Dumbbell size={22} color="#D97706" strokeWidth={2.2} />
          </View>
        </View>

        {/* Scenarios section */}
        {scenarios.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionBadge, { backgroundColor: '#FEF3C7' }]}>
                <Briefcase size={14} color="#D97706" strokeWidth={2.4} />
                <Text style={[styles.sectionBadgeText, { color: '#92400E' }]}>Real-Life Scenarios</Text>
              </View>
              <View style={styles.newPill}><Text style={styles.newPillText}>NEW</Text></View>
            </View>
            <Text style={styles.sectionSub}>Apply accounting to actual business situations</Text>

            {scenarios.map((p, i) => (
              <Animated.View key={p.id} entering={FadeInUp.delay(80 + i * 50).duration(380)}>
                <PressableScale style={styles.scenarioRow} onPress={() => startProblem(p)} testID={`problem-${p.id}`} scaleTo={0.98}>
                  <View style={[styles.scenarioIcon, { backgroundColor: DIFF_BG[p.difficulty] }]}>
                    <Building2 size={22} color={DIFF_COLOR[p.difficulty]} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scenarioTitle} numberOfLines={1}>{p.scenario_title || p.topic}</Text>
                    <Text style={styles.scenarioDesc} numberOfLines={2}>{p.question}</Text>
                    <View style={[styles.probMetaPill, { backgroundColor: DIFF_BG[p.difficulty] }]}>
                      <Text style={[styles.probMetaText, { color: DIFF_COLOR[p.difficulty] }]}>{p.topic} · {p.difficulty}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Quick drills */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionBadge, { backgroundColor: colors.brandActionLight }]}>
              <Target size={14} color={colors.brandAction} strokeWidth={2.4} />
              <Text style={[styles.sectionBadgeText, { color: colors.brandAction }]}>Quick Drills</Text>
            </View>
          </View>
          <Text style={styles.sectionSub}>Short problems for quick practice</Text>

          {drills.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInUp.delay(120 + i * 40).duration(380)}>
              <PressableScale style={styles.probRow} onPress={() => startProblem(p)} testID={`problem-${p.id}`} scaleTo={0.98}>
                <View style={[styles.probIcon, { backgroundColor: DIFF_BG[p.difficulty] }]}>
                  <Target size={20} color={DIFF_COLOR[p.difficulty]} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.probTitle} numberOfLines={2}>{p.question}</Text>
                  <View style={[styles.probMetaPill, { backgroundColor: DIFF_BG[p.difficulty] }]}>
                    <Text style={[styles.probMetaText, { color: DIFF_COLOR[p.difficulty] }]}>{p.topic} · {p.difficulty}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </PressableScale>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.xl, paddingBottom: 60 },
  activeContainer: { padding: spacing.xl, paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  h1: { fontSize: 30, fontFamily: fonts.displayBold, color: colors.textPrimary, letterSpacing: -0.8 },
  subTop: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontFamily: fonts.body },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: '#fff' },
  detailHeaderTitle: { fontSize: 16, fontFamily: fonts.heading, color: colors.textPrimary },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  sectionBadgeText: { fontSize: 12, fontFamily: fonts.semibold },
  sectionSub: { fontSize: 12, color: colors.textTertiary, marginBottom: spacing.md, fontFamily: fonts.body },
  newPill: { backgroundColor: colors.brandAction, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  newPillText: { color: '#fff', fontSize: 9, fontFamily: fonts.bodySemibold, letterSpacing: 0.8 },
  scenarioRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.md, gap: 14, ...elevation.card },
  scenarioIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scenarioTitle: { fontSize: 15, fontFamily: fonts.semibold, color: colors.textPrimary, marginBottom: 3 },
  scenarioDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, fontFamily: fonts.body, marginBottom: 8 },
  probRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.md, gap: 14, ...elevation.card },
  probIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  probTitle: { fontSize: 14, fontFamily: fonts.semibold, color: colors.textPrimary, lineHeight: 20 },
  probMetaPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 6 },
  probMetaText: { fontSize: 11, fontFamily: fonts.semibold, textTransform: 'capitalize' },
  problemCard: { backgroundColor: '#fff', padding: spacing.xl, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.lg, ...elevation.card },
  scenarioBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: '#FCD34D' },
  scenarioBannerText: { color: '#92400E', fontSize: 12, fontFamily: fonts.semibold },
  diffPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 12 },
  diffText: { fontSize: 11, fontFamily: fonts.semibold, textTransform: 'capitalize' },
  qText: { fontSize: 16, fontFamily: fonts.semibold, color: colors.textPrimary, lineHeight: 25 },
  label: { fontSize: 11, color: colors.textSecondary, marginBottom: 8, fontFamily: fonts.bodySemibold, textTransform: 'uppercase', letterSpacing: 1 },
  answerInput: { backgroundColor: '#fff', borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, padding: spacing.lg, minHeight: 130, textAlignVertical: 'top', color: colors.textPrimary, fontSize: 15, fontFamily: fonts.body },
  primaryBtn: { backgroundColor: colors.brandAction, paddingVertical: 16, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, flexDirection: 'row', ...elevation.brand },
  primaryBtnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 16 },
  resultCard: { borderRadius: radii.xxl, padding: spacing.xl, marginTop: spacing.lg, borderWidth: 1, ...elevation.card },
  successBox: { backgroundColor: '#fff', borderColor: colors.successBorder },
  errorBox: { backgroundColor: '#fff', borderColor: colors.errorBorder },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
  resultIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 19, fontFamily: fonts.displayBold },
  resultScore: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontFamily: fonts.body },
  scoreBarTrack: { height: 6, backgroundColor: colors.bgTertiary, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.lg },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  feedbackBlock: { marginTop: spacing.md },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  feedbackLabel: { fontSize: 11, color: colors.textSecondary, fontFamily: fonts.bodySemibold, textTransform: 'uppercase', letterSpacing: 1 },
  feedbackBody: { backgroundColor: colors.bgSecondary, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderLight },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandActionLight, paddingVertical: 14, borderRadius: radii.md, marginTop: spacing.lg },
  secondaryBtnText: { color: colors.brandAction, fontFamily: fonts.semibold, fontSize: 15 },
});
