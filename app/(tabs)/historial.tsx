// app/(tabs)/historial.tsx
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useHistorial } from '../../src/presentation/hooks/useHistorial';
import { useToast } from '../../src/presentation/hooks/useToast';
import { CardHistorial } from '../../src/presentation/components/features/historial/CardHistorial';
import { ModalDetalleHistorial } from '../../src/presentation/components/features/historial/ModalDetalleHistorial';
import {
  FiltrosHistorial,
  FiltrosActivos,
  FILTROS_VACIOS,
  aplicarFiltros,
  contarFiltrosActivos,
} from '../../src/presentation/components/features/historial/FiltrosHistorial';
import { HistorialTurno } from '../../src/domain/entities/HistorialTurno';
import { getColors, Typography, Spacing, Radius } from '../../src/constants/theme';
import { formatMoneda } from '../../src/utils/formatters';
import { useTheme } from '../../src/presentation/hooks/useTheme';

export default function HistorialScreen() {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const { historial, cargando, recargar, eliminar } = useHistorial();
  const toast = useToast();

  useFocusEffect(
    useCallback(() => { recargar(); }, [recargar])
  );

  const [registroSeleccionado, setRegistroSeleccionado] = useState<HistorialTurno | null>(null);
  const [filtros, setFiltros] = useState<FiltrosActivos>(FILTROS_VACIOS);

  // ── Lista filtrada (todo en memoria, sin tocar la BD) ────────
  const historialFiltrado = useMemo(
    () => aplicarFiltros(historial, filtros),
    [historial, filtros]
  );

  const filtrosActivos = contarFiltrosActivos(filtros);
  const hayFiltros = filtrosActivos > 0;

  // ── Totales — sobre la lista filtrada para que sean coherentes
  const totalVentas = historialFiltrado.reduce((acc, h) => acc + h.total_ventas, 0);
  const totalGanancias = historialFiltrado.reduce((acc, h) => acc + h.ganancia_neta, 0);

  // ── Eliminar ─────────────────────────────────────────────────
  const handleEliminar = (id: number) => {
    Alert.alert(
      'Eliminar registro',
      '¿Estás seguro? Este registro no se puede recuperar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminar(id);
              toast.exito('Registro eliminado', 'El registro fue eliminado del historial');
            } catch {
              toast.error('Error', 'No se pudo eliminar el registro');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTextos}>
          <Text style={styles.titulo}>Historial</Text>
          <View style={styles.accentLine} />
          <Text style={styles.subtitulo}>
            {cargando
              ? 'Cargando...'
              : historial.length === 0
              ? 'Sin turnos cerrados'
              : hayFiltros
              ? `${historialFiltrado.length} de ${historial.length} turno${historial.length !== 1 ? 's' : ''}`
              : `${historial.length} turno${historial.length !== 1 ? 's' : ''} cerrado${historial.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        <View style={styles.headerAcciones}>
          {/* Filtros — siempre visible si hay historial */}
          {historial.length > 0 && (
            <FiltrosHistorial
              historial={historial}
              filtros={filtros}
              onChange={setFiltros}
            />
          )}
          {/* Recargar */}
          <TouchableOpacity
            style={[styles.botonRecargar, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}
            onPress={recargar}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Chip de filtro activo — muestra resumen del período seleccionado ── */}
      {hayFiltros && (
        <TouchableOpacity
          style={[styles.filtroActivoBanner, { backgroundColor: `${Colors.accent}12`, borderColor: `${Colors.accent}30` }]}
          onPress={() => setFiltros(FILTROS_VACIOS)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="filter-remove-outline" size={14} color={Colors.accent} />
          <Text style={[styles.filtroActivoTexto, { color: Colors.accent }]}>
            {filtrosActivos} filtro{filtrosActivos !== 1 ? 's' : ''} activo{filtrosActivos !== 1 ? 's' : ''} — Toca para limpiar
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Resumen acumulado — sobre los resultados filtrados ── */}
      {historialFiltrado.length > 0 && (
        <View style={styles.resumenTotal}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenLabel}>
              {hayFiltros ? 'Ventas (filtrado)' : 'Total ventas acumuladas'}
            </Text>
            <Text style={[styles.resumenValor, { color: Colors.accent }]}>
              {formatMoneda(totalVentas)}
            </Text>
          </View>
          <View style={[styles.resumenSeparador, { backgroundColor: Colors.divider }]} />
          <View style={styles.resumenItem}>
            <Text style={styles.resumenLabel}>
              {hayFiltros ? 'Ganancia (filtrado)' : 'Ganancia neta acumulada'}
            </Text>
            <Text style={[styles.resumenValor, { color: totalGanancias >= 0 ? Colors.accentSuccess : Colors.accentDanger }]}>
              {formatMoneda(totalGanancias)}
            </Text>
          </View>
        </View>
      )}

      {/* ── Contenido principal ── */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : historial.length === 0 ? (
        // Estado vacío — sin turnos en absoluto
        <View style={styles.centrado}>
          <MaterialCommunityIcons name="history" size={64} color={Colors.textDisabled} />
          <Text style={styles.vacioTitulo}>Sin registros</Text>
          <Text style={styles.vacioDescripcion}>
            Los turnos cerrados aparecerán aquí automáticamente con todos sus detalles.
          </Text>
        </View>
      ) : historialFiltrado.length === 0 ? (
        // Estado vacío — hay turnos pero no coinciden con el filtro
        <View style={styles.centrado}>
          <MaterialCommunityIcons name="filter-off-outline" size={56} color={Colors.textDisabled} />
          <Text style={styles.vacioTitulo}>Sin resultados</Text>
          <Text style={styles.vacioDescripcion}>
            Ningún turno coincide con los filtros aplicados.
          </Text>
          <TouchableOpacity
            style={[styles.botonLimpiarFiltros, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}
            onPress={() => setFiltros(FILTROS_VACIOS)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="filter-remove-outline" size={16} color={Colors.accent} />
            <Text style={[styles.botonLimpiarFiltrosTexto, { color: Colors.accent }]}>
              Limpiar filtros
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={historialFiltrado}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CardHistorial
              registro={item}
              onVer={setRegistroSeleccionado}
              onEliminar={handleEliminar}
            />
          )}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Modal de detalle ── */}
      <ModalDetalleHistorial
        visible={registroSeleccionado !== null}
        onClose={() => setRegistroSeleccionado(null)}
        registro={registroSeleccionado}
      />
    </SafeAreaView>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.bgPrimary,
    },
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    headerTextos: {
      flex: 1,
    },
    headerAcciones: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    titulo: {
      fontFamily: Typography.fontFamilyBold,
      fontSize: Typography.size.xxl,
      color: Colors.textPrimary,
    },
    accentLine: {
      height: 2,
      backgroundColor: Colors.accent,
      width: 36,
      borderRadius: Radius.full,
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    subtitulo: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.sm,
      color: Colors.textSecondary,
    },
    botonRecargar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Banner de filtro activo
    filtroActivoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
    },
    filtroActivoTexto: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.xs,
    },
    // Resumen
    resumenTotal: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.lg,
      padding: Spacing.md,
    },
    resumenItem: {
      flex: 1,
      alignItems: 'center',
    },
    resumenLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.xs,
      color: Colors.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    resumenValor: {
      fontFamily: Typography.fontFamilyBold,
      fontSize: Typography.size.lg,
    },
    resumenSeparador: {
      width: 1,
      height: 40,
    },
    // Lista
    lista: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 120,
    },
    // Estados vacíos
    centrado: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xxxl,
      gap: Spacing.lg,
    },
    vacioTitulo: {
      fontFamily: Typography.fontFamilyBold,
      fontSize: Typography.size.xl,
      color: Colors.textSecondary,
    },
    vacioDescripcion: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.md,
      color: Colors.textDisabled,
      textAlign: 'center',
      lineHeight: 22,
    },
    botonLimpiarFiltros: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      marginTop: Spacing.sm,
    },
    botonLimpiarFiltrosTexto: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.sm,
    },
  });
}