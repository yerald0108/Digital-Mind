// src/presentation/components/features/inventario/ListaProductosDraggable.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Producto } from '../../../../domain/entities/Producto';
import { ModalConfirmacion } from '../../ui/ModalConfirmacion';
import { useTheme } from '../../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';

interface ListaProductosDraggableProps {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
  onEliminarMultiple?: (ids: number[]) => Promise<void>;
  onReordenar: (nuevosProductos: Producto[]) => Promise<void>;
}

// ── Item individual ───────────────────────────────────────────
interface ItemProps {
  item: Producto;
  index: number;
  total: number;
  modoSeleccion: boolean;
  seleccionado: boolean;
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
  onToggleSeleccion: (id: number) => void;
  onActivarModo: (id: number) => void;
  onMoverArriba: (index: number) => void;
  onMoverAbajo: (index: number) => void;
  C: ReturnType<typeof useTheme>['C'];
}

function ProductoItem({
  item,
  index,
  total,
  modoSeleccion,
  seleccionado,
  onEditar,
  onEliminar,
  onToggleSeleccion,
  onActivarModo,
  onMoverArriba,
  onMoverAbajo,
  C,
}: ItemProps) {
  const margen = item.precio_venta - item.precio_costo;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const animarSeleccion = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim]);

  const handlePress = () => {
    if (modoSeleccion) {
      animarSeleccion();
      onToggleSeleccion(item.id);
    }
  };

  const handleLongPress = () => {
    if (!modoSeleccion) {
      animarSeleccion();
      onActivarModo(item.id);
    }
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={modoSeleccion ? 0.7 : 1}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={350}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: C.bgSurface, borderColor: C.border },
              seleccionado && { backgroundColor: 'rgba(79,142,247,0.10)', borderColor: C.accent, borderWidth: 1.5 },
            ]}
          >
            {/* Checkbox de selección / Handle de orden */}
            {modoSeleccion ? (
              <View style={styles.checkboxArea}>
                <View style={[
                  styles.checkbox,
                  { borderColor: seleccionado ? C.accent : C.border },
                  seleccionado && { backgroundColor: C.accent },
                ]}>
                  {seleccionado && (
                    <MaterialCommunityIcons name="check" size={13} color="#fff" />
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.ordenBotones}>
                <TouchableOpacity
                  style={[styles.botonOrden, index === 0 && styles.botonOrdenDeshabilitado]}
                  onPress={() => onMoverArriba(index)}
                  disabled={index === 0}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <MaterialCommunityIcons
                    name="chevron-up"
                    size={16}
                    color={index === 0 ? C.textDisabled : C.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botonOrden, index === total - 1 && styles.botonOrdenDeshabilitado]}
                  onPress={() => onMoverAbajo(index)}
                  disabled={index === total - 1}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={16}
                    color={index === total - 1 ? C.textDisabled : C.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Número de orden */}
            <View style={[styles.orden, { backgroundColor: C.bgElevated, borderColor: seleccionado ? C.accent : C.border }]}>
              <Text style={[styles.ordenTexto, { color: seleccionado ? C.accent : C.textSecondary }]}>{index + 1}</Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={[styles.nombre, { color: C.textPrimary }]} numberOfLines={1}>
                {item.nombre}
              </Text>
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
                  <Text style={[styles.margen, { color: margen >= 0 ? C.accentSuccess : C.accentDanger }]}>
                    {margen >= 0 ? '+' : ''}{margen.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.separador, { backgroundColor: C.border }]} />
                <View style={styles.precioItem}>
                  <Text style={[styles.precioLabel, { color: C.textSecondary }]}>Cant.</Text>
                  <Text style={[styles.cantidadTexto, { color: C.accent }]}>{item.cantidad}</Text>
                </View>
              </View>
            </View>

            {/* Acciones — solo visibles fuera del modo selección */}
            {!modoSeleccion && (
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
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={C.accentDanger} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de Confirmación individual */}
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
}

// ── Componente principal ──────────────────────────────────────
export function ListaProductosDraggable({
  productos,
  onEditar,
  onEliminar,
  onEliminarMultiple,
  onReordenar,
}: ListaProductosDraggableProps) {
  const { C } = useTheme();
  const [lista, setLista] = useState<Producto[]>(productos);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [confirmEliminarMultiple, setConfirmEliminarMultiple] = useState(false);

  useEffect(() => {
    setLista(productos);
  }, [productos]);

  const activarModoSeleccion = useCallback((id: number) => {
    setModoSeleccion(true);
    setSeleccionados(new Set([id]));
  }, []);

  const toggleSeleccion = useCallback((id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const cancelarSeleccion = useCallback(() => {
    setModoSeleccion(false);
    setSeleccionados(new Set());
  }, []);

  const seleccionarTodos = useCallback(() => {
    setSeleccionados(new Set(lista.map((p) => p.id)));
  }, [lista]);

  const handleEliminarSeleccionados = useCallback(async () => {
    const ids = Array.from(seleccionados);
    cancelarSeleccion();
    if (onEliminarMultiple) {
      await onEliminarMultiple(ids);
    } else {
      for (const id of ids) {
        await onEliminar(id);
      }
    }
  }, [seleccionados, onEliminarMultiple, onEliminar, cancelarSeleccion]);

  const moverArriba = useCallback((index: number) => {
    if (index === 0) return;
    const next = [...lista];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setLista(next);
    onReordenar(next);
  }, [lista, onReordenar]);

  const moverAbajo = useCallback((index: number) => {
    if (index === lista.length - 1) return;
    const next = [...lista];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setLista(next);
    onReordenar(next);
  }, [lista, onReordenar]);

  const cantSeleccionados = seleccionados.size;

  return (
    <View style={{ flex: 1 }}>
      {/* Hint modo selección */}
      {modoSeleccion && (
        <View style={[styles.barraSeleccion, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
          <View style={styles.resumenSeleccion}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color={C.accent} />
            <Text style={[styles.resumenSeleccionTexto, { color: C.textPrimary }]}>
              {cantSeleccionados} {cantSeleccionados === 1 ? 'seleccionado' : 'seleccionados'}
            </Text>
            <TouchableOpacity onPress={seleccionarTodos} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.seleccionarTodosTexto, { color: C.accent }]}>Todos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.accionesSeleccion}>
            <TouchableOpacity style={styles.botonCancelar} onPress={cancelarSeleccion} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={18} color={C.textSecondary} />
              <Text style={[styles.botonSeleccionTexto, { color: C.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.botonEliminarSeleccion,
                { backgroundColor: 'rgba(232, 84, 84, 0.10)' },
                cantSeleccionados === 0 && styles.botonSeleccionDeshabilitado,
              ]}
              onPress={() => cantSeleccionados > 0 && setConfirmEliminarMultiple(true)}
              activeOpacity={0.7}
              disabled={cantSeleccionados === 0}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={C.accentDanger} />
              <Text style={[styles.botonSeleccionTexto, { color: C.accentDanger }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
        scrollEnabled={true}
      >
        {lista.map((item, index) => (
          <ProductoItem
            key={String(item.id)}
            item={item}
            index={index}
            total={lista.length}
            modoSeleccion={modoSeleccion}
            seleccionado={seleccionados.has(item.id)}
            onEditar={onEditar}
            onEliminar={onEliminar}
            onToggleSeleccion={toggleSeleccion}
            onActivarModo={activarModoSeleccion}
            onMoverArriba={moverArriba}
            onMoverAbajo={moverAbajo}
            C={C}
          />
        ))}
      </ScrollView>

      {/* Barra flotante de acciones de selección */}
      {/* Confirmación eliminación múltiple */}
      <ModalConfirmacion
        visible={confirmEliminarMultiple}
        titulo="Eliminar productos"
        mensaje={`¿Seguro que deseas eliminar ${cantSeleccionados} producto${cantSeleccionados !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        onConfirmar={() => {
          setConfirmEliminarMultiple(false);
          handleEliminarSeleccionados();
        }}
        onCancelar={() => setConfirmEliminarMultiple(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 160,
  },
  barraSeleccion: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  resumenSeleccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resumenSeleccionTexto: {
    flex: 1,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  seleccionarTodosTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
  },
  accionesSeleccion: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  botonCancelar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  botonEliminarSeleccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  botonSeleccionTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  botonSeleccionDeshabilitado: {
    opacity: 0.45,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    minHeight: 72,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  // Área de checkbox en modo selección
  checkboxArea: {
    paddingHorizontal: Spacing.sm,
    alignSelf: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Botones de orden (↑↓)
  ordenBotones: {
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xs,
    alignItems: 'center',
    gap: 2,
    alignSelf: 'center',
  },
  botonOrden: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  botonOrdenDeshabilitado: {
    opacity: 0.3,
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
    marginHorizontal: Spacing.xs,
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
  cantidadTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
  },
});
