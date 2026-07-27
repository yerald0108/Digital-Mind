// src/presentation/components/features/inventario/EmptyInventario.tsx
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../ui/Button';
import { Colors, Typography, Spacing } from '../../../../constants/theme';

interface EmptyInventarioProps {
  onAgregar: () => void;
}

export function EmptyInventario({ onAgregar }: EmptyInventarioProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="package-variant"
        size={64}
        color={Colors.textDisabled}
      />
      <Text style={styles.titulo}>Sin productos</Text>
      <Text style={styles.descripcion}>
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
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.6,
  },
});