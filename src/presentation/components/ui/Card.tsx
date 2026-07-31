// src/presentation/components/ui/Card.tsx
import { View, StyleSheet, ViewStyle } from 'react-native';
import { getColors, Spacing, Radius, Shadows } from '../../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false }: CardProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  elevated: {
    backgroundColor: Colors.bgElevated,
    ...Shadows.md,
  },
  noPadding: {
    padding: 0,
  },
  });
}
