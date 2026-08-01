// src/presentation/components/features/historial/FiltrosHistorial.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal as RNModal,
  Animated,
  Dimensions,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HistorialTurno } from '../../../../domain/entities/HistorialTurno';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

export type EstadoCuadreFiltro = 'todos' | 'exacto' | 'sobrante' | 'faltante' | 'sin_cuadre';
export type RangoGanancia = 'todos' | 'positiva' | 'negativa' | 'alta';

export interface FiltrosActivos {
  mes: number | null;   // 0–11 (Date month index), null = todos
  anio: number | null;
  estado: EstadoCuadreFiltro;
  rango: RangoGanancia;
}

export const FILTROS_VACIOS: FiltrosActivos = {
  mes: null,
  anio: null,
  estado: 'todos',
  rango: 'todos',
};

// ── Función pura de filtrado (useMemo en pantalla) ────────────
export function aplicarFiltros(
  historial: HistorialTurno[],
  filtros: FiltrosActivos
): HistorialTurno[] {
  return historial.filter((h) => {
    // Filtro mes/año
    if (filtros.mes !== null || filtros.anio !== null) {
      const fecha = new Date(h.fecha_cierre);
      if (filtros.anio !== null && fecha.getFullYear() !== filtros.anio) return false;
      if (filtros.mes !== null && fecha.getMonth() !== filtros.mes) return false;
    }

    // Filtro estado
    if (filtros.estado !== 'todos' && h.estado_cuadre !== filtros.estado) return false;

    // Filtro rango de ganancia
    if (filtros.rango === 'positiva' && h.ganancia_neta <= 0) return false;
    if (filtros.rango === 'negativa' && h.ganancia_neta >= 0) return false;
    if (filtros.rango === 'alta' && h.ganancia_neta < 5000) return false;

    return true;
  });
}

// ── Derivar meses/años disponibles del historial real ─────────
export function derivarPeriodos(historial: HistorialTurno[]) {
  const aniosSet = new Set<number>();
  const mesesPorAnio = new Map<number, Set<number>>();

  historial.forEach((h) => {
    const fecha = new Date(h.fecha_cierre);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth();
    aniosSet.add(anio);
    if (!mesesPorAnio.has(anio)) mesesPorAnio.set(anio, new Set());
    mesesPorAnio.get(anio)!.add(mes);
  });

  const anios = Array.from(aniosSet).sort((a, b) => b - a);
  return { anios, mesesPorAnio };
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ESTADOS_CUADRE: { valor: EstadoCuadreFiltro; label: string; icono: string; }[] = [
  { valor: 'todos',      label: 'Todos',      icono: 'view-list-outline' },
  { valor: 'exacto',     label: 'Exacto',     icono: 'check-circle-outline' },
  { valor: 'sobrante',   label: 'Sobrante',   icono: 'trending-up' },
  { valor: 'faltante',   label: 'Faltante',   icono: 'trending-down' },
  { valor: 'sin_cuadre', label: 'Sin cuadre', icono: 'help-circle-outline' },
];

const RANGOS_GANANCIA: { valor: RangoGanancia; label: string; }[] = [
  { valor: 'todos',    label: 'Cualquier ganancia' },
  { valor: 'positiva', label: 'Ganancia positiva' },
  { valor: 'negativa', label: 'Ganancia negativa' },
  { valor: 'alta',     label: 'Ganancia alta (+5 000 CUP)' },
];

// ── Contar filtros activos para el badge ─────────────────────
export function contarFiltrosActivos(filtros: FiltrosActivos): number {
  let n = 0;
  if (filtros.mes !== null || filtros.anio !== null) n++;
  if (filtros.estado !== 'todos') n++;
  if (filtros.rango !== 'todos') n++;
  return n;
}

// ────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────
interface FiltrosHistorialProps {
  historial: HistorialTurno[];
  filtros: FiltrosActivos;
  onChange: (filtros: FiltrosActivos) => void;
}

export function FiltrosHistorial({ historial, filtros, onChange }: FiltrosHistorialProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  const [panelVisible, setPanelVisible] = useState(false);
  const [draft, setDraft] = useState<FiltrosActivos>(filtros);

  const { anios, mesesPorAnio } = derivarPeriodos(historial);
  const activos = contarFiltrosActivos(filtros);

  // Animación del panel (bottom sheet)
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (panelVisible) {
      setDraft(filtros); // Sincronizar draft al abrir
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: Dimensions.get('window').height, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [panelVisible, overlayOpacity, sheetTranslateY]);

  const aplicar = () => {
    onChange(draft);
    setPanelVisible(false);
  };

  const limpiar = () => {
    setDraft(FILTROS_VACIOS);
    onChange(FILTROS_VACIOS);
    setPanelVisible(false);
  };

  // Meses disponibles según el año seleccionado en el draft
  const mesesDisponibles = draft.anio !== null
    ? Array.from(mesesPorAnio.get(draft.anio) ?? []).sort((a, b) => a - b)
    : [];

  return (
    <>
      {/* ── Botón de filtros ── */}
      <TouchableOpacity
        style={[
          styles.botonFiltros,
          {
            backgroundColor: activos > 0 ? `${Colors.accent}18` : Colors.bgSurface,
            borderColor: activos > 0 ? Colors.accent : Colors.border,
          },
        ]}
        onPress={() => setPanelVisible(true)}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name="filter-variant"
          size={18}
          color={activos > 0 ? Colors.accent : Colors.textSecondary}
        />
        <Text style={[
          styles.botonFiltrosTexto,
          { color: activos > 0 ? Colors.accent : Colors.textSecondary },
        ]}>
          {activos > 0 ? `Filtros (${activos})` : 'Filtrar'}
        </Text>
      </TouchableOpacity>

      {/* ── Panel bottom sheet ── */}
      <RNModal
        visible={panelVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setPanelVisible(false)}
      >
        <Animated.View
          style={[styles.overlay, { backgroundColor: Colors.overlay, opacity: overlayOpacity }]}
          pointerEvents={panelVisible ? 'auto' : 'none'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPanelVisible(false)} />
        </Animated.View>

        <Animated.View style={[
          styles.sheet,
          { backgroundColor: Colors.bgSurface, borderColor: Colors.border },
          { transform: [{ translateY: sheetTranslateY }] },
        ]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: Colors.border }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitulo, { color: Colors.textPrimary }]}>Filtrar historial</Text>
            <TouchableOpacity onPress={() => setPanelVisible(false)} style={styles.botonClose}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContenido}>

            {/* ── Sección: Período ── */}
            <Text style={[styles.seccionLabel, { color: Colors.textSecondary }]}>PERÍODO</Text>

            {/* Selector de año */}
            {anios.length > 0 && (
              <>
                <Text style={[styles.subLabel, { color: Colors.textSecondary }]}>Año</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
                  <ChipOpcion
                    label="Todos"
                    activo={draft.anio === null}
                    onPress={() => setDraft((d) => ({ ...d, anio: null, mes: null }))}
                    Colors={Colors}
                  />
                  {anios.map((a) => (
                    <ChipOpcion
                      key={a}
                      label={String(a)}
                      activo={draft.anio === a}
                      onPress={() => setDraft((d) => ({ ...d, anio: a, mes: null }))}
                      Colors={Colors}
                    />
                  ))}
                </ScrollView>

                {/* Selector de mes — solo si hay un año seleccionado */}
                {draft.anio !== null && mesesDisponibles.length > 1 && (
                  <>
                    <Text style={[styles.subLabel, { color: Colors.textSecondary }]}>Mes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
                      <ChipOpcion
                        label="Todos"
                        activo={draft.mes === null}
                        onPress={() => setDraft((d) => ({ ...d, mes: null }))}
                        Colors={Colors}
                      />
                      {mesesDisponibles.map((m) => (
                        <ChipOpcion
                          key={m}
                          label={MESES[m]}
                          activo={draft.mes === m}
                          onPress={() => setDraft((d) => ({ ...d, mes: m }))}
                          Colors={Colors}
                        />
                      ))}
                    </ScrollView>
                  </>
                )}
              </>
            )}

            {/* ── Sección: Estado del cuadre ── */}
            <Text style={[styles.seccionLabel, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
              ESTADO DEL CUADRE
            </Text>
            <View style={styles.estadoGrid}>
              {ESTADOS_CUADRE.map((e) => {
                const activo = draft.estado === e.valor;
                const color = e.valor === 'exacto' ? Colors.accentSuccess
                  : e.valor === 'sobrante' ? Colors.accentWarning
                  : e.valor === 'faltante' ? Colors.accentDanger
                  : e.valor === 'sin_cuadre' ? Colors.textDisabled
                  : Colors.accent;
                return (
                  <TouchableOpacity
                    key={e.valor}
                    style={[
                      styles.estadoChip,
                      {
                        backgroundColor: activo ? `${color}18` : Colors.bgElevated,
                        borderColor: activo ? color : Colors.border,
                      },
                    ]}
                    onPress={() => setDraft((d) => ({ ...d, estado: e.valor }))}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={e.icono as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={15}
                      color={activo ? color : Colors.textSecondary}
                    />
                    <Text style={[styles.estadoChipTexto, { color: activo ? color : Colors.textSecondary }]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Sección: Rango de ganancia ── */}
            <Text style={[styles.seccionLabel, { color: Colors.textSecondary, marginTop: Spacing.md }]}>
              GANANCIA
            </Text>
            <View style={[styles.grupo, { backgroundColor: Colors.bgElevated, borderColor: Colors.border }]}>
              {RANGOS_GANANCIA.map((r, i) => {
                const activo = draft.rango === r.valor;
                return (
                  <View key={r.valor}>
                    <TouchableOpacity
                      style={styles.rangoFila}
                      onPress={() => setDraft((d) => ({ ...d, rango: r.valor }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.rangoLabel, { color: Colors.textPrimary }]}>{r.label}</Text>
                      <View style={[
                        styles.radio,
                        {
                          borderColor: activo ? Colors.accent : Colors.border,
                          backgroundColor: activo ? Colors.accent : 'transparent',
                        },
                      ]}>
                        {activo && <View style={[styles.radioDot, { backgroundColor: Colors.bgSurface }]} />}
                      </View>
                    </TouchableOpacity>
                    {i < RANGOS_GANANCIA.length - 1 && (
                      <View style={[styles.rangoSep, { backgroundColor: Colors.divider }]} />
                    )}
                  </View>
                );
              })}
            </View>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>

          {/* ── Botones ── */}
          <View style={[styles.acciones, { borderTopColor: Colors.divider }]}>
            <TouchableOpacity
              style={[styles.botonLimpiar, { borderColor: Colors.border, backgroundColor: Colors.bgElevated }]}
              onPress={limpiar}
              activeOpacity={0.75}
            >
              <Text style={[styles.botonLimpiarTexto, { color: Colors.textSecondary }]}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonAplicar, { backgroundColor: Colors.accent }]}
              onPress={aplicar}
              activeOpacity={0.8}
            >
              <Text style={[styles.botonAplicarTexto, { color: Colors.textOnAccent }]}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </RNModal>
    </>
  );
}

// ── Chip reutilizable ────────────────────────────────────────
function ChipOpcion({
  label, activo, onPress, Colors,
}: {
  label: string;
  activo: boolean;
  onPress: () => void;
  Colors: ReturnType<typeof getColors>;
}) {
  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1.5,
        borderColor: activo ? Colors.accent : Colors.border,
        backgroundColor: activo ? `${Colors.accent}18` : Colors.bgElevated,
        marginRight: Spacing.sm,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={{
        fontFamily: activo ? Typography.fontFamilySemiBold : Typography.fontFamily,
        fontSize: Typography.size.sm,
        color: activo ? Colors.accent : Colors.textSecondary,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Estilos ──────────────────────────────────────────────────
function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    botonFiltros: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      borderWidth: 1.5,
    },
    botonFiltrosTexto: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
    },
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
      maxHeight: '85%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: Radius.full,
      alignSelf: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    sheetTitulo: {
      fontFamily: Typography.fontFamilyBold,
      fontSize: Typography.size.lg,
    },
    botonClose: {
      padding: Spacing.xs,
    },
    sheetContenido: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
    },
    seccionLabel: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.xs,
      letterSpacing: 0.8,
      marginBottom: Spacing.sm,
    },
    subLabel: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
      marginBottom: Spacing.sm,
    },
    chipScroll: {
      marginBottom: Spacing.md,
    },
    chipRow: {
      flexDirection: 'row',
      paddingRight: Spacing.xl,
    },
    // Estado cuadre grid (2 columnas + 1 centrado al final)
    estadoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    estadoChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      borderWidth: 1.5,
    },
    estadoChipTexto: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
    },
    // Rango de ganancia
    grupo: {
      borderRadius: Radius.md,
      borderWidth: 1,
      overflow: 'hidden',
    },
    rangoFila: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      justifyContent: 'space-between',
    },
    rangoLabel: {
      fontFamily: Typography.fontFamilyMedium,
      fontSize: Typography.size.sm,
      flex: 1,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    rangoSep: {
      height: 1,
      marginHorizontal: Spacing.md,
    },
    // Botones del footer
    acciones: {
      flexDirection: 'row',
      gap: Spacing.sm,
      padding: Spacing.xl,
      borderTopWidth: 1,
    },
    botonLimpiar: {
      flex: 1,
      height: 50,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonLimpiarTexto: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.md,
    },
    botonAplicar: {
      flex: 2,
      height: 50,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonAplicarTexto: {
      fontFamily: Typography.fontFamilySemiBold,
      fontSize: Typography.size.md,
    },
  });
}