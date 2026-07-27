// src/presentation/components/features/cuadre/SeccionGastos.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Gasto, GastoInput } from '../../../../domain/entities/Gasto';
import { gastoSchema } from '../../../../utils/validators';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';
import { z } from 'zod';

type FormData = z.infer<typeof gastoSchema>;

interface SeccionGastosProps {
  turnoId: number;
  gastos: Gasto[];
  onCrear: (input: GastoInput) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function SeccionGastos({ turnoId, gastos, onCrear, onEliminar }: SeccionGastosProps) {
  const [mostrarForm, setMostrarForm] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(gastoSchema),
      defaultValues: {
        producto_nombre: '',
        precio_venta: 0,
        precio_cobrado: 0,
        cantidad: 1,
        notas: '',
      },
    });

  const precioVenta = watch('precio_venta') || 0;
  const precioCobrado = watch('precio_cobrado') || 0;
  const cantidad = watch('cantidad') || 1;
  const diferencia = (precioVenta - precioCobrado) * cantidad;

  const onSubmit = async (data: FormData) => {
    await onCrear({
      turno_id: turnoId,
      producto_id: null,
      producto_nombre: data.producto_nombre,
      precio_venta: data.precio_venta,
      precio_cobrado: data.precio_cobrado,
      cantidad: data.cantidad,
      notas: data.notas || null,
    });
    reset();
    setMostrarForm(false);
  };

  const totalGastos = gastos.reduce((acc, g) => acc + g.diferencia, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.descripcion}>
        Registra productos que compró algún trabajador a precio reducido. La diferencia entre el precio real y lo cobrado se descuenta de la caja.
      </Text>

      {gastos.length > 0 && (
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>Total a descontar</Text>
          <Text style={styles.totalValor}>- {formatMoneda(totalGastos)}</Text>
        </View>
      )}

      {mostrarForm && (
        <View style={styles.form}>
          <Controller control={control} name="producto_nombre"
            render={({ field: { onChange, value } }) => (
              <Input label="Producto" placeholder="Nombre del producto..."
                value={value} onChangeText={onChange}
                error={errors.producto_nombre?.message} icon="package-variant-closed" />
            )} />
          <Controller control={control} name="cantidad"
            render={({ field: { onChange, value } }) => (
              <Input label="Cantidad" placeholder="1"
                value={value === 1 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 1)}
                error={errors.cantidad?.message}
                keyboardType="decimal-pad" icon="counter" />
            )} />
          <Controller control={control} name="precio_venta"
            render={({ field: { onChange, value } }) => (
              <Input label="Precio de venta real (CUP)" placeholder="0.00"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.precio_venta?.message}
                keyboardType="decimal-pad" icon="tag-outline" />
            )} />
          <Controller control={control} name="precio_cobrado"
            render={({ field: { onChange, value } }) => (
              <Input label="Precio cobrado al trabajador (CUP)" placeholder="0.00"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.precio_cobrado?.message}
                keyboardType="decimal-pad" icon="tag-minus-outline" />
            )} />

          {/* Diferencia calculada */}
          {diferencia > 0 && (
            <View style={styles.diferenciaPreview}>
              <Text style={styles.diferenciaLabel}>Diferencia a descontar</Text>
              <Text style={styles.diferenciaValor}>- {formatMoneda(diferencia)}</Text>
            </View>
          )}

          <Controller control={control} name="notas"
            render={({ field: { onChange, value } }) => (
              <Input label="Notas (opcional)" placeholder="Observaciones..."
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

      {gastos.map((g, i) => (
        <View key={g.id} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemNumero}>#{i + 1}</Text>
            <View>
              <Text style={styles.itemNombre}>{g.producto_nombre}</Text>
              <Text style={styles.itemDetalle}>
                {g.cantidad} × {formatMoneda(g.precio_venta)} → {formatMoneda(g.precio_cobrado)}
              </Text>
              <Text style={styles.itemDiferencia}>
                Descuento: - {formatMoneda(g.diferencia)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Eliminar', '¿Eliminar este gasto?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => onEliminar(g.id) },
            ])}
            style={styles.botonEliminar}>
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
  diferenciaPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(232,84,84,0.08)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(232,84,84,0.2)',
  },
  diferenciaLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  diferenciaValor: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    color: Colors.accentDanger,
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
  itemLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flex: 1 },
  itemNumero: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    width: 24,
    marginTop: 2,
  },
  itemNombre: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  itemDetalle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemDiferencia: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    color: Colors.accentDanger,
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