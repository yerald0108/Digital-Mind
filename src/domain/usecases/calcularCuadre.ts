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

  // ── Dinero esperado (de las ventas) ──
  total_ventas_esperado: number;   // suma de lo que debería generar cada producto
  total_gastos: number;            // descuentos a restar
  total_esperado: number;          // ventas - gastos

  // ── Dinero real (lo que entró a la caja) ──
  total_efectivo_caja: number;     // suma de caja por día (efectivo)
  total_transferencias: number;    // transferencias recibidas
  total_usd_en_cup: number;        // USD convertidos a CUP
  total_real: number;              // efectivo + transferencias + USD

  // ── Diferencia ──
  diferencia: number;              // real - esperado
  estado: 'exacto' | 'sobrante' | 'faltante';

  // ── Salarios y ganancias ──
  salario_mostrador: number;       // 1% de ventas
  salario_salon: number;           // 0.5% de ventas
  ganancia_neta_dueno: number;     // ventas - costos - salarios - gastos
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

  // ── Calcular aporte por producto ──────────────────────────
  const resultados_productos: ResultadoProducto[] = inventarioInicial.map((itemInicial) => {
    const pid = itemInicial.producto_id;

    const cantidad_inicial = itemInicial.cantidad;

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

    // Vendidas = inicial + entradas - salidas familiares - mermas - final
    const cantidad_vendida = Math.max(
      0,
      cantidad_inicial + cantidad_entradas - cantidad_salidas_familiares - cantidad_mermas - cantidad_final
    );

    // ── Tramos de precio ──
    const cambiosDelProducto = cambiosPrecio
      .filter((c) => c.producto_id === pid)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const tramos: TramoPrecio[] = [];
    let vendidaAcumulada = 0;

    if (cambiosDelProducto.length === 0) {
      tramos.push({
        precio_venta: itemInicial.precio_venta,
        cantidad_vendida_en_tramo: cantidad_vendida,
        subtotal: redondear(cantidad_vendida * itemInicial.precio_venta),
      });
    } else {
      const primerCambio = cambiosDelProducto[0];
      const cantidadDisponible = cantidad_inicial + cantidad_entradas;

      const vendidaAntesPrimerCambio = Math.max(
        0,
        cantidadDisponible - primerCambio.cantidad_existente - cantidad_salidas_familiares - cantidad_mermas
      );

      if (vendidaAntesPrimerCambio > 0) {
        tramos.push({
          precio_venta: itemInicial.precio_venta,
          cantidad_vendida_en_tramo: vendidaAntesPrimerCambio,
          subtotal: redondear(vendidaAntesPrimerCambio * itemInicial.precio_venta),
        });
        vendidaAcumulada += vendidaAntesPrimerCambio;
      }

      for (let i = 0; i < cambiosDelProducto.length; i++) {
        const cambioActual = cambiosDelProducto[i];
        const cambioSiguiente = cambiosDelProducto[i + 1];

        let vendidaEnEsteTramo: number;
        if (cambioSiguiente) {
          vendidaEnEsteTramo = Math.max(
            0,
            cambioActual.cantidad_existente - cambioSiguiente.cantidad_existente
          );
        } else {
          vendidaEnEsteTramo = Math.max(0, cantidad_vendida - vendidaAcumulada);
        }

        if (vendidaEnEsteTramo > 0) {
          tramos.push({
            precio_venta: cambioActual.precio_nuevo,
            cantidad_vendida_en_tramo: vendidaEnEsteTramo,
            subtotal: redondear(vendidaEnEsteTramo * cambioActual.precio_nuevo),
          });
          vendidaAcumulada += vendidaEnEsteTramo;
        }
      }
    }

    const dinero_aportado = redondear(tramos.reduce((acc, t) => acc + t.subtotal, 0));

    return {
      producto_id: pid,
      producto_nombre: itemInicial.producto_nombre,
      cantidad_inicial,
      cantidad_entradas,
      cantidad_salidas_familiares,
      cantidad_mermas,
      cantidad_final,
      cantidad_vendida,
      dinero_aportado,
      tramos,
    };
  });

  // ── Totales esperados (ventas) ────────────────────────────
  const total_ventas_esperado = redondear(
    resultados_productos.reduce((acc, r) => acc + r.dinero_aportado, 0)
  );

  const total_gastos = redondear(
    gastos.reduce((acc, g) => acc + g.diferencia, 0)
  );

  // Lo que debería haber en caja = ventas - gastos
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

  // Dinero real total = efectivo + transferencias + USD
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
      return acc + r.cantidad_vendida * (itemInicial?.precio_costo ?? 0);
    }, 0)
  );

  const ganancia_neta_dueno = redondear(
    total_ventas_esperado - total_costo - salario_mostrador - salario_salon - total_gastos
  );

  return {
    resultados_productos,
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