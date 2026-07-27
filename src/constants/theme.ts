// src/constants/theme.ts
// ============================================================
// ARCHIVO SAGRADO DE ESTILOS — Digital/Mind
// Tokens para modo oscuro y modo claro.
// ============================================================

// ── Paletas base ─────────────────────────────────────────────
const PaletaDark = {
  bgPrimary: '#0D0D0F',
  bgSurface: '#18181C',
  bgElevated: '#222228',
  bgInput: '#1C1C22',
  accent: '#4F8EF7',
  accentDark: '#2C6FD4',
  accentSuccess: '#34C77B',
  accentDanger: '#E85454',
  accentWarning: '#F0B429',
  accentInfo: '#7B9FE0',
  textPrimary: '#F0F0F5',
  textSecondary: '#8888A0',
  textDisabled: '#44445A',
  textOnAccent: '#FFFFFF',
  border: '#2C2C36',
  borderFocus: '#4F8EF7',
  divider: '#1E1E26',
  turnoAbierto: '#34C77B',
  turnoCerrado: '#E85454',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

const PaletaLight = {
  bgPrimary: '#F4F4F8',
  bgSurface: '#FFFFFF',
  bgElevated: '#EEEEF4',
  bgInput: '#F8F8FC',
  accent: '#2E6EE1',
  accentDark: '#1A4FB5',
  accentSuccess: '#1EA85F',
  accentDanger: '#D03B3B',
  accentWarning: '#C8920A',
  accentInfo: '#4A72C4',
  textPrimary: '#12121A',
  textSecondary: '#55556A',
  textDisabled: '#AAAABC',
  textOnAccent: '#FFFFFF',
  border: '#DDDDE8',
  borderFocus: '#2E6EE1',
  divider: '#E8E8F0',
  turnoAbierto: '#1EA85F',
  turnoCerrado: '#D03B3B',
  overlay: 'rgba(0, 0, 0, 0.45)',
};

// ── Función para obtener los colores según el modo ───────────
export function getColors(modo: 'oscuro' | 'claro' = 'oscuro') {
  return modo === 'claro' ? PaletaLight : PaletaDark;
}

// Export estático para compatibilidad (usa dark por defecto)
export const Colors = PaletaDark;

// ── Tipografía ────────────────────────────────────────────────
export const Typography = {
  fontFamily: 'Inter_400Regular',
  fontFamilyMedium: 'Inter_500Medium',
  fontFamilySemiBold: 'Inter_600SemiBold',
  fontFamilyBold: 'Inter_700Bold',
  fontFamilyExtraBold: 'Inter_800ExtraBold',
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const AccentLine = {
  height: 2,
  backgroundColor: PaletaDark.accent,
  width: 36,
  borderRadius: Radius.full,
  marginTop: Spacing.xs,
  marginBottom: Spacing.lg,
} as const;

// Hook para usar en componentes
export function getAccentLine(modo: 'oscuro' | 'claro') {
  return {
    height: 2,
    backgroundColor: getColors(modo).accent,
    width: 36,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  };
}