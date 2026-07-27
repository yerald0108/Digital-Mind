// src/presentation/components/features/inventario/ModalProducto.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Divider } from '../../ui/Divider';
import { Producto } from '../../../../domain/entities/Producto';
import { productoSchema } from '../../../../utils/validators';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { z } from 'zod';

type FormData = z.infer<typeof productoSchema>;

interface ModalProductoProps {
  visible: boolean;
  onClose: () => void;
  onGuardar: (data: FormData) => Promise<void>;
  // Para modo edición con carrusel
  productos?: Producto[];
  productoEditar?: Producto | null;
  indiceInicial?: number;
}

export function ModalProducto({
  visible,
  onClose,
  onGuardar,
  productos = [],
  productoEditar,
  indiceInicial = 0,
}: ModalProductoProps) {
  // Si hay lista de productos para el carrusel usamos índice
  const esCarrusel = productos.length > 0 && productoEditar !== null;
  const [indiceActual, setIndiceActual] = useState(indiceInicial);
  const [guardado, setGuardado] = useState(false);

  // Producto actual según el modo
  const productoActual = esCarrusel
    ? productos[indiceActual] ?? null
    : productoEditar ?? null;

  const esEdicion = !!productoActual;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: '',
      precio_costo: 0,
      precio_venta: 0,
      cantidad: 0,
    },
  });

  const precioVenta = watch('precio_venta') || 0;
  const precioCosto = watch('precio_costo') || 0;
  const margen = precioVenta - precioCosto;

  // Cargar datos del producto actual
  useEffect(() => {
    if (productoActual) {
      reset({
        nombre: productoActual.nombre,
        precio_costo: productoActual.precio_costo,
        precio_venta: productoActual.precio_venta,
        cantidad: productoActual.cantidad,
      });
      setGuardado(false);
    } else {
      reset({ nombre: '', precio_costo: 0, precio_venta: 0, cantidad: 0 });
    }
  }, [productoActual?.id, indiceActual]);

  // Sincronizar índice cuando cambia indiceInicial
  useEffect(() => {
    setIndiceActual(indiceInicial);
  }, [indiceInicial]);

  const onSubmit = async (data: FormData) => {
    try {
      await onGuardar(data);
      setGuardado(true);
      // En modo carrusel NO cerramos el modal
      if (!esCarrusel) {
        reset();
        onClose();
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar el producto');
    }
  };

  const handleClose = () => {
    reset();
    setGuardado(false);
    onClose();
  };

  const irAnterior = () => {
    if (indiceActual > 0) {
      setIndiceActual(indiceActual - 1);
      setGuardado(false);
    }
  };

  const irSiguiente = () => {
    if (indiceActual < productos.length - 1) {
      setIndiceActual(indiceActual + 1);
      setGuardado(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
      onClose={handleClose}
      scrollable
    >
      {/* Navegación carrusel — solo en modo edición con lista */}
      {esCarrusel && productos.length > 1 && (
        <View style={styles.carrusel}>
          <TouchableOpacity
            style={[styles.carruselBtn, indiceActual === 0 && styles.carruselBtnDisabled]}
            onPress={irAnterior}
            disabled={indiceActual === 0}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={20}
              color={indiceActual === 0 ? Colors.textDisabled : Colors.accent}
            />
            <Text style={[
              styles.carruselTexto,
              indiceActual === 0 && styles.carruselTextoDisabled,
            ]}>
              Anterior
            </Text>
          </TouchableOpacity>

          {/* Indicador de posición */}
          <View style={styles.carruselIndicador}>
            <Text style={styles.carruselPosicion}>
              {indiceActual + 1} / {productos.length}
            </Text>
            <View style={styles.dotsRow}>
              {productos.slice(
                Math.max(0, indiceActual - 2),
                Math.min(productos.length, indiceActual + 3)
              ).map((_, i) => {
                const realIndex = Math.max(0, indiceActual - 2) + i;
                return (
                  <View
                    key={realIndex}
                    style={[
                      styles.dot,
                      realIndex === indiceActual && styles.dotActivo,
                    ]}
                  />
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.carruselBtn,
              indiceActual === productos.length - 1 && styles.carruselBtnDisabled,
            ]}
            onPress={irSiguiente}
            disabled={indiceActual === productos.length - 1}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.carruselTexto,
              indiceActual === productos.length - 1 && styles.carruselTextoDisabled,
            ]}>
              Siguiente
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={indiceActual === productos.length - 1 ? Colors.textDisabled : Colors.accent}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Indicador de guardado exitoso */}
      {guardado && (
        <View style={styles.guardadoBanner}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.accentSuccess} />
          <Text style={styles.guardadoTexto}>
            Guardado correctamente
          </Text>
        </View>
      )}

      {/* Nombre */}
      <Controller
        control={control}
        name="nombre"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Nombre del producto"
            placeholder="Ej: Café, Refresco..."
            value={value}
            onChangeText={onChange}
            error={errors.nombre?.message}
            icon="tag-outline"
            autoCapitalize="words"
          />
        )}
      />

      {/* Cantidad en existencia */}
      <Controller
        control={control}
        name="cantidad"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Cantidad en existencia"
            placeholder="0"
            value={value === 0 ? '' : String(value)}
            onChangeText={(t) => onChange(parseFloat(t) || 0)}
            error={errors.cantidad?.message}
            icon="package-variant-closed"
            keyboardType="decimal-pad"
          />
        )}
      />

      <Divider />

      {/* Precio de costo */}
      <Controller
        control={control}
        name="precio_costo"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Precio de costo (CUP)"
            placeholder="0.00"
            value={value === 0 ? '' : String(value)}
            onChangeText={(t) => onChange(parseFloat(t) || 0)}
            error={errors.precio_costo?.message}
            icon="cash-minus"
            keyboardType="decimal-pad"
          />
        )}
      />

      {/* Precio de venta */}
      <Controller
        control={control}
        name="precio_venta"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Precio de venta (CUP)"
            placeholder="0.00"
            value={value === 0 ? '' : String(value)}
            onChangeText={(t) => onChange(parseFloat(t) || 0)}
            error={errors.precio_venta?.message}
            icon="cash-plus"
            keyboardType="decimal-pad"
          />
        )}
      />

      {/* Margen */}
      <View style={styles.margenContainer}>
        <Text style={styles.margenLabel}>Margen de ganancia</Text>
        <Text style={[
          styles.margenValor,
          { color: margen >= 0 ? Colors.accentSuccess : Colors.accentDanger },
        ]}>
          {margen >= 0 ? '+' : ''}{margen.toFixed(2)} CUP
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.botones}>
        <Button
          label="Cerrar"
          variant="ghost"
          onPress={handleClose}
          style={styles.botonCancelar}
        />
        <Button
          label={esEdicion ? 'Actualizar' : 'Guardar'}
          variant="primary"
          icon={esEdicion ? 'content-save-outline' : 'plus'}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.botonGuardar}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  carrusel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  carruselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  carruselBtnDisabled: {
    opacity: 0.4,
  },
  carruselTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
  carruselTextoDisabled: {
    color: Colors.textDisabled,
  },
  carruselIndicador: {
    alignItems: 'center',
    gap: 4,
  },
  carruselPosicion: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  guardadoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(52,199,123,0.1)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52,199,123,0.3)',
  },
  guardadoTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.accentSuccess,
  },
  margenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  margenLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  margenValor: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
  },
  botones: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  botonCancelar: { flex: 1 },
  botonGuardar: { flex: 2 },
});