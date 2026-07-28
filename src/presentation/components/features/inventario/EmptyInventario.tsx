// src/presentation/components/features/inventario/EmptyInventario.tsx
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../ui/Button';
import { useTheme } from '../../../../presentation/hooks/useTheme';
import { Typography, Spacing } from '../../../../constants/theme';

interface EmptyInventarioProps {
  onAgregar: () => void;
}

export function EmptyInventario({ onAgregar }: EmptyInventarioProps) {
  const { C } = useTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="package-variant"
        size={64}
        color={C.textDisabled}
      />
      <Text style={[styles.titulo, { color: C.textPrimary }]}>Sin productos</Text>
      <Text style={[styles.descripcion, { color: C.textSecondary }]}>
        Agrega los productos del negocio con sus precios de costo y venta
        para poder gestionar el inventario y los turnos.
      </Text>
      <Button
        label="Agregar primer producto"
        variant="primary"
        icon="plus"
        onPress={onAgregar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  titulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.6,
  },
});