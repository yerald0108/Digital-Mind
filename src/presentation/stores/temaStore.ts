// src/presentation/stores/temaStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ModoTema = 'oscuro' | 'claro';

interface TemaStore {
  modo: ModoTema;
  cargado: boolean;
  setModo: (modo: ModoTema) => Promise<void>;
  cargarPreferencia: () => Promise<void>;
}

const CLAVE = 'digitalmind_tema';

export const useTemaStore = create<TemaStore>((set) => ({
  modo: 'oscuro',
  cargado: false,

  cargarPreferencia: async () => {
    try {
      const guardado = await AsyncStorage.getItem(CLAVE);
      if (guardado === 'claro' || guardado === 'oscuro') {
        set({ modo: guardado, cargado: true });
      } else {
        set({ cargado: true });
      }
    } catch {
      set({ cargado: true });
    }
  },

  setModo: async (modo) => {
    try {
      await AsyncStorage.setItem(CLAVE, modo);
      set({ modo });
    } catch (e) {
      console.error('[temaStore] Error guardando tema:', e);
    }
  },
}));