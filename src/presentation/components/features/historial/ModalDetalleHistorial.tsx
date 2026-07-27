// src/presentation/components/features/historial/ModalDetalleHistorial.tsx
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { HistorialTurno } from '../../../../domain/entities/HistorialTurno';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda, formatFechaHora, formatDias } from '../../../../utils/formatters';

interface ModalDetalleHistorialProps {
  visible: boolean;
  onClose: () => void;
  registro: HistorialTurno | null;
}

export function ModalDetalleHistorial({
  visible, onClose, registro,
}: ModalDetalleHistorialProps) {
  if (!registro) return null;

  const colorEstado =
    registro.estado_cuadre === 'sobrante' ? Colors.accentWarning
    : registro.estado_cuadre === 'faltante' ? Colors.accentDanger
    : registro.estado_cuadre === 'exacto' ? Colors.accentSuccess
    : Colors.textDisabled;

  // Parsear el detalle JSON si existe
  let detalle: any = null;
  try {
    if (registro.detalle_json) {
      detalle = JSON.parse(registro.detalle_json);
    }
  } catch { /* sin detalle */ }

  const movimientos = detalle?.datos;

  return (
    <Modal
      visible={visible}
      title="Detalle del turno"
      onClose={onClose}
      scrollable
    >
      {/* ── Info general ── */}
      <View style={styles.infoGeneral}>
        <View style={styles.infoFila}>
          <MaterialCommunityIcons name="calendar-start" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Apertura</Text>
          <Text style={styles.infoValor}>{formatFechaHora(registro.fecha_apertura)}</Text>
        </View>
        <View style={styles.infoFila}>
          <MaterialCommunityIcons name="calendar-end" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Cierre</Text>
          <Text style={styles.infoValor}>{formatFechaHora(registro.fecha_cierre)}</Text>
        </View>
        <View style={styles.infoFila}>
          <MaterialCommunityIcons name="calendar-range" size={16} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Duración</Text>
          <Text style={styles.infoValor}>{formatDias(registro.dias_duracion)}</Text>
        </View>
      </View>

      {/* ── Resumen del cuadre ── */}
      <View style={[styles.seccion, { borderColor: colorEstado }]}>
        <Text style={styles.seccionTitulo}>Resumen del cuadre</Text>

        <FilaDetalle label="Total ventas" valor={registro.total_ventas} color={Colors.accent} />
        {registro.total_transferencias > 0 && (
          <FilaDetalle label="Transferencias" valor={registro.total_transferencias} color={Colors.accent} />
        )}
        {registro.total_usd_cup > 0 && (
          <FilaDetalle label="USD (CUP)" valor={registro.total_usd_cup} color={Colors.accentWarning} />
        )}
        {registro.total_gastos > 0 && (
          <FilaDetalle label="Gastos" valor={registro.total_gastos} color={Colors.accentDanger} negativo />
        )}

        <View style={styles.divisor} />

        <FilaDetalle
          label="Total esperado"
          valor={registro.total_esperado}
          color={Colors.textPrimary}
          destacado
        />
        <FilaDetalle
          label="Efectivo real"
          valor={registro.total_efectivo_real}
          color={Colors.accentSuccess}
          destacado
        />

        {/* Estado del cuadre */}
        <View style={[styles.estadoCuadre, { backgroundColor: `${colorEstado}12`, borderColor: `${colorEstado}35` }]}>
          <Text style={[styles.estadoCuadreLabel, { color: colorEstado }]}>
            {registro.estado_cuadre === 'sobrante' ? `Sobrante de ${formatMoneda(registro.diferencia)}`
            : registro.estado_cuadre === 'faltante' ? `Faltante de ${formatMoneda(Math.abs(registro.diferencia))}`
            : registro.estado_cuadre === 'exacto' ? 'Cuadre exacto'
            : 'Sin cuadre realizado'}
          </Text>
        </View>
      </View>

      {/* ── Salarios y ganancias ── */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Salarios y ganancias</Text>
        <FilaDetalle label="Salario mostrador (1%)" valor={registro.salario_mostrador} color={Colors.accent} />
        <FilaDetalle label="Salario salón (0.5%)" valor={registro.salario_salon} color={Colors.accent} />
        <View style={styles.divisor} />
        <FilaDetalle
          label="Ganancia neta del dueño"
          valor={registro.ganancia_neta}
          color={registro.ganancia_neta >= 0 ? Colors.accentSuccess : Colors.accentDanger}
          destacado
        />
      </View>

      {/* ── Movimientos registrados ── */}
      {movimientos && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Movimientos del turno</Text>

          <MovimientoResumen
            label="Entradas"
            count={movimientos.entradas?.length ?? 0}
            icono="package-down"
            color={Colors.accent}
          />
          <MovimientoResumen
            label="Salidas familiares"
            count={movimientos.salidasFamiliares?.length ?? 0}
            icono="account-arrow-right-outline"
            color={Colors.accentWarning}
          />
          <MovimientoResumen
            label="Cambios de precio"
            count={movimientos.cambiosPrecio?.length ?? 0}
            icono="tag-edit-outline"
            color="#B57BFF"
          />
          <MovimientoResumen
            label="Mermas"
            count={movimientos.mermas?.length ?? 0}
            icono="package-variant-remove"
            color={Colors.accentDanger}
          />
          <MovimientoResumen
            label="Transferencias"
            count={movimientos.transferencias?.length ?? 0}
            icono="bank-transfer"
            color={Colors.accent}
          />
        </View>
      )}

      {/* ── Detalle por producto si existe ── */}
      {detalle?.resultado?.resultados_productos?.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Aporte por producto</Text>
          {detalle.resultado.resultados_productos.map((r: any, i: number) => (
            <View key={i} style={styles.productoFila}>
              <View style={styles.productoInfo}>
                <Text style={styles.productoNombre} numberOfLines={1}>
                  {r.producto_nombre}
                </Text>
                <Text style={styles.productoDetalle}>
                  Vendidas: {r.cantidad_vendida}
                </Text>
              </View>
              <Text style={styles.productoImporte}>
                {formatMoneda(r.dinero_aportado)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Modal>
  );
}

// ── Helpers visuales ──────────────────────────────────────────
function FilaDetalle({
  label, valor, color, negativo, destacado,
}: {
  label: string;
  valor: number;
  color: string;
  negativo?: boolean;
  destacado?: boolean;
}) {
  return (
    <View style={[estilosHelper.fila, destacado && estilosHelper.filaDestacada]}>
      <Text style={[estilosHelper.label, destacado && estilosHelper.labelDestacado]}>
        {label}
      </Text>
      <Text style={[estilosHelper.valor, { color }]}>
        {negativo ? '- ' : ''}{formatMoneda(Math.abs(valor))}
      </Text>
    </View>
  );
}

function MovimientoResumen({
  label, count, icono, color,
}: {
  label: string;
  count: number;
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return (
    <View style={estilosHelper.movFila}>
      <MaterialCommunityIcons name={icono} size={16} color={color} />
      <Text style={estilosHelper.movLabel}>{label}</Text>
      <View style={[estilosHelper.movBadge, { backgroundColor: `${color}15` }]}>
        <Text style={[estilosHelper.movCount, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

const estilosHelper = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  filaDestacada: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    marginVertical: 2,
  },
  label: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  labelDestacado: {
    fontFamily: Typography.fontFamilySemiBold,
    color: Colors.textPrimary,
  },
  valor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  movFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  movLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  movBadge: {
    minWidth: 28,
    height: 22,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  movCount: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xs,
  },
});

const styles = StyleSheet.create({
  infoGeneral: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    width: 70,
  },
  infoValor: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  seccion: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  seccionTitulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  divisor: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  estadoCuadre: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  estadoCuadreLabel: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
  },
  productoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  productoInfo: { flex: 1 },
  productoNombre: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  productoDetalle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productoImporte: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
});