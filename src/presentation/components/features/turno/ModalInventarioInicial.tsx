// src/presentation/components/features/turno/ModalInventarioInicial.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { ItemInventarioTurno } from '../../../../domain/entities/InventarioTurno';
import { TurnoRepository } from '../../../../data/repositories/TurnoRepository';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda, formatFechaHora } from '../../../../utils/formatters';

interface ModalInventarioInicialProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  fechaApertura: string;
}

export function ModalInventarioInicial({
  visible,
  onClose,
  turnoId,
  fechaApertura,
}: ModalInventarioInicialProps) {
  const [items, setItems] = useState<ItemInventarioTurno[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setCargando(true);
    TurnoRepository.getInventario(turnoId, 'inicial')
      .then(setItems)
      .catch((e) => console.error('[ModalInventarioInicial]', e))
      .finally(() => setCargando(false));
  }, [visible, turnoId]);

  // Totales para el resumen
  const totalProductos = items.length;
  const totalUnidades = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <Modal visible={visible} title="Inventario inicial" onClose={onClose} scrollable>
      <Text style={styles.fecha}>
        Apertura: {formatFechaHora(fechaApertura)}
      </Text>

      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.vacio}>
          <MaterialCommunityIcons name="package-variant" size={40} color={Colors.textDisabled} />
          <Text style={styles.vacioTexto}>Sin inventario inicial registrado</Text>
          <Text style={styles.vacioDescripcion}>
            El inventario inicial se guarda automáticamente al abrir el turno con las cantidades actuales de cada producto.
          </Text>
        </View>
      ) : (
        <>
          {/* Resumen rápido */}
          <View style={styles.resumen}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenNumero}>{totalProductos}</Text>
              <Text style={styles.resumenLabel}>Productos</Text>
            </View>
            <View style={styles.resumenSeparador} />
            <View style={styles.resumenItem}>
              <Text style={styles.resumenNumero}>{totalUnidades}</Text>
              <Text style={styles.resumenLabel}>Unidades totales</Text>
            </View>
          </View>

          {/* Cabecera de tabla */}
          <View style={styles.cabecera}>
            <Text style={[styles.cabeceraTexto, { flex: 1 }]}>Producto</Text>
            <Text style={[styles.cabeceraTexto, styles.cabeceraCenter]}>Cant. inicial</Text>
            <Text style={[styles.cabeceraTexto, styles.cabeceraRight]}>Precio venta</Text>
          </View>

          {/* Lista */}
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.fila, index % 2 === 0 && styles.filaAlterna]}
            >
              <View style={styles.filaNumero}>
                <Text style={styles.filaNumeroTexto}>{index + 1}</Text>
              </View>
              <Text style={styles.filaNombre} numberOfLines={1}>
                {item.producto_nombre}
              </Text>
              {/* Cantidad inicial destacada */}
              <View style={styles.cantidadContainer}>
                <Text style={[
                  styles.filaCantidad,
                  item.cantidad === 0 && styles.filaCantidadCero,
                ]}>
                  {item.cantidad}
                </Text>
                <Text style={styles.unidadTexto}>uds</Text>
              </View>
              <Text style={styles.filaPrecioVenta}>
                {formatMoneda(item.precio_venta)}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View style={styles.totalContainer}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.totalTexto}>
              {totalProductos} producto{totalProductos !== 1 ? 's' : ''} · {totalUnidades} unidades en total
            </Text>
          </View>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fecha: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  centrado: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  vacioTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  vacioDescripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  resumen: {
    flexDirection: 'row',
    backgroundColor: 'rgba(79,142,247,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  resumenItem: { alignItems: 'center' },
  resumenNumero: {
    fontFamily: Typography.fontFamilyExtraBold,
    fontSize: Typography.size.xxl,
    color: Colors.accent,
  },
  resumenLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  resumenSeparador: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: Spacing.xs,
  },
  cabeceraTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cabeceraCenter: {
    width: 90,
    textAlign: 'center',
  },
  cabeceraRight: {
    width: 80,
    textAlign: 'right',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.sm,
    gap: Spacing.xs,
  },
  filaAlterna: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  filaNumero: {
    width: 22,
    alignItems: 'center',
  },
  filaNumeroTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
  },
  filaNombre: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  cantidadContainer: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  filaCantidad: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    color: Colors.accentSuccess,
    textAlign: 'center',
  },
  filaCantidadCero: {
    color: Colors.accentDanger,
  },
  unidadTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  filaPrecioVenta: {
    width: 80,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    color: Colors.accent,
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  totalTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
});