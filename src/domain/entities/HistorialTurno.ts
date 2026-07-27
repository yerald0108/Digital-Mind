// src/domain/entities/HistorialTurno.ts

export interface HistorialTurno {
  id: number;
  turno_id: number;
  fecha_apertura: string;
  fecha_cierre: string;
  dias_duracion: number;
  // Totales
  total_ventas: number;
  total_transferencias: number;
  total_usd_cup: number;
  total_gastos: number;
  total_esperado: number;
  total_efectivo_real: number;
  total_real: number;
  diferencia: number;
  estado_cuadre: 'sobrante' | 'faltante' | 'exacto' | 'sin_cuadre';
  // Salarios
  salario_mostrador: number;
  salario_salon: number;
  ganancia_neta: number;
  // Detalle JSON completo
  detalle_json: string | null;
  creado_en: string;
}

export type HistorialTurnoInput = Omit<HistorialTurno, 'id' | 'creado_en'>;