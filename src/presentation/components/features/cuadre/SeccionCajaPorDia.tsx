// src/presentation/components/features/cuadre/SeccionCajaPorDia.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CajaDia, CajaDiaInput } from '../../../../domain/entities/CajaDia';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';

interface SeccionCajaPorDiaProps {
  turnoId: number;
  diasDuracion: number;
  cajaPorDia: CajaDia[];
  onGuardar: (input: CajaDiaInput) => Promise<void>;
}

export function SeccionCajaPorDia({
  turnoId,
  diasDuracion,
  cajaPorDia,
  onGuardar,
}: SeccionCajaPorDiaProps) {
  const dias = Array.from({ length: diasDuracion }, (_, i) => i + 1);

  // Estado local para cada día — evita conflicto con el estado remoto
  const [valores, setValores] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState<Record<number, boolean>>({});

  // Inicializar valores desde la DB cuando cajaPorDia cambia
  useEffect(() => {
    const inicial: Record<number, string> = {};
    dias.forEach((dia) => {
      const registro = cajaPorDia.find((c) => c.dia_numero === dia);
      inicial[dia] = registro && registro.monto_efectivo > 0
        ? String(registro.monto_efectivo)
        : '';
    });
    setValores(inicial);
  }, [cajaPorDia.length, diasDuracion]);

  const handleChangeText = (dia: number, texto: string) => {
    // Solo permitir números y punto decimal
    const limpio = texto.replace(/[^0-9.]/g, '');
    // Evitar múltiples puntos
    const partes = limpio.split('.');
    const valido = partes.length > 2
      ? partes[0] + '.' + partes.slice(1).join('')
      : limpio;
    setValores((prev) => ({ ...prev, [dia]: valido }));
  };

  const handleBlur = async (dia: number) => {
    const texto = valores[dia] ?? '';
    const monto = parseFloat(texto) || 0;

    try {
      setGuardando((prev) => ({ ...prev, [dia]: true }));
      await onGuardar({
        turno_id: turnoId,
        dia_numero: dia,
        monto_efectivo: monto,
      });
    } catch (e) {
      console.error('[SeccionCajaPorDia] handleBlur:', e);
    } finally {
      setGuardando((prev) => ({ ...prev, [dia]: false }));
    }
  };

  const totalEfectivo = dias.reduce((acc, dia) => {
    return acc + (parseFloat(valores[dia] ?? '0') || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.descripcion}>
        Ingresa el efectivo recibido en caja separado por cada día del turno.
        El monto se guarda automáticamente al salir del campo.
      </Text>

      {/* Total acumulado */}
      <View style={styles.totalBadge}>
        <Text style={styles.totalLabel}>Total efectivo en caja</Text>
        <Text style={styles.totalValor}>{formatMoneda(totalEfectivo)}</Text>
      </View>

      {/* Un input por día */}
      {dias.map((dia) => {
        const valor = valores[dia] ?? '';
        const monto = parseFloat(valor) || 0;
        const tieneValor = monto > 0;
        const estaGuardando = guardando[dia] ?? false;

        return (
          <View key={dia} style={styles.fila}>
            {/* Label del día */}
            <View style={styles.diaInfo}>
              <View style={styles.diaBadge}>
                <Text style={styles.diaBadgeTexto}>{dia}</Text>
              </View>
              <Text style={styles.diaTitulo}>Día {dia}</Text>
            </View>

            {/* Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.inputMonto,
                  tieneValor && styles.inputMontoActivo,
                ]}
                value={valor}
                onChangeText={(t) => handleChangeText(dia, t)}
                onBlur={() => handleBlur(dia)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.textDisabled}
                selectTextOnFocus
                returnKeyType="done"
              />
              <Text style={styles.monedaLabel}>CUP</Text>
            </View>

            {/* Indicador de guardado */}
            <View style={styles.estadoIndicador}>
              {estaGuardando ? (
                <MaterialCommunityIcons
                  name="loading"
                  size={16}
                  color={Colors.textSecondary}
                />
              ) : tieneValor ? (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={Colors.accentSuccess}
                />
              ) : (
                <MaterialCommunityIcons
                  name="circle-outline"
                  size={16}
                  color={Colors.textDisabled}
                />
              )}
            </View>
          </View>
        );
      })}

      {/* Nota sobre el guardado */}
      <View style={styles.nota}>
        <MaterialCommunityIcons
          name="information-outline"
          size={13}
          color={Colors.textDisabled}
        />
        <Text style={styles.notaTexto}>
          El monto se guarda automáticamente al tocar fuera del campo.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: Typography.size.xl,
    color: Colors.accentSuccess,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  diaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  diaBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diaBadgeTexto: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  diaTitulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inputMonto: {
    width: 120,
    height: 46,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    textAlign: 'right',
    paddingHorizontal: Spacing.md,
  },
  inputMontoActivo: {
    borderColor: Colors.accentSuccess,
    color: Colors.accentSuccess,
    backgroundColor: 'rgba(52,199,123,0.06)',
  },
  monedaLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    width: 32,
  },
  estadoIndicador: {
    width: 20,
    alignItems: 'center',
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  notaTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    flex: 1,
    lineHeight: 16,
  },
});