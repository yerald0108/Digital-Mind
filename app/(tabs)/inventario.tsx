// app/(tabs)/inventario.tsx
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductos } from '../../src/presentation/hooks/useProductos';
import { useToast } from '../../src/presentation/hooks/useToast';
import { useBusquedaProductos } from '../../src/presentation/hooks/useBusquedaProductos';
import { useTheme } from '../../src/presentation/hooks/useTheme';
import { ModalProducto } from '../../src/presentation/components/features/inventario/ModalProducto';
import { ListaProductosDraggable } from '../../src/presentation/components/features/inventario/ListaProductosDraggable';
import { EmptyInventario } from '../../src/presentation/components/features/inventario/EmptyInventario';
import { SearchBar } from '../../src/presentation/components/ui/SearchBar';
import { Producto } from '../../src/domain/entities/Producto';
import { Typography, Spacing } from '../../src/constants/theme';

export default function InventarioScreen() {
  const { C, T, S, accentLine } = useTheme();
  const {
    productos,
    cargando,
    error,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    reordenarProductos,
  } = useProductos();

  const toast = useToast();
  const { query, setQuery, resultados, hayQuery, limpiar } =
    useBusquedaProductos(productos);

  const [modalVisible, setModalVisible] = useState(false);
  const [indiceEditar, setIndiceEditar] = useState<number | null>(null);

  const handleAgregar = () => {
    setIndiceEditar(null);
    setModalVisible(true);
  };

  const handleEditar = (producto: Producto) => {
    const indice = productos.findIndex((p) => p.id === producto.id);
    setIndiceEditar(indice >= 0 ? indice : 0);
    setModalVisible(true);
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setIndiceEditar(null);
  };

  const handleGuardar = async (
    data: {
      nombre: string;
      precio_costo: number;
      precio_venta: number;
      cantidad: number;
    },
    indiceActual: number = indiceEditar ?? 0,
  ) => {
    if (indiceEditar !== null) {
      const producto = productos[indiceActual];
      if (!producto) return;
      await actualizarProducto(producto.id, data);
      toast.exito('Producto actualizado', `"${data.nombre}" actualizado`);
    } else {
      await crearProducto(data);
      toast.exito('Producto agregado', `"${data.nombre}" agregado al inventario`);
    }
  };

  const handleEliminar = async (id: number) => {
    const producto = productos.find((p) => p.id === id);
    try {
      await eliminarProducto(id);
      toast.exito('Producto eliminado', `"${producto?.nombre}" fue eliminado`);
    } catch {
      toast.error('Error al eliminar', 'No se pudo eliminar el producto');
    }
  };

  const handleReordenar = async (nuevosProductos: Producto[]) => {
    try {
      await reordenarProductos(nuevosProductos);
      toast.info('Orden actualizado', 'El nuevo orden fue guardado');
    } catch {
      toast.error('Error', 'No se pudo guardar el nuevo orden');
    }
  };

  const totalProductos = productos.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.titulo, { color: C.textPrimary }]}>Inventario</Text>
          <View style={[accentLine, { backgroundColor: C.accent }]} />
          <Text style={[styles.subtitulo, { color: C.textSecondary }]}>
            {totalProductos === 0
              ? 'Sin productos registrados'
              : `${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.botonAgregar, { backgroundColor: C.accent }]}
          onPress={handleAgregar}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={22} color={C.textOnAccent} />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      {totalProductos > 0 && (
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onLimpiar={limpiar}
          placeholder="Buscar por nombre o precio..."
        />
      )}

      {/* Sin resultados de búsqueda */}
      {hayQuery && resultados.length === 0 && (
        <View style={styles.sinResultados}>
          <MaterialCommunityIcons name="magnify-close" size={40} color={C.textDisabled} />
          <Text style={[styles.sinResultadosTexto, { color: C.textSecondary }]}>
            Sin resultados para "{query}"
          </Text>
        </View>
      )}

      {/* Contenido */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : error ? (
        <View style={styles.centrado}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={C.accentDanger}
          />
          <Text style={[styles.errorTexto, { color: C.accentDanger }]}>{error}</Text>
        </View>
      ) : totalProductos === 0 ? (
        <EmptyInventario onAgregar={handleAgregar} />
      ) : resultados.length > 0 ? (
        <>
          {!hayQuery && (
            <View style={styles.hintArrastre}>
              <MaterialCommunityIcons
                name="drag-vertical"
                size={14}
                color={C.textDisabled}
              />
              <Text style={[styles.hintTexto, { color: C.textDisabled }]}>
                Mantén y arrastra para reordenar
              </Text>
            </View>
          )}
          <ListaProductosDraggable
            productos={resultados}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            onReordenar={handleReordenar}
          />
        </>
      ) : null}

      {/* Modal crear/editar con carrusel */}
      <ModalProducto
        visible={modalVisible}
        onClose={handleCerrarModal}
        onGuardar={handleGuardar}
        productos={indiceEditar !== null ? productos : []}
        productoEditar={indiceEditar !== null ? productos[indiceEditar] : null}
        indiceInicial={indiceEditar ?? 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  titulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xxl,
  },
  subtitulo: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  botonAgregar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  sinResultados: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  sinResultadosTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    textAlign: 'center',
  },
  hintArrastre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  hintTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  errorTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    textAlign: 'center',
  },
});