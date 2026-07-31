import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getColors, Radius, Spacing, Typography } from '../../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

interface BarraProgresoCuadreProps {
  completadas: number;
  total: number;
}

export function BarraProgresoCuadre({ completadas, total }: BarraProgresoCuadreProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
  const textoEstado = `${completadas} de ${total} secciones con datos`;

  return (
    <View style={styles.container}>
      <View style={styles.encabezado}>
        <View style={styles.tituloWrapper}>
          <MaterialCommunityIcons
            name="progress-check"
            size={17}
            color={Colors.accentSuccess}
          />
          <Text style={styles.titulo}>Progreso del cuadre</Text>
        </View>
        <Text style={styles.contador}>{textoEstado}</Text>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Progreso del cuadre"
        accessibilityValue={{ min: 0, max: total, now: completadas, text: textoEstado }}
        style={styles.pista}
      >
        <View style={[styles.relleno, { width: `${porcentaje}%` }]} />
      </View>
    </View>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  tituloWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titulo: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  contador: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
  },
  pista: {
    height: 5,
    overflow: 'hidden',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
  },
  relleno: {
    height: '100%',
    minWidth: 0,
    backgroundColor: Colors.accentSuccess,
    borderRadius: Radius.full,
  },
  });
}
