// src/utils/formatters.ts
// Funciones de formateo reutilizables en toda la app

// Formatea un número como moneda CUP sin símbolo
export function formatCUP(valor: number): string {
  return valor.toLocaleString('es-CU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formatea con símbolo
export function formatMoneda(valor: number, simbolo = '$'): string {
  return `${simbolo} ${formatCUP(valor)}`;
}

// Formatea una fecha ISO a formato legible
export function formatFecha(fecha: string): string {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-CU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formatea fecha con hora
export function formatFechaHora(fecha: string): string {
  const date = new Date(fecha);
  return date.toLocaleString('es-CU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Formatea un número de días
export function formatDias(dias: number): string {
  return dias === 1 ? '1 día' : `${dias} días`;
}