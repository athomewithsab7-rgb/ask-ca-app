import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Platform, Alert } from 'react-native';
import { X, ShieldCheck } from 'lucide-react-native';
import { apiFetch, useAuth } from '../auth';
import { colors, radii, spacing, fonts, elevation } from '../theme';
import PressableScale from './PressableScale';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') { resolve(false); return; }
    // @ts-ignore
    if (typeof window !== 'undefined' && (window as any).Razorpay) { resolve(true); return; }
    // @ts-ignore
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    // @ts-ignore
    document.body.appendChild(s);
  });
}

export default function PaymentSheet({ visible, onClose, onSuccess }: Props) {
  const { token, refreshUser } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'loading' | 'processing' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const orderRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) { setPhase('idle'); setErrorMsg(''); orderRef.current = null; return; }
    (async () => {
      try {
        setPhase('loading');
        // Create order
        const order = await apiFetch('/payments/create-order', { method: 'POST' }, token);
        orderRef.current = order;

        if (Platform.OS === 'web') {
          const ok = await loadRazorpayScript();
          if (!ok) { setPhase('error'); setErrorMsg('Failed to load payment gateway'); return; }
          setPhase('processing');
          // @ts-ignore
          const options: any = {
            key: order.key_id,
            amount: order.amount,
            currency: order.currency,
            order_id: order.order_id,
            name: order.name,
            description: order.description,
            prefill: order.prefill,
            theme: { color: '#2563EB' },
            handler: async (response: any) => {
              try {
                setPhase('verifying');
                await apiFetch('/payments/verify', {
                  method: 'POST',
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                }, token);
                await refreshUser();
                setPhase('success');
                setTimeout(() => { onSuccess(); }, 900);
              } catch (e: any) {
                setPhase('error');
                setErrorMsg(e.message || 'Verification failed');
              }
            },
            modal: {
              ondismiss: () => {
                if (phase === 'processing' || phase === 'loading') {
                  onClose();
                }
              },
            },
          };
          // @ts-ignore
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', (resp: any) => {
            setPhase('error');
            setErrorMsg(resp?.error?.description || 'Payment failed. Please try again.');
          });
          rzp.open();
        } else {
          // Native: defer to WebView modal (we'll dynamically require it to avoid web crash)
          setPhase('processing');
        }
      } catch (e: any) {
        setPhase('error');
        setErrorMsg(e.message || 'Unable to start payment');
      }
    })();
  }, [visible]);

  const handleWebViewMessage = async (raw: string) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'success') {
        setPhase('verifying');
        await apiFetch('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: msg.payload.razorpay_order_id,
            razorpay_payment_id: msg.payload.razorpay_payment_id,
            razorpay_signature: msg.payload.razorpay_signature,
          }),
        }, token);
        await refreshUser();
        setPhase('success');
        setTimeout(() => onSuccess(), 900);
      } else if (msg.type === 'failed') {
        setPhase('error');
        setErrorMsg(msg.payload?.description || 'Payment failed');
      } else if (msg.type === 'dismissed') {
        onClose();
      }
    } catch (e: any) {
      setPhase('error');
      setErrorMsg(e.message || 'Verification failed');
    }
  };

  // Only import WebView on native
  let WebViewComp: any = null;
  if (Platform.OS !== 'web' && visible && orderRef.current) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      WebViewComp = require('react-native-webview').WebView;
    } catch {}
  }

  const bridgeUrl = orderRef.current
    ? `${BACKEND_URL}/api/payments/bridge?order_id=${encodeURIComponent(orderRef.current.order_id)}&key_id=${encodeURIComponent(orderRef.current.key_id)}&amount=${orderRef.current.amount}&name=${encodeURIComponent(orderRef.current.prefill?.name || '')}&email=${encodeURIComponent(orderRef.current.prefill?.email || '')}`
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} testID="payment-sheet">
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Complete Payment</Text>
              <Text style={styles.subtitle}>Ask CA AI Premium · ₹199/month</Text>
            </View>
            <PressableScale style={styles.closeBtn} onPress={onClose} testID="payment-close-btn">
              <X size={18} color={colors.textSecondary} />
            </PressableScale>
          </View>

          {phase === 'loading' && (
            <View style={styles.state}>
              <ActivityIndicator size="large" color={colors.brandAction} />
              <Text style={styles.stateText}>Preparing secure checkout…</Text>
            </View>
          )}

          {phase === 'processing' && Platform.OS === 'web' && (
            <View style={styles.state}>
              <ActivityIndicator size="large" color={colors.brandAction} />
              <Text style={styles.stateText}>Razorpay checkout opened in a popup.{'\n'}Complete payment to activate Premium.</Text>
              <Text style={styles.hint}>Test card: 4111 1111 1111 1111 · CVV 123 · any future date</Text>
            </View>
          )}

          {phase === 'processing' && Platform.OS !== 'web' && WebViewComp && bridgeUrl && (
            <View style={styles.webViewWrap}>
              <WebViewComp
                source={{ uri: bridgeUrl }}
                onMessage={(e: any) => handleWebViewMessage(e.nativeEvent.data)}
                style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
              />
            </View>
          )}

          {phase === 'verifying' && (
            <View style={styles.state}>
              <ActivityIndicator size="large" color={colors.brandAction} />
              <Text style={styles.stateText}>Verifying payment…</Text>
            </View>
          )}

          {phase === 'success' && (
            <View style={styles.state}>
              <View style={styles.successIcon}>
                <ShieldCheck size={36} color={colors.success} strokeWidth={2.4} />
              </View>
              <Text style={[styles.stateText, { color: colors.successDeep, fontFamily: fonts.semibold }]}>Premium activated!</Text>
              <Text style={styles.hint}>Enjoy unlimited chats & advanced lessons 🎉</Text>
            </View>
          )}

          {phase === 'error' && (
            <View style={styles.state}>
              <Text style={[styles.stateText, { color: colors.error, fontFamily: fonts.semibold }]}>Payment failed</Text>
              <Text style={styles.hint}>{errorMsg}</Text>
              <PressableScale testID="payment-retry-btn" style={styles.retryBtn} onPress={() => { setPhase('idle'); setTimeout(() => { /* retrigger */ }, 50); }}>
                <Text style={styles.retryText}>Close</Text>
              </PressableScale>
            </View>
          )}

          <View style={styles.trustRow}>
            <ShieldCheck size={12} color={colors.success} strokeWidth={2.4} />
            <Text style={styles.trustText}>Secured by Razorpay · Test mode</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,40,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: radii.xxl, padding: spacing.xl, ...elevation.cardHover },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.lg },
  title: { fontSize: 18, fontFamily: fonts.heading, color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontFamily: fonts.body },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  state: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 12 },
  stateText: { fontSize: 14, color: colors.textPrimary, textAlign: 'center', fontFamily: fonts.body, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', fontFamily: fonts.body, paddingHorizontal: 10, lineHeight: 18 },
  webViewWrap: { height: 520, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.borderLight },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.successBorder },
  retryBtn: { marginTop: spacing.md, backgroundColor: colors.brandActionLight, paddingVertical: 10, paddingHorizontal: 22, borderRadius: radii.md },
  retryText: { color: colors.brandAction, fontFamily: fonts.semibold, fontSize: 14 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  trustText: { fontSize: 11, color: colors.textTertiary, fontFamily: fonts.medium },
});
