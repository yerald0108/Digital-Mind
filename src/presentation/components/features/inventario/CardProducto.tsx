// src/presentation/components/features/inventario/CardProducto.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Producto } from '../../../../domain/entities/Producto';
import { ModalConfirmacion } from '../../ui/ModalConfirmacion';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';
import { useTheme } from '../../../hooks/useTheme';

interface CardProductoProps {
  producto: Producto;
  index: number;
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
}

export function CardProducto({
  producto,
  index,
  onEditar,
  onEliminar,
}: CardProductoProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const margen = producto.precio_venta - producto.precio_costo;
  const esPositivo = margen >= 0;
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <>
      <View style={styles.container}>
        {/* Número de orden */}
        <View style={styles.orden}>
          <Text style={styles.ordenTexto}>{index + 1}</Text>
        </View>

        {/* Info del producto */}
        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>
            {producto.nombre}
          </Text>
          <View style={styles.precios}>
            {/* Precio costo */}
            <View style={styles.precioItem}>
              <Text style={styles.precioLabel}>Costo</Text>
              <Text style={styles.precioCosto}>
                {formatMoneda(producto.precio_costo)}
              </Text>
            </View>
            {/* Separador */}
            <View style={styles.separador} />
            {/* Precio venta */}
            <View style={styles.precioItem}>
              <Text style={styles.precioLabel}>Venta</Text>
              <Text style={styles.precioVenta}>
                {formatMoneda(producto.precio_venta)}
              </Text>
            </View>
            {/* Separador */}
            <View style={styles.separador} />
            {/* Margen */}
            <View style={styles.precioItem}>
              <Text style={styles.precioLabel}>Margen</Text>
              <Text
                style={[
                  styles.margen,
                  { color: esPositivo ? Colors.accentSuccess : Colors.accentDanger },
                ]}
              >
                {esPositivo ? '+' : ''}{margen.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.acciones}>
          <TouchableOpacity
            style={styles.botonAccion}
            onPress={() => onEditar(producto)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color={Colors.accent}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonAccion, styles.botonEliminar]}
            onPress={() => setConfirmVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={Colors.accentDanger}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* ── Modal de Confirmación ── */}
      <ModalConfirmacion
        visible={confirmVisible}
        titulo="Eliminar producto"
        mensaje={`¿Seguro que deseas eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`}
        onConfirmar={() => {
          setConfirmVisible(false);
          onEliminar(producto.id);
        }}
        onCancelar={() => setConfirmVisible(false)}
      />
    </>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  orden: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ordenTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  precios: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  precioItem: {
    alignItems: 'center',
  },
  precioLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  precioCosto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  precioVenta: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
  margen: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  separador: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  acciones: {
    flexDirection: 'column',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  botonAccion: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  botonEliminar: {
    borderColor: 'rgba(232, 84, 84, 0.3)',
    backgroundColor: 'rgba(232, 84, 84, 0.08)',
  },
  });
}