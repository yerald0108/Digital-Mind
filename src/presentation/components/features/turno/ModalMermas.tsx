// src/presentation/components/features/turno/ModalMermas.tsx
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
import { Merma, MermaInput, TipoMerma } from '../../../../domain/entities/Merma';
import { mermaSchema } from '../../../../utils/validators';
import { useTheme } from '../../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatFechaHora } from '../../../../utils/formatters';
import { z } from 'zod';

type FormData = z.infer<typeof mermaSchema>;

const TIPOS_MERMA: {
  value: TipoMerma;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { value: 'roto', label: 'Roto', icon: 'package-variant-remove' },
  { value: 'vencido', label: 'Vencido', icon: 'calendar-remove-outline' },
  { value: 'otro', label: 'Otro', icon: 'dots-horizontal-circle-outline' },
];

interface ModalMermasProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  productos: Producto[];
  mermas: Merma[];
  onCrear: (input: MermaInput) => Promise<void>;
  onActualizar: (id: number, cantidad: number, tipo: string, notas: string | null) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
}

export function ModalMermas({
  visible, onClose, turnoId, productos, mermas,
  onCrear, onActualizar, onEliminar,
}: ModalMermasProps) {
  const { C } = useTheme();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoMerma>('roto');

  const [pendienteEliminar, setPendienteEliminar] = useState<{ id: number; nombre: string } | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(mermaSchema),
      defaultValues: { producto_id: 0, cantidad: 0, tipo: 'roto', notas: '' },
    });

  const abrirEdicion = (merma: Merma) => {
    setEditandoId(merma.id);
    setValue('cantidad', merma.cantidad);
    setValue('notas', merma.notas ?? '');
    setTipoSeleccionado(merma.tipo as TipoMerma);
    const prod = productos.find((p) => p.id === merma.producto_id);
    setProductoSeleccionado(prod ?? null);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setProductoSeleccionado(null);
    setTipoSeleccionado('roto');
    reset();
  };

  const onSubmit = async (data: FormData) => {
    if (editandoId !== null) {
      await onActualizar(editandoId, data.cantidad, tipoSeleccionado, data.notas || null);
    } else {
      if (!productoSeleccionado) return;
      await onCrear({
        turno_id: turnoId,
        producto_id: productoSeleccionado.id,
        producto_nombre: productoSeleccionado.nombre,
        cantidad: data.cantidad,
        tipo: tipoSeleccionado,
        notas: data.notas || null,
      });
    }
    handleCancelar();
  };

  const confirmarEliminar = (id: number, nombre: string) => {
    setPendienteEliminar({ id, nombre });
  };

  return (
    <Modal visible={visible} title="Mermas" onClose={onClose} scrollable>
      {!mostrarFormulario && (
        <Button label="Registrar nueva merma" variant="primary" icon="plus"
          onPress={() => { setEditandoId(null); setMostrarFormulario(true); }} fullWidth />
      )}

      {mostrarFormulario && (
        <View style={styles.formulario}>
          <Text style={[styles.titulo, { color: C.textPrimary }]}>
            {editandoId !== null ? 'Editar merma' : 'Nueva merma'}
          </Text>

          {editandoId === null ? (
            <SelectorProducto
              productos={productos}
              seleccionado={productoSeleccionado}
              onSeleccionar={setProductoSeleccionado}
              mostrarPrecio="venta"
            />
          ) : (
            <View style={[styles.productoFijo, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
              <MaterialCommunityIcons name="package-variant-remove" size={16} color={C.accentDanger} />
              <Text style={[styles.productoFijoTexto, { color: C.textPrimary }]}>
                {productoSeleccionado?.nombre ?? ''}
              </Text>
            </View>
          )}

          {/* Tipo */}
          <Text style={[styles.tipoLabel, { color: C.textSecondary }]}>Tipo de merma</Text>
          <View style={styles.tiposRow}>
            {TIPOS_MERMA.map((tipo) => {
              const activo = tipoSeleccionado === tipo.value;
              return (
                <TouchableOpacity key={tipo.value}
                  style={[
                    styles.tipoBoton,
                    { backgroundColor: C.bgElevated, borderColor: C.border },
                    activo && { backgroundColor: `${C.accentDanger}1A`, borderColor: `${C.accentDanger}66` },
                  ]}
                  onPress={() => setTipoSeleccionado(tipo.value)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name={tipo.icon} size={16}
                    color={activo ? C.accentDanger : C.textSecondary} />
                  <Text style={[
                    styles.tipoTexto,
                    { color: C.textSecondary },
                    activo && { color: C.accentDanger },
                  ]}>
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

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
              <Input label="Notas (opcional)" placeholder="Detalle de la merma..."
                value={value ?? ''} onChangeText={onChange} icon="note-outline" />
            )} />

          <View style={styles.botones}>
            <Button label="Cancelar" variant="ghost" onPress={handleCancelar} style={{ flex: 1 }} />
            <Button
              label={editandoId !== null ? 'Actualizar' : 'Guardar'}
              variant={editandoId !== null ? 'primary' : 'danger'} icon="check"
              onPress={handleSubmit(onSubmit)} loading={isSubmitting}
              disabled={editandoId === null && !productoSeleccionado}
              style={{ flex: 2 }} />
          </View>
        </View>
      )}

      {mermas.length > 0 && (
        <View style={styles.lista}>
          <Divider />
          <Text style={[styles.listaLabel, { color: C.textSecondary }]}>
            {mermas.length} merma{mermas.length !== 1 ? 's' : ''}
          </Text>
          {mermas.map((m) => (
            <View key={m.id} style={[styles.item, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemNombre, { color: C.textPrimary }]}>{m.producto_nombre}</Text>
                <Text style={[styles.itemDetalle, { color: C.textSecondary }]}>
                  {m.cantidad} uds · {m.tipo} · {formatFechaHora(m.fecha)}
                </Text>
                {m.notas && <Text style={[styles.itemNotas, { color: C.textDisabled }]}>{m.notas}</Text>}
              </View>
              <TouchableOpacity onPress={() => abrirEdicion(m)} style={styles.botonEditar}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={C.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmarEliminar(m.id, m.producto_nombre)}
                style={styles.botonEliminar}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={C.accentDanger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {mermas.length === 0 && !mostrarFormulario && (
        <View style={styles.vacio}>
          <MaterialCommunityIcons name="package-variant-remove" size={40} color={C.textDisabled} />
          <Text style={[styles.vacioTexto, { color: C.textDisabled }]}>Sin mermas registradas</Text>
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

const styles = StyleSheet.create({
  formulario: { marginTop: Spacing.md },
  titulo: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, marginBottom: Spacing.md },
  productoFijo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1 },
  productoFijoTexto: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md },
  tipoLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, marginBottom: Spacing.xs, letterSpacing: 0.3 },
  tiposRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tipoBoton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: Radius.md, borderWidth: 1, paddingVertical: Spacing.sm },
  tipoTexto: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
  botones: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  lista: { marginTop: Spacing.md },
  listaLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, marginBottom: Spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm },
  itemInfo: { flex: 1 },
  itemNombre: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  itemDetalle: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 },
  itemNotas: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2, fontStyle: 'italic' },
  botonEditar: { padding: Spacing.xs, marginLeft: Spacing.xs },
  botonEliminar: { padding: Spacing.xs, marginLeft: Spacing.xs },
  vacio: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm, marginTop: Spacing.md },
  vacioTexto: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm },
});