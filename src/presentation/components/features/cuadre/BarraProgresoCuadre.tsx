import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getColors, Radius, Spacing, Typography } from '../../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

type Seccion = 'inventario' | 'transferencias' | 'usd' | 'gastos' | 'caja' | 'resultado';

interface BarraProgresoCuadreProps {
  completadas: number;
  total: number;
  listoParaCalcular: boolean;
  seccionesCompletadas: Record<Seccion, boolean>;
}

// Miniaturas de los 5 pasos (sin "resultado" que es la meta, no un paso)
const PASOS: { id: Seccion; icono: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string }[] = [
  { id: 'inventario',     icono: 'package-variant-closed', label: 'Inv.' },
  { id: 'transferencias', icono: 'bank-transfer',           label: 'Trans.' },
  { id: 'usd',            icono: 'currency-usd',            label: 'USD' },
  { id: 'gastos',         icono: 'minus-circle-outline',    label: 'Gastos' },
  { id: 'caja',           icono: 'cash',                    label: 'Caja' },
];

export function BarraProgresoCuadre({
  completadas,
  total,
  listoParaCalcular,
  seccionesCompletadas,
}: BarraProgresoCuadreProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

  const textoEstado = listoParaCalcular
    ? '¡Listo para calcular!'
    : `${completadas} de ${total} pasos`;

  const colorBarra = listoParaCalcular ? Colors.accentSuccess : Colors.accent;

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.encabezado}>
        <View style={styles.tituloWrapper}>
          <MaterialCommunityIcons
            name={listoParaCalcular ? 'check-circle' : 'progress-check'}
            size={17}
            color={colorBarra}
          />
          <Text style={styles.titulo}>Progreso del cuadre</Text>
        </View>
        <Text style={[styles.contador, listoParaCalcular && { color: Colors.accentSuccess }]}>
          {textoEstado}
        </Text>
      </View>

      {/* Barra de progreso */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Progreso del cuadre"
        accessibilityValue={{ min: 0, max: total, now: completadas, text: textoEstado }}
        style={styles.pista}
      >
        <View
          style={[
            styles.relleno,
            {
              width: `${porcentaje}%`,
              backgroundColor: colorBarra,
            },
          ]}
        />
      </View>

      {/* Indicadores de pasos individuales */}
      <View style={styles.pasosRow}>
        {PASOS.map((paso, idx) => {
          const ok = seccionesCompletadas[paso.id];
          const esObligatorio = paso.id === 'inventario' || paso.id === 'caja';
          return (
            <View key={paso.id} style={styles.pasoItem}>
              {/* Línea conectora (excepto en el primero) */}
              {idx > 0 && (
                <View
                  style={[
                    styles.lineaConectora,
                    { backgroundColor: seccionesCompletadas[PASOS[idx - 1].id] ? colorBarra : Colors.bgElevated },
                  ]}
                />
              )}
              <View
                style={[
                  styles.pasoBurbuja,
                  ok
                    ? { backgroundColor: colorBarra, borderColor: colorBarra }
                    : esObligatorio
                      ? { backgroundColor: Colors.bgElevated, borderColor: Colors.accentDanger }
                      : { backgroundColor: Colors.bgElevated, borderColor: Colors.border },
                ]}
              >
                <MaterialCommunityIcons
                  name={ok ? 'check' : paso.icono}
                  size={10}
                  color={ok ? Colors.bgPrimary : esObligatorio ? Colors.accentDanger : Colors.textDisabled}
                />
              </View>
              <Text style={[styles.pasoLabel, ok && { color: colorBarra }]}>
                {paso.label}
              </Text>
            </View>
          );
        })}
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
    borderRadius: Radius.full,
  },
  // Indicadores de pasos
  pasosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  pasoItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
    position: 'relative',
  },
  lineaConectora: {
    position: 'absolute',
    top: 9,
    right: '50%',
    left: '-50%',
    height: 2,
    zIndex: 0,
  },
  pasoBurbuja: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 1,
  },
  pasoLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 9,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
  });
}