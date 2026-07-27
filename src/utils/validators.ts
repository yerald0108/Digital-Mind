// src/utils/validators.ts
import { z } from 'zod';

// Schema para crear/editar un producto
export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  precio_costo: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo'),
  precio_venta: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo'),
  cantidad: z.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'No puede ser negativo'),
});

// Schema para abrir turno
export const turnoSchema = z.object({
  dias_duracion: z.number().min(1).max(6),
});

// Schema para entrada
export const entradaSchema = z.object({
  producto_id: z.number({ required_error: 'Selecciona un producto' }),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  notas: z.string().optional(),
});

// Schema para salida familiar
export const salidaFamiliarSchema = z.object({
  producto_id: z.number({ required_error: 'Selecciona un producto' }),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  quien_sustrajo: z.string().min(1, 'Indica quién sustrajo los productos'),
  notas: z.string().optional(),
});

// Schema para cambio de precio
export const cambioPrecioSchema = z.object({
  producto_id: z.number({ required_error: 'Selecciona un producto' }),
  precio_nuevo: z.number().min(0, 'No puede ser negativo'),
  cantidad_existente: z.number().min(0, 'No puede ser negativo'),
  notas: z.string().optional(),
});

// Schema para merma
export const mermaSchema = z.object({
  producto_id: z.number({ required_error: 'Selecciona un producto' }),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  tipo: z.enum(['roto', 'vencido', 'otro']),
  notas: z.string().optional(),
});

// Schema para transferencia
export const transferenciaSchema = z.object({
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  concepto: z.string().optional(),
});

// Schema para gasto
export const gastoSchema = z.object({
  producto_nombre: z.string().min(1, 'El nombre del producto es obligatorio'),
  precio_venta: z.number().min(0, 'No puede ser negativo'),
  precio_cobrado: z.number().min(0, 'No puede ser negativo'),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  notas: z.string().optional(),
});

// Schema para registro USD
export const usdSchema = z.object({
  cantidad_usd: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  tasa_cambio: z.number().min(1, 'La tasa de cambio debe ser mayor a 0'),
});