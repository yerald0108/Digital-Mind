// src/presentation/components/features/turno/AlertaInventario.tsx
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { useTheme } from '../../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../../constants/theme';

interface AlertaInventarioProps {
  visible: boolean;
  onRevisarInventario: () => void;
  onContinuar: () => void;
}

export function AlertaInventario({
  visible,
  onRevisarInventario,
  onContinuar,
}: AlertaInventarioProps) {
  const { C } = useTheme();

  return (
    <Modal
      visible={visible}
      title="Antes de abrir el turno"
      onClose={onRevisarInventario}
    >
      <View style={styles.iconoContainer}>
        <MaterialCommunityIcons
          name="clipboard-list-outline"
          size={52}
          color={C.accentWarning}
        />
      </View>

      <Text style={[styles.titulo, { color: C.textPrimary }]}>Revisa el inventario</Text>

      <Text style={[styles.descripcion, { color: C.textSecondary }]}>
        Antes de abrir el turno confirma que el inventario esté
        completo y actualizado. La cantidad inicial de cada producto
        se guardará automáticamente al abrir el turno.
      </Text>

      {/* Lista de verificación */}
      <View style={[styles.checklist, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
        {[
          'Todos los productos están registrados',
          'Los precios de venta están actualizados',
          'Las cantidades en existencia son correctas',
          'Los precios de costo están al día',
        ].map((item, i) => (
          <View key={i} style={styles.checkItem}>
            <MaterialCommunityIcons
              name="checkbox-blank-circle-outline"
              size={16}
              color={C.accentWarning}
            />
            <Text style={[styles.checkTexto, { color: C.textSecondary }]}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.aviso, { backgroundColor: `${C.accent}14`, borderColor: `${C.accent}33` }]}>
        <MaterialCommunityIcons
          name="information-outline"
          size={14}
          color={C.accent}
        />
        <Text style={[styles.avisoTexto, { color: C.accent }]}>
          La cantidad actual de cada producto en el inventario se usará como cantidad inicial del turno para calcular las ventas.
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.botones}>
        <Button
          label="Ir al inventario"
          variant="ghost"
          icon="package-variant-closed"
          onPress={onRevisarInventario}
          style={styles.boton}
        />
        <Button
          label="Todo está bien"
          variant="success"
          icon="check"
          onPress={onContinuar}
          style={styles.boton}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iconoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  descripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  checklist: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  avisoTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    flex: 1,
    lineHeight: 16,
  },
  botones: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  boton: { flex: 1 },
});