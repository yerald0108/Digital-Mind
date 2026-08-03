// src/presentation/components/features/configuracion/ModalImportacionExterna.tsx
// Se muestra globalmente cuando el usuario abre un .dmind desde cualquier app
// (WhatsApp, Zapya, Bluetooth, explorador de archivos, etc.)

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal as RNModal } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Typography, Spacing, Radius, Shadows } from '../../../../constants/theme';
import { ArchivoProductos, importarProductos, ModoImportacion } from '../../../../domain/usecases/exportarImportarProductos';

interface ModalImportacionExternaProps {
  visible: boolean;
  datos: ArchivoProductos | null;
  onImportado: (mensaje: string) => void;
  onCancelar: () => void;
}

type Paso = 'elegir_modo' | 'importando' | 'error';

export function ModalImportacionExterna({
  visible,
  datos,
  onImportado,
  onCancelar,
}: ModalImportacionExternaProps) {
  const { C } = useTheme();
  const [paso, setPaso] = useState<Paso>('elegir_modo');
  const [mensajeError, setMensajeError] = useState('');

  if (!datos) return null;

  const ejecutar = async (modo: ModoImportacion) => {
    setPaso('importando');
    try {
      const resultado = await importarProductos(datos, modo);
      const accion = modo === 'reemplazar' ? 'reemplazados' : 'añadidos';
      let mensaje = `${resultado.importados} productos ${accion} correctamente.`;
      if (resultado.omitidos > 0) {
        mensaje += ` ${resultado.omitidos} omitidos por datos inválidos.`;
      }
      setPaso('elegir_modo'); // resetear para la próxima vez
      onImportado(mensaje);
    } catch (e: any) {
      setMensajeError(e?.message ?? 'Error desconocido al importar.');
      setPaso('error');
    }
  };

  const handleCancelar = () => {
    setPaso('elegir_modo');
    setMensajeError('');
    onCancelar();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancelar}
    >
      <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
        <View style={[styles.card, { backgroundColor: C.bgSurface, borderColor: C.border }]}>

          {/* ── Ícono y título ── */}
          <View style={[styles.iconoContainer, { backgroundColor: `${C.accent}15` }]}>
            <MaterialCommunityIcons name="database-import-outline" size={32} color={C.accent} />
          </View>

          {paso === 'error' ? (
            <>
              <Text style={[styles.titulo, { color: C.textPrimary }]}>
                Error al importar
              </Text>
              <Text style={[styles.mensaje, { color: C.textSecondary }]}>
                {mensajeError}
              </Text>
              <TouchableOpacity
                style={[styles.botonPrimario, { backgroundColor: C.accent }]}
                onPress={handleCancelar}
                activeOpacity={0.8}
              >
                <Text style={[styles.botonTexto, { color: C.textOnAccent }]}>Cerrar</Text>
              </TouchableOpacity>
            </>
          ) : paso === 'importando' ? (
            <>
              <Text style={[styles.titulo, { color: C.textPrimary }]}>
                Importando...
              </Text>
              <Text style={[styles.mensaje, { color: C.textSecondary }]}>
                Procesando {datos.total} productos. Un momento.
              </Text>
            </>
          ) : (
            <>
              {/* ── Encabezado informativo ── */}
              <Text style={[styles.titulo, { color: C.textPrimary }]}>
                Archivo de productos
              </Text>
              <Text style={[styles.mensaje, { color: C.textSecondary }]}>
                Se encontró un archivo con{' '}
                <Text style={{ color: C.textPrimary, fontFamily: Typography.fontFamilyBold }}>
                  {datos.total} productos
                </Text>{' '}
                de Digital/Mind. ¿Cómo quieres importarlos?
              </Text>

              {/* ── Separador ── */}
              <View style={[styles.separador, { backgroundColor: C.divider }]} />

              {/* ── Opción 1: Añadir ── */}
              <TouchableOpacity
                style={[styles.opcion, { borderColor: `${C.accentSuccess}50`, backgroundColor: `${C.accentSuccess}10` }]}
                onPress={() => ejecutar('añadir')}
                activeOpacity={0.8}
              >
                <View style={[styles.opcionIcono, { backgroundColor: `${C.accentSuccess}20` }]}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={22} color={C.accentSuccess} />
                </View>
                <View style={styles.opcionTextos}>
                  <Text style={[styles.opcionTitulo, { color: C.accentSuccess }]}>
                    Añadir a los actuales
                  </Text>
                  <Text style={[styles.opcionDesc, { color: C.textSecondary }]}>
                    Conserva los productos existentes y agrega los nuevos
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ── Opción 2: Reemplazar ── */}
              <TouchableOpacity
                style={[styles.opcion, { borderColor: `${C.accentDanger}50`, backgroundColor: `${C.accentDanger}10` }]}
                onPress={() => ejecutar('reemplazar')}
                activeOpacity={0.8}
              >
                <View style={[styles.opcionIcono, { backgroundColor: `${C.accentDanger}20` }]}>
                  <MaterialCommunityIcons name="swap-horizontal" size={22} color={C.accentDanger} />
                </View>
                <View style={styles.opcionTextos}>
                  <Text style={[styles.opcionTitulo, { color: C.accentDanger }]}>
                    Reemplazar todo
                  </Text>
                  <Text style={[styles.opcionDesc, { color: C.textSecondary }]}>
                    Elimina los productos actuales y carga los del archivo
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ── Cancelar ── */}
              <TouchableOpacity
                style={[styles.botonCancelar, { borderColor: C.border }]}
                onPress={handleCancelar}
                activeOpacity={0.7}
              >
                <Text style={[styles.botonCancelarTexto, { color: C.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.lg,
  },
  iconoContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  titulo: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    textAlign: 'center',
  },
  mensaje: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  separador: {
    width: '100%',
    height: 1,
    marginVertical: Spacing.xs,
  },
  opcion: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  opcionIcono: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionTextos: { flex: 1 },
  opcionTitulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  opcionDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  botonPrimario: {
    width: '100%',
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  botonTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  botonCancelar: {
    width: '100%',
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  botonCancelarTexto: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
});