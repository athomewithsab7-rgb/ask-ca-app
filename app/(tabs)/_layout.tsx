import { Tabs } from 'expo-router';
import { Home, MessageCircle, BookOpen, Dumbbell } from 'lucide-react-native';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../../src/theme';

function TabItem({ Icon, label, focused }: { Icon: any; label: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
        <Icon color={focused ? colors.brandAction : colors.textTertiary} size={20} strokeWidth={focused ? 2.4 : 2} />
      </View>
      <Text style={[styles.label, { color: focused ? colors.brandAction : colors.textTertiary, fontFamily: focused ? fonts.semibold : fonts.medium }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 72,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 14,
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <View testID="tab-home"><TabItem Icon={Home} label="Home" focused={focused} /></View> }} />
      <Tabs.Screen name="chat" options={{ tabBarIcon: ({ focused }) => <View testID="tab-chat"><TabItem Icon={MessageCircle} label="Ask CA" focused={focused} /></View> }} />
      <Tabs.Screen name="learn" options={{ tabBarIcon: ({ focused }) => <View testID="tab-learn"><TabItem Icon={BookOpen} label="Learn" focused={focused} /></View> }} />
      <Tabs.Screen name="practice" options={{ tabBarIcon: ({ focused }) => <View testID="tab-practice"><TabItem Icon={Dumbbell} label="Practice" focused={focused} /></View> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', minWidth: 64, gap: 4 },
  iconBox: { width: 40, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBoxActive: { backgroundColor: colors.brandActionLight },
  label: { fontSize: 11 },
});
