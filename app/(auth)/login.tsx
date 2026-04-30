import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Calculator, Mail, Lock, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../src/auth';
import { colors, spacing, radii, fonts, elevation } from '../../src/theme';
import PressableScale from '../../src/components/PressableScale';

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<'email' | 'pwd' | null>(null);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Missing fields', 'Email aur password dono daalo'); return; }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Login failed', e.message || 'Try again');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe} testID="login-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.brandWrap}>
            <View style={styles.logoCircle}>
              <Calculator color={colors.textInverse} size={34} strokeWidth={2.4} />
            </View>
            <Text style={styles.brand}>Ask CA AI</Text>
            <Text style={styles.tagline}>Accounting made simple, in Hinglish</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.card}>
            <Text style={styles.h2}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to continue learning</Text>

            <View style={[styles.inputWrap, focus === 'email' && styles.inputFocus]}>
              <Mail size={18} color={focus === 'email' ? colors.brandAction : colors.textSecondary} />
              <TextInput
                testID="login-email-input"
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocus('email')}
                onBlur={() => setFocus(null)}
              />
            </View>

            <View style={[styles.inputWrap, focus === 'pwd' && styles.inputFocus]}>
              <Lock size={18} color={focus === 'pwd' ? colors.brandAction : colors.textSecondary} />
              <TextInput
                testID="login-password-input"
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocus('pwd')}
                onBlur={() => setFocus(null)}
              />
            </View>

            <PressableScale testID="login-submit-btn" style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                  <ArrowRight size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </PressableScale>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New here? </Text>
              <Link href="/(auth)/signup" asChild>
                <Text testID="goto-signup-btn" style={styles.linkText}>Create an account</Text>
              </Link>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeIn.delay(400)} style={styles.disclaimer}>
            By signing in, you agree to our Terms & Privacy
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: 'center' },
  brandWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brandAction, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...elevation.brand },
  brand: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.brandDeep, letterSpacing: -0.8 },
  tagline: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  card: { backgroundColor: colors.bgPrimary, borderRadius: radii.xxl, padding: spacing.xl, borderWidth: 1, borderColor: colors.borderLight, ...elevation.card },
  h2: { fontFamily: fonts.heading, fontSize: 24, color: colors.textPrimary },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgSecondary, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  inputFocus: { borderColor: colors.brandAction, backgroundColor: '#fff' },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textPrimary, fontFamily: fonts.body },
  primaryBtn: { backgroundColor: colors.brandAction, paddingVertical: 16, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, flexDirection: 'row', ...elevation.brand },
  primaryBtnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { color: colors.textTertiary, fontSize: 12, fontFamily: fonts.medium },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: colors.textSecondary, fontFamily: fonts.body },
  linkText: { color: colors.brandAction, fontFamily: fonts.semibold },
  disclaimer: { textAlign: 'center', fontSize: 11, color: colors.textTertiary, marginTop: spacing.lg, fontFamily: fonts.body },
});
