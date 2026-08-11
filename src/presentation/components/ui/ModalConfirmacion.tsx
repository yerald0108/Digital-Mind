// src/presentation/components/ui/ModalConfirmacion.tsx
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius, Shadows } from '../../../constants/theme';

interface ModalConfirmacionProps {
  visible: boolean;
  titulo: string;
  mensaje: string;
  labelConfirmar?: string;
  labelCancelar?: string;
  variante?: 'danger' | 'warning';
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacion({
  visible,
  titulo,
  mensaje,
  labelConfirmar = 'Eliminar',
  labelCancelar = 'Cancelar',
  variante = 'danger',
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) {
  const { C } = useTheme();

  const colorAccion = variante === 'danger' ? C.accentDanger : C.accentWarning;
  const iconoAccion = variante === 'danger' ? 'trash-can-outline' : 'alert-outline';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancelar}
    >
      {/* Overlay */}
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: C.overlay }]}
        activeOpacity={1}
        onPress={onCancelar}
      >
        {/* Tarjeta — stopPropagation para que el tap interno no cierre */}
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.card, { backgroundColor: C.bgSurface, borderColor: C.border }]}
        >
          {/* Ícono */}
          <View style={[styles.iconoContainer, { backgroundColor: `${colorAccion}15` }]}>
            <MaterialCommunityIcons name={iconoAccion} size={28} color={colorAccion} />
          </View>

          {/* Textos */}
          <Text style={[styles.titulo, { color: C.textPrimary }]}>{titulo}</Text>
          <Text style={[styles.mensaje, { color: C.textSecondary }]}>{mensaje}</Text>

          {/* Botones */}
          <View style={styles.botones}>
            <TouchableOpacity
              style={[styles.boton, styles.botonCancelar, { backgroundColor: C.bgElevated, borderColor: C.border }]}
              onPress={onCancelar}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={labelCancelar}
            >
              <Text style={[styles.botonTexto, { color: C.textSecondary }]}>
                {labelCancelar}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonConfirmar, { backgroundColor: colorAccion }]}
              onPress={onConfirmar}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={labelConfirmar}
            >
              <MaterialCommunityIcons name={iconoAccion} size={15} color={C.textOnAccent} />
              <Text style={[styles.botonTexto, { color: C.textOnAccent }]}>
                {labelConfirmar}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  iconoContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  titulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    textAlign: 'center',
  },
  mensaje: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  botones: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.xs,
  },
  boton: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  botonCancelar: {
    borderWidth: 1,
  },
  botonConfirmar: {},
  botonTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
});
