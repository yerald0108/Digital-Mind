// src/presentation/components/features/cuadre/SeccionUSD.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { RegistroUSD, RegistroUSDInput } from '../../../../domain/entities/RegistroUSD';
import { usdSchema } from '../../../../utils/validators';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';
import { z } from 'zod';

type FormData = z.infer<typeof usdSchema>;

interface SeccionUSDProps {
  turnoId: number;
  registros: RegistroUSD[];
  onCrear: (input: RegistroUSDInput) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function SeccionUSD({ turnoId, registros, onCrear, onEliminar }: SeccionUSDProps) {
  const [mostrarForm, setMostrarForm] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(usdSchema),
      defaultValues: { cantidad_usd: 0, tasa_cambio: 0 },
    });

  const cantidadUSD = watch('cantidad_usd') || 0;
  const tasaCambio = watch('tasa_cambio') || 0;
  const equivalenteCUP = cantidadUSD * tasaCambio;

  const onSubmit = async (data: FormData) => {
    await onCrear({
      turno_id: turnoId,
      cantidad_usd: data.cantidad_usd,
      tasa_cambio: data.tasa_cambio,
    });
    reset();
    setMostrarForm(false);
  };

  const totalCUP = registros.reduce((acc, r) => acc + r.equivalente_cup, 0);
  const totalUSD = registros.reduce((acc, r) => acc + r.cantidad_usd, 0);

  return (
    <View style={styles.container}>
      {registros.length === 0 && !mostrarForm && (
        <Text style={styles.descripcion}>
          Si no se recibió dólares durante el turno, omite esta sección.
        </Text>
      )}

      {/* Totales */}
      {registros.length > 0 && (
        <View style={styles.totalBadge}>
          <View>
            <Text style={styles.totalLabel}>Total USD</Text>
            <Text style={styles.totalUSD}>{totalUSD.toFixed(2)} USD</Text>
          </View>
          <View style={styles.separator} />
          <View>
            <Text style={styles.totalLabel}>Equivalente CUP</Text>
            <Text style={styles.totalCUP}>{formatMoneda(totalCUP)}</Text>
          </View>
        </View>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <View style={styles.form}>
          <Controller control={control} name="cantidad_usd"
            render={({ field: { onChange, value } }) => (
              <Input label="Cantidad en USD" placeholder="0.00"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.cantidad_usd?.message}
                keyboardType="decimal-pad" icon="currency-usd" />
            )} />
          <Controller control={control} name="tasa_cambio"
            render={({ field: { onChange, value } }) => (
              <Input label="Tasa de cambio (CUP por 1 USD)" placeholder="0.00"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.tasa_cambio?.message}
                keyboardType="decimal-pad" icon="swap-horizontal" />
            )} />

          {/* Preview del equivalente */}
          {cantidadUSD > 0 && tasaCambio > 0 && (
            <View style={styles.preview}>
              <Text style={styles.previewTexto}>
                {cantidadUSD.toFixed(2)} USD × {tasaCambio} ={' '}
              </Text>
              <Text style={styles.previewValor}>{formatMoneda(equivalenteCUP)}</Text>
            </View>
          )}

          <View style={styles.botones}>
            <Button label="Cancelar" variant="ghost"
              onPress={() => { setMostrarForm(false); reset(); }} style={{ flex: 1 }} />
            <Button label="Agregar" variant="primary" icon="check"
              onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={{ flex: 2 }} />
          </View>
        </View>
      )}

      {/* Lista */}
      {registros.map((r, i) => (
        <View key={r.id} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemNumero}>#{i + 1}</Text>
            <View>
              <Text style={styles.itemUSD}>{r.cantidad_usd.toFixed(2)} USD</Text>
              <Text style={styles.itemDetalle}>
                × {r.tasa_cambio} = {formatMoneda(r.equivalente_cup)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Eliminar', '¿Eliminar este registro de USD?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => onEliminar(r.id) },
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
        <Text style={styles.botonAgregarTexto}>Agregar registro USD</Text>
      </TouchableOpacity>
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
    lineHeight: 18,
  },
  totalBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(79,142,247,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  totalLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  totalUSD: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    color: Colors.accentWarning,
  },
  totalCUP: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    color: Colors.accent,
  },
  form: { marginBottom: Spacing.md },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  previewValor: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
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
  itemUSD: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.accentWarning,
  },
  itemDetalle: {
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