import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CajaDia, CajaDiaInput } from '../../../../domain/entities/CajaDia';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';
import { useTheme } from '../../../hooks/useTheme';

interface SeccionCajaPorDiaProps {
  turnoId: number;
  diasDuracion: number;
  cajaPorDia: CajaDia[];
  onGuardar: (inputs: CajaDiaInput[]) => Promise<void>;
}

export function SeccionCajaPorDia({
  turnoId,
  diasDuracion,
  cajaPorDia,
  onGuardar,
}: SeccionCajaPorDiaProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const dias = Array.from({ length: diasDuracion }, (_, i) => i + 1);
  const [valores, setValores] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  // Cuando llega una confirmación desde SQLite, la interfaz refleja los datos persistidos.
  useEffect(() => {
    const inicial: Record<number, string> = {};
    dias.forEach((dia) => {
      const registro = cajaPorDia.find((c) => c.dia_numero === dia);
      inicial[dia] = registro && registro.monto_efectivo > 0
        ? String(registro.monto_efectivo)
        : '';
    });
    setValores(inicial);
  }, [cajaPorDia, diasDuracion]);

  const handleChangeText = (dia: number, texto: string) => {
    const limpio = texto.replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    const valido = partes.length > 2
      ? partes[0] + '.' + partes.slice(1).join('')
      : limpio;

    setErrorGuardar(null);
    setValores((prev) => ({ ...prev, [dia]: valido }));
  };

  const montoIngresado = (dia: number): number =>
    parseFloat(valores[dia] ?? '') || 0;

  const registroGuardado = (dia: number) =>
    cajaPorDia.find((registro) => registro.dia_numero === dia);

  const hayCambioPendiente = (dia: number): boolean => {
    const registro = registroGuardado(dia);
    const texto = valores[dia] ?? '';

    if (!registro) return texto !== '';
    return montoIngresado(dia) !== registro.monto_efectivo;
  };

  const cambiosPendientes = dias
    .filter(hayCambioPendiente)
    .map((dia): CajaDiaInput => ({
      turno_id: turnoId,
      dia_numero: dia,
      monto_efectivo: montoIngresado(dia),
    }));

  const handleGuardarCambios = async () => {
    if (cambiosPendientes.length === 0) return;

    try {
      setGuardando(true);
      setErrorGuardar(null);
      await onGuardar(cambiosPendientes);
    } catch (error) {
      console.error('[SeccionCajaPorDia] handleGuardarCambios:', error);
      setErrorGuardar('No se pudieron guardar los cambios. Inténtalo otra vez.');
    } finally {
      setGuardando(false);
    }
  };

  const totalEfectivo = dias.reduce(
    (acumulado, dia) => acumulado + montoIngresado(dia),
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.descripcion}>
        Ingresa el efectivo recibido en caja separado por cada día del turno.
        Puedes editar varios días y guardar todos los cambios juntos.
      </Text>

      <View style={styles.totalBadge}>
        <Text style={styles.totalLabel}>Total efectivo en caja</Text>
        <Text style={styles.totalValor}>{formatMoneda(totalEfectivo)}</Text>
      </View>

      {dias.map((dia) => {
        const valor = valores[dia] ?? '';
        const monto = montoIngresado(dia);
        const registro = registroGuardado(dia);
        const pendiente = hayCambioPendiente(dia);
        const tieneValor = monto > 0;

        return (
          <View key={dia} style={styles.fila}>
            <View style={styles.diaInfo}>
              <View style={styles.diaBadge}>
                <Text style={styles.diaBadgeTexto}>{dia}</Text>
              </View>
              <Text style={styles.diaTitulo}>Día {dia}</Text>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.inputMonto,
                  tieneValor && styles.inputMontoActivo,
                  pendiente && styles.inputMontoPendiente,
                ]}
                value={valor}
                onChangeText={(texto) => handleChangeText(dia, texto)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textDisabled}
                selectTextOnFocus
                returnKeyType="next"
                accessibilityLabel={`Efectivo del día ${dia} en CUP`}
              />
              <Text style={styles.monedaLabel}>CUP</Text>
            </View>

            <View style={styles.estadoIndicador}>
              {guardando && pendiente ? (
                <MaterialCommunityIcons name="loading" size={16} color={Colors.textSecondary} />
              ) : pendiente ? (
                <MaterialCommunityIcons name="pencil-circle" size={17} color={Colors.accentWarning} />
              ) : registro ? (
                <MaterialCommunityIcons name="check-circle" size={16} color={Colors.accentSuccess} />
              ) : (
                <MaterialCommunityIcons name="circle-outline" size={16} color={Colors.textDisabled} />
              )}
            </View>
          </View>
        );
      })}

      {cambiosPendientes.length > 0 ? (
        <View style={styles.guardarCard}>
          <View style={styles.guardarInfo}>
            <MaterialCommunityIcons
              name="content-save-edit-outline"
              size={20}
              color={Colors.accentWarning}
            />
            <View style={styles.guardarTextos}>
              <Text style={styles.guardarTitulo}>
                {cambiosPendientes.length} {cambiosPendientes.length === 1 ? 'cambio pendiente' : 'cambios pendientes'}
              </Text>
              <Text style={styles.guardarDescripcion}>
                Revisa los montos y guárdalos cuando estén listos.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonGuardarDeshabilitado]}
            onPress={handleGuardarCambios}
            disabled={guardando}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Guardar ${cambiosPendientes.length} cambios de caja`}
          >
            <MaterialCommunityIcons
              name={guardando ? 'loading' : 'content-save'}
              size={17}
              color={Colors.textOnAccent}
            />
            <Text style={styles.botonGuardarTexto}>
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : cajaPorDia.length > 0 ? (
        <View style={styles.guardadoInfo}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.accentSuccess} />
          <Text style={styles.guardadoInfoTexto}>Los montos ingresados están guardados</Text>
        </View>
      ) : null}

      {errorGuardar && <Text style={styles.errorGuardar}>{errorGuardar}</Text>}
    </View>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  container: {},
  descripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  totalBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,123,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(52,199,123,0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  totalValor: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.accentSuccess,
  },
  fila: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  diaInfo: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  diaBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
  },
  diaBadgeTexto: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xs,
    color: Colors.accent,
  },
  diaTitulo: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputMonto: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bgInput,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    textAlign: 'right',
  },
  inputMontoActivo: {
    borderColor: Colors.accentSuccess,
  },
  inputMontoPendiente: {
    borderColor: Colors.accentWarning,
  },
  monedaLabel: {
    marginLeft: Spacing.sm,
    width: 30,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  estadoIndicador: {
    width: 20,
    alignItems: 'flex-end',
  },
  guardarCard: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(240,180,41,0.32)',
    backgroundColor: 'rgba(240,180,41,0.08)',
  },
  guardarInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  guardarTextos: {
    flex: 1,
    gap: 2,
  },
  guardarTitulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  guardarDescripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  botonGuardar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
  },
  botonGuardarDeshabilitado: {
    opacity: 0.7,
  },
  botonGuardarTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textOnAccent,
  },
  guardadoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  guardadoInfoTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    color: Colors.accentSuccess,
  },
  errorGuardar: {
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.accentDanger,
    textAlign: 'center',
  },
  });
}
