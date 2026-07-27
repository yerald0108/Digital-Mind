// src/presentation/stores/toastStore.ts
import { create } from 'zustand';
import { ToastConfig, ToastVariant } from '../components/ui/Toast/types';

interface ToastStore {
  toasts: ToastConfig[];
  mostrar: (config: Omit<ToastConfig, 'id'>) => void;
  ocultar: (id: string) => void;
  // Helpers rápidos
  exito: (titulo: string, mensaje?: string) => void;
  error: (titulo: string, mensaje?: string) => void;
  advertencia: (titulo: string, mensaje?: string) => void;
  info: (titulo: string, mensaje?: string) => void;
}

function generarId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  mostrar: (config) => {
    const id = generarId();
    set((state) => ({
      toasts: [...state.toasts, { ...config, id }],
    }));
  },

  ocultar: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  exito: (titulo, mensaje) => {
    const id = generarId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, variant: 'success' as ToastVariant, titulo, mensaje },
      ],
    }));
  },

  error: (titulo, mensaje) => {
    const id = generarId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, variant: 'error' as ToastVariant, titulo, mensaje },
      ],
    }));
  },

  advertencia: (titulo, mensaje) => {
    const id = generarId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, variant: 'warning' as ToastVariant, titulo, mensaje },
      ],
    }));
  },

  info: (titulo, mensaje) => {
    const id = generarId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, variant: 'info' as ToastVariant, titulo, mensaje },
      ],
    }));
  },
}));