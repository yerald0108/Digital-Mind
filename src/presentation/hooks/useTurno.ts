// src/presentation/hooks/useTurno.ts
import { useState, useEffect, useCallback } from 'react';
import { Turno } from '../../domain/entities/Turno';
import { ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';
import { TurnoRepository } from '../../data/repositories/TurnoRepository';
import { ProductoRepository } from '../../data/repositories/ProductoRepository';
import { MovimientoRepository } from '../../data/repositories/MovimientoRepository';
import { HistorialRepository } from '../../data/repositories/HistorialRepository';
import { calcularCuadre, DatosCuadre } from '../../domain/usecases/calcularCuadre';

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

    /*
     * ROLLBACK MANUAL
     * Se ejecutan los pasos secuencialmente fuera de una transaccion.
     * Si algo falla a mitad del proceso, se revierte lo que ya se hizo
     * usando las banderas de cada paso completado.
     */
    let turnoCerrado = false;
    let historialGuardado = false;
    let inventarioActualizado = false;
    let movimientosEliminados = false;

    try {
      // PASO 1: Marcar el turno como cerrado en la base de datos
      await TurnoRepository.cerrar(turno.id);
      turnoCerrado = true;
      console.log('[useTurno] Paso 1/5 completado: Turno cerrado');

      // PASO 2: Leer todos los datos del turno antes de limpiar
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
      console.log('[useTurno] Paso 2/5 completado: Datos leidos');

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

      const resultado =
        inventarioFinal.length > 0 ? calcularCuadre(datos) : null;

      const yaExiste = await HistorialRepository.existeParaTurno(turno.id);
      if (!yaExiste) {
        const turnoCerradoData = await TurnoRepository.getById(turno.id);
        await HistorialRepository.guardar({
          turno_id: turno.id,
          fecha_apertura: turno.fecha_apertura,
          fecha_cierre:
            turnoCerradoData?.fecha_cierre ?? new Date().toISOString(),
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
          detalle_json: resultado
            ? JSON.stringify({ datos, resultado })
            : null,
        });
        historialGuardado = true;
      }
      console.log('[useTurno] Paso 3/5 completado: Historial guardado');

      // PASO 4: Actualizar las cantidades de cada producto en el inventario
      if (inventarioFinal.length > 0) {
        for (const item of inventarioFinal) {
          await ProductoRepository.update(item.producto_id, {
            cantidad: item.cantidad,
          });
        }
        inventarioActualizado = true;
        console.log(
          '[useTurno] Paso 4/5 completado: Inventario actualizado con cantidades finales'
        );
      } else {
        // Sin inventario final registrado, no hay nada que actualizar.
        // Se marca como completado para que el rollback no intente revertir.
        inventarioActualizado = true;
        console.log('[useTurno] Paso 4/5 omitido: Sin inventario final');
      }

      // PASO 5: Eliminar todos los movimientos del turno
      await MovimientoRepository.eliminarMovimientosDelTurno(turno.id);
      movimientosEliminados = true;
      console.log('[useTurno] Paso 5/5 completado: Movimientos eliminados');

      console.log('[useTurno] Cierre de turno completado exitosamente');
    } catch (e) {
      console.error(
        '[useTurno] Error durante el cierre. Iniciando rollback manual:',
        e
      );

      /*
       * ROLLBACK: Se revierte en orden inverso al de ejecucion.
       * Solo se deshacen los pasos que alcanzaron a completarse
       * segun las banderas definidas al inicio.
       */
      try {
        // Si se actualizo el inventario pero no se eliminaron los movimientos,
        // el estado quedo parcial. Se advierte para revision manual.
        if (inventarioActualizado && !movimientosEliminados) {
          console.warn(
            '[useTurno] ADVERTENCIA: El inventario se actualizo pero los ' +
              'movimientos no se pudieron eliminar. El turno quedo en estado ' +
              'parcial. Se requiere revision manual.'
          );
        }

        // Revertir paso 3: eliminar el historial si se alcanzo a guardar
        if (historialGuardado) {
          await HistorialRepository.eliminarPorTurnoId(turno.id); 
          console.log('[useTurno] Rollback: Historial eliminado');
        }

        // Revertir paso 1: reabrir el turno
        if (turnoCerrado) {
          await TurnoRepository.reabrir(turno.id);
          console.log('[useTurno] Rollback: Turno reabierto');
        }
      } catch (rollbackError) {
        console.error(
          '[useTurno] Error critico durante el rollback:',
          rollbackError
        );
        console.error(
          '[useTurno] ESTADO INCONSISTENTE - Se requiere intervencion manual. ' +
            'turno_id=' + turno.id +
            ', turnoCerrado=' + turnoCerrado +
            ', historialGuardado=' + historialGuardado +
            ', inventarioActualizado=' + inventarioActualizado +
            ', movimientosEliminados=' + movimientosEliminados
        );
      }

      throw e;
    } finally {
      setCerrando(false);
    }

    await recargar();
  }, [turno, recargar]);

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