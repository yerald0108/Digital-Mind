// src/presentation/components/ui/Badge.tsx
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../../constants/theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant].container, style]}>
      <Text style={[styles.label, variantStyles[variant].text]}>{label}</Text>
    </View>
  );
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: any }> = {
  success: {
    container: { backgroundColor: 'rgba(52, 199, 123, 0.15)', borderColor: 'rgba(52, 199, 123, 0.3)' },
    text: { color: Colors.accentSuccess },
  },
  danger: {
    container: { backgroundColor: 'rgba(232, 84, 84, 0.15)', borderColor: 'rgba(232, 84, 84, 0.3)' },
    text: { color: Colors.accentDanger },
  },
  warning: {
    container: { backgroundColor: 'rgba(240, 180, 41, 0.15)', borderColor: 'rgba(240, 180, 41, 0.3)' },
    text: { color: Colors.accentWarning },
  },
  info: {
    container: { backgroundColor: 'rgba(79, 142, 247, 0.15)', borderColor: 'rgba(79, 142, 247, 0.3)' },
    text: { color: Colors.accent },
  },
  neutral: {
    container: { backgroundColor: Colors.bgElevated, borderColor: Colors.border },
    text: { color: Colors.textSecondary },
  },
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    letterSpacing: 0.3,
  },
});