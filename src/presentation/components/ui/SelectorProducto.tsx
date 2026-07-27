// src/presentation/components/ui/SelectorProducto.tsx
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Producto } from 'src/domain/entities/Producto';
import { Colors, Typography, Spacing, Radius } from 'src/constants/theme';
import { formatMoneda } from 'src/utils/formatters';

interface SelectorProductoProps {
  productos: Producto[];
  seleccionado: Producto | null;
  onSeleccionar: (producto: Producto) => void;
  label?: string;
  mostrarPrecio?: 'costo' | 'venta' | 'ambos';
}

export function SelectorProducto({
  productos,
  seleccionado,
  onSeleccionar,
  label = 'Producto',
  mostrarPrecio = 'venta',
}: SelectorProductoProps) {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState('');

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      p.nombre.toLowerCase().includes(q) ||
      String(p.precio_venta).includes(q)
    );
  }, [query, productos]);

  const handleSeleccionar = (producto: Producto) => {
    onSeleccionar(producto);
    setAbierto(false);
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Botón selector */}
      <TouchableOpacity
        style={[styles.selector, abierto && styles.selectorAbierto]}
        onPress={() => setAbierto(!abierto)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="package-variant-closed"
          size={16}
          color={seleccionado ? Colors.accent : Colors.textSecondary}
          style={styles.selectorIcono}
        />
        <Text
          style={[
            styles.selectorTexto,
            !seleccionado && styles.placeholder,
          ]}
          numberOfLines={1}
        >
          {seleccionado ? seleccionado.nombre : 'Selecciona un producto...'}
        </Text>
        <MaterialCommunityIcons
          name={abierto ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Precio del seleccionado */}
      {seleccionado && !abierto && (
        <View style={styles.precioSeleccionado}>
          {(mostrarPrecio === 'costo' || mostrarPrecio === 'ambos') && (
            <Text style={styles.precioItem}>
              Costo:{' '}
              <Text style={styles.precioValor}>
                {formatMoneda(seleccionado.precio_costo)}
              </Text>
            </Text>
          )}
          {(mostrarPrecio === 'venta' || mostrarPrecio === 'ambos') && (
            <Text style={styles.precioItem}>
              Venta:{' '}
              <Text style={styles.precioValor}>
                {formatMoneda(seleccionado.precio_venta)}
              </Text>
            </Text>
          )}
        </View>
      )}

      {/* Dropdown con búsqueda */}
      {abierto && (
        <View style={styles.dropdown}>
          {/* Buscador */}
          <View style={styles.buscadorContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={16}
              color={Colors.textSecondary}
              style={styles.buscadorIcono}
            />
            <TextInput
              style={styles.buscadorInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar producto..."
              placeholderTextColor={Colors.textDisabled}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.limpiarBtn}>
                <MaterialCommunityIcons name="close-circle" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista filtrada */}
          <ScrollView style={styles.lista} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtrados.length === 0 ? (
              <View style={styles.sinResultados}>
                <Text style={styles.sinResultadosTexto}>
                  Sin resultados para "{query}"
                </Text>
              </View>
            ) : (
              filtrados.map((p) => {
                const esSeleccionado = seleccionado?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.item, esSeleccionado && styles.itemSeleccionado]}
                    onPress={() => handleSeleccionar(p)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemNombre, esSeleccionado && styles.itemNombreSeleccionado]}>
                        {p.nombre}
                      </Text>
                      <View style={styles.itemPrecios}>
                        {mostrarPrecio !== 'venta' && (
                          <Text style={styles.itemPrecio}>
                            C: {formatMoneda(p.precio_costo)}
                          </Text>
                        )}
                        {mostrarPrecio !== 'costo' && (
                          <Text style={styles.itemPrecio}>
                            V: {formatMoneda(p.precio_venta)}
                          </Text>
                        )}
                      </View>
                    </View>
                    {esSeleccionado && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={Colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
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
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 48,
  },
  selectorAbierto: {
    borderColor: Colors.accent,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  selectorIcono: {
    marginRight: Spacing.sm,
  },
  selectorTexto: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textDisabled,
  },
  precioSeleccionado: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(79,142,247,0.06)',
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.15)',
  },
  precioItem: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  precioValor: {
    fontFamily: Typography.fontFamilySemiBold,
    color: Colors.accent,
  },
  dropdown: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.accent,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    overflow: 'hidden',
    maxHeight: 260,
  },
  buscadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
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
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  limpiarBtn: {
    padding: 4,
  },
  lista: {
    maxHeight: 200,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  itemSeleccionado: {
    backgroundColor: 'rgba(79,142,247,0.08)',
  },
  itemInfo: {
    flex: 1,
  },
  itemNombre: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  itemNombreSeleccionado: {
    color: Colors.accent,
  },
  itemPrecios: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  itemPrecio: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  sinResultados: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  sinResultadosTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textDisabled,
  },
});