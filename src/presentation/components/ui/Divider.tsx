// src/presentation/components/ui/Divider.tsx
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../presentation/hooks/useTheme';
import { Spacing } from '../../../constants/theme';

interface DividerProps {
  style?: ViewStyle;
  vertical?: boolean;
}

export function Divider({ style, vertical = false }: DividerProps) {
  const { C } = useTheme();

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: C.divider },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    marginVertical: Spacing.md,
  },
  vertical: {
    width: 1,
    marginHorizontal: Spacing.md,
  },
});