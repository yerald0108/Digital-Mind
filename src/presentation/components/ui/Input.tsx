// src/presentation/components/ui/Input.tsx
import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: IconName;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, icon, containerStyle, ...props }: InputProps) {
  const { C } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: C.bgInput, borderColor: C.border },
          focused && { borderColor: C.borderFocus },
          !!error && { borderColor: C.accentDanger },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={focused ? C.accent : C.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, { color: C.textPrimary }, icon && styles.inputWithIcon]}
          placeholderTextColor={C.textDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={[styles.error, { color: C.accentDanger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 48,
  },
  icon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputWithIcon: {
    paddingLeft: Spacing.sm,
  },
  error: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
});