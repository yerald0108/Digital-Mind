// src/presentation/components/features/cuadre/SeccionTransferencias.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Transferencia, TransferenciaInput } from '../../../../domain/entities/Transferencia';
import { transferenciaSchema } from '../../../../utils/validators';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';
import { z } from 'zod';
import { useTheme } from '../../../hooks/useTheme';

type FormData = z.infer<typeof transferenciaSchema>;

interface SeccionTransferenciasProps {
  turnoId: number;
  transferencias: Transferencia[];
  onCrear: (input: TransferenciaInput) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function SeccionTransferencias({
  turnoId,
  transferencias,
  onCrear,
  onEliminar,
}: SeccionTransferenciasProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const [mostrarForm, setMostrarForm] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(transferenciaSchema),
      defaultValues: { monto: 0, concepto: '' },
    });

  const onSubmit = async (data: FormData) => {
    await onCrear({ turno_id: turnoId, monto: data.monto, concepto: data.concepto || null });
    reset();
    setMostrarForm(false);
  };

  const totalTransferencias = transferencias.reduce((acc, t) => acc + t.monto, 0);

  return (
    <View style={styles.container}>
      {/* Total */}
      {transferencias.length > 0 && (
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>Total transferencias</Text>
          <Text style={styles.totalValor}>{formatMoneda(totalTransferencias)}</Text>
        </View>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <View style={styles.form}>
          <Controller control={control} name="monto"
            render={({ field: { onChange, value } }) => (
              <Input label="Monto (CUP)" placeholder="0.00"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.monto?.message}
                keyboardType="decimal-pad" icon="bank-transfer" />
            )} />
          <Controller control={control} name="concepto"
            render={({ field: { onChange, value } }) => (
              <Input label="Concepto (opcional)" placeholder="De quién / para qué..."
                value={value ?? ''} onChangeText={onChange} icon="note-outline" />
            )} />
          <View style={styles.botones}>
            <Button label="Cancelar" variant="ghost"
              onPress={() => { setMostrarForm(false); reset(); }} style={{ flex: 1 }} />
            <Button label="Agregar" variant="primary" icon="check"
              onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={{ flex: 2 }} />
          </View>
        </View>
      )}

      {/* Lista */}
      {transferencias.map((t, i) => (
        <View key={t.id} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemNumero}>#{i + 1}</Text>
            <View>
              <Text style={styles.itemMonto}>{formatMoneda(t.monto)}</Text>
              {t.concepto && <Text style={styles.itemConcepto}>{t.concepto}</Text>}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Eliminar', '¿Eliminar esta transferencia?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => onEliminar(t.id) },
            ])}
            style={styles.botonEliminar}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.accentDanger} />
          </TouchableOpacity>
        </View>
      ))}

      {/* Botón agregar */}
      <TouchableOpacity
        style={styles.botonAgregar}
        onPress={() => setMostrarForm(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={16} color={Colors.accent} />
        <Text style={styles.botonAgregarTexto}>Agregar transferencia</Text>
      </TouchableOpacity>
    </View>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  container: {},
  totalBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(79,142,247,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  totalValor: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.accent,
  },
  form: { marginBottom: Spacing.md },
  botones: { flexDirection: 'row', gap: Spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  itemNumero: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    width: 24,
  },
  itemMonto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  itemConcepto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  botonEliminar: { padding: Spacing.xs },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  botonAgregarTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
  });
}
