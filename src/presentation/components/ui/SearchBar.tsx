// src/presentation/components/ui/SearchBar.tsx
import { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from 'src/constants/theme';

// Nota: este componente vive en ui/ pero se importa desde presentation/components/ui
// El path relativo depende de desde dónde se importe

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
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={18}
        color={value ? Colors.accent : Colors.textSecondary}
        style={styles.iconoBuscar}
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
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
          <MaterialCommunityIcons name="close-circle" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  botonLimpiar: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
});