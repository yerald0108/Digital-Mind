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
import { Colors, Typography, Spacing, Radius } from '../../../constants/theme';

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
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? Colors.accent : Colors.textOnAccent}
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

const iconColors: Record<ButtonVariant, string> = {
  primary: Colors.textOnAccent,
  secondary: Colors.textPrimary,
  danger: Colors.textOnAccent,
  ghost: Colors.accent,
  success: Colors.textOnAccent,
};

const labelStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: Colors.textOnAccent },
  secondary: { color: Colors.textPrimary },
  danger: { color: Colors.textOnAccent },
  ghost: { color: Colors.accent },
  success: { color: Colors.textOnAccent },
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
  // Variantes
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.accentDanger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  success: {
    backgroundColor: Colors.accentSuccess,
  },
  // Tamaños
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
  // Modificadores
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  // Labels
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