// src/presentation/components/ui/Toast/types.ts

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  variant: ToastVariant;
  titulo: string;
  mensaje?: string;
  duracion?: number;  // ms, default 3000
}