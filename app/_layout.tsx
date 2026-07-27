// app/_layout.tsx
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { ToastContainer } from '../src/presentation/components/ui/Toast/ToastContainer';
import { initDatabaseSync } from '../src/data/database/db';
import { useTemaStore } from '../src/presentation/stores/temaStore';
import { getColors } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [listo, setListo] = useState(false);
  const { modo, cargarPreferencia } = useTemaStore();
  const C = getColors(modo);

  useEffect(() => {
    async function inicializar() {
      try {
        // 1. DB
        initDatabaseSync();

        // 2. Fuentes
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
          Inter_800ExtraBold,
        });

        // 3. Preferencia de tema
        await cargarPreferencia();

      } catch (e) {
        console.error('[RootLayout] Error inicializando:', e);
      } finally {
        setListo(true);
        await SplashScreen.hideAsync();
      }
    }

    inicializar();
  }, []);

  if (!listo) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#0D0D0F',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          style={modo === 'oscuro' ? 'light' : 'dark'}
          backgroundColor={C.bgPrimary}
        />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        <ToastContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}