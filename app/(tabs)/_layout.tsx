// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Dimensions, Easing } from 'react-native';
import { BarraNavegacionFlotante } from '../../src/presentation/components/navigation/BarraNavegacionFlotante';
import { useTheme } from '../../src/presentation/hooks/useTheme';

const ANCHO_PANTALLA = Dimensions.get('window').width;

export default function TabLayout() {
  const { C } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 360,
            easing: Easing.bezier(0.22, 0.78, 0.2, 1),
          },
        },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-ANCHO_PANTALLA, 0, ANCHO_PANTALLA],
                }),
              },
            ],
          },
        }),
        sceneStyle: {
          backgroundColor: C.bgPrimary,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <BarraNavegacionFlotante {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: 'Inventario',
        }}
      />
      <Tabs.Screen
        name="cuadre"
        options={{
          title: 'Cuadre',
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
        }}
      />
    </Tabs>
  );
}
