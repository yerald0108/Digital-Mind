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
import { Colors, Typography, Spacing, Radius } from '../../../constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: IconName;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, icon, containerStyle, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={focused ? Colors.accent : Colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          placeholderTextColor={Colors.textDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
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
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: Colors.borderFocus,
  },
  inputWrapperError: {
    borderColor: Colors.accentDanger,
  },
  icon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputWithIcon: {
    paddingLeft: Spacing.sm,
  },
  error: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.accentDanger,
    marginTop: Spacing.xs,
  },
});