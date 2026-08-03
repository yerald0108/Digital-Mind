// app/_layout.tsx
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
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
import { useToastStore } from '../src/presentation/stores/toastStore';
import { useProductosStore } from '../src/presentation/stores/productosStore';
import { parsearArchivoImportacion } from '../src/domain/usecases/exportarImportarProductos';
import { ModalImportacionExterna } from '../src/presentation/components/features/configuracion/ModalImportacionExterna';
import { ArchivoProductos } from '../src/domain/usecases/exportarImportarProductos';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [listo, setListo] = useState(false);
  const { modo, cargarPreferencia } = useTemaStore();
  const C = getColors(modo);

  // ── Estado para el modal de importación externa ──
  const [archivoExterno, setArchivoExterno] = useState<ArchivoProductos | null>(null);
  const procesandoRef = useRef(false);

  const toast = useToastStore();
  const marcarActualizado = useProductosStore((s) => s.marcarActualizado);

  // ── Procesar URI recibida desde un intent externo ──────────────────────

  const procesarURI = async (uri: string | null) => {
    if (!uri || procesandoRef.current) return;

    // Solo procesar archivos .dmind o JSON que vengan como content:// o file://
    const esArchivoValido =
      uri.endsWith('.dmind') ||
      uri.includes('.dmind') ||
      uri.startsWith('content://') ||
      (uri.startsWith('file://') && (uri.includes('.dmind') || uri.includes('.json')));

    if (!esArchivoValido) return;

    procesandoRef.current = true;
    try {
      const datos = await parsearArchivoImportacion(uri);
      setArchivoExterno(datos);
    } catch (e: any) {
      if (e?.message !== 'CANCELADO' && e?.message !== 'NO_ES_DIGITALMIND') {
        toast.error('Archivo inválido', e?.message ?? 'No se pudo leer el archivo.');
      }
    } finally {
      procesandoRef.current = false;
    }
  };

  // ── Inicialización de la app ────────────────────────────────────────────

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

        // 4. Verificar si la app fue abierta desde un archivo externo
        //    (cuando la app estaba cerrada y el usuario tocó el .dmind)
        const urlInicial = await Linking.getInitialURL();
        if (urlInicial) {
          // Pequeño delay para que la UI esté montada antes de mostrar el modal
          setTimeout(() => procesarURI(urlInicial), 800);
        }

      } catch (e) {
        console.error('[RootLayout] Error inicializando:', e);
      } finally {
        setListo(true);
        await SplashScreen.hideAsync();
      }
    }

    inicializar();
  }, []);

  // ── Escuchar intents mientras la app está abierta ──────────────────────
  useEffect(() => {
    const suscripcion = Linking.addEventListener('url', ({ url }) => {
      procesarURI(url);
    });
    return () => suscripcion.remove();
  }, []);

  if (!listo) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: C.bgPrimary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator size="large" color={C.accent} />
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

        {/* Modal global de importación externa — se muestra sobre cualquier pantalla */}
        <ModalImportacionExterna
          visible={archivoExterno !== null}
          datos={archivoExterno}
          onImportado={(mensaje) => {
            setArchivoExterno(null);
            marcarActualizado();
            toast.exito('Importación exitosa', mensaje);
          }}
          onCancelar={() => setArchivoExterno(null)}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}