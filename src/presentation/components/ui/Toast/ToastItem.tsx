// src/presentation/components/ui/Toast/ToastItem.tsx
import { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ToastConfig, ToastVariant } from './types';
import { Colors, Typography, Spacing, Radius } from 'src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const DURACION_DEFAULT = 3000;

interface VarianteVisual {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  bgColor: string;
  barColor: string;
  borderColor: string;
}

// Colores sólidos — visibles sobre cualquier fondo
const success: VarianteVisual = {
  icon: 'check-circle',
  iconColor: '#34C77B',
  bgColor: '#1A2E23',
  barColor: '#34C77B',
  borderColor: '#2A4A35',
};

const errorV: VarianteVisual = {
  icon: 'close-circle',
  iconColor: '#E85454',
  bgColor: '#2E1A1A',
  barColor: '#E85454',
  borderColor: '#4A2A2A',
};

const warning: VarianteVisual = {
  icon: 'alert-circle',
  iconColor: '#F0B429',
  bgColor: '#2E2714',
  barColor: '#F0B429',
  borderColor: '#4A3E1E',
};

const infoV: VarianteVisual = {
  icon: 'information-slab-circle',
  iconColor: '#4F8EF7',
  bgColor: '#1A2240',
  barColor: '#4F8EF7',
  borderColor: '#243060',
};

const VARIANTE_CONFIG: Record<ToastVariant, VarianteVisual> = {
  success,
  error: errorV,
  warning,
  info: infoV,
};

interface ToastItemProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = VARIANTE_CONFIG[toast.variant];
  const duracion = toast.duracion ?? DURACION_DEFAULT;

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(TOAST_WIDTH)).current;

  const salir = useRef(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  }).current;

  useEffect(() => {
    // Entrada
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 20,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    // Barra de progreso (no useNativeDriver porque anima width)
    Animated.timing(progressWidth, {
      toValue: 0,
      duration: duracion,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(salir, duracion);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Barra lateral */}
      <View style={[styles.barraLateral, { backgroundColor: config.barColor }]} />

      {/* Icono */}
      <View style={styles.iconoWrapper}>
        <MaterialCommunityIcons
          name={config.icon}
          size={24}
          color={config.iconColor}
        />
      </View>

      {/* Textos */}
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: config.iconColor }]} numberOfLines={1}>
          {toast.titulo}
        </Text>
        {toast.mensaje ? (
          <Text style={styles.mensaje} numberOfLines={2}>
            {toast.mensaje}
          </Text>
        ) : null}
      </View>

      {/* Cerrar */}
      <TouchableOpacity onPress={salir} style={styles.botonCerrar} activeOpacity={0.7}>
        <MaterialCommunityIcons name="close" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Barra progreso inferior */}
      <Animated.View
        style={[
          styles.progreso,
          {
            backgroundColor: config.barColor,
            width: progressWidth,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TOAST_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    minHeight: 56,
    // Sombra para que flote
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 20,
  },
  barraLateral: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconoWrapper: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  textos: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.xs,
  },
  titulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    letterSpacing: 0.2,
  },
  mensaje: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  botonCerrar: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  progreso: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
});