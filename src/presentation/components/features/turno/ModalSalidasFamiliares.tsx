// src/presentation/components/features/turno/ModalSalidasFamiliares.tsx
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
import { SalidaFamiliar, SalidaFamiliarInput } from '../../../../domain/entities/SalidaFamiliar';
import { salidaFamiliarSchema } from '../../../../utils/validators';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatFechaHora } from '../../../../utils/formatters';
import { z } from 'zod';
import { useTheme } from '../../../hooks/useTheme';

type FormData = z.infer<typeof salidaFamiliarSchema>;

interface ModalSalidasFamiliaresProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  productos: Producto[];
  salidas: SalidaFamiliar[];
  onCrear: (input: SalidaFamiliarInput) => Promise<void>;
  onActualizar: (id: number, cantidad: number, quien: string, notas: string | null) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function ModalSalidasFamiliares({
  visible, onClose, turnoId, productos, salidas,
  onCrear, onActualizar, onEliminar,
}: ModalSalidasFamiliaresProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  const [pendienteEliminar, setPendienteEliminar] = useState<{ id: number; nombre: string } | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(salidaFamiliarSchema),
      defaultValues: { producto_id: 0, cantidad: 0, quien_sustrajo: '', notas: '' },
    });

  const abrirEdicion = (salida: SalidaFamiliar) => {
    setEditandoId(salida.id);
    setValue('cantidad', salida.cantidad);
    setValue('quien_sustrajo', salida.quien_sustrajo);
    setValue('notas', salida.notas ?? '');
    const prod = productos.find((p) => p.id === salida.producto_id);
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
      await onActualizar(editandoId, data.cantidad, data.quien_sustrajo, data.notas || null);
    } else {
      if (!productoSeleccionado) return;
      await onCrear({
        turno_id: turnoId,
        producto_id: productoSeleccionado.id,
        producto_nombre: productoSeleccionado.nombre,
        cantidad: data.cantidad,
        quien_sustrajo: data.quien_sustrajo,
        notas: data.notas || null,
      });
    }
    handleCancelar();
  };

  const confirmarEliminar = (id: number, nombre: string) => {
    setPendienteEliminar({ id, nombre });
  };

  return (
    <Modal visible={visible} title="Salidas familiares" onClose={onClose} scrollable>
      {!mostrarFormulario && (
        <Button label="Registrar nueva salida" variant="primary" icon="plus"
          onPress={() => { setEditandoId(null); setMostrarFormulario(true); }} fullWidth />
      )}

      {mostrarFormulario && (
        <View style={styles.formulario}>
          <Text style={styles.titulo}>
            {editandoId !== null ? 'Editar salida' : 'Nueva salida familiar'}
          </Text>

          {editandoId === null ? (
            <SelectorProducto
              productos={productos}
              seleccionado={productoSeleccionado}
              onSeleccionar={setProductoSeleccionado}
              mostrarPrecio="venta"
            />
          ) : (
            <View style={styles.productoFijo}>
              <MaterialCommunityIcons name="package-variant-closed" size={16} color={Colors.accentWarning} />
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

          <Controller control={control} name="quien_sustrajo"
            render={({ field: { onChange, value } }) => (
              <Input label="¿Quién sustrajo?" placeholder="Nombre de la persona..."
                value={value} onChangeText={onChange}
                error={errors.quien_sustrajo?.message} icon="account-outline" />
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

      {salidas.length > 0 && (
        <View style={styles.lista}>
          <Divider />
          <Text style={styles.listaLabel}>{salidas.length} salida{salidas.length !== 1 ? 's' : ''}</Text>
          {salidas.map((s) => (
            <View key={s.id} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre}>{s.producto_nombre}</Text>
                <Text style={styles.itemDetalle}>
                  {s.cantidad} uds · {s.quien_sustrajo} · {formatFechaHora(s.fecha)}
                </Text>
                {s.notas && <Text style={styles.itemNotas}>{s.notas}</Text>}
              </View>
              <TouchableOpacity onPress={() => abrirEdicion(s)} style={styles.botonEditar}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmarEliminar(s.id, s.producto_nombre)}
                style={styles.botonEliminar}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.accentDanger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {salidas.length === 0 && !mostrarFormulario && (
        <View style={styles.vacio}>
          <MaterialCommunityIcons name="account-arrow-right-outline" size={40} color={Colors.textDisabled} />
          <Text style={styles.vacioTexto}>Sin salidas familiares registradas</Text>
        </View>
      )}

      {/* ── Modal de Confirmación ── */}
      <ModalConfirmacion
        visible={pendienteEliminar !== null}
        titulo="Eliminar salida familiar"
        mensaje={`¿Eliminar la salida familiar de "${pendienteEliminar?.nombre}"?`}  
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
}
