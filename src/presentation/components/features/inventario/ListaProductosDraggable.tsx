// src/presentation/components/features/inventario/ListaProductosDraggable.tsx
import { useRef, useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Producto } from '../../../../domain/entities/Producto';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';

const ITEM_HEIGHT = 72;
const ITEM_MARGIN = Spacing.sm;
const ITEM_TOTAL = ITEM_HEIGHT + ITEM_MARGIN;

interface ListaProductosDraggableProps {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
  onReordenar: (nuevosProductos: Producto[]) => Promise<void>;
}

interface ItemProps {
  item: Producto;
  index: number;
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
  isDragging: boolean;
  dragY: Animated.Value;
}

// ── Item individual — memo para evitar re-renders ─────────────
const ProductoItem = memo(function ProductoItem({
  item,
  index,
  onEditar,
  onEliminar,
  panHandlers,
  isDragging,
  dragY,
}: ItemProps) {
  const margen = item.precio_venta - item.precio_costo;

  const confirmarEliminar = () => {
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que deseas eliminar "${item.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onEliminar(item.id),
        },
      ]
    );
  };

  return (
    <Animated.View
      style={[
        styles.card,
        isDragging && styles.cardActiva,
        isDragging && { transform: [{ translateY: dragY }], zIndex: 999 },
      ]}
    >
      {/* Handle drag */}
      <View {...panHandlers} style={styles.handle}>
        <MaterialCommunityIcons
          name="drag-vertical"
          size={22}
          color={isDragging ? Colors.accent : Colors.textDisabled}
        />
      </View>

      {/* Número orden */}
      <View style={styles.orden}>
        <Text style={styles.ordenTexto}>{index + 1}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nombreRow}>
          <Text style={styles.nombre} numberOfLines={1}>
            {item.nombre}
          </Text>
        </View>
        <View style={styles.precios}>
          <View style={styles.precioItem}>
            <Text style={styles.precioLabel}>Costo</Text>
            <Text style={styles.precioCosto}>{formatMoneda(item.precio_costo)}</Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.precioItem}>
            <Text style={styles.precioLabel}>Venta</Text>
            <Text style={styles.precioVenta}>{formatMoneda(item.precio_venta)}</Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.precioItem}>
            <Text style={styles.precioLabel}>Margen</Text>
            <Text
              style={[
                styles.margen,
                { color: margen >= 0 ? Colors.accentSuccess : Colors.accentDanger },
              ]}
            >
              {margen >= 0 ? '+' : ''}{margen.toFixed(2)}
            </Text>
          </View>
          <View style={styles.separador} />
          <View style={styles.precioItem}>
            <Text style={styles.precioLabel}>Cantidad</Text>
            <Text style={styles.cantidadTexto}>{item.cantidad} uds</Text>
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.botonAccion}
          onPress={() => onEditar(item)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botonAccion, styles.botonEliminar]}
          onPress={confirmarEliminar}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color={Colors.accentDanger}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

// ── Componente principal ──────────────────────────────────────
export function ListaProductosDraggable({
  productos,
  onEditar,
  onEliminar,
  onReordenar,
}: ListaProductosDraggableProps) {
  const [lista, setLista] = useState<Producto[]>(productos);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(-1);
  const listaRef = useRef<Producto[]>(productos);

  // Sincronizar cuando cambian productos desde el padre (solo sin arrastre)
  useEffect(() => {
    if (draggingId === null) {
      setLista(productos);
      listaRef.current = productos;
    }
  }, [productos, draggingId]);

  const crearPanResponder = useCallback(
    (item: Producto, index: number) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 6,

        onPanResponderGrant: () => {
          currentIndex.current = index;
          dragY.setValue(0);
          setDraggingId(item.id);
        },

        onPanResponderMove: (_, gs) => {
          dragY.setValue(gs.dy);

          const newTarget = Math.max(
            0,
            Math.min(
              listaRef.current.length - 1,
              Math.round(currentIndex.current + gs.dy / ITEM_TOTAL)
            )
          );

          if (newTarget !== currentIndex.current) {
            // Reordenar en ref y estado sin afectar el render del padre
            const next = [...listaRef.current];
            const [moved] = next.splice(currentIndex.current, 1);
            next.splice(newTarget, 0, moved);
            listaRef.current = next;
            currentIndex.current = newTarget;

            // Resetear dragY relativo al nuevo índice
            dragY.setValue(gs.dy - (newTarget - index) * ITEM_TOTAL);

            // Actualizar lista visual
            setLista([...next]);
          }
        },

        onPanResponderRelease: () => {
          dragY.setValue(0);
          setDraggingId(null);
          // Persistir orden — fuera del render
          const finalLista = listaRef.current;
          setTimeout(() => onReordenar(finalLista), 0);
        },

        onPanResponderTerminate: () => {
          dragY.setValue(0);
          setDraggingId(null);
        },
      }),
    [onReordenar]
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.lista}
      scrollEnabled={draggingId === null}
    >
      {lista.map((item, index) => {
        const isDragging = draggingId === item.id;
        const panResponder = crearPanResponder(item, index);
        return (
          <ProductoItem
            key={String(item.id)}
            item={item}
            index={index}
            onEditar={onEditar}
            onEliminar={onEliminar}
            panHandlers={panResponder.panHandlers}
            isDragging={isDragging}
            dragY={dragY}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lista: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: ITEM_MARGIN,
    height: ITEM_HEIGHT,
    paddingRight: Spacing.sm,
  },
  cardActiva: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    paddingHorizontal: Spacing.sm,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orden: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
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
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    marginBottom: 4,
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
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  precioCosto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  precioVenta: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 11,
    color: Colors.accent,
  },
  margen: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 11,
  },
  separador: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  acciones: {
    flexDirection: 'column',
    gap: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  botonAccion: {
    width: 30,
    height: 30,
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
  nombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  cantidadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cantidadTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.accent,
  },
});