// src/presentation/components/ui/SelectorProducto.tsx
//
// NOTA IMPORTANTE — por qué cargamos productos aquí y no solo de la prop:
//
// Los modales que contienen este componente se montan dentro de un bloque
// condicional {turno && <Modal productos={productos} />}. Cuando se abre
// un turno por primera vez, `turno` y `productos` (de useProductos en el
// padre) cambian casi al mismo tiempo, pero `productos` puede llegar vacío
// en el primer render si el hook aún está cargando desde SQLite.
//
// Para romper esa dependencia, este componente carga los productos
// directamente desde el repositorio cuando el dropdown se abre.
// La prop `productos` sigue existiendo como fallback y como fuente de
// datos cuando ya están disponibles en el padre.
//
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Producto } from '../../../domain/entities/Producto';
import { ProductoRepository } from '../../../data/repositories/ProductoRepository';
import { useTheme } from '../../../presentation/hooks/useTheme';
import { Typography, Spacing, Radius } from '../../../constants/theme';
import { formatMoneda } from '../../../utils/formatters';

interface SelectorProductoProps {
  productos: Producto[];          // prop del padre (puede llegar vacía al inicio)
  seleccionado: Producto | null;
  onSeleccionar: (producto: Producto) => void;
  label?: string;
  mostrarPrecio?: 'costo' | 'venta' | 'ambos';
}

export function SelectorProducto({
  productos: productosProp,
  seleccionado,
  onSeleccionar,
  label = 'Producto',
  mostrarPrecio = 'venta',
}: SelectorProductoProps) {
  const { C } = useTheme();
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Lista de productos que realmente se muestra en el dropdown.
  // Se inicializa con la prop; si está vacía cuando se abre el dropdown,
  // se carga directamente desde SQLite.
  const [productosLocales, setProductosLocales] = useState<Producto[]>(productosProp);
  const [cargandoLocal, setCargandoLocal] = useState(false);

  // Si la prop se actualiza después del montado (padre terminó de cargar),
  // sincronizamos el estado local sólo cuando el dropdown está cerrado para
  // no interrumpir al usuario.
  useEffect(() => {
    if (!abierto && productosProp.length > 0) {
      setProductosLocales(productosProp);
    }
  }, [productosProp, abierto]);

  // Cuando se abre el dropdown: si no hay productos aún, cargar desde SQLite.
  const cargarSiVacio = useCallback(async () => {
    if (productosLocales.length > 0) return;   // ya hay datos, no hace falta
    try {
      setCargandoLocal(true);
      const data = await ProductoRepository.getAll();
      setProductosLocales(data);
    } catch (e) {
      console.error('[SelectorProducto] Error al cargar productos:', e);
    } finally {
      setCargandoLocal(false);
    }
  }, [productosLocales.length]);

  // Abrir dropdown y cargar si es necesario
  const handleToggle = useCallback(() => {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);
    if (nuevoEstado) cargarSiVacio();
  }, [abierto, cargarSiVacio]);

  // Foco diferido para evitar el race condition de Android con RNModal
  useEffect(() => {
    if (abierto) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [abierto]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productosLocales;
    return productosLocales.filter((p) =>
      p.nombre.toLowerCase().includes(q) ||
      String(p.precio_venta).includes(q)
    );
  }, [query, productosLocales]);

  const handleSeleccionar = (producto: Producto) => {
    onSeleccionar(producto);
    setAbierto(false);
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>

      {/* Botón selector */}
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: C.bgInput, borderColor: C.border },
          abierto && { borderColor: C.accent, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
        ]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={16}
          color={seleccionado ? C.accent : C.textSecondary}
          style={styles.selectorIcono}
        />
        <Text
          style={[
            styles.selectorTexto,
            { color: C.textPrimary },
            !seleccionado && { color: C.textDisabled },
          ]}
          numberOfLines={1}
        >
          {seleccionado ? seleccionado.nombre : 'Selecciona un producto...'}
        </Text>
        <MaterialCommunityIcons
          name={abierto ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={C.textSecondary}
        />
      </TouchableOpacity>

      {/* Precio del seleccionado */}
      {seleccionado && !abierto && (
        <View style={[styles.precioSeleccionado, { backgroundColor: `${C.accent}0F`, borderColor: `${C.accent}26` }]}>
          {(mostrarPrecio === 'costo' || mostrarPrecio === 'ambos') && (
            <Text style={[styles.precioItem, { color: C.textSecondary }]}>
              Costo:{' '}
              <Text style={[styles.precioValor, { color: C.accent }]}>
                {formatMoneda(seleccionado.precio_costo)}
              </Text>
            </Text>
          )}
          {(mostrarPrecio === 'venta' || mostrarPrecio === 'ambos') && (
            <Text style={[styles.precioItem, { color: C.textSecondary }]}>
              Venta:{' '}
              <Text style={[styles.precioValor, { color: C.accent }]}>
                {formatMoneda(seleccionado.precio_venta)}
              </Text>
            </Text>
          )}
        </View>
      )}

      {/* Dropdown con búsqueda */}
      {abierto && (
        <View style={[styles.dropdown, { backgroundColor: C.bgElevated, borderColor: C.accent }]}>
          {/* Buscador */}
          <View style={[styles.buscadorContainer, { borderBottomColor: C.divider }]}>
            <MaterialCommunityIcons
              name="magnify"
              size={16}
              color={C.textSecondary}
              style={styles.buscadorIcono}
            />
            <TextInput
              ref={inputRef}
              style={[styles.buscadorInput, { color: C.textPrimary }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar producto..."
              placeholderTextColor={C.textDisabled}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.limpiarBtn}>
                <MaterialCommunityIcons name="close-circle" size={14} color={C.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista filtrada */}
          {cargandoLocal ? (
            <View style={styles.cargando}>
              <ActivityIndicator size="small" color={C.accent} />
            </View>
          ) : (
            <ScrollView style={styles.lista} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {filtrados.length === 0 ? (
                <View style={styles.sinResultados}>
                  <Text style={[styles.sinResultadosTexto, { color: C.textDisabled }]}>
                    {query ? `Sin resultados para "${query}"` : 'No hay productos registrados'}
                  </Text>
                </View>
              ) : (
                filtrados.map((p) => {
                  const esSeleccionado = seleccionado?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.item,
                        { borderBottomColor: C.divider },
                        esSeleccionado && { backgroundColor: `${C.accent}14` },
                      ]}
                      onPress={() => handleSeleccionar(p)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={[
                          styles.itemNombre,
                          { color: C.textPrimary },
                          esSeleccionado && { color: C.accent },
                        ]}>
                          {p.nombre}
                        </Text>
                        <View style={styles.itemPrecios}>
                          {mostrarPrecio !== 'venta' && (
                            <Text style={[styles.itemPrecio, { color: C.textSecondary }]}>
                              C: {formatMoneda(p.precio_costo)}
                            </Text>
                          )}
                          {mostrarPrecio !== 'costo' && (
                            <Text style={[styles.itemPrecio, { color: C.textSecondary }]}>
                              V: {formatMoneda(p.precio_venta)}
                            </Text>
                          )}
                        </View>
                      </View>
                      {esSeleccionado && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={18}
                          color={C.accent}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 48,
  },
  selectorIcono: {
    marginRight: Spacing.sm,
  },
  selectorTexto: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
  },
  precioSeleccionado: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
  },
  precioItem: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  },
  precioValor: {
    fontFamily: Typography.fontFamilySemiBold,
  },
  dropdown: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    overflow: 'hidden',
    maxHeight: 260,
  },
  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  buscadorIcono: {
    marginRight: Spacing.sm,
  },
  buscadorInput: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    paddingVertical: 0,
  },
  limpiarBtn: {
    padding: 4,
  },
  lista: {
    maxHeight: 200,
  },
  cargando: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  itemPrecios: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  itemPrecio: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  },
  sinResultados: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  sinResultadosTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
});