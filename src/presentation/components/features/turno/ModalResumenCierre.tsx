// src/presentation/components/features/turno/ModalResumenCierre.tsx
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Turno } from '../../../../domain/entities/Turno';
import { TurnoRepository } from '../../../../data/repositories/TurnoRepository';
import { calcularCuadre } from '../../../../domain/usecases/calcularCuadre';
import { MovimientoRepository } from '../../../../data/repositories/MovimientoRepository';
import { formatMoneda } from '../../../../utils/formatters';
import { getColors, Typography, Spacing, Radius, Shadows } from '../../../../constants/theme';
import { formatDias, formatFechaHora } from '../../../../utils/formatters';
import { useTheme } from '../../../hooks/useTheme';

type EstadoItem = 'ok' | 'advertencia' | 'pendiente';

interface ResumenTurno {
  diasDuracion: number;
  entradas: number;
  salidas: number;
  mermas: number;
  cambiosPrecio: number;
  inventarioFinalCompleto: boolean;
  cajaCompleta: boolean;
  cuadreCalculado: boolean;
  //Resultado financiero real
  diferencia: number | null;
  estadoCuadre: 'exacto' | 'sobrante' | 'faltante' | null;
  totalVentas: number | null;
}

interface ModalResumenCierreProps {
  visible: boolean;
  turno: Turno;
  // Contadores ya disponibles en index.tsx — no hay fetch extra para estos
  totalEntradas: number;
  totalSalidas: number;
  totalMermas: number;
  totalCambios: number;
  onConfirmar: () => void;
  onCancelar: () => void;
  cerrando: boolean;
}

export function ModalResumenCierre({
  visible,
  turno,
  totalEntradas,
  totalSalidas,
  totalMermas,
  totalCambios,
  onConfirmar,
  onCancelar,
  cerrando,
}: ModalResumenCierreProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);

  const [cargando, setCargando] = useState(false);
  const [resumen, setResumen] = useState<ResumenTurno | null>(null);

  // ── Animaciones coordinadas: overlay fade + sheet slide ──────
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) {
      // Entrar: fade del overlay + slide del sheet simultáneos
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Salir: ambos se van juntos
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: Dimensions.get('window').height,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  // Cargar datos de BD al abrir (inventario final y caja — no están en index.tsx)
  useEffect(() => {
    if (!visible) return;

    let cancelado = false;
    setCargando(true);
    setResumen(null);

    async function cargar() {
      const [
        inventarioInicial,
        inventarioFinal,
        entradas,
        salidasFamiliares,
        cambiosPrecio,
        mermas,
        transferencias,
        gastos,
        cajaPorDia,
        registrosUSD,
      ] = await Promise.all([
        TurnoRepository.getInventario(turno.id, 'inicial'),
        TurnoRepository.getInventario(turno.id, 'final'),
        MovimientoRepository.getEntradas(turno.id),
        MovimientoRepository.getSalidasFamiliares(turno.id),
        MovimientoRepository.getCambiosPrecio(turno.id),
        MovimientoRepository.getMermas(turno.id),
        MovimientoRepository.getTransferencias(turno.id),
        MovimientoRepository.getGastos(turno.id),
        MovimientoRepository.getCajaPorDia(turno.id),
        MovimientoRepository.getRegistrosUSD(turno.id),
      ]);

      if (cancelado) return;

      const inventarioFinalCompleto = inventarioFinal.length > 0;
      const diasConCaja = new Set(cajaPorDia.map((c) => c.dia_numero)).size;
      const cajaCompleta = diasConCaja >= turno.dias_duracion;
      const cuadreCalculado = inventarioFinalCompleto && cajaCompleta;

      // Calcular resultado financiero real si hay inventario final
      let diferencia: number | null = null;
      let estadoCuadre: 'exacto' | 'sobrante' | 'faltante' | null = null;
      let totalVentas: number | null = null;

      if (inventarioFinalCompleto) {
        const resultado = calcularCuadre({
          inventarioInicial, inventarioFinal, entradas,
          salidasFamiliares, cambiosPrecio, mermas,
          transferencias, gastos, cajaPorDia, registrosUSD,
        });
        diferencia = resultado.diferencia;
        estadoCuadre = resultado.estado;
        totalVentas = resultado.total_ventas_esperado;
      }

      setResumen({
        diasDuracion: turno.dias_duracion,
        entradas: totalEntradas,
        salidas: totalSalidas,
        mermas: totalMermas,
        cambiosPrecio: totalCambios,
        inventarioFinalCompleto,
        cajaCompleta,
        cuadreCalculado,
        diferencia,
        estadoCuadre,
        totalVentas,
      });
    }

    cargar();
    return () => { cancelado = true; };
  }, [visible, turno.id, turno.dias_duracion, totalEntradas, totalSalidas, totalMermas, totalCambios]);

  // ── Lógica del semáforo ───────────────────────────────────
  const hayAlgosPendientesCriticos = resumen
    ? !resumen.inventarioFinalCompleto || !resumen.cajaCompleta
    : false;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancelar}
    >
      {/* Backdrop animado — fade suave coordinado con el sheet */}
      <Animated.View
        style={[styles.overlay, { backgroundColor: Colors.overlay, opacity: overlayOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={cerrando ? undefined : onCancelar}
        />
      </Animated.View>

      {/* Sheet animado — slide up con spring */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: Colors.bgSurface, borderColor: Colors.border },
          { transform: [{ translateY: sheetTranslateY }] },
          { minHeight: 320 },
        ]}
      >

        {/* Handle bar */}
        <View style={[styles.handle, { backgroundColor: Colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextos}>
            <Text style={[styles.titulo, { color: Colors.textPrimary }]}>
              Resumen del turno
            </Text>
            <Text style={[styles.subtitulo, { color: Colors.textSecondary }]}>
              Revisa antes de cerrar
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCancelar}
            style={styles.botonClose}
            disabled={cerrando}
          >
            <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.accentLine, { backgroundColor: Colors.accentDanger }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          {cargando ? (
            <View style={styles.loader}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={[styles.loaderTexto, { color: Colors.textSecondary }]}>
                Verificando estado del turno...
              </Text>
            </View>
          ) : resumen ? (
            <>
              {/* ── Info del turno ── */}
              <View style={[styles.turnoCard, { backgroundColor: Colors.bgElevated, borderColor: Colors.border }]}>
                <View style={styles.turnoRow}>
                  <MaterialCommunityIcons name="calendar-range" size={15} color={Colors.accent} />
                  <Text style={[styles.turnoLabel, { color: Colors.textSecondary }]}>Duración</Text>
                  <Text style={[styles.turnoValor, { color: Colors.textPrimary }]}>
                    {formatDias(resumen.diasDuracion)}
                  </Text>
                </View>
                <View style={[styles.turnoSep, { backgroundColor: Colors.divider }]} />
                <View style={styles.turnoRow}>
                  <MaterialCommunityIcons name="clock-outline" size={15} color={Colors.accent} />
                  <Text style={[styles.turnoLabel, { color: Colors.textSecondary }]}>Apertura</Text>
                  <Text style={[styles.turnoValor, { color: Colors.textPrimary }]}>
                    {formatFechaHora(turno.fecha_apertura)}
                  </Text>
                </View>
              </View>

              {/* ── Sección: Movimientos del turno ── */}
              <Text style={[styles.seccionLabel, { color: Colors.textSecondary }]}>
                MOVIMIENTOS REGISTRADOS
              </Text>

              <View style={[styles.grupo, { backgroundColor: Colors.bgElevated, borderColor: Colors.border }]}>
                <FilaMovimiento
                  icono="package-down"
                  label="Entradas"
                  valor={resumen.entradas}
                  estado={resumen.entradas > 0 ? 'ok' : 'pendiente'}
                  opcional
                  Colors={Colors}
                />
                <Separador Colors={Colors} />
                <FilaMovimiento
                  icono="account-arrow-right-outline"
                  label="Salidas familiares"
                  valor={resumen.salidas}
                  estado={resumen.salidas > 0 ? 'ok' : 'pendiente'}
                  opcional
                  Colors={Colors}
                />
                <Separador Colors={Colors} />
                <FilaMovimiento
                  icono="tag-edit-outline"
                  label="Cambios de precio"
                  valor={resumen.cambiosPrecio}
                  estado={resumen.cambiosPrecio > 0 ? 'ok' : 'pendiente'}
                  opcional
                  Colors={Colors}
                />
                <Separador Colors={Colors} />
                <FilaMovimiento
                  icono="alert-circle-outline"
                  label="Mermas"
                  valor={resumen.mermas}
                  estado={resumen.mermas > 0 ? 'ok' : 'pendiente'}
                  opcional
                  Colors={Colors}
                />
              </View>

              {/* ── Sección: Cuadre ── */}
              <Text style={[styles.seccionLabel, { color: Colors.textSecondary }]}>
                ESTADO DEL CUADRE
              </Text>

              <View style={[styles.grupo, { backgroundColor: Colors.bgElevated, borderColor: Colors.border }]}>
                <FilaEstado
                  icono="package-variant-closed"
                  label="Inventario final"
                  completo={resumen.inventarioFinalCompleto}
                  textoOk="Guardado"
                  textoPendiente="Sin guardar"
                  critico
                  Colors={Colors}
                />
                <Separador Colors={Colors} />
                <FilaEstado
                  icono="cash"
                  label={`Caja por día (${resumen.diasDuracion} ${resumen.diasDuracion === 1 ? 'día' : 'días'})`}
                  completo={resumen.cajaCompleta}
                  textoOk="Completa"
                  textoPendiente="Incompleta"
                  critico
                  Colors={Colors}
                />
                <Separador Colors={Colors} />
                <FilaEstado
                  icono="calculator-variant-outline"
                  label="Cuadre calculado"
                  completo={resumen.cuadreCalculado}
                  textoOk="Listo"
                  textoPendiente="Pendiente"
                  critico={false}
                  Colors={Colors}
                />
              </View>

              {/* ── Sección: Resultado financiero ── */}
              {resumen.diferencia !== null && resumen.estadoCuadre !== null && (
                <>
                  <Text style={[styles.seccionLabel, { color: Colors.textSecondary }]}>
                    RESULTADO FINANCIERO
                  </Text>
                  <View style={[
                    styles.resultadoCard,
                    {
                      backgroundColor:
                        resumen.estadoCuadre === 'exacto'
                          ? `${Colors.accentSuccess}12`
                          : resumen.estadoCuadre === 'sobrante'
                          ? `${Colors.accentWarning}12`
                          : `${Colors.accentDanger}12`,
                        borderColor:
                        resumen.estadoCuadre === 'exacto'
                          ? `${Colors.accentSuccess}40`
                          : resumen.estadoCuadre === 'sobrante'
                          ? `${Colors.accentWarning}40`
                          : `${Colors.accentDanger}40`,
                    },
                  ]}>
                    <MaterialCommunityIcons
                      name={
                        resumen.estadoCuadre === 'exacto' ? 'check-circle-outline'
                        : resumen.estadoCuadre === 'sobrante' ? 'trending-up'
                        : 'trending-down'
                      }
                      size={28}
                      color={
                        resumen.estadoCuadre === 'exacto' ? Colors.accentSuccess
                        : resumen.estadoCuadre === 'sobrante' ? Colors.accentWarning
                        : Colors.accentDanger
                      }
                    />
                    <View style={styles.resultadoTextos}>
                      <Text style={[
                        styles.resultadoLabel,
                        {
                          color:
                            resumen.estadoCuadre === 'exacto' ? Colors.accentSuccess
                            : resumen.estadoCuadre === 'sobrante' ? Colors.accentWarning
                            : Colors.accentDanger,
                        },
                      ]}>
                        {resumen.estadoCuadre === 'exacto' ? 'Cuadre exacto'
                        : resumen.estadoCuadre === 'sobrante' ? 'Sobrante'
                        : 'Faltante'}
                      </Text>
                      <Text style={[
                        styles.resultadoDiferencia,
                        {
                          color:
                            resumen.estadoCuadre === 'exacto' ? Colors.accentSuccess
                            : resumen.estadoCuadre === 'sobrante' ? Colors.accentWarning
                            : Colors.accentDanger,
                        },
                      ]}>
                        {resumen.estadoCuadre === 'exacto'
                          ? 'Sin diferencia'
                          : `${resumen.diferencia > 0 ? '+' : ''}${formatMoneda(resumen.diferencia)}`}
                      </Text>
                      {resumen.totalVentas !== null && (
                        <Text style={[styles.resultadoSub, { color: Colors.textSecondary }]}>
                          Ventas estimadas: {formatMoneda(resumen.totalVentas)}
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}

              {/* ── Aviso si hay pendientes críticos ── */}
              {hayAlgosPendientesCriticos && (
                <View style={[styles.aviso, {
                  backgroundColor: `${Colors.accentWarning}12`,
                  borderColor: `${Colors.accentWarning}40`,
                }]}>
                  <MaterialCommunityIcons
                    name="alert-outline"
                    size={16}
                    color={Colors.accentWarning}
                  />
                  <Text style={[styles.avisoTexto, { color: Colors.accentWarning }]}>
                    Hay secciones incompletas. El turno se cerrará sin cuadre completo y la diferencia no podrá calcularse.
                  </Text>
                </View>
              )}
            </>
          ) : null}
        </ScrollView>

        {/* ── Botones de acción ── */}
        <View style={[styles.acciones, { borderTopColor: Colors.divider }]}>
          <TouchableOpacity
            style={[styles.botonCancelar, { borderColor: Colors.border, backgroundColor: Colors.bgElevated }]}
            onPress={onCancelar}
            disabled={cerrando}
            activeOpacity={0.75}
          >
            <Text style={[styles.botonCancelarTexto, { color: Colors.textSecondary }]}>
              Volver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botonConfirmar,
              hayAlgosPendientesCriticos
                ? { backgroundColor: Colors.accentWarning }
                : { backgroundColor: Colors.accentDanger },
              cerrando && styles.botonDeshabilitado,
            ]}
            onPress={onConfirmar}
            disabled={cerrando || cargando}
            activeOpacity={0.8}
          >
            {cerrando ? (
              <ActivityIndicator size="small" color={Colors.textOnAccent} />
            ) : (
              <MaterialCommunityIcons
                name="stop-circle-outline"
                size={18}
                color={Colors.textOnAccent}
              />
            )}
            <Text style={[styles.botonConfirmarTexto, { color: Colors.textOnAccent }]}>
              {cerrando
                ? 'Cerrando...'
                : hayAlgosPendientesCriticos
                  ? 'Cerrar igual'
                  : 'Confirmar cierre'}
            </Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </RNModal>
  );
}

// ── Sub-componentes internos ──────────────────────────────────

function FilaMovimiento({
  icono, label, valor, estado, opcional, Colors,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  valor: number;
  estado: EstadoItem;
  opcional?: boolean;
  Colors: ReturnType<typeof getColors>;
}) {
  const colorEstado = estado === 'ok'
    ? Colors.accentSuccess
    : opcional
      ? Colors.textDisabled
      : Colors.accentDanger;

  return (
    <View style={filaStyles.fila}>
      <MaterialCommunityIcons name={icono} size={16} color={Colors.textSecondary} />
      <Text style={[filaStyles.label, { color: Colors.textPrimary }]}>{label}</Text>
      <View style={filaStyles.derecha}>
        {valor > 0 ? (
          <View style={[filaStyles.badge, { backgroundColor: `${Colors.accentSuccess}15` }]}>
            <Text style={[filaStyles.badgeTexto, { color: Colors.accentSuccess }]}>
              {valor} {valor === 1 ? 'registro' : 'registros'}
            </Text>
          </View>
        ) : (
          <Text style={[filaStyles.ninguno, { color: Colors.textDisabled }]}>
            {opcional ? 'Ninguno' : 'Pendiente'}
          </Text>
        )}
      </View>
    </View>
  );
}

function FilaEstado({
  icono, label, completo, textoOk, textoPendiente, critico, Colors,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  completo: boolean;
  textoOk: string;
  textoPendiente: string;
  critico: boolean;
  Colors: ReturnType<typeof getColors>;
}) {
  const color = completo
    ? Colors.accentSuccess
    : critico
      ? Colors.accentDanger
      : Colors.textDisabled;

  const iconoEstado = completo
    ? 'check-circle'
    : critico
      ? 'close-circle'
      : 'circle-outline';

  return (
    <View style={filaStyles.fila}>
      <MaterialCommunityIcons name={icono} size={16} color={Colors.textSecondary} />
      <Text style={[filaStyles.label, { color: Colors.textPrimary }]}>{label}</Text>
      <View style={filaStyles.derecha}>
        <MaterialCommunityIcons name={iconoEstado} size={15} color={color} />
        <Text style={[filaStyles.estadoTexto, { color }]}>
          {completo ? textoOk : textoPendiente}
        </Text>
      </View>
    </View>
  );
}

function Separador({ Colors }: { Colors: ReturnType<typeof getColors> }) {
  return <View style={[filaStyles.sep, { backgroundColor: Colors.divider }]} />;
}

const filaStyles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  label: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  derecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
  },
  ninguno: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  },
  estadoTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
  },
  sep: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
});

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      maxHeight: '88%',
      ...Shadows.lg,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: Radius.full,
      alignSelf: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
    },
    headerTextos: { flex: 1 },
    titulo: {
      fontFamily: Typography.fontFamilyBold,
      fontSize: Typography.size.lg,
    },
    subtitulo: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.sm,
      marginTop: 2,
    },
    botonClose: {
      padding: Spacing.xs,
      marginLeft: Spacing.sm,
    },
    accentLine: {
      height: 2,
      width: 36,
      borderRadius: Radius.full,
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
    },
    contenido: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    loader: {
      alignItems: 'center',
      paddingVertical: Spacing.xxxl,
      gap: Spacing.md,
    },
    loaderTexto: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.sm,
    },
    // Tarjeta info del turno
    turnoCard: {
      borderRadius: Radius.md,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    turnoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
    },
    turnoLabel: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
      flex: 1,
    },
    turnoValor: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.sm,
    },
    turnoSep: {
      height: 1,
      marginHorizontal: Spacing.md,
    },
    // Etiquetas de sección
    seccionLabel: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.xs,
      letterSpacing: 0.8,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    // Grupos de filas
    grupo: {
      borderRadius: Radius.md,
      borderWidth: 1,
      overflow: 'hidden',
    },
    // Aviso pendientes críticos
    aviso: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    avisoTexto: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.xs,
      flex: 1,
      lineHeight: 18,
    },
    // Botones
    acciones: {
      flexDirection: 'row',
      gap: Spacing.sm,
      padding: Spacing.xl,
      borderTopWidth: 1,
    },
    botonCancelar: {
      flex: 1,
      height: 50,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonCancelarTexto: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.md,
    },
    botonConfirmar: {
      flex: 2,
      height: 50,
      borderRadius: Radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    botonConfirmarTexto: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.md,
    },
    botonDeshabilitado: {
      opacity: 0.6,
    },
    resultadoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      padding: Spacing.md,
    },
    resultadoTextos: {
      flex: 1,
      gap: 2,
    },
    resultadoLabel: {
      fontFamily: Typography.fontFamilyBold,
      fontSize: Typography.size.md,
    },
    resultadoDiferencia: {
      fontFamily: Typography.fontFamilyExtraBold,
      fontSize: Typography.size.xl,
    },
    resultadoSub: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.size.xs,
      marginTop: 2,
    },
  });
}