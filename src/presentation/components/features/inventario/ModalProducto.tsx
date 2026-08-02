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
import { useTheme } from '../../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../../constants/theme';
import { z } from 'zod';

type FormData = z.infer<typeof productoSchema>;

interface ModalProductoProps {
  visible: boolean;
  onClose: () => void;
  onGuardar: (data: FormData) => Promise<void>;
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
  const { C } = useTheme();

  const esCarrusel = productos.length > 0 && productoEditar !== null;
  const [indiceActual, setIndiceActual] = useState(indiceInicial);
  const [guardado, setGuardado] = useState(false);

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

  useEffect(() => {
    setIndiceActual(indiceInicial);
  }, [indiceInicial]);

  const onSubmit = async (data: FormData) => {
    try {
      await onGuardar(data);
      setGuardado(true);
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
    if (indiceActual < productos.length - 1 && !isSubmitting) {
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
      {/* Navegación carrusel */}
      {esCarrusel && productos.length > 1 && (
        <View style={[styles.carrusel, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
          <TouchableOpacity
            style={[
              styles.carruselBtn,
              (indiceActual === 0 || isSubmitting) && styles.carruselBtnDisabled,
            ]}
            onPress={irAnterior}
            disabled={indiceActual === 0 || isSubmitting} 
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={20}
              color={indiceActual === 0 ? C.textDisabled : C.accent}
            />
            <Text style={[
              styles.carruselTexto,
              { color: indiceActual === 0 ? C.textDisabled : C.accent },
            ]}>
              Anterior
            </Text>
          </TouchableOpacity>

          <View style={styles.carruselIndicador}>
            <Text style={[styles.carruselPosicion, { color: C.textPrimary }]}>
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
                      { backgroundColor: C.border },
                      realIndex === indiceActual && { backgroundColor: C.accent, width: 8, height: 8, borderRadius: 4 },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.carruselBtn,
              (indiceActual === productos.length - 1 || isSubmitting) && styles.carruselBtnDisabled,
            ]}
            onPress={irSiguiente}
            disabled={indiceActual === productos.length - 1 || isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.carruselTexto,
              { color: indiceActual === productos.length - 1 ? C.textDisabled : C.accent },
            ]}>
              Siguiente
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={indiceActual === productos.length - 1 ? C.textDisabled : C.accent}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Indicador de guardado exitoso */}
      {guardado && (
        <View style={[styles.guardadoBanner, { borderColor: 'rgba(52,199,123,0.3)' }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={C.accentSuccess} />
          <Text style={[styles.guardadoTexto, { color: C.accentSuccess }]}>
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

      {/* Cantidad */}
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
      <View style={[styles.margenContainer, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
        <Text style={[styles.margenLabel, { color: C.textSecondary }]}>Margen de ganancia</Text>
        <Text style={[
          styles.margenValor,
          { color: margen >= 0 ? C.accentSuccess : C.accentDanger },
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
    borderRadius: Radius.md,
    borderWidth: 1,
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
  },
  carruselIndicador: {
    alignItems: 'center',
    gap: 4,
  },
  carruselPosicion: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
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
  },
  guardadoTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  margenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
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
  botones: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  botonCancelar: { flex: 1 },
  botonGuardar: { flex: 2 },
});