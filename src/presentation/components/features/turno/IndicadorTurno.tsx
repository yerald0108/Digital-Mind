// src/presentation/components/features/turno/IndicadorTurno.tsx
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Turno } from '../../../../domain/entities/Turno';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatFechaHora, formatDias } from '../../../../utils/formatters';
import { useTheme } from '../../../hooks/useTheme';

interface IndicadorTurnoProps {
  turno: Turno | null;
  onAbrir: () => void;
  onCerrar: () => void;
  onEditarDias: () => void;
  cerrando?: boolean; 
}

export function IndicadorTurno({
  turno,
  onAbrir,
  onCerrar,
  onEditarDias,
  cerrando = false,  // ← VALOR POR DEFECTO
}: IndicadorTurnoProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const estaAbierto = turno?.estado === 'abierto';

  if (!turno || !estaAbierto) {
    // ── Sin turno activo ──────────────────────────────────
    return (
      <View style={styles.container}>
        <View style={styles.estadoRow}>
          <View style={[styles.dot, styles.dotCerrado]} />
          <Text style={styles.estadoLabel}>Sin turno activo</Text>
        </View>
        <Text style={styles.descripcion}>
          Abre un turno para comenzar a registrar movimientos
        </Text>
        <TouchableOpacity
          style={styles.botonAbrir}
          onPress={onAbrir}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="play-circle-outline"
            size={20}
            color={Colors.textOnAccent}
          />
          <Text style={styles.botonAbrirTexto}>Abrir turno</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Turno abierto ─────────────────────────────────────
  return (
    <View style={[styles.container, styles.containerAbierto]}>
      {/* Estado + duración */}
      <View style={styles.headerRow}>
        <View style={styles.estadoRow}>
          <View style={[styles.dot, styles.dotAbierto]} />
          <Text style={[styles.estadoLabel, styles.estadoAbierto]}>
            Turno abierto
          </Text>
        </View>
        {/* Botón editar días */}
        <TouchableOpacity
          style={styles.botonEditar}
          onPress={onEditarDias}
          activeOpacity={0.7}
          disabled={cerrando}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={14}
            color={Colors.accent}
          />
          <Text style={styles.botonEditarTexto}>
            {formatDias(turno.dias_duracion)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fecha apertura */}
      <Text style={styles.fecha}>
        Abierto el {formatFechaHora(turno.fecha_apertura)}
      </Text>

      {/* Botón cerrar turno */}
      <TouchableOpacity
        style={[styles.botonCerrar, cerrando && styles.botonCerrarDeshabilitado]}
        onPress={onCerrar}
        activeOpacity={0.8}
        disabled={cerrando}
      >
        {cerrando ? (
          <ActivityIndicator size="small" color={Colors.accentDanger} />
        ) : (
          <MaterialCommunityIcons
            name="stop-circle-outline"
            size={18}
            color={Colors.accentDanger}
          />
        )}
        <Text style={[styles.botonCerrarTexto, cerrando && styles.botonCerrarTextoDeshabilitado]}>
          {cerrando ? 'Cerrando...' : 'Cerrar turno'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  container: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  containerAbierto: {
    borderColor: 'rgba(52, 199, 123, 0.3)',
    backgroundColor: 'rgba(52, 199, 123, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotAbierto: {
    backgroundColor: Colors.accentSuccess,
  },
  dotCerrado: {
    backgroundColor: Colors.accentDanger,
  },
  estadoLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  estadoAbierto: {
    color: Colors.accentSuccess,
  },
  descripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginVertical: Spacing.sm,
  },
  fecha: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  botonAbrir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSuccess,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  botonAbrirTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textOnAccent,
  },
  botonEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  botonEditarTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
  botonCerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 84, 84, 0.4)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  botonCerrarDeshabilitado: {
    borderColor: 'rgba(232, 84, 84, 0.15)',
    opacity: 0.6,
  },
  botonCerrarTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.accentDanger,
  },
  botonCerrarTextoDeshabilitado: {
    color: Colors.textDisabled,
  },
  });
}
