// src/presentation/components/features/cuadre/SeccionInventarioFinal.tsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ItemFinal } from '../../../../presentation/hooks/useInventarioFinal';
import { ItemInventarioTurno } from '../../../../domain/entities/InventarioTurno';
import { Entrada } from '../../../../domain/entities/Entrada';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';
import { useTheme } from '../../../hooks/useTheme';

interface SeccionInventarioFinalProps {
  items: ItemFinal[];
  inventarioInicial: ItemInventarioTurno[];
  entradas: Entrada[];
  onActualizarCantidad: (productoId: number, cantidad: number) => void;
  onGuardar: () => void;
  guardando: boolean;
}

export function SeccionInventarioFinal({
  items,
  inventarioInicial,
  entradas,
  onActualizarCantidad,
  onGuardar,
  guardando,
}: SeccionInventarioFinalProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  if (items.length === 0) {
    return (
      <View style={styles.vacio}>
        <MaterialCommunityIcons
          name="package-variant"
          size={48}
          color={Colors.textDisabled}
        />
        <Text style={styles.vacioTitulo}>Sin productos</Text>
        <Text style={styles.vacioDescripcion}>
          Agrega productos al inventario antes de realizar el cuadre.
        </Text>
      </View>
    );
  }

  // Helpers para buscar datos por producto
  const getCantidadInicial = (productoId: number): number => {
    return inventarioInicial.find((i) => i.producto_id === productoId)?.cantidad ?? 0;
  };

  const getCantidadEntradas = (productoId: number): number => {
    return entradas
      .filter((e) => e.producto_id === productoId)
      .reduce((acc, e) => acc + e.cantidad, 0);
  };

  const totalIngresado = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.descripcion}>
        Realiza el conteo físico de cada producto e ingresa la cantidad
        que quedó al cierre del turno.
      </Text>

      {/* Resumen */}
      <View style={styles.resumen}>
        <MaterialCommunityIcons name="counter" size={15} color={Colors.accent} />
        <Text style={styles.resumenTexto}>
          {items.length} productos · {totalIngresado} uds finales ingresadas
        </Text>
      </View>

      {/* Lista de productos */}
      {items.map((item, index) => {
        const cantInicial = getCantidadInicial(item.producto_id);
        const cantEntradas = getCantidadEntradas(item.producto_id);
        const disponible = cantInicial + cantEntradas;

        return (
          <View
            key={item.producto_id}
            style={[styles.card, index % 2 === 0 && styles.cardAlterna]}
          >
            {/* Encabezado del producto */}
            <View style={styles.cardHeader}>
              <View style={styles.numeroBadge}>
                <Text style={styles.numeroTexto}>{index + 1}</Text>
              </View>
              <Text style={styles.nombre} numberOfLines={1}>
                {item.producto_nombre}
              </Text>
              <Text style={styles.precioVenta}>
                {formatMoneda(item.precio_venta)}
              </Text>
            </View>

            {/* Datos del turno */}
            <View style={styles.datosRow}>
              {/* Inicial */}
              <View style={styles.datoItem}>
                <Text style={styles.datoLabel}>Inicial</Text>
                <Text style={styles.datoValor}>{cantInicial}</Text>
              </View>

              {/* Entradas */}
              <View style={styles.datoItem}>
                <Text style={styles.datoLabel}>Entradas</Text>
                <Text style={[
                  styles.datoValor,
                  cantEntradas > 0 && styles.datoEntrada,
                ]}>
                  {cantEntradas > 0 ? `+${cantEntradas}` : '0'}
                </Text>
              </View>

              {/* Disponible */}
              <View style={styles.datoItem}>
                <Text style={styles.datoLabel}>Disponible</Text>
                <Text style={styles.datoDisponible}>{disponible}</Text>
              </View>

              {/* Separador visual */}
              <View style={styles.separadorVertical} />

              {/* Input cantidad final */}
              <View style={styles.datoItemFinal}>
                <Text style={styles.datoLabel}>Cant. final</Text>
                <TextInput
                  style={[
                    styles.inputCantidad,
                    item.cantidad > 0 && styles.inputActivo,
                  ]}
                  value={item.cantidad === 0 ? '' : String(item.cantidad)}
                  onChangeText={(t) =>
                    onActualizarCantidad(item.producto_id, parseFloat(t) || 0)
                  }
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textDisabled}
                  selectTextOnFocus
                />
              </View>
            </View>

            {/* Vendidas estimadas */}
            {item.cantidad > 0 && (
              <View style={styles.vendidoRow}>
                <MaterialCommunityIcons
                  name="cart-outline"
                  size={12}
                  color={Colors.textSecondary}
                />
                <Text style={styles.vendidoTexto}>
                  Vendidas estimadas:{' '}
                  <Text style={styles.vendidoValor}>
                    {Math.max(0, disponible - item.cantidad)}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Botón guardar */}
      <TouchableOpacity
        style={[styles.botonGuardar, guardando && styles.botonGuardando]}
        onPress={onGuardar}
        activeOpacity={0.8}
        disabled={guardando}
      >
        <MaterialCommunityIcons
          name="content-save-outline"
          size={18}
          color={Colors.textOnAccent}
        />
        <Text style={styles.botonGuardarTexto}>
          {guardando ? 'Guardando...' : 'Guardar inventario final'}
        </Text>
      </TouchableOpacity>
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
    lineHeight: 20,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(79,142,247,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.2)',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  resumenTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardAlterna: {
    backgroundColor: Colors.bgElevated,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  numeroBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  numeroTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  nombre: {
    flex: 1,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  precioVenta: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.accent,
  },
  datosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  datoItem: {
    alignItems: 'center',
    flex: 1,
  },
  datoItemFinal: {
    alignItems: 'center',
    flex: 1.2,
  },
  datoLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  datoValor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  datoEntrada: {
    color: Colors.accentSuccess,
  },
  datoDisponible: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    color: Colors.accent,
  },
  separadorVertical: {
    width: 1,
    height: 36,
    backgroundColor: Colors.divider,
  },
  inputCantidad: {
    width: '100%',
    height: 40,
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  inputActivo: {
    borderColor: Colors.accentSuccess,
    color: Colors.accentSuccess,
    backgroundColor: 'rgba(52,199,123,0.08)',
  },
  vendidoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  vendidoTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  vendidoValor: {
    fontFamily: Typography.fontFamilySemiBold,
    color: Colors.accentSuccess,
  },
  botonGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  botonGuardando: { opacity: 0.6 },
  botonGuardarTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textOnAccent,
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  vacioTitulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    color: Colors.textSecondary,
  },
  vacioDescripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textDisabled,
    textAlign: 'center',
    lineHeight: 20,
  },
  });
}
