import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Send, Sparkles, Crown, Zap } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useAuth, apiFetch } from '../../src/auth';
import { colors, radii, spacing, fonts, elevation } from '../../src/theme';
import PressableScale from '../../src/components/PressableScale';
import MarkdownText from '../../src/components/MarkdownText';
import PremiumModal from '../../src/components/PremiumModal';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Journal entry kya hota hai?',
  'GST 18% kaise calculate karte hain?',
  'TDS u/s 194J explain karo',
  'Trial Balance match nahi ho raha?',
];

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.alignStart]}>
      <View style={styles.aiAvatarSmall}>
        <Sparkles size={12} color={colors.brandAction} strokeWidth={2.4} />
      </View>
      <View style={[styles.bubble, styles.aiBubble, { paddingVertical: 14, paddingHorizontal: 16 }]}>
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Animated.View entering={FadeIn} style={[styles.dot]} />
          <Animated.View entering={FadeIn.delay(150)} style={[styles.dot]} />
          <Animated.View entering={FadeIn.delay(300)} style={[styles.dot]} />
        </View>
      </View>
    </View>
  );
}

export default function ChatTab() {
  const { token, user, togglePremium } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [chatsLeft, setChatsLeft] = useState<number | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadLimits = useCallback(async () => {
    if (!token) return;
    try {
      const p = await apiFetch('/progress', {}, token);
      if (p.is_premium) setChatsLeft(null);
      else setChatsLeft(Math.max(0, (p.free_daily_limit ?? 5) - (p.today_chat_count ?? 0)));
    } catch {}
  }, [token]);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "**Namaste! 🙏 Main CA Sharma hoon.**\n\nAccounting ka koi bhi sawaal pucho — Journal entries, GST, TDS, Trial Balance, kuch bhi. Simple Hinglish mein step-by-step samjhaunga!\n\nChalo shuru karte hain. 📚",
    }]);
  }, []);

  useFocusEffect(useCallback(() => { loadLimits(); }, [loadLimits]));

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    // Pre-check limit (soft — server is source of truth)
    if (!user?.is_premium && chatsLeft !== null && chatsLeft <= 0) {
      setShowPremium(true);
      return;
    }

    setInput('');
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: message };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await apiFetch('/chat/send', {
        method: 'POST',
        body: JSON.stringify({ message, session_id: sessionId }),
      }, token);
      setSessionId(res.session_id);
      if (res.chats_remaining !== undefined && res.chats_remaining !== null) {
        setChatsLeft(res.chats_remaining);
      }
      const aiMsg: Msg = { id: res.ai_message_id, role: 'assistant', content: res.reply };
      setMessages((m) => [...m, aiMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e: any) {
      const errMsg = e.message || 'Try again';
      if (errMsg.toLowerCase().includes('daily free limit') || errMsg.toLowerCase().includes('upgrade to premium')) {
        // Remove the optimistic user message so they can retry later
        setMessages((m) => m.filter(mm => mm.id !== userMsg.id));
        setChatsLeft(0);
        setShowPremium(true);
      } else {
        setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'assistant', content: `**Error:** ${errMsg}` }]);
      }
    } finally {
      setSending(false);
    }
  };

  const handleUpgrade = () => {
    setShowPremium(false);
    setTimeout(() => setShowPay(true), 150);
  };

  const handlePaySuccess = async () => {
    setShowPay(false);
    await loadLimits();
    setChatsLeft(null);
  };

  const renderItem = ({ item }: { item: Msg }) => {
    if (item.role === 'user') {
      return (
        <Animated.View entering={FadeInUp.duration(250)} style={[styles.bubbleRow, styles.alignEnd]}>
          <View style={[styles.bubble, styles.userBubble]} testID="msg-user">
            <Text style={styles.userText}>{item.content}</Text>
          </View>
        </Animated.View>
      );
    }
    return (
      <Animated.View entering={FadeInUp.duration(280)} style={[styles.bubbleRow, styles.alignStart]}>
        <View style={styles.aiAvatarSmall}>
          <Sparkles size={12} color={colors.brandAction} strokeWidth={2.4} />
        </View>
        <View style={[styles.bubble, styles.aiBubble]} testID="msg-assistant">
          <MarkdownText content={item.content} />
        </View>
      </Animated.View>
    );
  };

  const isPremium = user?.is_premium;

  return (
    <SafeAreaView style={styles.safe} testID="chat-screen" edges={['top']}>
      <View style={styles.headerBar}>
        <View style={styles.avatar}>
          <Sparkles size={20} color={colors.brandAction} strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>CA Sharma</Text>
            {isPremium && (
              <View style={styles.premiumPill}>
                <Crown size={10} color="#92400E" strokeWidth={2.4} />
                <Text style={styles.premiumPillText}>PREMIUM</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={styles.statusDot} />
            <Text style={styles.subtitle}>Your AI accounting tutor</Text>
          </View>
        </View>
        {!isPremium && chatsLeft !== null && (
          <PressableScale testID="chat-quota-pill" onPress={() => setShowPremium(true)} style={[styles.quotaPill, chatsLeft <= 1 && styles.quotaPillLow]}>
            <Zap size={12} color={chatsLeft <= 1 ? colors.error : colors.brandAction} strokeWidth={2.4} />
            <Text style={[styles.quotaText, chatsLeft <= 1 && { color: colors.error }]}>{chatsLeft}/5</Text>
          </PressableScale>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={sending ? <TypingIndicator /> : null}
        />

        {messages.length <= 1 && (
          <View style={styles.suggestionsWrap}>
            {SUGGESTIONS.map((s, i) => (
              <PressableScale key={i} onPress={() => send(s)} testID={`suggestion-${i}`} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </PressableScale>
            ))}
          </View>
        )}

        {!isPremium && chatsLeft !== null && chatsLeft <= 1 && chatsLeft > 0 && (
          <View style={styles.lowQuotaBanner}>
            <Text style={styles.lowQuotaText}>⚡ {chatsLeft} chat{chatsLeft === 1 ? '' : 's'} left today · </Text>
            <PressableScale onPress={() => setShowPremium(true)} testID="chat-upgrade-inline">
              <Text style={styles.lowQuotaLink}>Upgrade to Premium</Text>
            </PressableScale>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            testID="chat-input"
            style={styles.input}
            placeholder="Apna sawaal type karo..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!sending}
          />
          <PressableScale testID="chat-send-btn" style={[styles.sendBtn, (!input.trim() || sending) && { backgroundColor: colors.textTertiary }]} onPress={() => send()} disabled={!input.trim() || sending}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Send size={18} color="#fff" strokeWidth={2.4} />}
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        onUpgrade={handleUpgrade}
        title="Daily Limit Reached"
        reason={`Free users get ${5} chats per day. Upgrade to Premium for unlimited chats with CA Sharma and advanced lessons.`}
      />

      <PaymentSheet visible={showPay} onClose={() => setShowPay(false)} onSuccess={handlePaySuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 12, backgroundColor: '#fff' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandActionLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.brandActionMid },
  title: { fontSize: 17, fontFamily: fonts.heading, color: colors.textPrimary },
  premiumPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#FCD34D' },
  premiumPillText: { fontSize: 9, fontFamily: fonts.bodySemibold, color: '#92400E', letterSpacing: 0.5 },
  subtitle: { fontSize: 12, color: colors.success, fontFamily: fonts.medium },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  quotaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandActionLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.brandActionMid },
  quotaPillLow: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
  quotaText: { fontSize: 12, fontFamily: fonts.bodySemibold, color: colors.brandAction },
  bubbleRow: { marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  aiAvatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brandActionLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.brandActionMid, marginBottom: 4 },
  alignEnd: { justifyContent: 'flex-end' },
  alignStart: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: radii.xl },
  userBubble: { backgroundColor: colors.brandAction, borderBottomRightRadius: 6 },
  aiBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: colors.borderLight, ...elevation.card },
  userText: { color: '#fff', fontSize: 15, lineHeight: 22, fontFamily: fonts.body },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textTertiary },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: 8, marginBottom: spacing.sm },
  chip: { paddingVertical: 9, paddingHorizontal: 14, backgroundColor: colors.brandActionLight, borderRadius: 999, borderWidth: 1, borderColor: colors.brandActionMid },
  chipText: { color: colors.brandAction, fontSize: 12, fontFamily: fonts.semibold },
  lowQuotaBanner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, paddingHorizontal: spacing.lg, backgroundColor: '#FEF3C7', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FCD34D' },
  lowQuotaText: { color: '#92400E', fontSize: 12, fontFamily: fonts.medium },
  lowQuotaLink: { color: colors.brandAction, fontSize: 12, fontFamily: fonts.semibold, textDecorationLine: 'underline' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, gap: 10, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: '#fff' },
  input: { flex: 1, minHeight: 46, maxHeight: 120, paddingHorizontal: spacing.lg, paddingVertical: 12, backgroundColor: colors.bgSecondary, borderRadius: radii.xl, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, fontFamily: fonts.body },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandAction, alignItems: 'center', justifyContent: 'center', ...elevation.brand },
});
