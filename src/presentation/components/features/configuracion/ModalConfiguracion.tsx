// src/presentation/components/features/configuracion/ModalConfiguracion.tsx
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { useTheme } from '../../../hooks/useTheme';
import { Spacing, Radius, Typography } from '../../../../constants/theme';

interface ModalConfiguracionProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalConfiguracion({ visible, onClose }: ModalConfiguracionProps) {
  const { C, modo, toggleModo, esOscuro } = useTheme();

  return (
    <Modal visible={visible} title="Configuración" onClose={onClose}>
      {/* ── Apariencia ── */}
      <Text style={[estilos.seccionLabel, { color: C.textSecondary }]}>
        Apariencia
      </Text>

      <View style={[estilos.opcionCard, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
        {/* Modo oscuro / claro */}
        <View style={estilos.opcionFila}>
          <View style={estilos.opcionIcono}>
            <MaterialCommunityIcons
              name={esOscuro ? 'moon-waning-crescent' : 'white-balance-sunny'}
              size={22}
              color={C.accent}
            />
          </View>
          <View style={estilos.opcionTextos}>
            <Text style={[estilos.opcionTitulo, { color: C.textPrimary }]}>
              {esOscuro ? 'Modo oscuro' : 'Modo claro'}
            </Text>
            <Text style={[estilos.opcionDescripcion, { color: C.textSecondary }]}>
              {esOscuro
                ? 'Interfaz oscura para ambientes con poca luz'
                : 'Interfaz clara para ambientes iluminados'}
            </Text>
          </View>
          <Switch
            value={esOscuro}
            onValueChange={toggleModo}
            trackColor={{ false: C.border, true: `${C.accent}60` }}
            thumbColor={esOscuro ? C.accent : C.textDisabled}
          />
        </View>

        {/* Preview de los dos modos */}
        <View style={[estilos.previews, { borderTopColor: C.divider }]}>
          <TouchableOpacity
            style={[
              estilos.previewItem,
              { backgroundColor: '#0D0D0F', borderColor: !esOscuro ? C.border : C.accent },
              !esOscuro && estilos.previewInactivo,
            ]}
            onPress={() => { if (!esOscuro) toggleModo(); }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="moon-waning-crescent"
              size={18}
              color={esOscuro ? '#4F8EF7' : '#555'}
            />
            <Text style={[
              estilos.previewLabel,
              { color: esOscuro ? '#F0F0F5' : '#888' },
            ]}>
              Oscuro
            </Text>
            {esOscuro && (
              <MaterialCommunityIcons name="check-circle" size={14} color="#4F8EF7" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              estilos.previewItem,
              { backgroundColor: '#F4F4F8', borderColor: esOscuro ? C.border : '#2E6EE1' },
              esOscuro && estilos.previewInactivo,
            ]}
            onPress={() => { if (esOscuro) toggleModo(); }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="white-balance-sunny"
              size={18}
              color={!esOscuro ? '#2E6EE1' : '#aaa'}
            />
            <Text style={[
              estilos.previewLabel,
              { color: !esOscuro ? '#12121A' : '#aaa' },
            ]}>
              Claro
            </Text>
            {!esOscuro && (
              <MaterialCommunityIcons name="check-circle" size={14} color="#2E6EE1" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Info de la app ── */}
      <Text style={[estilos.seccionLabel, { color: C.textSecondary, marginTop: Spacing.lg }]}>
        Información
      </Text>

      <View style={[estilos.opcionCard, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
        <InfoFila icono="application-outline" label="Aplicación" valor="Digital/Mind" color={C} />
        <InfoFila icono="tag-outline" label="Versión" valor="1.0.0" color={C} />
        <InfoFila icono="code-tags" label="Desarrollador" valor="@yerald.dev" color={C} ultimo />
      </View>
    </Modal>
  );
}

function InfoFila({
  icono, label, valor, color, ultimo,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  valor: string;
  color: any;
  ultimo?: boolean;
}) {
  return (
    <View style={[
      estilos.infoFila,
      !ultimo && { borderBottomWidth: 1, borderBottomColor: color.divider },
    ]}>
      <MaterialCommunityIcons name={icono} size={16} color={color.textSecondary} />
      <Text style={[estilos.infoLabel, { color: color.textSecondary }]}>{label}</Text>
      <Text style={[estilos.infoValor, { color: color.textPrimary }]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  seccionLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  opcionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  opcionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  opcionIcono: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(79,142,247,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionTextos: { flex: 1 },
  opcionTitulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  opcionDescripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  previews: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  previewItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  previewInactivo: {
    opacity: 0.5,
  },
  previewLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  infoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  infoLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  infoValor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
});