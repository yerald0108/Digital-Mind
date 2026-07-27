// src/presentation/components/features/cuadre/ResultadoCuadre.tsx
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResultadoCuadre as TResultado } from '../../../../domain/usecases/calcularCuadre';
import { Colors, Typography, Spacing, Radius } from '../../../../constants/theme';
import { formatMoneda } from '../../../../utils/formatters';

interface ResultadoCuadreProps {
  resultado: TResultado;
}

export function ResultadoCuadreView({ resultado }: ResultadoCuadreProps) {
  const colorEstado =
    resultado.estado === 'sobrante' ? Colors.accentWarning
    : resultado.estado === 'faltante' ? Colors.accentDanger
    : Colors.accentSuccess;

  const iconoEstado =
    resultado.estado === 'sobrante' ? 'trending-up'
    : resultado.estado === 'faltante' ? 'trending-down'
    : 'check-circle-outline';

  const labelEstado =
    resultado.estado === 'sobrante' ? 'Sobrante'
    : resultado.estado === 'faltante' ? 'Faltante'
    : 'Cuadre exacto';

  return (
    <View style={styles.container}>

      {/* ── Resultado principal ── */}
      <View style={[styles.resultadoPrincipal, { borderColor: colorEstado }]}>
        <MaterialCommunityIcons name={iconoEstado} size={36} color={colorEstado} />
        <Text style={[styles.estadoLabel, { color: colorEstado }]}>{labelEstado}</Text>
        {resultado.estado !== 'exacto' && (
          <Text style={[styles.diferencia, { color: colorEstado }]}>
            {resultado.estado === 'sobrante' ? '+' : ''}{formatMoneda(resultado.diferencia)}
          </Text>
        )}
        <View style={styles.realVsEsperado}>
          <View style={styles.colItem}>
            <Text style={styles.colLabel}>Real en caja</Text>
            <Text style={[styles.colValor, { color: Colors.accentSuccess }]}>
              {formatMoneda(resultado.total_real)}
            </Text>
          </View>
          <View style={styles.vs}>
            <Text style={styles.vsTexto}>vs</Text>
          </View>
          <View style={styles.colItem}>
            <Text style={styles.colLabel}>Esperado</Text>
            <Text style={[styles.colValor, { color: Colors.accent }]}>
              {formatMoneda(resultado.total_esperado)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Dinero real en caja ── */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Dinero real recaudado</Text>
        <Text style={styles.seccionSubtitulo}>
          Todo el dinero que entró: efectivo + transferencias + USD
        </Text>

        <FilaDetalle
          label="Efectivo en caja"
          valor={resultado.total_efectivo_caja}
          color={Colors.accentSuccess}
          icono="cash"
        />
        <FilaDetalle
          label="Transferencias"
          valor={resultado.total_transferencias}
          color={Colors.accent}
          icono="bank-transfer"
        />
        {resultado.total_usd_en_cup > 0 && (
          <FilaDetalle
            label="USD (en CUP)"
            valor={resultado.total_usd_en_cup}
            color={Colors.accentWarning}
            icono="currency-usd"
          />
        )}

        <View style={styles.totalLinea} />
        <FilaDetalle
          label="Total real en caja"
          valor={resultado.total_real}
          color={Colors.accentSuccess}
          icono="sigma"
          destacado
        />
      </View>

      {/* ── Dinero esperado de ventas ── */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Dinero esperado de ventas</Text>
        <Text style={styles.seccionSubtitulo}>
          Lo que debería haberse recaudado según las ventas calculadas
        </Text>

        <FilaDetalle
          label="Ventas calculadas"
          valor={resultado.total_ventas_esperado}
          color={Colors.accent}
          icono="cash-register"
        />
        {resultado.total_gastos > 0 && (
          <FilaDetalle
            label="Gastos (descuentos)"
            valor={resultado.total_gastos}
            color={Colors.accentDanger}
            icono="minus-circle-outline"
            negativo
          />
        )}

        <View style={styles.totalLinea} />
        <FilaDetalle
          label="Total esperado"
          valor={resultado.total_esperado}
          color={Colors.accent}
          icono="sigma"
          destacado
        />
      </View>

      {/* ── Aporte por producto ── */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Aporte por producto</Text>

        {resultado.resultados_productos.map((r, index) => (
          <View
            key={r.producto_id}
            style={[
              styles.productoCard,
              index < resultado.resultados_productos.length - 1 && styles.productoCardBorder,
            ]}
          >
            {/* Header */}
            <View style={styles.productoHeader}>
              <View style={styles.numeroBadge}>
                <Text style={styles.numeroTexto}>{index + 1}</Text>
              </View>
              <Text style={styles.productoNombre} numberOfLines={1}>
                {r.producto_nombre}
              </Text>
              <Text style={styles.productoImporte}>
                {formatMoneda(r.dinero_aportado)}
              </Text>
            </View>

            {/* Grid */}
            <View style={styles.productoGrid}>
              <GridItem label="Inicial" valor={r.cantidad_inicial} color={Colors.textPrimary} icono="package-variant-closed" />
              <GridItem label="Entradas" valor={r.cantidad_entradas} color={Colors.accent} icono="package-down" prefijo="+" />
              <GridItem label="Salidas" valor={r.cantidad_salidas_familiares} color={Colors.accentWarning} icono="account-arrow-right-outline" prefijo="-" />
              <GridItem label="Mermas" valor={r.cantidad_mermas} color={Colors.accentDanger} icono="package-variant-remove" prefijo="-" />
              <GridItem label="Final" valor={r.cantidad_final} color={Colors.textPrimary} icono="flag-checkered" />
              <GridItem label="Vendidas" valor={r.cantidad_vendida} color={Colors.accentSuccess} icono="cart-outline" destacado />
            </View>

            {/* Tramos */}
            {r.tramos.length > 1 && (
              <View style={styles.tramosContainer}>
                <Text style={styles.tramosLabel}>Tramos de precio:</Text>
                {r.tramos.map((t, ti) => (
                  <View key={ti} style={styles.tramoFila}>
                    <MaterialCommunityIcons name="chevron-right" size={12} color={Colors.textDisabled} />
                    <Text style={styles.tramoTexto}>
                      {t.cantidad_vendida_en_tramo} × {formatMoneda(t.precio_venta)}
                    </Text>
                    <Text style={styles.tramoSubtotal}>= {formatMoneda(t.subtotal)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Importe */}
            <View style={styles.importeBar}>
              <Text style={styles.importeLabel}>Importe total</Text>
              <Text style={styles.importeValor}>{formatMoneda(r.dinero_aportado)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.totalVentasRow}>
          <Text style={styles.totalVentasLabel}>Total ventas</Text>
          <Text style={styles.totalVentasValor}>{formatMoneda(resultado.total_ventas_esperado)}</Text>
        </View>
      </View>

      {/* ── Salarios y ganancias ── */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Salarios y ganancias</Text>

        <FilaDetalle label="Salario mostrador (1%)" valor={resultado.salario_mostrador} color={Colors.accent} icono="account-outline" />
        <FilaDetalle label="Salario salón (0.5%)" valor={resultado.salario_salon} color={Colors.accent} icono="account-group-outline" />

        <View style={styles.totalLinea} />

        <View style={[
          styles.gananciaCard,
          {
            borderColor: resultado.ganancia_neta_dueno >= 0
              ? 'rgba(52,199,123,0.3)' : 'rgba(232,84,84,0.3)',
            backgroundColor: resultado.ganancia_neta_dueno >= 0
              ? 'rgba(52,199,123,0.06)' : 'rgba(232,84,84,0.06)',
          },
        ]}>
          <Text style={styles.gananciaLabel}>Ganancia neta del dueño</Text>
          <Text style={[
            styles.gananciaValor,
            { color: resultado.ganancia_neta_dueno >= 0 ? Colors.accentSuccess : Colors.accentDanger },
          ]}>
            {formatMoneda(resultado.ganancia_neta_dueno)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Componentes helper ────────────────────────────────────────
interface FilaDetalleProps {
  label: string;
  valor: number;
  color: string;
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  negativo?: boolean;
  destacado?: boolean;
}

function FilaDetalle({ label, valor, color, icono, negativo, destacado }: FilaDetalleProps) {
  return (
    <View style={[estilos.fila, destacado && estilos.filaDestacada]}>
      <MaterialCommunityIcons name={icono} size={15} color={color} style={estilos.filaIcono} />
      <Text style={[estilos.filaLabel, destacado && estilos.filaLabelDestacado]}>{label}</Text>
      <Text style={[estilos.filaValor, { color }, destacado && estilos.filaValorDestacado]}>
        {negativo ? '- ' : ''}{formatMoneda(Math.abs(valor))}
      </Text>
    </View>
  );
}

interface GridItemProps {
  label: string;
  valor: number;
  color: string;
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  prefijo?: string;
  destacado?: boolean;
}

function GridItem({ label, valor, color, icono, prefijo, destacado }: GridItemProps) {
  const mostrar = prefijo && valor > 0;
  return (
    <View style={[estilos.gridItem, destacado && estilos.gridItemDestacado]}>
      <View style={estilos.gridIconRow}>
        <MaterialCommunityIcons name={icono} size={11} color={destacado ? color : Colors.textSecondary} />
        <Text style={[estilos.gridLabel, destacado && { color }]}>{label}</Text>
      </View>
      <Text style={[estilos.gridValor, (mostrar || destacado) && { color }]}>
        {mostrar ? `${prefijo}${valor}` : String(valor)}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  filaDestacada: { backgroundColor: Colors.bgElevated, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, marginVertical: 2 },
  filaIcono: { marginRight: Spacing.sm },
  filaLabel: { flex: 1, fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, color: Colors.textSecondary },
  filaLabelDestacado: { fontFamily: Typography.fontFamilySemiBold, color: Colors.textPrimary },
  filaValor: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  filaValorDestacado: { fontSize: Typography.size.md },
  gridItem: { flex: 1, minWidth: '30%', backgroundColor: Colors.bgElevated, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, alignItems: 'center' },
  gridItemDestacado: { backgroundColor: 'rgba(52,199,123,0.08)', borderColor: 'rgba(52,199,123,0.3)' },
  gridIconRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  gridLabel: { fontFamily: Typography.fontFamily, fontSize: 9, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  gridValor: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  container: {},
  // Resultado principal
  resultadoPrincipal: {
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.xl,
    borderWidth: 2,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  estadoLabel: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xl },
  diferencia: { fontFamily: Typography.fontFamilyExtraBold, fontSize: Typography.size.display },
  realVsEsperado: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.sm },
  colItem: { alignItems: 'center' },
  colLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textSecondary, marginBottom: 2 },
  colValor: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md },
  vs: { backgroundColor: Colors.bgElevated, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  vsTexto: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textDisabled },
  // Secciones
  seccion: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  seccionTitulo: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  seccionSubtitulo: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textDisabled, marginBottom: Spacing.md, lineHeight: 16 },
  totalLinea: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
  // Producto
  productoCard: { paddingVertical: Spacing.md },
  productoCardBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  productoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  numeroBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  numeroTexto: { fontFamily: Typography.fontFamilySemiBold, fontSize: 10, color: Colors.textSecondary },
  productoNombre: { flex: 1, fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, color: Colors.textPrimary },
  productoImporte: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md, color: Colors.accent },
  productoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  tramosContainer: { backgroundColor: Colors.bgElevated, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  tramosLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.xs, color: Colors.textSecondary, marginBottom: 4 },
  tramoFila: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tramoTexto: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, color: Colors.textSecondary, flex: 1 },
  tramoSubtotal: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.xs, color: Colors.accent },
  importeBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(79,142,247,0.08)', borderRadius: Radius.sm, borderWidth: 1, borderColor: 'rgba(79,142,247,0.2)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  importeLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, color: Colors.textSecondary },
  importeValor: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.lg, color: Colors.accent },
  totalVentasRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 2, borderTopColor: Colors.accent },
  totalVentasLabel: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md, color: Colors.textPrimary },
  totalVentasValor: { fontFamily: Typography.fontFamilyExtraBold, fontSize: Typography.size.xl, color: Colors.accent },
  gananciaCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, marginTop: Spacing.sm },
  gananciaLabel: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm, color: Colors.textPrimary },
  gananciaValor: { fontFamily: Typography.fontFamilyExtraBold, fontSize: Typography.size.xl },
});