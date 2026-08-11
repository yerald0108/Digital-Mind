// src/presentation/components/features/cuadre/SeccionInventarioFinal.tsx
import { useCallback, memo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
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

// Altura fija de cada card para que FlatList pueda usar getItemLayout
// y evitar mediciones en tiempo de ejecución (mejora significativa con 60+ items).
const CARD_BASE_HEIGHT = 106; // header + datosRow + padding + marginBottom
const CARD_VENDIDO_EXTRA = 32; // altura adicional cuando se muestra la fila de vendidas
const CARD_MARGIN = Spacing.sm;

// ── Card individual extraída como componente memo ─────────────
// Evita re-renders de cards que no cambiaron cuando el usuario
// edita la cantidad de otro producto.
interface ProductoCardProps {
  item: ItemFinal;
  index: number;
  cantInicial: number;
  cantEntradas: number;
  onActualizarCantidad: (productoId: number, cantidad: number) => void;
  Colors: ReturnType<typeof getColors>;
  styles: ReturnType<typeof crearEstilos>;
}

const ProductoCard = memo(function ProductoCard({
  item,
  index,
  cantInicial,
  cantEntradas,
  onActualizarCantidad,
  Colors,
  styles,
}: ProductoCardProps) {
  const disponible = cantInicial + cantEntradas;

  return (
    <View style={[styles.card, index % 2 === 0 && styles.cardAlterna]}>
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
        <View style={styles.datoItem}>
          <Text style={styles.datoLabel}>Inicial</Text>
          <Text style={styles.datoValor}>{cantInicial}</Text>
        </View>

        <View style={styles.datoItem}>
          <Text style={styles.datoLabel}>Entradas</Text>
          <Text style={[styles.datoValor, cantEntradas > 0 && styles.datoEntrada]}>
            {cantEntradas > 0 ? `+${cantEntradas}` : '0'}
          </Text>
        </View>

        <View style={styles.datoItem}>
          <Text style={styles.datoLabel}>Disponible</Text>
          <Text style={styles.datoDisponible}>{disponible}</Text>
        </View>

        <View style={styles.separadorVertical} />

        <View style={styles.datoItemFinal}>
          <Text style={styles.datoLabel}>Cant. final</Text>
          <TextInput
            style={[styles.inputCantidad, item.tocado && styles.inputActivo]}
            value={item.tocado ? String(item.cantidad) : (item.cantidad === 0 ? '' : String(item.cantidad))}
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

      {/* Vendidas estimadas: mostrar si el usuario editó la cantidad (incluso si es 0) */}
      {item.tocado && (
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
});

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

  // Pre-calcular mapas para O(1) en lugar de O(n) por item dentro del render
  const inicialMap = new Map(inventarioInicial.map((i) => [i.producto_id, i.cantidad]));
  const entradasMap = new Map<number, number>();
  for (const e of entradas) {
    entradasMap.set(e.producto_id, (entradasMap.get(e.producto_id) ?? 0) + e.cantidad);
  }

  const totalIngresado = items.reduce((acc, i) => acc + i.cantidad, 0);

  // Header y footer de la FlatList definidos fuera del render para estabilidad
  const ListHeader = (
    <View>
      <Text style={styles.descripcion}>
        Realiza el conteo físico de cada producto e ingresa la cantidad
        que quedó al cierre del turno.
      </Text>
      <View style={styles.resumen}>
        <MaterialCommunityIcons name="counter" size={15} color={Colors.accent} />
        <Text style={styles.resumenTexto}>
          {items.length} productos · {totalIngresado} uds finales ingresadas
        </Text>
      </View>
    </View>
  );

  const ListFooter = (
    <View>
      <View style={styles.espaciadorTeclado} />
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

  // renderItem estable con useCallback no aplica aquí porque SeccionInventarioFinal
  // no es memo — usamos función inline pero la card interna sí es memo.
  const renderItem = ({ item, index }: { item: ItemFinal; index: number }) => (
    <ProductoCard
      item={item}
      index={index}
      cantInicial={inicialMap.get(item.producto_id) ?? 0}
      cantEntradas={entradasMap.get(item.producto_id) ?? 0}
      onActualizarCantidad={onActualizarCantidad}
      Colors={Colors}
      styles={styles}
    />
  );

  // getItemLayout permite a FlatList saltar directamente a cualquier posición
  // sin medir — crítico para rendimiento con 60+ items.
  const getItemLayout = (_: unknown, index: number) => {
    const height = CARD_BASE_HEIGHT + (items[index]?.cantidad > 0 ? CARD_VENDIDO_EXTRA : 0) + CARD_MARGIN;
    return { length: height, offset: height * index, index };
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.producto_id)}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      getItemLayout={getItemLayout}
      // Renderizar 10 items por lote para arranque rápido
      initialNumToRender={10}
      maxToRenderPerBatch={8}
      windowSize={5}
      // Desactiva el scroll de la FlatList — el scroll lo maneja el ScrollView padre
      scrollEnabled={false}
      // Evitar parpadeo al actualizar cantidades
      removeClippedSubviews={false}
      keyboardShouldPersistTaps="handled"
    />
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
    alignItems: 'stretch',
    flex: 1.5,
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
    height: 44,
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    // Padding horizontal para que el texto no quede pegado al borde
    paddingHorizontal: Spacing.sm,
    // Android: quita el padding interno que el sistema agrega a los TextInput
    // y que hace que los números se vean cortados verticalmente
    paddingVertical: 0,
    includeFontPadding: false,
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
  espaciadorTeclado: {
    height: 120,
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