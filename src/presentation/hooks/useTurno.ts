// src/presentation/hooks/useTurno.ts
import { useState, useEffect, useCallback } from 'react';
import { Turno } from '../../domain/entities/Turno';
import { ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';
import { TurnoRepository } from '../../data/repositories/TurnoRepository';
import { ProductoRepository } from '../../data/repositories/ProductoRepository';
import { MovimientoRepository } from '../../data/repositories/MovimientoRepository';
import { HistorialRepository } from '../../data/repositories/HistorialRepository';
import { calcularCuadre, DatosCuadre } from '../../domain/usecases/calcularCuadre';
import { getDatabase } from '../../data/database/db';

interface UseTurnoReturn {
  turno: Turno | null;
  cargando: boolean;
  recargar: () => Promise<void>;
  abrirTurno: (dias: number) => Promise<void>;
  cerrarTurno: () => Promise<void>;
  actualizarDias: (dias: number) => Promise<void>;
}

export function useTurno(): UseTurnoReturn {
  const [turno, setTurno] = useState<Turno | null>(null);
  const [cargando, setCargando] = useState(true);

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

  useEffect(() => { recargar(); }, [recargar]);

  const abrirTurno = useCallback(async (dias: number) => {
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
  }, [recargar]);

  const cerrarTurno = useCallback(async () => {
    if (!turno) return;

    // 1. Cerrar el turno en DB
    await TurnoRepository.cerrar(turno.id);

    try {
      // 2. Recopilar todos los datos antes de limpiar
      const [
        inventarioInicial, inventarioFinal,
        entradas, salidasFamiliares, cambiosPrecio,
        mermas, transferencias, gastos, cajaPorDia, registrosUSD,
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

      const datos: DatosCuadre = {
        inventarioInicial, inventarioFinal, entradas,
        salidasFamiliares, cambiosPrecio, mermas,
        transferencias, gastos, cajaPorDia, registrosUSD,
      };

      // 3. Calcular cuadre si hay inventario final
      const resultado = inventarioFinal.length > 0
        ? calcularCuadre(datos)
        : null;

      // 4. Guardar en historial
      const yaExiste = await HistorialRepository.existeParaTurno(turno.id);
      if (!yaExiste) {
        const turnoCerrado = await TurnoRepository.getById(turno.id);
        await HistorialRepository.guardar({
          turno_id: turno.id,
          fecha_apertura: turno.fecha_apertura,
          fecha_cierre: turnoCerrado?.fecha_cierre ?? new Date().toISOString(),
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
        });
      }

      // 5. Actualizar cantidad de cada producto con el inventario final
      if (inventarioFinal.length > 0) {
        for (const item of inventarioFinal) {
          await ProductoRepository.update(item.producto_id, {
            cantidad: item.cantidad,
          });
        }
        console.log('[useTurno] Inventario actualizado con cantidades finales');
      }

      // 6. Limpiar todos los movimientos del turno
      const db = await getDatabase();
      await db.runAsync('DELETE FROM entradas WHERE turno_id = ?', [turno.id]);
      await db.runAsync('DELETE FROM salidas_familiares WHERE turno_id = ?', [turno.id]);
      await db.runAsync('DELETE FROM cambios_precio WHERE turno_id = ?', [turno.id]);
      await db.runAsync('DELETE FROM mermas WHERE turno_id = ?', [turno.id]);
      await db.runAsync('DELETE FROM transferencias WHERE turno_id = ?', [turno.id]);
      await db.runAsync('DELETE FROM gastos WHERE turno_id = ?', [turno.id]);
      await db.runAsync('DELETE FROM caja_por_dia WHERE turno_id = ?', [turno.id]);
      await db.runAsync('DELETE FROM registros_usd WHERE turno_id = ?', [turno.id]);
      console.log('[useTurno] Movimientos del turno eliminados');

    } catch (e) {
      console.error('[useTurno] Error en cierre de turno:', e);
    }

    await recargar();
  }, [turno, recargar]);

  const actualizarDias = useCallback(async (dias: number) => {
    if (!turno) return;
    await TurnoRepository.actualizarDias(turno.id, dias);
    await recargar();
  }, [turno, recargar]);

  return { turno, cargando, recargar, abrirTurno, cerrarTurno, actualizarDias };
}