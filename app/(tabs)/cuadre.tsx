// app/(tabs)/cuadre.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  InteractionManager,
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
  { id: 'inventario',     label: 'Inv. Final', icon: 'package-variant-closed' },
  { id: 'transferencias', label: 'Transfer.',  icon: 'bank-transfer' },
  { id: 'usd',            label: 'USD',        icon: 'currency-usd' },
  { id: 'gastos',         label: 'Gastos',     icon: 'minus-circle-outline' },
  { id: 'caja',           label: 'Caja',       icon: 'cash' },
  { id: 'resultado',      label: 'Resultado',  icon: 'calculator-variant-outline' },
];

// Secciones que son opcionales: si el usuario las visitó sin agregar datos,
// se consideran completadas (el usuario decidió que no aplica para este turno).
const SECCIONES_OPCIONALES: Set<Seccion> = new Set(['transferencias', 'usd', 'gastos']);

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
  const [calculando, setCalculando] = useState(false);

  // ── Progreso inteligente ──────────────────────────────────
  // Rastrea qué secciones opcionales ya visitó el usuario.
  // Al visitar una sección opcional sin agregar datos, se marca como
  // "revisada" — el usuario decidió que no aplica para este turno.
  const [seccionesVisitadas, setSeccionesVisitadas] = useState<Set<Seccion>>(new Set());

  // Resetear secciones visitadas cuando cambia el turno (nuevo turno = empezar de cero)
  const turnoIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (turno?.id && turno.id !== turnoIdRef.current) {
      turnoIdRef.current = turno.id;
      setSeccionesVisitadas(new Set());
    }
  }, [turno?.id]);

  // ── Animación entre secciones (sin pestañeo) ─────────────
  // Estrategia: 2 fases completamente en el hilo JS.
  //
  // FASE 1 — fade-out del contenido actual (80 ms).
  // FASE 2 — en el callback de completado: cambiamos la sección
  //           (el nuevo contenido aparece ya fuera de pantalla porque
  //           translateX ya tiene el valor ±SCREEN_WIDTH antes del setState),
  //           luego slide-in + fade-in simultáneos.
  //
  // La clave del fix: `translateX.setValue(direccion * SCREEN_WIDTH)` ocurre
  // ANTES de `setSeccionActiva`, por lo que cuando React renderiza el nuevo
  // contenido, la vista ya está posicionada fuera de pantalla. Nunca habrá
  // un frame donde el contenido nuevo esté en posición 0 visible.
  const opacidad = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const indiceSeccionRef = useRef(0);
  const animandoRef = useRef(false);

  const cambiarSeccion = useCallback((nuevaSeccion: Seccion) => {
    if (animandoRef.current) return;
    if (nuevaSeccion === seccionActiva) return;

    const indiceActual = indiceSeccionRef.current;
    const indiceNuevo = SECCIONES.findIndex((s) => s.id === nuevaSeccion);
    const direccion = indiceNuevo > indiceActual ? 1 : -1;

    // Marcar sección opcional como visitada al salir de ella
    if (SECCIONES_OPCIONALES.has(seccionActiva)) {
      setSeccionesVisitadas((prev) => {
        const siguiente = new Set(prev);
        siguiente.add(seccionActiva);
        return siguiente;
      });
    }

    animandoRef.current = true;

    // FASE 1: fade-out del contenido actual
    Animated.timing(opacidad, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        animandoRef.current = false;
        return;
      }

      // Posicionar fuera de pantalla ANTES del setState — punto crítico del fix.
      // Cuando React renderice el nuevo contenido, ya estará en ±SCREEN_WIDTH.
      translateX.setValue(direccion * SCREEN_WIDTH);
      indiceSeccionRef.current = indiceNuevo;

      // Cambiar sección: React renderiza el nuevo contenido ya desplazado
      setSeccionActiva(nuevaSeccion);

      // Esperar al siguiente frame para que el render se complete,
      // luego arrancar slide-in + fade-in simultáneos
      InteractionManager.runAfterInteractions(() => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(opacidad, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          animandoRef.current = false;
        });
      });
    });
  }, [seccionActiva, opacidad, translateX]);

  const turnoId = turno?.id ?? null;

  const { items, cargando: cargandoInventario, actualizarCantidad, toInputArray } = useInventarioFinal(
    productos,
    turnoId ?? 0,
    datos?.entradas ?? [],
  );

  const [pendienteEliminar, setPendienteEliminar] = useState<{
    tipo: 'transferencia' | 'usd' | 'gasto';
    id: number;
  } | null>(null);

  // ── Lógica de progreso inteligente ───────────────────────
  // Caja completada: todos los días tienen monto guardado y > 0
  const cajaCompleta = (() => {
    if (!datos || !turno) return false;
    const diasRequeridos = turno.dias_duracion;
    const diasConMonto = datos.cajaPorDia.filter((c) => c.monto_efectivo > 0);
    return diasConMonto.length >= diasRequeridos;
  })();

  const seccionesCompletadas: Record<Seccion, boolean> = {
    // Obligatorias: requieren datos reales
    inventario: (datos?.inventarioFinal.length ?? 0) > 0,
    caja: cajaCompleta,
    // Opcionales: se marcan si hay datos O si el usuario ya las visitó
    transferencias:
      (datos?.transferencias.length ?? 0) > 0 || seccionesVisitadas.has('transferencias'),
    usd:
      (datos?.registrosUSD.length ?? 0) > 0 || seccionesVisitadas.has('usd'),
    gastos:
      (datos?.gastos.length ?? 0) > 0 || seccionesVisitadas.has('gastos'),
    // Resultado: se completa solo cuando ya hay un resultado calculado
    resultado: resultado !== null,
  };

  // Para la barra de progreso, solo contamos las 5 secciones de entrada (no "resultado")
  // El resultado es la meta, no un paso más.
  const SECCIONES_PROGRESO: Seccion[] = ['inventario', 'transferencias', 'usd', 'gastos', 'caja'];
  const completadasProgreso = SECCIONES_PROGRESO.filter((s) => seccionesCompletadas[s]).length;
  const totalProgreso = SECCIONES_PROGRESO.length;

  // El cuadre está listo para calcular cuando las dos obligatorias están completas
  const listoParaCalcular = seccionesCompletadas.inventario && seccionesCompletadas.caja;

  // Marcar sección activa como visitada cuando el usuario llega a ella
  useEffect(() => {
    if (SECCIONES_OPCIONALES.has(seccionActiva)) {
      // Se marca al salir (en cambiarSeccion), no al entrar, para que el
      // usuario tenga tiempo de agregar datos antes de que se marque.
    }
  }, [seccionActiva]);

  useFocusEffect(
    useCallback(() => {
      recargarTurno();
      recargarProductos();
    }, [recargarTurno, recargarProductos])
  );

  useFocusEffect(
    useCallback(() => {
      if (turnoId) {
        cargarDatos(turnoId);
      }
    }, [turnoId, cargarDatos])
  );

  // ── Pantalla de carga ─────────────────────────────────────
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

  const handleEliminarTransferencia = (id: number) => {
    setPendienteEliminar({ tipo: 'transferencia', id });
  };

  const handleCrearUSD = async (input: RegistroUSDInput) => {
    await MovimientoRepository.crearRegistroUSD(input);
    await cargarDatos(turno.id);
    toast.exito('USD registrado', `${input.cantidad_usd} USD`);
  };

  const handleEliminarUSD = (id: number) => {
    setPendienteEliminar({ tipo: 'usd', id });
  };

  const handleCrearGasto = async (input: GastoInput) => {
    await MovimientoRepository.crearGasto(input);
    await cargarDatos(turno.id);
    toast.exito('Gasto registrado', input.concepto ?? formatMoneda(input.monto));
  };

  const handleEliminarGasto = (id: number) => {
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

  // Feedback inmediato al calcular: activa el loader, luego calcula en el siguiente frame
  const handleCalcular = () => {
    if (!seccionesCompletadas.inventario) {
      toast.advertencia('Falta inventario final', 'Guarda el inventario final antes de calcular');
      cambiarSeccion('inventario');
      return;
    }
    if (!seccionesCompletadas.caja) {
      toast.advertencia('Falta la caja', 'Ingresa el efectivo de cada día antes de calcular');
      cambiarSeccion('caja');
      return;
    }

    setCalculando(true);
    // Pequeño timeout para que el render con el loader ocurra antes del cálculo
    setTimeout(() => {
      calcular();
      setCalculando(false);
      cambiarSeccion('resultado');
      toast.exito('Cuadre calculado', 'El resultado está listo');
    }, 50);
  };

  const getMensajeEliminar = () => {
    if (!pendienteEliminar) return '';
    switch (pendienteEliminar.tipo) {
      case 'transferencia': return '¿Eliminar esta transferencia?';
      case 'usd':           return '¿Eliminar este registro de USD?';
      case 'gasto':         return '¿Eliminar este gasto?';
    }
  };

  const getTituloEliminar = () => {
    if (!pendienteEliminar) return '';
    switch (pendienteEliminar.tipo) {
      case 'transferencia': return 'Eliminar transferencia';
      case 'usd':           return 'Eliminar registro USD';
      case 'gasto':         return 'Eliminar gasto';
    }
  };

  // ── Checklist inteligente para la pestaña Resultado ──────
  // Construye el estado actual de cada requisito con mensajes claros
  const checklistResultado = [
    {
      id: 'inventario',
      label: 'Inventario final',
      requerido: true,
      completado: seccionesCompletadas.inventario,
      accion: () => cambiarSeccion('inventario'),
      labelAccion: 'Ir a Inv. Final',
      mensajeFaltante: 'Realiza el conteo y guarda el inventario final',
      mensajeOk: `${datos?.inventarioFinal.length ?? 0} productos contados`,
    },
    {
      id: 'caja',
      label: 'Efectivo en caja',
      requerido: true,
      completado: seccionesCompletadas.caja,
      accion: () => cambiarSeccion('caja'),
      labelAccion: 'Ir a Caja',
      mensajeFaltante: `Ingresa el efectivo de ${
        turno.dias_duracion === 1 ? 'el día' : `los ${turno.dias_duracion} días`
      }`,
      mensajeOk: `${datos?.cajaPorDia.filter((c) => c.monto_efectivo > 0).length ?? 0} de ${turno.dias_duracion} ${turno.dias_duracion === 1 ? 'día' : 'días'} ingresados`,
    },
    {
      id: 'transferencias',
      label: 'Transferencias',
      requerido: false,
      completado: seccionesCompletadas.transferencias,
      accion: () => cambiarSeccion('transferencias'),
      labelAccion: 'Ir a Transfer.',
      mensajeFaltante: 'Opcional — agrega transferencias o pasa por esta pestaña',
      mensajeOk: (datos?.transferencias.length ?? 0) > 0
        ? `${datos?.transferencias.length} transferencia(s) registradas`
        : 'Sin transferencias (marcado como revisado)',
    },
    {
      id: 'usd',
      label: 'USD',
      requerido: false,
      completado: seccionesCompletadas.usd,
      accion: () => cambiarSeccion('usd'),
      labelAccion: 'Ir a USD',
      mensajeFaltante: 'Opcional — agrega registros en USD o pasa por esta pestaña',
      mensajeOk: (datos?.registrosUSD.length ?? 0) > 0
        ? `${datos?.registrosUSD.length} registro(s) USD`
        : 'Sin USD (marcado como revisado)',
    },
    {
      id: 'gastos',
      label: 'Gastos',
      requerido: false,
      completado: seccionesCompletadas.gastos,
      accion: () => cambiarSeccion('gastos'),
      labelAccion: 'Ir a Gastos',
      mensajeFaltante: 'Opcional — agrega gastos o pasa por esta pestaña',
      mensajeOk: (datos?.gastos.length ?? 0) > 0
        ? `${datos?.gastos.length} gasto(s) registrado(s)`
        : 'Sin gastos (marcado como revisado)',
    },
  ];

  const pendientesObligatorios = checklistResultado.filter((c) => c.requerido && !c.completado);
  const pendientesOpcionales = checklistResultado.filter((c) => !c.requerido && !c.completado);

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
            style={[
              styles.botonCalcular,
              !listoParaCalcular && styles.botonCalcularDeshabilitado,
            ]}
            onPress={handleCalcular}
            activeOpacity={0.8}
            disabled={calculando}
          >
            {calculando ? (
              <ActivityIndicator size="small" color={Colors.textOnAccent} />
            ) : (
              <MaterialCommunityIcons
                name="calculator-variant"
                size={16}
                color={Colors.textOnAccent}
              />
            )}
            <Text style={styles.botonCalcularTexto}>
              {calculando ? 'Calculando...' : 'Calcular'}
            </Text>
          </TouchableOpacity>
        </View>
        <BarraProgresoCuadre
          completadas={completadasProgreso}
          total={totalProgreso}
          listoParaCalcular={listoParaCalcular}
          seccionesCompletadas={seccionesCompletadas}
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
            const esOpcional = SECCIONES_OPCIONALES.has(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.navItem, activa && styles.navItemActivo]}
                onPress={() => cambiarSeccion(s.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={`${s.label}${completada ? ': completado' : esOpcional ? ': opcional' : ': pendiente'}`}
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
                {!completada && esOpcional && (
                  <MaterialCommunityIcons
                    name="circle-outline"
                    size={14}
                    color={Colors.textDisabled}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Contenido animado ── */}
      <KeyboardAvoidingView
        style={styles.contenidoScroll}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.contenidoScroll, { opacity: opacidad, transform: [{ translateX }] }]}>
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

            {seccionActiva === 'transferencias' && (
              <SeccionTransferencias
                turnoId={turno.id}
                transferencias={datos?.transferencias ?? []}
                onCrear={handleCrearTransferencia}
                onEliminar={handleEliminarTransferencia}
              />
            )}

            {seccionActiva === 'usd' && (
              <SeccionUSD
                turnoId={turno.id}
                registros={datos?.registrosUSD ?? []}
                onCrear={handleCrearUSD}
                onEliminar={handleEliminarUSD}
              />
            )}

            {seccionActiva === 'gastos' && (
              <SeccionGastos
                turnoId={turno.id}
                gastos={datos?.gastos ?? []}
                onCrear={handleCrearGasto}
                onEliminar={handleEliminarGasto}
              />
            )}

            {seccionActiva === 'caja' && (
              <SeccionCajaPorDia
                turnoId={turno.id}
                diasDuracion={turno.dias_duracion}
                cajaPorDia={datos?.cajaPorDia ?? []}
                onGuardar={handleGuardarCajaPorDia}
              />
            )}

            {seccionActiva === 'resultado' && resultado && (
              <ResultadoCuadreView resultado={resultado} />
            )}

            {seccionActiva === 'resultado' && !resultado && (
              <View style={styles.checklistContainer}>
                {/* Título con estado general */}
                <View style={styles.checklistHeader}>
                  <MaterialCommunityIcons
                    name={listoParaCalcular ? 'check-decagram' : 'clipboard-list-outline'}
                    size={24}
                    color={listoParaCalcular ? Colors.accentSuccess : Colors.accent}
                  />
                  <View style={styles.checklistHeaderTextos}>
                    <Text style={styles.checklistTitulo}>
                      {listoParaCalcular
                        ? '¡Listo para calcular!'
                        : 'Estado del cuadre'}
                    </Text>
                    <Text style={styles.checklistSubtitulo}>
                      {listoParaCalcular
                        ? 'Todos los requisitos obligatorios están completos.'
                        : `Faltan ${pendientesObligatorios.length} requisito(s) obligatorio(s).`}
                    </Text>
                  </View>
                </View>

                {/* Separador */}
                <View style={styles.checklistSeparador} />

                {/* Lista de requisitos */}
                {checklistResultado.map((item) => (
                  <View key={item.id} style={styles.checklistItem}>
                    <View style={styles.checklistItemIzq}>
                      <MaterialCommunityIcons
                        name={
                          item.completado
                            ? 'check-circle'
                            : item.requerido
                              ? 'alert-circle-outline'
                              : 'information-outline'
                        }
                        size={20}
                        color={
                          item.completado
                            ? Colors.accentSuccess
                            : item.requerido
                              ? Colors.accentDanger
                              : Colors.textSecondary
                        }
                      />
                      <View style={styles.checklistItemTextos}>
                        <View style={styles.checklistItemTituloRow}>
                          <Text style={[
                            styles.checklistLabel,
                            item.completado && styles.checklistLabelOk,
                          ]}>
                            {item.label}
                          </Text>
                          {!item.requerido && (
                            <View style={styles.opcionalBadge}>
                              <Text style={styles.opcionalBadgeTexto}>opcional</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[
                          styles.checklistMensaje,
                          item.completado && styles.checklistMensajeOk,
                        ]}>
                          {item.completado ? item.mensajeOk : item.mensajeFaltante}
                        </Text>
                      </View>
                    </View>
                    {!item.completado && (
                      <TouchableOpacity
                        style={[
                          styles.checklistBotonIr,
                          item.requerido && styles.checklistBotonIrPrimario,
                        ]}
                        onPress={item.accion}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.checklistBotonIrTexto,
                          item.requerido && styles.checklistBotonIrTextoPrimario,
                        ]}>
                          {item.labelAccion}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                {/* Información sobre opcionales no revisadas */}
                {pendientesOpcionales.length > 0 && (
                  <View style={styles.checklistInfoOpcional}>
                    <MaterialCommunityIcons
                      name="lightbulb-outline"
                      size={15}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.checklistInfoOpcionalTexto}>
                      Las secciones opcionales se marcan automáticamente cuando las visitas, aunque no agregues datos.
                    </Text>
                  </View>
                )}

                {/* Botón de calcular si está listo */}
                {listoParaCalcular && (
                  <TouchableOpacity
                    style={styles.botonCalcularResultado}
                    onPress={handleCalcular}
                    activeOpacity={0.8}
                    disabled={calculando}
                  >
                    {calculando ? (
                      <ActivityIndicator size="small" color={Colors.textOnAccent} />
                    ) : (
                      <MaterialCommunityIcons name="calculator-variant" size={20} color={Colors.textOnAccent} />
                    )}
                    <Text style={styles.botonCalcularResultadoTexto}>
                      {calculando ? 'Calculando...' : 'Calcular cuadre ahora'}
                    </Text>
                  </TouchableOpacity>
                )}
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
    minWidth: 100,
    justifyContent: 'center',
  },
  botonCalcularDeshabilitado: {
    backgroundColor: Colors.textDisabled,
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

  // ── Checklist inteligente ──
  checklistContainer: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  checklistHeaderTextos: {
    flex: 1,
    gap: 2,
  },
  checklistTitulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  checklistSubtitulo: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  checklistSeparador: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checklistItemIzq: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checklistItemTextos: {
    flex: 1,
    gap: 2,
  },
  checklistItemTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  checklistLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
  },
  checklistLabelOk: {
    color: Colors.accentSuccess,
  },
  checklistMensaje: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  checklistMensajeOk: {
    color: Colors.accentSuccess,
  },
  opcionalBadge: {
    backgroundColor: 'rgba(79,142,247,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.3)',
  },
  opcionalBadgeTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 9,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  checklistBotonIr: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  checklistBotonIrPrimario: {
    borderColor: Colors.accentDanger,
    backgroundColor: 'rgba(232,84,84,0.08)',
  },
  checklistBotonIrTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  checklistBotonIrTextoPrimario: {
    color: Colors.accentDanger,
  },
  checklistInfoOpcional: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  checklistInfoOpcionalTexto: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  botonCalcularResultado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  botonCalcularResultadoTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    color: Colors.textOnAccent,
  },
  });
}