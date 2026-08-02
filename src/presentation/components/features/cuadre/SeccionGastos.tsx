// src/presentation/components/features/cuadre/SeccionGastos.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { ModalConfirmacion } from '../../ui/ModalConfirmacion';
import { Gasto, GastoInput } from '../../../../domain/entities/Gasto';
import { gastoSchema } from '../../../../utils/validators';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';
import { z } from 'zod';
import { useTheme } from '../../../hooks/useTheme';

type FormData = z.infer<typeof gastoSchema>;

interface SeccionGastosProps {
  turnoId: number;
  gastos: Gasto[];
  onCrear: (input: GastoInput) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function SeccionGastos({ turnoId, gastos, onCrear, onEliminar }: SeccionGastosProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const [mostrarForm, setMostrarForm] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(gastoSchema),
      defaultValues: {
        concepto: '',
        monto: 0,
        notas: '',
      },
    });

  const onSubmit = async (data: FormData) => {
    await onCrear({
      turno_id: turnoId,
      concepto: data.concepto?.trim() || null,
      monto: data.monto,
      notas: data.notas || null,
    });
    reset();
    setMostrarForm(false);
  };

  const [pendienteEliminar, setPendienteEliminar] = useState<number | null>(null);

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.descripcion}>
        Registra cualquier gasto que deba descontarse de la caja. Ingresa el monto exacto a descontar.
      </Text>

      {gastos.length > 0 && (
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>Total a descontar</Text>
          <Text style={styles.totalValor}>- {formatMoneda(totalGastos)}</Text>
        </View>
      )}

      {mostrarForm && (
        <View style={styles.form}>
          <Controller control={control} name="concepto"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Concepto (opcional)"
                placeholder="Ej: Jabón cocina, pago de servicio..."
                value={value ?? ''}
                onChangeText={onChange}
                icon="text-short"
              />
            )}
          />

          <Controller control={control} name="monto"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Monto a descontar (CUP)"
                placeholder="0.00"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.monto?.message}
                keyboardType="decimal-pad"
                icon="cash-minus"
              />
            )}
          />

          <Controller control={control} name="notas"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Notas (opcional)"
                placeholder="Observaciones..."
                value={value ?? ''}
                onChangeText={onChange}
                icon="note-outline"
              />
            )}
          />

          <View style={styles.botones}>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={() => { setMostrarForm(false); reset(); }}
              style={{ flex: 1 }}
            />
            <Button
              label="Agregar"
              variant="primary"
              icon="check"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      )}

      {gastos.map((g, i) => (
        <View key={g.id} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemNumero}>#{i + 1}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemConcepto}>{g.concepto ?? 'Gasto'}</Text>
              {g.notas ? (
                <Text style={styles.itemNotas} numberOfLines={1}>{g.notas}</Text>
              ) : null}
              <Text style={styles.itemMonto}>- {formatMoneda(g.monto)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setPendienteEliminar(g.id)}
            style={styles.botonEliminar}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.accentDanger} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.botonAgregar}
        onPress={() => setMostrarForm(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={16} color={Colors.accent} />
        <Text style={styles.botonAgregarTexto}>Agregar gasto</Text>
      </TouchableOpacity>

      {/* ── Modal de Confirmación ── */}
      <ModalConfirmacion
        visible={pendienteEliminar !== null}
        titulo="Eliminar gasto" 
        mensaje="¿Estás seguro? Esta acción no se puede deshacer."
        onConfirmar={() => {
          if (pendienteEliminar !== null) onEliminar(pendienteEliminar);
          setPendienteEliminar(null);
        }}
        onCancelar={() => setPendienteEliminar(null)}
      />
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
    lineHeight: 18,
  },
  totalBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(232,84,84,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(232,84,84,0.2)',
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
    color: Colors.accentDanger,
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
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    flex: 1,
  },
  itemNumero: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    width: 24,
    marginTop: 2,
  },
  itemInfo: { flex: 1 },
  itemConcepto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  itemNotas: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemMonto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.accentDanger,
    marginTop: 4,
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
