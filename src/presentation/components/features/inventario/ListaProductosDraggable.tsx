// src/presentation/components/features/inventario/ListaProductosDraggable.tsx
import { useRef, useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Producto } from '../../../../domain/entities/Producto';
import { ModalConfirmacion } from '../../ui/ModalConfirmacion';
import { useTheme } from '../../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../../constants/theme';
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
  C: ReturnType<typeof useTheme>['C'];
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
  C,
}: ItemProps) {
  const margen = item.precio_venta - item.precio_costo;
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: C.bgSurface, borderColor: C.border },
          isDragging && { backgroundColor: C.bgElevated, borderColor: C.accent },
          isDragging && { transform: [{ translateY: dragY }], zIndex: 999 },
        ]}
      >
        {/* Handle drag */}
        <View {...panHandlers} style={styles.handle}>
          <MaterialCommunityIcons
            name="drag-vertical"
            size={22}
            color={isDragging ? C.accent : C.textDisabled}
          />
        </View>

        {/* Número orden */}
        <View style={[styles.orden, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
          <Text style={[styles.ordenTexto, { color: C.textSecondary }]}>{index + 1}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nombreRow}>
            <Text style={[styles.nombre, { color: C.textPrimary }]} numberOfLines={1}>
              {item.nombre}
            </Text>
          </View>
          <View style={styles.precios}>
            <View style={styles.precioItem}>
              <Text style={[styles.precioLabel, { color: C.textSecondary }]}>Costo</Text>
              <Text style={[styles.precioCosto, { color: C.textSecondary }]}>{formatMoneda(item.precio_costo)}</Text>
            </View>
            <View style={[styles.separador, { backgroundColor: C.border }]} />
            <View style={styles.precioItem}>
              <Text style={[styles.precioLabel, { color: C.textSecondary }]}>Venta</Text>
              <Text style={[styles.precioVenta, { color: C.accent }]}>{formatMoneda(item.precio_venta)}</Text>
            </View>
            <View style={[styles.separador, { backgroundColor: C.border }]} />
            <View style={styles.precioItem}>
              <Text style={[styles.precioLabel, { color: C.textSecondary }]}>Margen</Text>
              <Text
                style={[
                  styles.margen,
                  { color: margen >= 0 ? C.accentSuccess : C.accentDanger },
                ]}
              >
                {margen >= 0 ? '+' : ''}{margen.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.separador, { backgroundColor: C.border }]} />
            <View style={styles.precioItem}>
              <Text style={[styles.precioLabel, { color: C.textSecondary }]}>Cantidad</Text>
              <Text style={[styles.cantidadTexto, { color: C.accent }]}>{item.cantidad} uds</Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.acciones}>
          <TouchableOpacity
            style={[styles.botonAccion, { backgroundColor: C.bgElevated, borderColor: C.border }]}
            onPress={() => onEditar(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={C.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonAccion, styles.botonEliminar]}
            onPress={() => setConfirmVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color={C.accentDanger}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* ── Modal de Confirmación ── */}
      <ModalConfirmacion
        visible={confirmVisible}
        titulo="Eliminar producto"
        mensaje={`¿Seguro que deseas eliminar "${item.nombre}"?`}
        onConfirmar={() => {
          setConfirmVisible(false);
          onEliminar(item.id);
        }}
        onCancelar={() => setConfirmVisible(false)}
      />
    </>
  );
});

// ── Componente principal ──────────────────────────────────────
export function ListaProductosDraggable({
  productos,
  onEditar,
  onEliminar,
  onReordenar,
}: ListaProductosDraggableProps) {
  const { C } = useTheme();
  const [lista, setLista] = useState<Producto[]>(productos);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(-1);
  const listaRef = useRef<Producto[]>(productos);

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
            const next = [...listaRef.current];
            const [moved] = next.splice(currentIndex.current, 1);
            next.splice(newTarget, 0, moved);
            listaRef.current = next;
            currentIndex.current = newTarget;

            dragY.setValue(gs.dy - (newTarget - index) * ITEM_TOTAL);

            setLista([...next]);
          }
        },

        onPanResponderRelease: () => {
          dragY.setValue(0);
          setDraggingId(null);
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
            C={C}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lista: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: ITEM_MARGIN,
    height: ITEM_HEIGHT,
    paddingRight: Spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  ordenTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
  },
  info: {
    flex: 1,
  },
  nombre: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
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
    marginBottom: 1,
  },
  precioCosto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 11,
  },
  precioVenta: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 11,
  },
  margen: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 11,
  },
  separador: {
    width: 1,
    height: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  cantidadTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
  },
});