// src/presentation/components/features/turno/ModalEntradas.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Divider } from '../../ui/Divider';
import { SelectorProducto } from '../../ui/SelectorProducto';
import { ModalConfirmacion } from '../../ui/ModalConfirmacion';
import { Producto, ProductoInput } from '../../../../domain/entities/Producto';
import { Entrada, EntradaInput } from '../../../../domain/entities/Entrada';
import { entradaSchema } from '../../../../utils/validators';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatFechaHora } from '../../../../utils/formatters';
import { useTheme } from '../../../hooks/useTheme';

// Schema combinado para entrada de producto NUEVO
const entradaProductoNuevoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  precio_costo: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo'),
  precio_venta: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo'),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  notas: z.string().optional(),
});

type FormDataExistente = z.infer<typeof entradaSchema>;
type FormDataNuevo = z.infer<typeof entradaProductoNuevoSchema>;

interface ModalEntradasProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  productos: Producto[];
  entradas: Entrada[];
  onCrear: (input: EntradaInput) => Promise<void>;
  onActualizar: (id: number, cantidad: number, notas: string | null) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
  // Nueva prop: para crear un producto nuevo desde aquí
  onCrearProducto: (input: Omit<ProductoInput, 'orden'>) => Promise<Producto>;
}

export function ModalEntradas({
  visible, onClose, turnoId, productos, entradas,
  onCrear, onActualizar, onEliminar, onCrearProducto,
}: ModalEntradasProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  // Modo: 'existente' = producto ya en inventario | 'nuevo' = producto que no existe
  const [modoProducto, setModoProducto] = useState<'existente' | 'nuevo'>('existente');

  const [pendienteEliminar, setPendienteEliminar] = useState<{ id: number; nombre: string } | null>(null);

  // ── Formulario para producto EXISTENTE ───────────────────────
  const {
    control: ctrlExistente,
    handleSubmit: handleExistente,
    reset: resetExistente,
    setValue: setValueExistente,
    formState: { errors: errorsExistente, isSubmitting: submittingExistente },
  } = useForm<FormDataExistente>({
    resolver: zodResolver(entradaSchema),
    defaultValues: { producto_id: 0, cantidad: 0, notas: '' },
  });

  // ── Formulario para producto NUEVO ───────────────────────────
  const {
    control: ctrlNuevo,
    handleSubmit: handleNuevo,
    reset: resetNuevo,
    watch: watchNuevo,
    formState: { errors: errorsNuevo, isSubmitting: submittingNuevo },
  } = useForm<FormDataNuevo>({
    resolver: zodResolver(entradaProductoNuevoSchema),
    defaultValues: { nombre: '', precio_costo: 0, precio_venta: 0, cantidad: 0, notas: '' },
  });

  const precioVenta = watchNuevo('precio_venta') || 0;
  const precioCosto = watchNuevo('precio_costo') || 0;
  const margen = precioVenta - precioCosto;

  // ── Abrir edición de entrada existente ───────────────────────
  const abrirEdicion = (entrada: Entrada) => {
    setEditandoId(entrada.id);
    setValueExistente('cantidad', entrada.cantidad);
    setValueExistente('notas', entrada.notas ?? '');
    const prod = productos.find((p) => p.id === entrada.producto_id);
    setProductoSeleccionado(prod ?? null);
    setModoProducto('existente');
    setMostrarFormulario(true);
  };

  // ── Cancelar / limpiar ───────────────────────────────────────
  const handleCancelar = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setProductoSeleccionado(null);
    setModoProducto('existente');
    resetExistente();
    resetNuevo();
  };

  // ── Submit: producto existente ────────────────────────────────
  const onSubmitExistente = async (data: FormDataExistente) => {
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
        precio_venta: productoSeleccionado.precio_venta,
        notas: data.notas || null,
      });
    }
    handleCancelar();
  };

  // ── Submit: producto NUEVO ────────────────────────────────────
  const onSubmitNuevo = async (data: FormDataNuevo) => {
    // 1. Crear el producto en el inventario permanente
    const productoNuevo = await onCrearProducto({
      nombre: data.nombre.trim(),
      precio_costo: data.precio_costo,
      precio_venta: data.precio_venta,
      cantidad: 0, // empieza en 0; la entrada registra lo que llega
    });

    // 2. Registrar la entrada con ese nuevo producto
    await onCrear({
      turno_id: turnoId,
      producto_id: productoNuevo.id,
      producto_nombre: productoNuevo.nombre,
      cantidad: data.cantidad,
      precio_costo: data.precio_costo,
      precio_venta: data.precio_venta,
      notas: data.notas || null,
    });

    handleCancelar();
  };

  // ── Eliminar ─────────────────────────────────────────────────
  const confirmarEliminar = (id: number, nombre: string) => {
    setPendienteEliminar({ id, nombre });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <Modal visible={visible} title="Entradas" onClose={onClose} scrollable>

      {/* Botón principal: mostrar formulario */}
      {!mostrarFormulario && (
        <Button
          label="Registrar nueva entrada"
          variant="primary"
          icon="plus"
          onPress={() => { setEditandoId(null); setMostrarFormulario(true); }}
          fullWidth
        />
      )}

      {/* ── FORMULARIO ── */}
      {mostrarFormulario && (
        <View style={styles.formulario}>
          <Text style={styles.titulo}>
            {editandoId !== null ? 'Editar entrada' : 'Nueva entrada'}
          </Text>

          {/* Solo mostrar el selector de modo cuando es creación, no edición */}
          {editandoId === null && (
            <View style={styles.selectorModo}>
              <TouchableOpacity
                style={[
                  styles.botonModo,
                  modoProducto === 'existente' && styles.botonModoActivo,
                  { borderColor: modoProducto === 'existente' ? Colors.accent : Colors.border },
                ]}
                onPress={() => {
                  setModoProducto('existente');
                  resetNuevo();
                  setProductoSeleccionado(null);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={16}
                  color={modoProducto === 'existente' ? Colors.accent : Colors.textSecondary}
                />
                <Text style={[
                  styles.botonModoTexto,
                  { color: modoProducto === 'existente' ? Colors.accent : Colors.textSecondary },
                ]}>
                  Del inventario
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botonModo,
                  modoProducto === 'nuevo' && styles.botonModoActivo,
                  { borderColor: modoProducto === 'nuevo' ? Colors.accentWarning : Colors.border },
                ]}
                onPress={() => {
                  setModoProducto('nuevo');
                  resetExistente();
                  setProductoSeleccionado(null);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={16}
                  color={modoProducto === 'nuevo' ? Colors.accentWarning : Colors.textSecondary}
                />
                <Text style={[
                  styles.botonModoTexto,
                  { color: modoProducto === 'nuevo' ? Colors.accentWarning : Colors.textSecondary },
                ]}>
                  Producto nuevo
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── MODO: producto del inventario existente ── */}
          {(modoProducto === 'existente' || editandoId !== null) && (
            <>
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

              <Controller
                control={ctrlExistente}
                name="cantidad"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Cantidad"
                    placeholder="0"
                    value={value === 0 ? '' : String(value)}
                    onChangeText={(t) => onChange(parseFloat(t) || 0)}
                    error={errorsExistente.cantidad?.message}
                    keyboardType="decimal-pad"
                    icon="counter"
                  />
                )}
              />

              <Controller
                control={ctrlExistente}
                name="notas"
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
                <Button label="Cancelar" variant="ghost" onPress={handleCancelar} style={{ flex: 1 }} />
                <Button
                  label={editandoId !== null ? 'Actualizar' : 'Guardar'}
                  variant="primary"
                  icon="check"
                  onPress={handleExistente(onSubmitExistente)}
                  loading={submittingExistente}
                  disabled={editandoId === null && !productoSeleccionado}
                  style={{ flex: 2 }}
                />
              </View>
            </>
          )}

          {/* ── MODO: producto nuevo (no está en inventario) ── */}
          {modoProducto === 'nuevo' && editandoId === null && (
            <>
              {/* Aviso informativo */}
              <View style={[styles.avisoNuevo, { backgroundColor: `${Colors.accentWarning}12`, borderColor: `${Colors.accentWarning}35` }]}>
                <MaterialCommunityIcons name="information-outline" size={15} color={Colors.accentWarning} />
                <Text style={[styles.avisoNuevoTexto, { color: Colors.accentWarning }]}>
                  Este producto se añadirá al inventario y quedará disponible en futuros turnos.
                </Text>
              </View>

              <Divider />

              {/* Nombre */}
              <Controller
                control={ctrlNuevo}
                name="nombre"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Nombre del producto"
                    placeholder="Ej: Café, Refresco..."
                    value={value}
                    onChangeText={onChange}
                    error={errorsNuevo.nombre?.message}
                    icon="tag-outline"
                    autoCapitalize="words"
                  />
                )}
              />

              {/* Precio de costo */}
              <Controller
                control={ctrlNuevo}
                name="precio_costo"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Precio de costo (CUP)"
                    placeholder="0.00"
                    value={value === 0 ? '' : String(value)}
                    onChangeText={(t) => onChange(parseFloat(t) || 0)}
                    error={errorsNuevo.precio_costo?.message}
                    icon="cash-minus"
                    keyboardType="decimal-pad"
                  />
                )}
              />

              {/* Precio de venta */}
              <Controller
                control={ctrlNuevo}
                name="precio_venta"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Precio de venta (CUP)"
                    placeholder="0.00"
                    value={value === 0 ? '' : String(value)}
                    onChangeText={(t) => onChange(parseFloat(t) || 0)}
                    error={errorsNuevo.precio_venta?.message}
                    icon="cash-plus"
                    keyboardType="decimal-pad"
                  />
                )}
              />

              {/* Margen de ganancia (informativo) */}
              <View style={[styles.margenContainer, { backgroundColor: Colors.bgElevated, borderColor: Colors.border }]}>
                <Text style={[styles.margenLabel, { color: Colors.textSecondary }]}>Margen de ganancia</Text>
                <Text style={[
                  styles.margenValor,
                  { color: margen >= 0 ? Colors.accentSuccess : Colors.accentDanger },
                ]}>
                  {margen >= 0 ? '+' : ''}{margen.toFixed(2)} CUP
                </Text>
              </View>

              <Divider />

              {/* Cantidad que entra ahora */}
              <Controller
                control={ctrlNuevo}
                name="cantidad"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Cantidad que entra ahora"
                    placeholder="0"
                    value={value === 0 ? '' : String(value)}
                    onChangeText={(t) => onChange(parseFloat(t) || 0)}
                    error={errorsNuevo.cantidad?.message}
                    keyboardType="decimal-pad"
                    icon="counter"
                  />
                )}
              />

              {/* Notas */}
              <Controller
                control={ctrlNuevo}
                name="notas"
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
                <Button label="Cancelar" variant="ghost" onPress={handleCancelar} style={{ flex: 1 }} />
                <Button
                  label="Guardar"
                  variant="primary"
                  icon="check"
                  onPress={handleNuevo(onSubmitNuevo)}
                  loading={submittingNuevo}
                  style={{ flex: 2 }}
                />
              </View>
            </>
          )}
        </View>
      )}

      {/* ── LISTA de entradas registradas ── */}
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
                style={styles.botonEliminar}
              >
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

      {/* ── Modal de Confirmación ── */}
      <ModalConfirmacion
        visible={pendienteEliminar !== null}
        titulo="Eliminar entrada"
        mensaje={`¿Eliminar la entrada de "${pendienteEliminar?.nombre}"?`}  
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
    titulo: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.md,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },
    // ── Selector de modo ──
    selectorModo: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    botonModo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      borderWidth: 1.5,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      backgroundColor: Colors.bgElevated,
    },
    botonModoActivo: {
      backgroundColor: 'transparent',
    },
    botonModoTexto: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
    },
    // ── Aviso producto nuevo ──
    avisoNuevo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    avisoNuevoTexto: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.xs,
      flex: 1,
      lineHeight: 18,
    },
    // ── Margen ──
    margenContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
    },
    margenLabel: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
    },
    margenValor: {
      fontFamily: Typography.fontFamilyBold,
      fontSize: Typography.size.md,
    },
    // ── Producto fijo (en edición) ──
    productoFijo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.bgElevated,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    productoFijoTexto: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.md,
      color: Colors.textPrimary,
    },
    // ── Botones de acción ──
    botones: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    // ── Lista de entradas ──
    lista: { marginTop: Spacing.md },
    listaLabel: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
      color: Colors.textSecondary,
      marginBottom: Spacing.md,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.bgElevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    itemInfo: { flex: 1 },
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
    itemNotas: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.xs,
      color: Colors.textDisabled,
      marginTop: 2,
      fontStyle: 'italic',
    },
    botonEditar: { padding: Spacing.xs, marginLeft: Spacing.xs },
    botonEliminar: { padding: Spacing.xs, marginLeft: Spacing.xs },
    // ── Estado vacío ──
    vacio: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    vacioTexto: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.sm,
      color: Colors.textDisabled,
    },
  });
}