// src/domain/entities/RegistroUSD.ts
export interface RegistroUSD {
  id: number;
  turno_id: number;
  cantidad_usd: number;
  tasa_cambio: number;       // a cómo se cogió ese dólar
  equivalente_cup: number;   // cantidad_usd * tasa_cambio
  fecha: string;
}

export type RegistroUSDInput = Omit<RegistroUSD, 'id' | 'fecha' | 'equivalente_cup'>;