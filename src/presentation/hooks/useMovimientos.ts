// src/presentation/hooks/useMovimientos.ts
import { useState, useEffect, useCallback } from 'react';
import { MovimientoRepository } from '../../data/repositories/MovimientoRepository';
import { Entrada, EntradaInput } from '../../domain/entities/Entrada';
import { SalidaFamiliar, SalidaFamiliarInput } from '../../domain/entities/SalidaFamiliar';
import { CambioPrecio, CambioPrecioInput } from '../../domain/entities/CambioPrecio';
import { Merma, MermaInput } from '../../domain/entities/Merma';

interface UseMovimientosReturn {
  entradas: Entrada[];
  salidasFamiliares: SalidaFamiliar[];
  cambiosPrecio: CambioPrecio[];
  mermas: Merma[];
  cargando: boolean;
  recargar: () => Promise<void>;
  // Entradas
  crearEntrada: (input: EntradaInput) => Promise<void>;
  actualizarEntrada: (id: number, cantidad: number, notas: string | null) => Promise<void>;
  eliminarEntrada: (id: number) => Promise<void>;
  // Salidas
  crearSalidaFamiliar: (input: SalidaFamiliarInput) => Promise<void>;
  actualizarSalidaFamiliar: (id: number, cantidad: number, quien: string, notas: string | null) => Promise<void>;
  eliminarSalidaFamiliar: (id: number) => Promise<void>;
  // Cambios de precio
  crearCambioPrecio: (input: CambioPrecioInput) => Promise<void>;
  actualizarCambioPrecio: (id: number, precioNuevo: number, cantidad: number, notas: string | null) => Promise<void>;
  eliminarCambioPrecio: (id: number) => Promise<void>;
  // Mermas
  crearMerma: (input: MermaInput) => Promise<void>;
  actualizarMerma: (id: number, cantidad: number, tipo: string, notas: string | null) => Promise<void>;
  eliminarMerma: (id: number) => Promise<void>;
}

export function useMovimientos(turnoId: number | null): UseMovimientosReturn {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [salidasFamiliares, setSalidasFamiliares] = useState<SalidaFamiliar[]>([]);
  const [cambiosPrecio, setCambiosPrecio] = useState<CambioPrecio[]>([]);
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [cargando, setCargando] = useState(false);

  const recargar = useCallback(async () => {
    if (!turnoId) return;
    try {
      setCargando(true);
      const [e, s, c, m] = await Promise.all([
        MovimientoRepository.getEntradas(turnoId),
        MovimientoRepository.getSalidasFamiliares(turnoId),
        MovimientoRepository.getCambiosPrecio(turnoId),
        MovimientoRepository.getMermas(turnoId),
      ]);
      setEntradas(e);
      setSalidasFamiliares(s);
      setCambiosPrecio(c);
      setMermas(m);
    } catch (e) {
      console.error('[useMovimientos] recargar:', e);
    } finally {
      setCargando(false);
    }
  }, [turnoId]);

  useEffect(() => { recargar(); }, [recargar]);

  // Entradas
  const crearEntrada = useCallback(async (input: EntradaInput) => {
    await MovimientoRepository.crearEntrada(input);
    await recargar();
  }, [recargar]);

  const actualizarEntrada = useCallback(async (id: number, cantidad: number, notas: string | null) => {
    await MovimientoRepository.actualizarEntrada(id, cantidad, notas);
    await recargar();
  }, [recargar]);

  const eliminarEntrada = useCallback(async (id: number) => {
    await MovimientoRepository.eliminarEntrada(id);
    await recargar();
  }, [recargar]);

  // Salidas
  const crearSalidaFamiliar = useCallback(async (input: SalidaFamiliarInput) => {
    await MovimientoRepository.crearSalidaFamiliar(input);
    await recargar();
  }, [recargar]);

  const actualizarSalidaFamiliar = useCallback(async (
    id: number, cantidad: number, quien: string, notas: string | null
  ) => {
    await MovimientoRepository.actualizarSalidaFamiliar(id, cantidad, quien, notas);
    await recargar();
  }, [recargar]);

  const eliminarSalidaFamiliar = useCallback(async (id: number) => {
    await MovimientoRepository.eliminarSalidaFamiliar(id);
    await recargar();
  }, [recargar]);

  // Cambios
  const crearCambioPrecio = useCallback(async (input: CambioPrecioInput) => {
    await MovimientoRepository.crearCambioPrecio(input);
    await recargar();
  }, [recargar]);

  const actualizarCambioPrecio = useCallback(async (
    id: number, precioNuevo: number, cantidad: number, notas: string | null
  ) => {
    await MovimientoRepository.actualizarCambioPrecio(id, precioNuevo, cantidad, notas);
    await recargar();
  }, [recargar]);

  const eliminarCambioPrecio = useCallback(async (id: number) => {
    await MovimientoRepository.eliminarCambioPrecio(id);
    await recargar();
  }, [recargar]);

  // Mermas
  const crearMerma = useCallback(async (input: MermaInput) => {
    await MovimientoRepository.crearMerma(input);
    await recargar();
  }, [recargar]);

  const actualizarMerma = useCallback(async (
    id: number, cantidad: number, tipo: string, notas: string | null
  ) => {
    await MovimientoRepository.actualizarMerma(id, cantidad, tipo, notas);
    await recargar();
  }, [recargar]);

  const eliminarMerma = useCallback(async (id: number) => {
    await MovimientoRepository.eliminarMerma(id);
    await recargar();
  }, [recargar]);

  return {
    entradas, salidasFamiliares, cambiosPrecio, mermas, cargando, recargar,
    crearEntrada, actualizarEntrada, eliminarEntrada,
    crearSalidaFamiliar, actualizarSalidaFamiliar, eliminarSalidaFamiliar,
    crearCambioPrecio, actualizarCambioPrecio, eliminarCambioPrecio,
    crearMerma, actualizarMerma, eliminarMerma,
  };
}