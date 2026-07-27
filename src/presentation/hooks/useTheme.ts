// src/presentation/hooks/useTheme.ts
import { useTemaStore } from '../stores/temaStore';
import { getColors, getAccentLine, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

// Hook principal para acceder al tema actual en cualquier componente
export function useTheme() {
  const { modo, setModo } = useTemaStore();
  const C = getColors(modo);
  const esOscuro = modo === 'oscuro';

  return {
    modo,
    esOscuro,
    C,                          // Colors del modo actual
    T: Typography,              // Typography (igual en ambos modos)
    S: Spacing,                 // Spacing
    R: Radius,                  // Radius
    Sh: Shadows,                // Shadows
    accentLine: getAccentLine(modo),
    toggleModo: () => setModo(esOscuro ? 'claro' : 'oscuro'),
    setModo,
  };
}