// src/presentation/components/ui/SearchBar.tsx
import { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onLimpiar: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onLimpiar,
  placeholder = 'Buscar producto...',
}: SearchBarProps) {
  const { C } = useTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.container, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
      <MaterialCommunityIcons
        name="magnify"
        size={18}
        color={value ? C.accent : C.textSecondary}
        style={styles.iconoBuscar}
      />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: C.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textDisabled}
        returnKeyType="search"
        clearButtonMode="never"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onLimpiar();
            inputRef.current?.focus();
          }}
          style={styles.botonLimpiar}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close-circle" size={16} color={C.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    height: 44,
  },
  iconoBuscar: {
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    paddingVertical: 0,
  },
  botonLimpiar: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
});