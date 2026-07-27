// src/presentation/hooks/useCuadre.ts
import { useState, useCallback } from 'react';
import { getDatabase } from '../../data/database/db';
import { TurnoRepository } from '../../data/repositories/TurnoRepository';
import { MovimientoRepository } from '../../data/repositories/MovimientoRepository';
import { ItemInventarioTurnoInput } from '../../domain/entities/InventarioTurno';
import { calcularCuadre, ResultadoCuadre, DatosCuadre } from '../../domain/usecases/calcularCuadre';

interface UseCuadreReturn {
  datos: DatosCuadre | null;
  resultado: ResultadoCuadre | null;
  cargando: boolean;
  cargarDatos: (turnoId: number) => Promise<void>;
  guardarInventarioFinal: (
    turnoId: number,
    items: ItemInventarioTurnoInput[]
  ) => Promise<void>;
  calcular: () => void;
}

export function useCuadre(): UseCuadreReturn {
  const [datos, setDatos] = useState<DatosCuadre | null>(null);
  const [resultado, setResultado] = useState<ResultadoCuadre | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargarDatos = useCallback(async (turnoId: number) => {
    try {
      setCargando(true);
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
        TurnoRepository.getInventario(turnoId, 'inicial'),
        TurnoRepository.getInventario(turnoId, 'final'),
        MovimientoRepository.getEntradas(turnoId),
        MovimientoRepository.getSalidasFamiliares(turnoId),
        MovimientoRepository.getCambiosPrecio(turnoId),
        MovimientoRepository.getMermas(turnoId),
        MovimientoRepository.getTransferencias(turnoId),
        MovimientoRepository.getGastos(turnoId),
        MovimientoRepository.getCajaPorDia(turnoId),
        MovimientoRepository.getRegistrosUSD(turnoId),
      ]);

      const nuevosDatos: DatosCuadre = {
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

      setDatos(nuevosDatos);

      if (inventarioFinal.length > 0) {
        setResultado(calcularCuadre(nuevosDatos));
      }
    } catch (e) {
      console.error('[useCuadre] cargarDatos:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  const guardarInventarioFinal = useCallback(
    async (turnoId: number, items: ItemInventarioTurnoInput[]) => {
      const db = getDatabase();
      await db.runAsync(
        "DELETE FROM inventario_turno WHERE turno_id = ? AND tipo = 'final'",
        [turnoId]
      );
      await TurnoRepository.guardarInventario(items);
      await cargarDatos(turnoId);
    },
    [cargarDatos]
  );

  const calcular = useCallback(() => {
    if (!datos) return;
    setResultado(calcularCuadre(datos));
  }, [datos]);

  return {
    datos,
    resultado,
    cargando,
    cargarDatos,
    guardarInventarioFinal,
    calcular,
  };
};