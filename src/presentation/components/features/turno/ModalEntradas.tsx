// src/presentation/components/features/turno/ModalEntradas.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Divider } from '../../ui/Divider';
import { SelectorProducto } from '../../ui/SelectorProducto';
import { Producto } from '../../../../domain/entities/Producto';
import { Entrada, EntradaInput } from '../../../../domain/entities/Entrada';
import { entradaSchema } from '../../../../utils/validators';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatFechaHora } from '../../../../utils/formatters';
import { z } from 'zod';

type FormData = z.infer<typeof entradaSchema>;

interface ModalEntradasProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  productos: Producto[];
  entradas: Entrada[];
  onCrear: (input: EntradaInput) => Promise<void>;
  onActualizar: (id: number, cantidad: number, notas: string | null) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function ModalEntradas({
  visible, onClose, turnoId, productos, entradas,
  onCrear, onActualizar, onEliminar,
}: ModalEntradasProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(entradaSchema),
      defaultValues: { producto_id: 0, cantidad: 0, notas: '' },
    });

  const abrirEdicion = (entrada: Entrada) => {
    setEditandoId(entrada.id);
    setValue('cantidad', entrada.cantidad);
    setValue('notas', entrada.notas ?? '');
    const prod = productos.find((p) => p.id === entrada.producto_id);
    setProductoSeleccionado(prod ?? null);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setProductoSeleccionado(null);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    if (editandoId !== null) {
      await onActualizar(editandoId, data.cantidad, data.notas || null);
    } else {
      if (!productoSeleccionado) return;
      await onCrear({
        turno_id: turnoId,
        producto_id: productoSeleccionado.id,
        producto_nombre: productoSeleccionado.nombre,
        cantidad: data.cantidad,
        precio_costo: productoSeleccionado.precio_costo,
        notas: data.notas || null,
      });
    }
    handleCancelar();
  };

  const confirmarEliminar = (id: number, nombre: string) => {
    Alert.alert('Eliminar entrada', `¿Eliminar la entrada de "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onEliminar(id) },
    ]);
  };

  return (
    <Modal visible={visible} title="Entradas" onClose={onClose} scrollable>
      {!mostrarFormulario && (
        <Button label="Registrar nueva entrada" variant="primary" icon="plus"
          onPress={() => { setEditandoId(null); setMostrarFormulario(true); }} fullWidth />
      )}

      {mostrarFormulario && (
        <View style={styles.formulario}>
          <Text style={styles.titulo}>
            {editandoId !== null ? 'Editar entrada' : 'Nueva entrada'}
          </Text>

          {editandoId === null ? (
            <SelectorProducto
              productos={productos}
              seleccionado={productoSeleccionado}
              onSeleccionar={setProductoSeleccionado}
              mostrarPrecio="costo"
            />
          ) : (
            <View style={styles.productoFijo}>
              <MaterialCommunityIcons name="package-variant-closed" size={16} color={Colors.accent} />
              <Text style={styles.productoFijoTexto}>
                {productoSeleccionado?.nombre ?? ''}
              </Text>
            </View>
          )}

          <Controller control={control} name="cantidad"
            render={({ field: { onChange, value } }) => (
              <Input label="Cantidad" placeholder="0"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.cantidad?.message}
                keyboardType="decimal-pad" icon="counter" />
            )} />

          <Controller control={control} name="notas"
            render={({ field: { onChange, value } }) => (
              <Input label="Notas (opcional)" placeholder="Observaciones..."
                value={value ?? ''} onChangeText={onChange} icon="note-outline" />
            )} />

          <View style={styles.botones}>
            <Button label="Cancelar" variant="ghost" onPress={handleCancelar} style={{ flex: 1 }} />
            <Button
              label={editandoId !== null ? 'Actualizar' : 'Guardar'}
              variant="primary" icon="check"
              onPress={handleSubmit(onSubmit)} loading={isSubmitting}
              disabled={editandoId === null && !productoSeleccionado}
              style={{ flex: 2 }} />
          </View>
        </View>
      )}

      {entradas.length > 0 && (
        <View style={styles.lista}>
          <Divider />
          <Text style={styles.listaLabel}>
            {entradas.length} entrada{entradas.length !== 1 ? 's' : ''}
          </Text>
          {entradas.map((e) => (
            <View key={e.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre}>{e.producto_nombre}</Text>
                <Text style={styles.itemDetalle}>
                  {e.cantidad} uds · {formatFechaHora(e.fecha)}
                </Text>
                {e.notas && <Text style={styles.itemNotas}>{e.notas}</Text>}
              </View>
              <TouchableOpacity onPress={() => abrirEdicion(e)} style={styles.botonEditar}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmarEliminar(e.id, e.producto_nombre)}
                style={styles.botonEliminar}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.accentDanger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {entradas.length === 0 && !mostrarFormulario && (
        <View style={styles.vacio}>
          <MaterialCommunityIcons name="package-down" size={40} color={Colors.textDisabled} />
          <Text style={styles.vacioTexto}>Sin entradas registradas</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  formulario: { marginTop: Spacing.md },
  titulo: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, color: Colors.textPrimary, marginBottom: Spacing.md },
  productoFijo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  productoFijoTexto: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, color: Colors.textPrimary },
  botones: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  lista: { marginTop: Spacing.md },
  listaLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  itemInfo: { flex: 1 },
  itemNombre: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  itemDetalle: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  itemNotas: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textDisabled, marginTop: 2, fontStyle: 'italic' },
  botonEditar: { padding: Spacing.xs, marginLeft: Spacing.xs },
  botonEliminar: { padding: Spacing.xs, marginLeft: Spacing.xs },
  vacio: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm, marginTop: Spacing.md },
  vacioTexto: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, color: Colors.textDisabled },
});