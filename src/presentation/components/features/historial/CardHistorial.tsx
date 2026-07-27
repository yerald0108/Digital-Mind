// src/presentation/components/features/historial/CardHistorial.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HistorialTurno } from '../../../../domain/entities/HistorialTurno';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda, formatFecha, formatFechaHora, formatDias } from '../../../../utils/formatters';

interface CardHistorialProps {
  registro: HistorialTurno;
  onVer: (registro: HistorialTurno) => void;
  onEliminar: (id: number) => void;
}

export function CardHistorial({ registro, onVer, onEliminar }: CardHistorialProps) {
  const colorEstado =
    registro.estado_cuadre === 'sobrante' ? Colors.accentWarning
    : registro.estado_cuadre === 'faltante' ? Colors.accentDanger
    : registro.estado_cuadre === 'exacto' ? Colors.accentSuccess
    : Colors.textDisabled;

  const iconoEstado =
    registro.estado_cuadre === 'sobrante' ? 'trending-up'
    : registro.estado_cuadre === 'faltante' ? 'trending-down'
    : registro.estado_cuadre === 'exacto' ? 'check-circle-outline'
    : 'help-circle-outline';

  const labelEstado =
    registro.estado_cuadre === 'sobrante' ? 'Sobrante'
    : registro.estado_cuadre === 'faltante' ? 'Faltante'
    : registro.estado_cuadre === 'exacto' ? 'Exacto'
    : 'Sin cuadre';

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar registro',
      '¿Seguro que deseas eliminar este registro del historial? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onEliminar(registro.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onVer(registro)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        {/* Fecha y duración */}
        <View style={styles.headerLeft}>
          <Text style={styles.fecha}>{formatFecha(registro.fecha_apertura)}</Text>
          <View style={styles.duracionBadge}>
            <MaterialCommunityIcons
              name="calendar-range"
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.duracionTexto}>
              {formatDias(registro.dias_duracion)}
            </Text>
          </View>
        </View>

        {/* Estado del cuadre */}
        <View style={[styles.estadoBadge, { borderColor: colorEstado }]}>
          <MaterialCommunityIcons name={iconoEstado} size={14} color={colorEstado} />
          <Text style={[styles.estadoTexto, { color: colorEstado }]}>
            {labelEstado}
          </Text>
        </View>
      </View>

      {/* Datos principales */}
      <View style={styles.datos}>
        <DatoItem
          label="Ventas"
          valor={formatMoneda(registro.total_ventas)}
          icono="cash-register"
          color={Colors.accent}
        />
        <DatoItem
          label="Real en caja"
          valor={formatMoneda(registro.total_efectivo_real)}
          icono="cash"
          color={Colors.accentSuccess}
        />
        <DatoItem
          label="Ganancia neta"
          valor={formatMoneda(registro.ganancia_neta)}
          icono="trending-up"
          color={registro.ganancia_neta >= 0 ? Colors.accentSuccess : Colors.accentDanger}
        />
      </View>

      {/* Diferencia */}
      {registro.estado_cuadre !== 'sin_cuadre' && registro.estado_cuadre !== 'exacto' && (
        <View style={[styles.diferenciaBadge, { backgroundColor: `${colorEstado}15` }]}>
          <Text style={[styles.diferenciaTexto, { color: colorEstado }]}>
            {registro.estado_cuadre === 'sobrante' ? 'Sobran' : 'Faltan'}{' '}
            {formatMoneda(Math.abs(registro.diferencia))}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerFecha}>
          Cerrado: {formatFechaHora(registro.fecha_cierre)}
        </Text>
        <View style={styles.footerAcciones}>
          <TouchableOpacity
            onPress={() => onVer(registro)}
            style={styles.botonVer}
          >
            <MaterialCommunityIcons name="eye-outline" size={16} color={Colors.accent} />
            <Text style={styles.botonVerTexto}>Ver detalle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmarEliminar}
            style={styles.botonEliminar}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color={Colors.accentDanger}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Dato individual ───────────────────────────────────────────
function DatoItem({
  label, valor, icono, color,
}: {
  label: string;
  valor: string;
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}) {
  return (
    <View style={styles.datoItem}>
      <MaterialCommunityIcons name={icono} size={14} color={color} />
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={[styles.datoValor, { color }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: { gap: Spacing.xs },
  fecha: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  duracionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duracionTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  estadoTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
  },
  datos: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  datoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  datoLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  datoValor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  diferenciaBadge: {
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  diferenciaTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerFecha: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    flex: 1,
  },
  footerAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  botonVer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79,142,247,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.2)',
  },
  botonVerTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    color: Colors.accent,
  },
  botonEliminar: {
    padding: Spacing.xs,
  },
});