// src/presentation/components/features/turno/ModalCambiosPrecio.tsx
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
import { ModalConfirmacion } from '../../ui/ModalConfirmacion';
import { Producto } from '../../../../domain/entities/Producto';
import { CambioPrecio, CambioPrecioInput } from '../../../../domain/entities/CambioPrecio';
import { cambioPrecioSchema } from '../../../../utils/validators';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatFechaHora, formatMoneda } from '../../../../utils/formatters';
import { z } from 'zod';
import { useTheme } from '../../../hooks/useTheme';

type FormData = z.infer<typeof cambioPrecioSchema>;

interface ModalCambiosPrecioProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  productos: Producto[];
  cambios: CambioPrecio[];
  onCrear: (input: CambioPrecioInput) => Promise<void>;
  onActualizar: (id: number, precioNuevo: number, cantidad: number, notas: string | null) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function ModalCambiosPrecio({
  visible, onClose, turnoId, productos, cambios,
  onCrear, onActualizar, onEliminar,
}: ModalCambiosPrecioProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  const [pendienteEliminar, setPendienteEliminar] = useState<{ id: number; nombre: string } | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(cambioPrecioSchema),
      defaultValues: { producto_id: 0, precio_nuevo: 0, cantidad_existente: 0, notas: '' },
    });

  const abrirEdicion = (cambio: CambioPrecio) => {
    setEditandoId(cambio.id);
    setValue('precio_nuevo', cambio.precio_nuevo);
    setValue('cantidad_existente', cambio.cantidad_existente);
    setValue('notas', cambio.notas ?? '');
    const prod = productos.find((p) => p.id === cambio.producto_id);
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
      await onActualizar(editandoId, data.precio_nuevo, data.cantidad_existente, data.notas || null);
    } else {
      if (!productoSeleccionado) return;
      await onCrear({
        turno_id: turnoId,
        producto_id: productoSeleccionado.id,
        producto_nombre: productoSeleccionado.nombre,
        precio_anterior: productoSeleccionado.precio_venta,
        precio_nuevo: data.precio_nuevo,
        cantidad_existente: data.cantidad_existente,
        notas: data.notas || null,
      });
    }
    handleCancelar();
  };

  const confirmarEliminar = (id: number, nombre: string) => {
    setPendienteEliminar({ id, nombre });
  };

  return (
    <Modal visible={visible} title="Cambios de precio" onClose={onClose} scrollable>
      {!mostrarFormulario && (
        <Button label="Registrar cambio de precio" variant="primary" icon="plus"
          onPress={() => { setEditandoId(null); setMostrarFormulario(true); }} fullWidth />
      )}

      {mostrarFormulario && (
        <View style={styles.formulario}>
          <Text style={styles.titulo}>
            {editandoId !== null ? 'Editar cambio de precio' : 'Nuevo cambio de precio'}
          </Text>

          <View style={styles.aviso}>
            <MaterialCommunityIcons name="information-outline" size={14} color={Colors.accentWarning} />
            <Text style={styles.avisoTexto}>
              Las unidades existentes al momento del cambio son clave para el cálculo del cuadre.
            </Text>
          </View>

          {editandoId === null ? (
            <SelectorProducto
              productos={productos}
              seleccionado={productoSeleccionado}
              onSeleccionar={setProductoSeleccionado}
              mostrarPrecio="ambos"
            />
          ) : (
            <View style={styles.productoFijo}>
              <MaterialCommunityIcons name="tag-edit-outline" size={16} color={Colors.accent} />
              <Text style={styles.productoFijoTexto}>
                {productoSeleccionado?.nombre ?? ''}
              </Text>
            </View>
          )}

          {productoSeleccionado && editandoId === null && (
            <View style={styles.precioActual}>
              <Text style={styles.precioActualLabel}>Precio de venta actual</Text>
              <Text style={styles.precioActualValor}>
                {formatMoneda(productoSeleccionado.precio_venta)}
              </Text>
            </View>
          )}

          <Controller control={control} name="precio_nuevo"
            render={({ field: { onChange, value } }) => (
              <Input label="Nuevo precio de venta" placeholder="0.00"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.precio_nuevo?.message}
                keyboardType="decimal-pad" icon="tag-edit-outline" />
            )} />

          <Controller control={control} name="cantidad_existente"
            render={({ field: { onChange, value } }) => (
              <Input label="Unidades existentes en ese momento" placeholder="0"
                value={value === 0 ? '' : String(value)}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                error={errors.cantidad_existente?.message}
                keyboardType="decimal-pad" icon="package-variant-closed" />
            )} />

          <Controller control={control} name="notas"
            render={({ field: { onChange, value } }) => (
              <Input label="Notas (opcional)" placeholder="Motivo del cambio..."
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

      {cambios.length > 0 && (
        <View style={styles.lista}>
          <Divider />
          <Text style={styles.listaLabel}>{cambios.length} cambio{cambios.length !== 1 ? 's' : ''}</Text>
          {cambios.map((c) => (
            <View key={c.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre}>{c.producto_nombre}</Text>
                <View style={styles.preciosRow}>
                  <Text style={styles.precioAnterior}>{formatMoneda(c.precio_anterior)}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={12} color={Colors.textSecondary} />
                  <Text style={styles.precioNuevo}>{formatMoneda(c.precio_nuevo)}</Text>
                  <Text style={styles.itemDetalle}>· {c.cantidad_existente} uds</Text>
                </View>
                <Text style={styles.itemFecha}>{formatFechaHora(c.fecha)}</Text>
              </View>
              <TouchableOpacity onPress={() => abrirEdicion(c)} style={styles.botonEditar}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmarEliminar(c.id, c.producto_nombre)}
                style={styles.botonEliminar}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.accentDanger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {cambios.length === 0 && !mostrarFormulario && (
        <View style={styles.vacio}>
          <MaterialCommunityIcons name="tag-edit-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.vacioTexto}>Sin cambios de precio registrados</Text>
        </View>
      )}

      {/* ── Modal de Confirmación ── */}
      <ModalConfirmacion
        visible={pendienteEliminar !== null}
        titulo="Eliminar merma"
        mensaje={`¿Eliminar la merma de "${pendienteEliminar?.nombre}"?`}  
        onConfirmar={() => {
          if (pendienteEliminar) onEliminar(pendienteEliminar.id);
          setPendienteEliminar(null);
        }}
        onCancelar={() => setPendienteEliminar(null)}
      />
    </Modal>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  formulario: { marginTop: Spacing.md },
  titulo: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, color: Colors.textPrimary, marginBottom: Spacing.sm },
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, backgroundColor: 'rgba(240,180,41,0.1)', borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(240,180,41,0.2)' },
  avisoTexto: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.accentWarning, flex: 1, lineHeight: 16 },
  productoFijo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgElevated, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  productoFijoTexto: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, color: Colors.textPrimary },
  precioActual: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bgElevated, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  precioActualLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, color: Colors.textSecondary },
  precioActualValor: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md, color: Colors.textPrimary },
  botones: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  lista: { marginTop: Spacing.md },
  listaLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  itemInfo: { flex: 1 },
  itemNombre: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm, color: Colors.textPrimary, marginBottom: 4 },
  preciosRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  precioAnterior: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.xs, color: Colors.textSecondary, textDecorationLine: 'line-through' },
  precioNuevo: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.xs, color: Colors.accentSuccess },
  itemDetalle: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textSecondary },
  itemFecha: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textDisabled },
  botonEditar: { padding: Spacing.xs, marginLeft: Spacing.xs },
  botonEliminar: { padding: Spacing.xs, marginLeft: Spacing.xs },
  vacio: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm, marginTop: Spacing.md },
  vacioTexto: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, color: Colors.textDisabled },
  });
}
