// src/domain/usecases/calcularCuadre.ts
// ============================================================
// MOTOR DE CÁLCULO DEL CUADRE DE CAJA — Digital/Mind
//
// LÓGICA CORRECTA:
// - Dinero real = efectivo en caja (por día) + transferencias + USD
// - Dinero esperado = ventas calculadas de productos - gastos
// - Diferencia = real - esperado
// ============================================================
import { ItemInventarioTurno } from '../entities/InventarioTurno';
import { Entrada } from '../entities/Entrada';
import { SalidaFamiliar } from '../entities/SalidaFamiliar';
import { CambioPrecio } from '../entities/CambioPrecio';
import { Merma } from '../entities/Merma';
import { Transferencia } from '../entities/Transferencia';
import { Gasto } from '../entities/Gasto';
import { CajaDia } from '../entities/CajaDia';
import { RegistroUSD } from '../entities/RegistroUSD';

export interface ResultadoProducto {
  producto_id: number;
  producto_nombre: string;
  cantidad_inicial: number;
  cantidad_entradas: number;
  cantidad_salidas_familiares: number;
  cantidad_mermas: number;
  cantidad_final: number;
  cantidad_vendida_teorica: number;
  cantidad_vendida: number;
  dinero_aportado: number;
  tramos: TramoPrecio[];
}

export interface TramoPrecio {
  precio_venta: number;
  cantidad_vendida_en_tramo: number;
  subtotal: number;
}

export interface ResultadoCuadre {
  resultados_productos: ResultadoProducto[];
  inconsistencias_inventario: InconsistenciaInventario[];

  // ── Dinero esperado (de las ventas) ──
  total_ventas_esperado: number;
  total_gastos: number;
  total_esperado: number;

  // ── Dinero real (lo que entró a la caja) ──
  total_efectivo_caja: number;
  total_transferencias: number;
  total_usd_en_cup: number;
  total_real: number;

  // ── Diferencia ──
  diferencia: number;
  estado: 'exacto' | 'sobrante' | 'faltante';

  // ── Salarios y ganancias ──
  salario_mostrador: number;
  salario_salon: number;
  ganancia_neta_dueno: number;
}

export interface DatosCuadre {
  inventarioInicial: ItemInventarioTurno[];
  inventarioFinal: ItemInventarioTurno[];
  entradas: Entrada[];
  salidasFamiliares: SalidaFamiliar[];
  cambiosPrecio: CambioPrecio[];
  mermas: Merma[];
  transferencias: Transferencia[];
  gastos: Gasto[];
  cajaPorDia: CajaDia[];
  registrosUSD: RegistroUSD[];
}

export function calcularCuadre(datos: DatosCuadre): ResultadoCuadre {
  const {
    inventarioInicial, inventarioFinal, entradas,
    salidasFamiliares, cambiosPrecio, mermas,
    transferencias, gastos, cajaPorDia, registrosUSD,
  } = datos;

  // ── Construir conjunto unico de producto_id ───────────────
  // Se incluyen productos del inventario inicial, entradas,
  // salidas familiares y mermas. Asi se cubren productos
  // nuevos que entraron durante el turno sin stock inicial.
  const idsProductos = new Set<number>();

  for (const item of inventarioInicial) idsProductos.add(item.producto_id);
  for (const e of entradas) idsProductos.add(e.producto_id);
  for (const s of salidasFamiliares) idsProductos.add(s.producto_id);
  for (const m of mermas) idsProductos.add(m.producto_id);

  // ── Calcular aporte por producto ──────────────────────────
  const resultados_productos: ResultadoProducto[] = Array.from(idsProductos).map((pid) => {
    // Datos del inventario inicial (puede no existir si es producto nuevo)
    const itemInicial = inventarioInicial.find((i) => i.producto_id === pid);
    const cantidad_inicial = itemInicial?.cantidad ?? 0;

    // Nombre del producto: buscar en inicial, si no en la primera entrada,
    // si no en salidas, si no en mermas
    const primeraEntrada = entradas.find((e) => e.producto_id === pid);
    const primeraSalida = salidasFamiliares.find((s) => s.producto_id === pid);
    const primeraMerma = mermas.find((m) => m.producto_id === pid);

    const producto_nombre =
      itemInicial?.producto_nombre ??
      primeraEntrada?.producto_nombre ??
      primeraSalida?.producto_nombre ??
      primeraMerma?.producto_nombre ??
      'Producto desconocido';

    // Cambios de precio del producto (se necesitan temprano para el fallback de precio_venta)
    const cambiosDelProducto = cambiosPrecio
      .filter((c) => c.producto_id === pid)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Precio de venta inicial: inventario inicial, o primer cambio de precio, o 0
    const precio_venta_inicial =
      itemInicial?.precio_venta ??
      (cambiosDelProducto.length > 0 ? cambiosDelProducto[0].precio_anterior : 0);

    const cantidad_entradas = entradas
      .filter((e) => e.producto_id === pid)
      .reduce((acc, e) => acc + e.cantidad, 0);

    const cantidad_salidas_familiares = salidasFamiliares
      .filter((s) => s.producto_id === pid)
      .reduce((acc, s) => acc + s.cantidad, 0);

    const cantidad_mermas = mermas
      .filter((m) => m.producto_id === pid)
      .reduce((acc, m) => acc + m.cantidad, 0);

    const itemFinal = inventarioFinal.find((f) => f.producto_id === pid);
    const cantidad_final = itemFinal?.cantidad ?? 0;

    // Conservamos el cálculo teórico para advertir conteos imposibles.
    const cantidad_vendida_teorica =
      cantidad_inicial + cantidad_entradas - cantidad_salidas_familiares - cantidad_mermas - cantidad_final;
    const cantidad_vendida = Math.max(0, cantidad_vendida_teorica);

    // ── Tramos de precio ──
    const tramos: TramoPrecio[] = [];
    const movimientosStock = [
      ...entradas
        .filter((entrada) => entrada.producto_id === pid)
        .map((entrada) => ({ fecha: entrada.fecha, delta: entrada.cantidad })),
      ...salidasFamiliares
        .filter((salida) => salida.producto_id === pid)
        .map((salida) => ({ fecha: salida.fecha, delta: -salida.cantidad })),
      ...mermas
        .filter((merma) => merma.producto_id === pid)
        .map((merma) => ({ fecha: merma.fecha, delta: -merma.cantidad })),
    ].sort((a, b) => a.fecha.localeCompare(b.fecha));

    const agregarTramo = (precio: number, cantidad: number) => {
      if (cantidad <= 0) return;
      tramos.push({
        precio_venta: precio,
        cantidad_vendida_en_tramo: cantidad,
        subtotal: redondear(cantidad * precio),
      });
    };

    let stockEnTramo = cantidad_inicial;
    let precioActual = precio_venta_inicial;
    let indiceMovimiento = 0;

    const aplicarMovimientosHasta = (fecha: string) => {
      while (
        indiceMovimiento < movimientosStock.length &&
        movimientosStock[indiceMovimiento].fecha <= fecha
      ) {
        stockEnTramo += movimientosStock[indiceMovimiento].delta;
        indiceMovimiento += 1;
      }
    };

    for (const cambio of cambiosDelProducto) {
      aplicarMovimientosHasta(cambio.fecha);
      agregarTramo(precioActual, Math.max(0, stockEnTramo - cambio.cantidad_existente));
      stockEnTramo = cambio.cantidad_existente;
      precioActual = cambio.precio_nuevo;
    }

    while (indiceMovimiento < movimientosStock.length) {
      stockEnTramo += movimientosStock[indiceMovimiento].delta;
      indiceMovimiento += 1;
    }
    agregarTramo(precioActual, Math.max(0, stockEnTramo - cantidad_final));

    const dinero_aportado = redondear(tramos.reduce((acc, t) => acc + t.subtotal, 0));

    return {
      producto_id: pid,
      producto_nombre,
      cantidad_inicial,
      cantidad_entradas,
      cantidad_salidas_familiares,
      cantidad_mermas,
      cantidad_final,
      cantidad_vendida_teorica,
      cantidad_vendida,
      dinero_aportado,
      tramos,
    };
  });

  const inconsistencias_inventario = resultados_productos
    .filter((resultado) => resultado.cantidad_vendida_teorica < 0)
    .map((resultado) => ({
      producto_id: resultado.producto_id,
      producto_nombre: resultado.producto_nombre,
      disponible:
        resultado.cantidad_inicial +
        resultado.cantidad_entradas -
        resultado.cantidad_salidas_familiares -
        resultado.cantidad_mermas,
      cantidad_final: resultado.cantidad_final,
      exceso: Math.abs(resultado.cantidad_vendida_teorica),
    }));

  // ── Totales esperados (ventas) ────────────────────────────
  const total_ventas_esperado = redondear(
    resultados_productos.reduce((acc, r) => acc + r.dinero_aportado, 0)
  );

  const total_gastos = redondear(
    gastos.reduce((acc, g) => acc + g.monto, 0)
  );

  const total_esperado = redondear(total_ventas_esperado - total_gastos);

  // ── Totales reales (lo que entró a la caja) ───────────────
  const total_efectivo_caja = redondear(
    cajaPorDia.reduce((acc, c) => acc + c.monto_efectivo, 0)
  );

  const total_transferencias = redondear(
    transferencias.reduce((acc, t) => acc + t.monto, 0)
  );

  const total_usd_en_cup = redondear(
    registrosUSD.reduce((acc, u) => acc + u.equivalente_cup, 0)
  );

  const total_real = redondear(
    total_efectivo_caja + total_transferencias + total_usd_en_cup
  );

  // ── Diferencia ────────────────────────────────────────────
  const diferencia = redondear(total_real - total_esperado);

  let estado: ResultadoCuadre['estado'] = 'exacto';
  if (diferencia > 0.01) estado = 'sobrante';
  else if (diferencia < -0.01) estado = 'faltante';

  // ── Salarios y ganancias ──────────────────────────────────
  const salario_mostrador = redondear(total_ventas_esperado * 0.01);
  const salario_salon = redondear(total_ventas_esperado * 0.005);

  const total_costo = redondear(
    resultados_productos.reduce((acc, r) => {
      const itemInicial = inventarioInicial.find((i) => i.producto_id === r.producto_id);
      const itemEntrada = entradas.find((e) => e.producto_id === r.producto_id);
      const precio_costo = itemInicial?.precio_costo ?? itemEntrada?.precio_costo ?? 0;
      return acc + r.cantidad_vendida * precio_costo;
    }, 0)
  );

  const ganancia_neta_dueno = redondear(
    total_ventas_esperado - total_costo - salario_mostrador - salario_salon - total_gastos
  );

  return {
    resultados_productos,
    inconsistencias_inventario,
    total_ventas_esperado,
    total_gastos,
    total_esperado,
    total_efectivo_caja,
    total_transferencias,
    total_usd_en_cup,
    total_real,
    diferencia,
    estado,
    salario_mostrador,
    salario_salon,
    ganancia_neta_dueno,
  };
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export interface InconsistenciaInventario {
  producto_id: number;
  producto_nombre: string;
  disponible: number;
  cantidad_final: number;
  exceso: number;
}
