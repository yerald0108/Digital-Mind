// src/presentation/hooks/useHistorial.ts
import { useState, useEffect, useCallback } from 'react';
import { HistorialTurno } from '../../domain/entities/HistorialTurno';
import { HistorialRepository } from '../../data/repositories/HistorialRepository';

interface UseHistorialReturn {
  historial: HistorialTurno[];
  cargando: boolean;
  recargar: () => Promise<void>;
  eliminar: (id: number) => Promise<void>;
}

export function useHistorial(): UseHistorialReturn {
  const [historial, setHistorial] = useState<HistorialTurno[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      setCargando(true);
      const data = await HistorialRepository.getAll();
      setHistorial(data);
    } catch (e) {
      console.error('[useHistorial] recargar:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  const eliminar = useCallback(async (id: number) => {
    await HistorialRepository.eliminar(id);
    await recargar();
  }, [recargar]);

  return { historial, cargando, recargar, eliminar };
}