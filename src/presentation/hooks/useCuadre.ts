// src/presentation/hooks/useCuadre.ts
import { useState, useCallback, useRef } from 'react';
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
  const datosRef = useRef<DatosCuadre | null>(null);

  const cargarDatos = useCallback(async (turnoId: number) => {
    try {
      if (!datosRef.current) setCargando(true);

      // Queries secuenciales — expo-sqlite SDK 54 no soporta múltiples
      // queries concurrentes sobre la misma instancia de DB (Promise.all
      // causa "2nd argument cannot be cast to NativeStatement").
      const inventarioInicial  = await TurnoRepository.getInventario(turnoId, 'inicial');
      const inventarioFinal    = await TurnoRepository.getInventario(turnoId, 'final');
      const entradas           = await MovimientoRepository.getEntradas(turnoId);
      const salidasFamiliares  = await MovimientoRepository.getSalidasFamiliares(turnoId);
      const cambiosPrecio      = await MovimientoRepository.getCambiosPrecio(turnoId);
      const mermas             = await MovimientoRepository.getMermas(turnoId);
      const transferencias     = await MovimientoRepository.getTransferencias(turnoId);
      const gastos             = await MovimientoRepository.getGastos(turnoId);
      const cajaPorDia         = await MovimientoRepository.getCajaPorDia(turnoId);
      const registrosUSD       = await MovimientoRepository.getRegistrosUSD(turnoId);

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

      datosRef.current = nuevosDatos;
      setDatos(nuevosDatos);
      // El resultado solo se calcula cuando el usuario presiona "Calcular".
      // No se dispara automáticamente al cargar datos para que la pantalla
      // Resultado no aparezca sin que el usuario haya completado los pasos.
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
}