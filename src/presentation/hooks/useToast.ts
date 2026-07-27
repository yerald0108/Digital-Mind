// src/presentation/hooks/useToast.ts
import { useToastStore } from '../stores/toastStore';

// Hook de acceso rápido al sistema de toasts
export function useToast() {
  const { exito, error, advertencia, info, mostrar, ocultar } = useToastStore();
  return { exito, error, advertencia, info, mostrar, ocultar };
}