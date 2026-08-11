// src/presentation/hooks/useTurno.ts
import { useState, useEffect, useCallback } from 'react';
import { Turno } from '../../domain/entities/Turno';
import { ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';
import { TurnoRepository } from '../../data/repositories/TurnoRepository';
import { ProductoRepository } from '../../data/repositories/ProductoRepository';
import { MovimientoRepository } from '../../data/repositories/MovimientoRepository';
import { calcularCuadre, DatosCuadre } from '../../domain/usecases/calcularCuadre';
import { useProductosStore } from '../stores/productosStore';

interface UseTurnoReturn {
  turno: Turno | null;
  cargando: boolean;
  cerrando: boolean;
  recargar: () => Promise<void>;
  abrirTurno: (dias: number) => Promise<void>;
  cerrarTurno: () => Promise<void>;
  actualizarDias: (dias: number) => Promise<void>;
}

export function useTurno(): UseTurnoReturn {
  const [turno, setTurno] = useState<Turno | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const marcarProductosActualizados = useProductosStore((s) => s.marcarActualizado);

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await TurnoRepository.getTurnoAbierto();
      setTurno(data);
    } catch (e) {
      console.error('[useTurno] recargar:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const abrirTurno = useCallback(
    async (dias: number) => {
      if (turno) return;
      const turnoId = await TurnoRepository.abrir({ dias_duracion: dias });
      const productos = await ProductoRepository.getAll();
      const items: ItemInventarioTurnoInput[] = productos.map((p) => ({
        turno_id: turnoId,
        producto_id: p.id,
        producto_nombre: p.nombre,
        precio_costo: p.precio_costo,
        precio_venta: p.precio_venta,
        cantidad: p.cantidad,
        tipo: 'inicial',
      }));
      if (items.length > 0) {
        await TurnoRepository.guardarInventario(items);
      }
      await recargar();
    },
    [recargar]
  );

  const cerrarTurno = useCallback(async () => {
    if (!turno) return;

    setCerrando(true);

    try {
      // SQLite de Expo SDK 54 requiere ejecutar estas consultas en secuencia.
      const inventarioInicial = await TurnoRepository.getInventario(turno.id, 'inicial');
      const inventarioFinal = await TurnoRepository.getInventario(turno.id, 'final');
      const entradas = await MovimientoRepository.getEntradas(turno.id);
      const salidasFamiliares = await MovimientoRepository.getSalidasFamiliares(turno.id);
      const cambiosPrecio = await MovimientoRepository.getCambiosPrecio(turno.id);
      const mermas = await MovimientoRepository.getMermas(turno.id);
      const transferencias = await MovimientoRepository.getTransferencias(turno.id);
      const gastos = await MovimientoRepository.getGastos(turno.id);
      const cajaPorDia = await MovimientoRepository.getCajaPorDia(turno.id);
      const registrosUSD = await MovimientoRepository.getRegistrosUSD(turno.id);

      // PASO 3: Calcular el cuadre y guardar el historial
      const datos: DatosCuadre = {
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
      };

      const resultado = inventarioFinal.length > 0 ? calcularCuadre(datos) : null;
      const preciosFinales = Array.from(
        cambiosPrecio
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id)
          .reduce((porProducto, cambio) => {
            porProducto.set(cambio.producto_id, cambio.precio_nuevo);
            return porProducto;
          }, new Map<number, number>())
          .entries()
      ).map(([productoId, precioVenta]) => ({ productoId, precioVenta }));

      await TurnoRepository.cerrarConsolidado({
        turnoId: turno.id,
        inventarioFinal,
        preciosFinales,
        historial: {
          turno_id: turno.id,
          fecha_apertura: turno.fecha_apertura,
          fecha_cierre: new Date().toISOString(),
          dias_duracion: turno.dias_duracion,
          total_ventas: resultado?.total_ventas_esperado ?? 0,
          total_transferencias: resultado?.total_transferencias ?? 0,
          total_usd_cup: resultado?.total_usd_en_cup ?? 0,
          total_gastos: resultado?.total_gastos ?? 0,
          total_esperado: resultado?.total_esperado ?? 0,
          total_efectivo_real: resultado?.total_efectivo_caja ?? 0,
          total_real: resultado?.total_real ?? 0,
          diferencia: resultado?.diferencia ?? 0,
          estado_cuadre: resultado?.estado ?? 'sin_cuadre',
          salario_mostrador: resultado?.salario_mostrador ?? 0,
          salario_salon: resultado?.salario_salon ?? 0,
          ganancia_neta: resultado?.ganancia_neta_dueno ?? 0,
          detalle_json: resultado ? JSON.stringify({ datos, resultado }) : null,
        },
      });

      marcarProductosActualizados();
    } catch (e) {
      console.error('[useTurno] Error durante el cierre transaccional:', e);
      throw e;
    } finally {
      setCerrando(false);
    }

    await recargar();
  }, [turno, recargar, marcarProductosActualizados]);

  const actualizarDias = useCallback(
    async (dias: number) => {
      if (!turno) return;
      await TurnoRepository.actualizarDias(turno.id, dias);
      await recargar();
    },
    [turno, recargar]
  );

  return {
    turno,
    cargando,
    cerrando,
    recargar,
    abrirTurno,
    cerrarTurno,
    actualizarDias,
  };
}
