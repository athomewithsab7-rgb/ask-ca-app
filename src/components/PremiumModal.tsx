import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, X, Sparkles, Infinity as InfinityIcon, BookOpen, Zap } from 'lucide-react-native';
import { colors, radii, spacing, fonts, elevation } from '../theme';
import PressableScale from './PressableScale';

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  reason?: string;
};

export default function PremiumModal({ visible, onClose, onUpgrade, title, reason }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="premium-modal-backdrop">
        <Pressable style={styles.card} onPress={() => {}} testID="premium-modal">
          <LinearGradient colors={['#0A2540', '#1E293B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
            <View style={styles.glow} />
            <View style={styles.glow2} />
            <PressableScale style={styles.closeBtn} onPress={onClose} testID="premium-modal-close">
              <X size={18} color="rgba(255,255,255,0.6)" />
            </PressableScale>

            <View style={styles.iconBox}>
              <Crown size={36} color="#FCD34D" strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>{title || 'Unlock Premium'}</Text>
            {reason && <Text style={styles.reason}>{reason}</Text>}

            <View style={styles.benefits}>
              {[
                { Icon: InfinityIcon, text: 'Unlimited AI chats with CA Sharma' },
                { Icon: BookOpen, text: 'Advanced lessons (TDS, P&L, more)' },
                { Icon: Sparkles, text: 'Detailed practice feedback' },
                { Icon: Zap, text: 'Priority responses, no daily limits' },
              ].map(({ Icon, text }, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={styles.benefitDot}>
                    <Icon size={14} color="#FCD34D" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.benefitText}>{text}</Text>
                </View>
              ))}
            </View>

            <PressableScale testID="premium-modal-upgrade-btn" style={styles.upgradeBtn} onPress={onUpgrade}>
              <Crown size={16} color="#0A2540" strokeWidth={2.4} />
              <Text style={styles.upgradeText}>  Pay ₹199 · Activate Premium</Text>
            </PressableScale>

            <Text style={styles.footnote}>Secured by Razorpay · Test mode</Text>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 20, 40, 0.65)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 380, borderRadius: radii.xxl, overflow: 'hidden', ...elevation.cardHover },
  gradient: { padding: spacing.xl, overflow: 'hidden' },
  glow: { position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(252,211,77,0.1)' },
  glow2: { position: 'absolute', bottom: -100, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(37,99,235,0.1)' },
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  iconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(252,211,77,0.12)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(252,211,77,0.25)' },
  title: { color: '#fff', fontSize: 22, fontFamily: fonts.displayBold, textAlign: 'center', letterSpacing: -0.4 },
  reason: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', marginTop: 8, marginBottom: spacing.lg, fontFamily: fonts.body, lineHeight: 19 },
  benefits: { gap: 12, marginTop: spacing.md, marginBottom: spacing.xl },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitDot: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(252,211,77,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(252,211,77,0.2)' },
  benefitText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: fonts.body, flex: 1 },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCD34D', paddingVertical: 14, borderRadius: radii.md },
  upgradeText: { color: '#0A2540', fontFamily: fonts.semibold, fontSize: 15 },
  footnote: { color: 'rgba(255,255,255,0.45)', fontSize: 11, textAlign: 'center', marginTop: spacing.md, fontFamily: fonts.body },
});
