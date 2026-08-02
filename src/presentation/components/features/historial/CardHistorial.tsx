// src/presentation/components/features/historial/CardHistorial.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HistorialTurno } from '../../../../domain/entities/HistorialTurno';
import { getColors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda, formatFecha, formatFechaHora, formatDias } from '../../../../utils/formatters';
import { useTheme } from '../../../../presentation/hooks/useTheme';

interface CardHistorialProps {
  registro: HistorialTurno;
  index: number;
  onVer: (registro: HistorialTurno) => void;
  onEliminar: (id: number) => void;
}

export function CardHistorial({ registro, index, onVer, onEliminar }: CardHistorialProps) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);

  // ── Animación de entrada: fade + slide desde abajo con stagger por índice ──
  const opacidad = useRef(new Animated.Value(0)).current;
  const traslacion = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Máximo 400ms de retardo para que las cards lejanas no tarden demasiado
    const retardo = Math.min(index * 60, 400);
    Animated.parallel([
      Animated.timing(opacidad, {
        toValue: 1,
        duration: 350,
        delay: retardo,
        useNativeDriver: true,
      }),
      Animated.timing(traslacion, {
        toValue: 0,
        duration: 350,
        delay: retardo,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // Solo al montar — no se repite en re-renders

  const colorEstado =
    registro.estado_cuadre === 'sobrante' ? Colors.accentWarning
    : registro.estado_cuadre === 'faltante' ? Colors.accentDanger
    : registro.estado_cuadre === 'exacto' ? Colors.accentSuccess
    : Colors.textDisabled;

  const iconoEstado =
    registro.estado_cuadre === 'sobrante' ? 'trending-up'
    : registro.estado_cuadre === 'faltante' ? 'trending-down'
    : registro.estado_cuadre === 'exacto' ? 'check-circle-outline'
    : 'help-circle-outline';

  const labelEstado =
    registro.estado_cuadre === 'sobrante' ? 'Sobrante'
    : registro.estado_cuadre === 'faltante' ? 'Faltante'
    : registro.estado_cuadre === 'exacto' ? 'Exacto'
    : 'Sin cuadre';

  // La confirmación se maneja en historial.tsx para evitar el Alert doble.
  const confirmarEliminar = () => onEliminar(registro.id);

  const handleCompartir = async () => {
    const sep = '─────────────────────';
    const linea = (label: string, valor: string) => `• ${label}: ${valor}`;

    const estadoTexto =
      registro.estado_cuadre === 'sobrante'
        ? `Sobrante de ${formatMoneda(registro.diferencia)}`
        : registro.estado_cuadre === 'faltante'
        ? `Faltante de ${formatMoneda(Math.abs(registro.diferencia))}`
        : registro.estado_cuadre === 'exacto'
        ? 'Cuadre exacto ✓'
        : 'Sin cuadre';

    // Parsear movimientos del detalle_json
    let movs: any = null;
    try {
      if (registro.detalle_json) movs = JSON.parse(registro.detalle_json)?.datos;
    } catch { /* sin detalle */ }

    let texto = `📊 *RESUMEN DE TURNO — Digital/Mind*\n${sep}\n`;
    texto += `📅 Apertura: ${formatFechaHora(registro.fecha_apertura)}\n`;
    texto += `📅 Cierre:   ${formatFechaHora(registro.fecha_cierre)}\n`;
    texto += `⏱ Duración: ${formatDias(registro.dias_duracion)}\n\n`;

    texto += `💰 *CUADRE DE CAJA*\n${sep}\n`;
    texto += `${linea('Total ventas', formatMoneda(registro.total_ventas))}\n`;
    if (registro.total_transferencias > 0)
      texto += `${linea('Transferencias', formatMoneda(registro.total_transferencias))}\n`;
    if (registro.total_usd_cup > 0)
      texto += `${linea('USD (CUP)', formatMoneda(registro.total_usd_cup))}\n`;
    if (registro.total_gastos > 0)
      texto += `${linea('Gastos', `- ${formatMoneda(registro.total_gastos)}`)}\n`;
    texto += `${linea('Total esperado', formatMoneda(registro.total_esperado))}\n`;
    texto += `${linea('Efectivo real', formatMoneda(registro.total_efectivo_real))}\n`;
    texto += `➡ Estado: ${estadoTexto}\n\n`;

    texto += `👷 *SALARIOS Y GANANCIAS*\n${sep}\n`;
    texto += `${linea('Salario mostrador (1%)', formatMoneda(registro.salario_mostrador))}\n`;
    texto += `${linea('Salario salón (0.5%)', formatMoneda(registro.salario_salon))}\n`;
    texto += `${linea('Ganancia neta', formatMoneda(registro.ganancia_neta))}\n`;

    if (movs) {
      texto += `\n🔄 *MOVIMIENTOS*\n${sep}\n`;

      if (movs.entradas?.length > 0) {
        texto += `📥 Entradas (${movs.entradas.length}):\n`;
        for (const e of movs.entradas)
          texto += `  - ${e.producto_nombre}: ${e.cantidad} uds\n`;
      }
      if (movs.salidasFamiliares?.length > 0) {
        texto += `👪 Salidas familiares (${movs.salidasFamiliares.length}):\n`;
        for (const s of movs.salidasFamiliares)
          texto += `  - ${s.producto_nombre}: ${s.cantidad} uds (${s.quien_sustrajo})\n`;
      }
      if (movs.cambiosPrecio?.length > 0) {
        texto += `🏷 Cambios de precio (${movs.cambiosPrecio.length}):\n`;
        for (const c of movs.cambiosPrecio)
          texto += `  - ${c.producto_nombre}: ${formatMoneda(c.precio_anterior)} → ${formatMoneda(c.precio_nuevo)}\n`;
      }
      if (movs.mermas?.length > 0) {
        texto += `⚠ Mermas (${movs.mermas.length}):\n`;
        for (const m of movs.mermas)
          texto += `  - ${m.producto_nombre}: ${m.cantidad} uds (${m.tipo})\n`;
      }
      if (movs.transferencias?.length > 0) {
        texto += `💳 Transferencias (${movs.transferencias.length}):\n`;
        for (const t of movs.transferencias)
          texto += `  - ${formatMoneda(t.monto)}${t.concepto ? ` (${t.concepto})` : ''}\n`;
      }
      if (movs.gastos?.length > 0) {
        texto += `🧾 Gastos (${movs.gastos.length}):\n`;
        for (const g of movs.gastos) {
          const etiqueta = g.concepto || g.producto_nombre || 'Gasto';
          const monto = g.monto || g.diferencia || 0;
          texto += `  - ${etiqueta}: - ${formatMoneda(monto)}\n`;
        }
      }
    }

    texto += `\n_Generado por Digital/Mind_`;

    try {
      await Share.share({ message: texto });
    } catch {
      Alert.alert('Error', 'No se pudo compartir el resumen');
    }
  };

  return (
    <Animated.View
      style={{
        opacity: opacidad,
        transform: [{ translateY: traslacion }],
      }}
    >
      <TouchableOpacity style={styles.card} onPress={() => onVer(registro)} activeOpacity={0.8}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.fecha}>{formatFecha(registro.fecha_apertura)}</Text>
            <View style={styles.duracionBadge}>
              <MaterialCommunityIcons name="calendar-range" size={12} color={Colors.textSecondary} />
              <Text style={styles.duracionTexto}>{formatDias(registro.dias_duracion)}</Text>
            </View>
          </View>
          <View style={[styles.estadoBadge, { borderColor: colorEstado }]}>
            <MaterialCommunityIcons name={iconoEstado} size={14} color={colorEstado} />
            <Text style={[styles.estadoTexto, { color: colorEstado }]}>{labelEstado}</Text>
          </View>
        </View>

        {/* Datos principales */}
        <View style={styles.datos}>
          <DatoItem label="Ventas" valor={formatMoneda(registro.total_ventas)} icono="cash-register" color={Colors.accent} />
          <DatoItem label="Real en caja" valor={formatMoneda(registro.total_efectivo_real)} icono="cash" color={Colors.accentSuccess} />
          <DatoItem
            label="Ganancia neta"
            valor={formatMoneda(registro.ganancia_neta)}
            icono="trending-up"
            color={registro.ganancia_neta >= 0 ? Colors.accentSuccess : Colors.accentDanger}
          />
        </View>

        {/* Diferencia */}
        {registro.estado_cuadre !== 'sin_cuadre' && registro.estado_cuadre !== 'exacto' && (
          <View style={[styles.diferenciaBadge, { backgroundColor: `${colorEstado}15` }]}>
            <Text style={[styles.diferenciaTexto, { color: colorEstado }]}>
              {registro.estado_cuadre === 'sobrante' ? 'Sobran' : 'Faltan'}{' '}
              {formatMoneda(Math.abs(registro.diferencia))}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerFecha}>Cerrado: {formatFechaHora(registro.fecha_cierre)}</Text>
          <View style={styles.footerAcciones}>
            <TouchableOpacity onPress={handleCompartir} style={styles.botonCompartir}>
              <MaterialCommunityIcons name="whatsapp" size={15} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onVer(registro)} style={styles.botonVer}>
              <MaterialCommunityIcons name="eye-outline" size={16} color={Colors.accent} />
              <Text style={styles.botonVerTexto}>Ver detalle</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmarEliminar} style={styles.botonEliminar}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.accentDanger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function DatoItem({ label, valor, icono, color }: {
  label: string; valor: string;
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string;
}) {
  const { C: Colors } = useTheme();
  const styles = crearEstilos(Colors);
  return (
    <View style={styles.datoItem}>
      <MaterialCommunityIcons name={icono} size={14} color={color} />
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={[styles.datoValor, { color }]}>{valor}</Text>
    </View>
  );
}

function crearEstilos(Colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: { gap: Spacing.xs },
  fecha: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
  },
  duracionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  duracionTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  estadoTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
  },
  datos: { gap: Spacing.sm, marginBottom: Spacing.md },
  datoItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  datoLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  datoValor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  diferenciaBadge: {
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  diferenciaTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  footerFecha: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textDisabled,
    flex: 1,
  },
  footerAcciones: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  botonCompartir: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(37,211,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonVer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(79,142,247,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(79,142,247,0.2)',
  },
  botonVerTexto: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    color: Colors.accent,
  },
  botonEliminar: { padding: Spacing.xs },
  });
}