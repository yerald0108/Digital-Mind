// src/presentation/components/ui/Button.tsx
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { C } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: C.accent },
    secondary: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.border },
    danger: { backgroundColor: C.accentDanger },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.accent },
    success: { backgroundColor: C.accentSuccess },
  };

  const labelStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: C.textOnAccent },
    secondary: { color: C.textPrimary },
    danger: { color: C.textOnAccent },
    ghost: { color: C.accent },
    success: { color: C.textOnAccent },
  };

  const iconColors: Record<ButtonVariant, string> = {
    primary: C.textOnAccent,
    secondary: C.textPrimary,
    danger: C.textOnAccent,
    ghost: C.accent,
    success: C.textOnAccent,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        variantStyles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? C.accent : C.textOnAccent}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons
              name={icon}
              size={iconSizes[size]}
              color={iconColors[variant]}
              style={styles.iconLeft}
            />
          )}
          <Text style={[styles.label, labelStyles[variant], labelSizes[size]]}>
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons
              name={icon}
              size={iconSizes[size]}
              color={iconColors[variant]}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const iconSizes: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

const labelSizes: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: Typography.size.sm },
  md: { fontSize: Typography.size.md },
  lg: { fontSize: Typography.size.lg },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  size_sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    minHeight: 34,
  },
  size_md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
  },
  size_lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: Typography.fontFamilySemiBold,
  },
  iconLeft: {
    marginRight: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.xs,
  },
});
