import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CONFIGURACION_TABS: Record<string, { etiqueta: string; icono: IconName }> = {
  index: { etiqueta: 'Inicio', icono: 'view-dashboard-outline' },
  inventario: { etiqueta: 'Inventario', icono: 'package-variant-closed' },
  cuadre: { etiqueta: 'Cuadre', icono: 'calculator-variant-outline' },
  historial: { etiqueta: 'Historial', icono: 'history' },
};

export function BarraNavegacionFlotante({ state, descriptors, navigation }: BottomTabBarProps) {
  const { C, T, S, R, Sh } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.duration(360).springify()}
      style={[
        styles.barra,
        {
          bottom: Math.max(insets.bottom, S.md),
          backgroundColor: C.bgSurface,
          borderColor: C.border,
          borderRadius: R.xl,
          ...Sh.lg,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const enfocada = state.index === index;
        const opciones = descriptors[route.key].options;
        const configuracion = CONFIGURACION_TABS[route.name] ?? {
          etiqueta: opciones.title ?? route.name,
          icono: 'circle-outline' as IconName,
        };

        const alPresionar = () => {
          const evento = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!enfocada && !evento.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <BotonTab
            key={route.key}
            etiqueta={configuracion.etiqueta}
            icono={configuracion.icono}
            enfocada={enfocada}
            colorActivo={C.accent}
            colorInactivo={C.textSecondary}
            fondoActivo={`${C.accent}1F`}
            tipografia={T}
            radio={R}
            onPress={alPresionar}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            accessibilityLabel={opciones.tabBarAccessibilityLabel ?? configuracion.etiqueta}
          />
        );
      })}
    </Animated.View>
  );
}

interface BotonTabProps {
  etiqueta: string;
  icono: IconName;
  enfocada: boolean;
  colorActivo: string;
  colorInactivo: string;
  fondoActivo: string;
  tipografia: ReturnType<typeof useTheme>['T'];
  radio: ReturnType<typeof useTheme>['R'];
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel: string;
}

function BotonTab({
  etiqueta,
  icono,
  enfocada,
  colorActivo,
  colorInactivo,
  fondoActivo,
  tipografia,
  radio,
  onPress,
  onLongPress,
  accessibilityLabel,
}: BotonTabProps) {
  const progreso = useSharedValue(enfocada ? 1 : 0);

  useEffect(() => {
    progreso.value = withSpring(enfocada ? 1 : 0, {
      damping: 14,
      stiffness: 180,
      mass: 0.65,
    });
  }, [enfocada, progreso]);

  const fondoAnimado = useAnimatedStyle(() => ({
    opacity: progreso.value,
    transform: [{ scale: 0.84 + progreso.value * 0.16 }],
  }));

  const iconoAnimado = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progreso.value) * 2 }],
  }));

  const etiquetaAnimada = useAnimatedStyle(() => ({
    opacity: 0.76 + progreso.value * 0.24,
  }));

  const color = enfocada ? colorActivo : colorInactivo;

  return (
    <Pressable
      style={styles.boton}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: enfocada }}
      accessibilityLabel={accessibilityLabel}
      android_ripple={{ color: `${colorActivo}18`, borderless: false }}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.fondoActivo, { backgroundColor: fondoActivo, borderRadius: radio.lg }, fondoAnimado]}
      />
      <Animated.View style={[styles.contenidoBoton, iconoAnimado]}>
        <MaterialCommunityIcons name={icono} size={21} color={color} />
        <Animated.Text
          style={[
            styles.etiqueta,
            { color, fontFamily: tipografia.fontFamilyMedium, fontSize: tipografia.size.xs },
            etiquetaAnimada,
          ]}
        >
          {etiqueta}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    elevation: 14,
  },
  boton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fondoActivo: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
  },
  contenidoBoton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  etiqueta: {
    lineHeight: 15,
  },
});
