// app/(tabs)/cuadre.tsx
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTurno } from '../../src/presentation/hooks/useTurno';
import { useProductos } from '../../src/presentation/hooks/useProductos';
import { useCuadre } from '../../src/presentation/hooks/useCuadre';
import { useInventarioFinal } from '../../src/presentation/hooks/useInventarioFinal';
import { useToast } from '../../src/presentation/hooks/useToast';
import { MovimientoRepository } from '../../src/data/repositories/MovimientoRepository';
import { SeccionInventarioFinal } from '../../src/presentation/components/features/cuadre/SeccionInventarioFinal';
import { SeccionTransferencias } from '../../src/presentation/components/features/cuadre/SeccionTransferencias';
import { SeccionUSD } from '../../src/presentation/components/features/cuadre/SeccionUSD';
import { SeccionGastos } from '../../src/presentation/components/features/cuadre/SeccionGastos';
import { SeccionCajaPorDia } from '../../src/presentation/components/features/cuadre/SeccionCajaPorDia';
import { ResultadoCuadreView } from '../../src/presentation/components/features/cuadre/ResultadoCuadre';
import { BarraProgresoCuadre } from '../../src/presentation/components/features/cuadre/BarraProgresoCuadre';
import { ModalConfirmacion } from '../../src/presentation/components/ui/ModalConfirmacion';
import { TransferenciaInput } from '../../src/domain/entities/Transferencia';
import { RegistroUSDInput } from '../../src/domain/entities/RegistroUSD';
import { formatMoneda } from '../../src/utils/formatters';
import { GastoInput } from '../../src/domain/entities/Gasto';
import { CajaDiaInput } from '../../src/domain/entities/CajaDia';
import { getColors, Typography, Spacing, Radius } from '../../src/constants/theme';
import { useTheme } from '../../src/presentation/hooks/useTheme';

type Seccion = 'inventario' | 'transferencias' | 'usd' | 'gastos' | 'caja' | 'resultado';

const SECCIONES: {
  id: Seccion;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { id: 'inventario', label: 'Inv. Final', icon: 'package-variant-closed' },
  { id: 'transferencias', label: 'Transfer.', icon: 'bank-transfer' },
  { id: 'usd', label: 'USD', icon: 'currency-usd' },
  { id: 'gastos', label: 'Gastos', icon: 'minus-circle-outline' },
  { id: 'caja', label: 'Caja', icon: 'cash' },
  { id: 'resultado', label: 'Resultado', icon: 'calculator-variant-outline' },
];

export default function CuadreScreen() {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const toast = useToast();
  const { turno, cargando: cargandoTurno, recargar: recargarTurno } = useTurno();
  const { productos, recargar: recargarProductos } = useProductos();
  const { datos, resultado, cargando, cargarDatos, guardarInventarioFinal, calcular } =
    useCuadre();
  const [seccionActiva, setSeccionActiva] = useState<Seccion>('inventario');
  const [guardandoInventario, setGuardandoInventario] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const indiceSeccionRef = useRef(0);

  const cambiarSeccion = useCallback((nuevaSeccion: Seccion) => {
    const indiceActual = indiceSeccionRef.current;
    const indiceNuevo = SECCIONES.findIndex((s) => s.id === nuevaSeccion);
    const direccion = indiceNuevo > indiceActual ? 1 : -1;

    // La nueva sección entra desde fuera de la pantalla
    slideAnim.setValue(direccion * SCREEN_WIDTH);

    setSeccionActiva(nuevaSeccion);
    indiceSeccionRef.current = indiceNuevo;

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 68,
      friction: 11,
    }).start();
  }, [slideAnim]);

  const turnoId = turno?.id ?? null;

  const { items, cargando: cargandoInventario, actualizarCantidad, toInputArray } = useInventarioFinal(
    productos,
    turnoId ?? 0
  );

  // El estado solo necesita tipo e id
  const [pendienteEliminar, setPendienteEliminar] = useState<{
    tipo: 'transferencia' | 'usd' | 'gasto';
    id: number;
  } | null>(null);

  const seccionesCompletadas: Record<Seccion, boolean> = {
    inventario: (datos?.inventarioFinal.length ?? 0) > 0,
    transferencias: (datos?.transferencias.length ?? 0) > 0,
    usd: (datos?.registrosUSD.length ?? 0) > 0,
    gastos: (datos?.gastos.length ?? 0) > 0,
    caja: new Set(datos?.cajaPorDia.map((registro) => registro.dia_numero) ?? []).size >=
      (turno?.dias_duracion ?? 1),
    resultado: resultado !== null,
  };
  const totalSeccionesCompletadas = Object.values(seccionesCompletadas)
    .filter(Boolean)
    .length;

  // Recargar el estado del turno y los productos cada vez que la pantalla
  // recibe el foco. Esto resuelve que el Inventario Final quede vacío al
  // llegar a la pantalla por primera vez después de abrir un turno, o que
  // no incluya productos nuevos creados desde la pantalla de Entradas.
  useFocusEffect(
    useCallback(() => {
      recargarTurno();
      recargarProductos();
    }, [recargarTurno, recargarProductos])
  );

  // Recargar los datos del cuadre cada vez que la pantalla recibe el foco.
  // Esto resuelve la desincronizacion entre pantallas: si el turno se abrio
  // en la pantalla de Inicio, al navegar a Cuadre se detecta correctamente.
  useFocusEffect(
    useCallback(() => {
      if (turnoId) {
        cargarDatos(turnoId);
      }
    }, [turnoId, cargarDatos])
  );

  // ── Pantalla de carga ─────────────────────────────────────
  // Solo se muestra el spinner si no hay datos previos.
  // Si ya hay datos (navegacion entre tabs), la actualizacion
  // ocurre en segundo plano sin interrumpir la interfaz.
  if (
    (cargandoTurno && !turno) ||
    (cargando && !datos) ||
    (cargandoInventario && items.length === 0)
  ) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Sin turno ──────────────────────────────────────────────
  if (!turno || turno.estado !== 'abierto') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerContainer}>
          <Text style={styles.titulo}>Cuadre de caja</Text>
          <View style={styles.accentLine} />
        </View>
        <View style={styles.centrado}>
          <MaterialCommunityIcons
            name="calculator-variant-outline"
            size={64}
            color={Colors.textDisabled}
          />
          <Text style={styles.sinTurnoTexto}>
            No hay un turno abierto.{'\n'}Abre un turno desde la pantalla de Inicio.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Handlers ──────────────────────────────────────────────
  const handleGuardarInventarioFinal = async () => {
    try {
      setGuardandoInventario(true);
      await guardarInventarioFinal(turno.id, toInputArray());
      toast.exito('Inventario final guardado', 'El conteo fue registrado correctamente');
      cambiarSeccion('transferencias');
    } catch {
      toast.error('Error', 'No se pudo guardar el inventario final');
    } finally {
      setGuardandoInventario(false);
    }
  };

  const handleCrearTransferencia = async (input: TransferenciaInput) => {
    await MovimientoRepository.crearTransferencia(input);
    await cargarDatos(turno.id);
    toast.exito('Transferencia agregada', formatMoneda(input.monto));
  };

  const handleEliminarTransferencia = async (id: number) => {
    setPendienteEliminar({ tipo: 'transferencia', id });
  };

  const handleCrearUSD = async (input: RegistroUSDInput) => {
    await MovimientoRepository.crearRegistroUSD(input);
    await cargarDatos(turno.id);
    toast.exito('USD registrado', `${input.cantidad_usd} USD`);
  };

  const handleEliminarUSD = async (id: number) => {
    setPendienteEliminar({ tipo: 'usd', id });
  };

  const handleCrearGasto = async (input: GastoInput) => {
    await MovimientoRepository.crearGasto(input);
    await cargarDatos(turno.id);
    toast.exito('Gasto registrado', input.concepto ?? formatMoneda(input.monto));
  };

  const handleEliminarGasto = async (id: number) => {
    setPendienteEliminar({ tipo: 'gasto', id });
  };

  const handleGuardarCajaPorDia = async (inputs: CajaDiaInput[]) => {
    await MovimientoRepository.guardarCajaPorDia(inputs);
    await cargarDatos(turno.id);
    toast.exito(
      'Caja guardada',
      `${inputs.length} ${inputs.length === 1 ? 'día actualizado' : 'días actualizados'}`
    );
  };

  const handleConfirmarEliminar = async () => {
    if (!pendienteEliminar) return;
    const { tipo, id } = pendienteEliminar;
    setPendienteEliminar(null);

    if (tipo === 'transferencia') {
      await MovimientoRepository.eliminarTransferencia(id);
      await cargarDatos(turno.id);
      toast.advertencia('Transferencia eliminada', '');
    } else if (tipo === 'usd') {
      await MovimientoRepository.eliminarRegistroUSD(id);
      await cargarDatos(turno.id);
      toast.advertencia('Registro USD eliminado', '');
    } else if (tipo === 'gasto') {
      await MovimientoRepository.eliminarGasto(id);
      await cargarDatos(turno.id);
      toast.advertencia('Gasto eliminado', '');
    }
  };

  const handleCalcular = () => {
    if (!datos?.inventarioFinal.length) {
      toast.advertencia(
        'Falta inventario final',
        'Guarda el inventario final antes de calcular'
      );
      cambiarSeccion('inventario');
      return;
    }
    calcular();
    cambiarSeccion('resultado');
    toast.exito('Cuadre calculado', 'El resultado está listo');
  };

  const getMensajeEliminar = () => {
    if (!pendienteEliminar) return '';
    switch (pendienteEliminar.tipo) {
      case 'transferencia':
        return `¿Eliminar la transferencia de "${pendienteEliminar}"?`;
      case 'usd':
        return `¿Eliminar el registro USD de "${pendienteEliminar}"?`;
      case 'gasto':
        return `¿Eliminar el gasto "${pendienteEliminar }"?`;
    }
  };

  const getTituloEliminar = () => {
    if (!pendienteEliminar) return '';
    switch (pendienteEliminar.tipo) {
      case 'transferencia':
        return 'Eliminar transferencia';
      case 'usd':
        return 'Eliminar registro USD';
      case 'gasto':
        return 'Eliminar gasto';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header fijo ── */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleWrapper}>
            <Text style={styles.titulo}>Cuadre de caja</Text>
            <View style={styles.accentLine} />
            <Text style={styles.subtitulo}>Turno activo</Text>
          </View>
          <TouchableOpacity
            style={styles.botonCalcular}
            onPress={handleCalcular}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calculator-variant"
              size={16}
              color={Colors.textOnAccent}
            />
            <Text style={styles.botonCalcularTexto}>Calcular</Text>
          </TouchableOpacity>
        </View>
        <BarraProgresoCuadre
          completadas={totalSeccionesCompletadas}
          total={SECCIONES.length}
        />
      </View>

      {/* ── Navegación horizontal fija ── */}
      <View style={styles.navWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navContainer}
          bounces={false}
        >
          {SECCIONES.map((s) => {
            const activa = seccionActiva === s.id;
            const completada = seccionesCompletadas[s.id];
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.navItem, activa && styles.navItemActivo]}
                onPress={() => cambiarSeccion(s.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={`${s.label}: ${completada ? 'con datos' : 'sin datos'}`}
              >
                <MaterialCommunityIcons
                  name={s.icon}
                  size={15}
                  color={activa ? Colors.accent : Colors.textSecondary}
                />
                <Text style={[styles.navLabel, activa && styles.navLabelActivo]}>
                  {s.label}
                </Text>
                {completada && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={14}
                    color={Colors.accentSuccess}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Contenido scrollable independiente ── */}
      <KeyboardAvoidingView
        style={styles.contenidoScroll}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      <Animated.View style={[styles.contenidoScroll, { transform: [{ translateX: slideAnim }] }]}>
      <ScrollView
        style={styles.contenidoScroll}
        contentContainerStyle={styles.contenidoPadding}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {seccionActiva === 'inventario' && (
          <SeccionInventarioFinal
            items={items}
            inventarioInicial={datos?.inventarioInicial ?? []}
            entradas={datos?.entradas ?? []}
            onActualizarCantidad={actualizarCantidad}
            onGuardar={handleGuardarInventarioFinal}
            guardando={guardandoInventario}
          />
        )}

        {seccionActiva === 'transferencias' && datos && (
          <SeccionTransferencias
            turnoId={turno.id}
            transferencias={datos.transferencias}
            onCrear={handleCrearTransferencia}
            onEliminar={handleEliminarTransferencia}
          />
        )}

        {seccionActiva === 'usd' && datos && (
          <SeccionUSD
            turnoId={turno.id}
            registros={datos.registrosUSD}
            onCrear={handleCrearUSD}
            onEliminar={handleEliminarUSD}
          />
        )}

        {seccionActiva === 'gastos' && datos && (
          <SeccionGastos
            turnoId={turno.id}
            gastos={datos.gastos}
            onCrear={handleCrearGasto}
            onEliminar={handleEliminarGasto}
          />
        )}

        {seccionActiva === 'caja' && datos && (
          <SeccionCajaPorDia
            turnoId={turno.id}
            diasDuracion={turno.dias_duracion}
            cajaPorDia={datos.cajaPorDia}
            onGuardar={handleGuardarCajaPorDia}
          />
        )}

        {seccionActiva === 'resultado' && resultado && (
          <ResultadoCuadreView resultado={resultado} />
        )}

        {seccionActiva === 'resultado' && !resultado && (
          <View style={styles.checklistContainer}>
            <Text style={styles.checklistTitulo}>Para calcular el cuadre necesitas:</Text>

            <View style={styles.checklistItem}>
              <MaterialCommunityIcons
                name={datos && datos.inventarioFinal.length > 0 ? 'check-circle' : 'checkbox-blank-circle-outline'}
                size={20}
                color={datos && datos.inventarioFinal.length > 0 ? Colors.accentSuccess : Colors.textDisabled}
              />
              <Text style={[
                styles.checklistTexto,
                datos && datos.inventarioFinal.length > 0 && styles.checklistCompletado
              ]}>
                Inventario final{datos && datos.inventarioFinal.length > 0 ? ' (completado)' : ' (pendiente)'}
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <MaterialCommunityIcons
                name={datos && datos.cajaPorDia.length > 0 ? 'check-circle' : 'checkbox-blank-circle-outline'}
                size={20}
                color={datos && datos.cajaPorDia.length > 0 ? Colors.accentSuccess : Colors.textDisabled}
              />
              <Text style={[
                styles.checklistTexto,
                datos && datos.cajaPorDia.length > 0 && styles.checklistCompletado
              ]}>
                Caja por dia{datos && datos.cajaPorDia.length > 0 ? ' (completado)' : ' (pendiente)'}
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.checklistTexto}>
                Transferencias, USD y Gastos son opcionales
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botonIrInventario}
              onPress={() => cambiarSeccion('inventario')}
              activeOpacity={0.7}
            >
              <Text style={styles.botonIrInventarioTexto}>
                Ir a Inventario Final
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </Animated.View>
      </KeyboardAvoidingView>

      {/* ── Modal de Confirmación ── */}
      <ModalConfirmacion
        visible={pendienteEliminar !== null}
        titulo={getTituloEliminar()}
        mensaje={getMensajeEliminar()}
        onConfirmar={handleConfirmarEliminar}
        onCancelar={() => setPendienteEliminar(null)}
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

  // ── Header ──
  headerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleWrapper: {
    flex: 1,
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
  botonCalcular: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },

  botonCalcularTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textOnAccent,
  },

  // ── Nav ──
  navWrapper: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.bgSurface,
    height: 48,
  },
  navContainer: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    height: 48,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 34,
  },
  navItemActivo: {
    backgroundColor: 'rgba(79,142,247,0.12)',
    borderColor: 'rgba(79,142,247,0.3)',
  },
  navLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  navLabelActivo: {
    color: Colors.accent,
  },

  // ── Contenido ──
  contenidoScroll: {
    flex: 1,
  },
  contenidoPadding: {
    padding: Spacing.xl,
    // Espacio extra al final para que el contenido no quede
    // detras de la barra de navegacion flotante
    paddingBottom: 120,
  },

  // ── Estados ──
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  sinTurnoTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
    // ── Checklist ──
  checklistContainer: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  checklistTitulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checklistTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  checklistCompletado: {
    color: Colors.accentSuccess,
    fontFamily: Typography.fontFamilySemiBold,
  },
  botonIrInventario: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  botonIrInventarioTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textOnAccent,
  },
  });
}