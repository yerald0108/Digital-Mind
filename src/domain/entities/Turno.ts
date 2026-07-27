// src/domain/entities/Turno.ts
export type EstadoTurno = 'abierto' | 'cerrado';

export interface Turno {
  id: number;
  dias_duracion: number;   // 1 a 6
  estado: EstadoTurno;
  fecha_apertura: string;
  fecha_cierre: string | null;
  creado_en: string;
}

export type TurnoInput = Pick<Turno, 'dias_duracion'>;