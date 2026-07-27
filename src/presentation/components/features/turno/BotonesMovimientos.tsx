// src/presentation/components/features/turno/BotonesMovimientos.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface BotonMovimientoConfig {
  id: string;
  label: string;
  sublabel: string;
  icon: IconName;
  color: string;
  bgColor: string;
  borderColor: string;
  contador?: number;
}

interface BotonesMovimientosProps {
  contadorEntradas: number;
  contadorSalidas: number;
  contadorCambios: number;
  contadorMermas: number;
  onEntradas: () => void;
  onSalidas: () => void;
  onCambiosPrecio: () => void;
  onMermas: () => void;
}

export function BotonesMovimientos({
  contadorEntradas,
  contadorSalidas,
  contadorCambios,
  contadorMermas,
  onEntradas,
  onSalidas,
  onCambiosPrecio,
  onMermas,
}: BotonesMovimientosProps) {
  const botones: (BotonMovimientoConfig & { onPress: () => void })[] = [
    {
      id: 'entradas',
      label: 'Entradas',
      sublabel: 'Productos que entran',
      icon: 'package-down',
      color: '#4F8EF7',
      bgColor: 'rgba(79,142,247,0.08)',
      borderColor: 'rgba(79,142,247,0.25)',
      contador: contadorEntradas,
      onPress: onEntradas,
    },
    {
      id: 'salidas',
      label: 'Salidas familiares',
      sublabel: 'Sustracciones del turno',
      icon: 'account-arrow-right-outline',
      color: '#F0B429',
      bgColor: 'rgba(240,180,41,0.08)',
      borderColor: 'rgba(240,180,41,0.25)',
      contador: contadorSalidas,
      onPress: onSalidas,
    },
    {
      id: 'cambios',
      label: 'Cambios de precio',
      sublabel: 'Variaciones durante el turno',
      icon: 'tag-edit-outline',
      color: '#B57BFF',
      bgColor: 'rgba(181,123,255,0.08)',
      borderColor: 'rgba(181,123,255,0.25)',
      contador: contadorCambios,
      onPress: onCambiosPrecio,
    },
    {
      id: 'mermas',
      label: 'Mermas',
      sublabel: 'Rotos, vencidos u otros',
      icon: 'package-variant-remove',
      color: '#E85454',
      bgColor: 'rgba(232,84,84,0.08)',
      borderColor: 'rgba(232,84,84,0.25)',
      contador: contadorMermas,
      onPress: onMermas,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.seccionLabel}>Movimientos del turno</Text>
      <View style={styles.grid}>
        {botones.map((boton) => (
          <TouchableOpacity
            key={boton.id}
            style={[
              styles.boton,
              {
                backgroundColor: boton.bgColor,
                borderColor: boton.borderColor,
              },
            ]}
            onPress={boton.onPress}
            activeOpacity={0.75}
          >
            {/* Contador badge */}
            {boton.contador !== undefined && boton.contador > 0 && (
              <View style={[styles.badge, { backgroundColor: boton.color }]}>
                <Text style={styles.badgeTexto}>{boton.contador}</Text>
              </View>
            )}

            {/* Icono */}
            <MaterialCommunityIcons
              name={boton.icon}
              size={28}
              color={boton.color}
              style={styles.icono}
            />

            {/* Textos */}
            <Text style={[styles.botonLabel, { color: boton.color }]}>
              {boton.label}
            </Text>
            <Text style={styles.botonSublabel}>{boton.sublabel}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  seccionLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  boton: {
    width: '47.5%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    position: 'relative',
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeTexto: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xs,
    color: Colors.textOnAccent,
  },
  icono: {
    marginBottom: Spacing.sm,
  },
  botonLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  botonSublabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});