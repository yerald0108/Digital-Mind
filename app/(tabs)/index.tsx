// app/(tabs)/index.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/presentation/hooks/useTheme';
import { useTurno } from '../../src/presentation/hooks/useTurno';
import { useMovimientos } from '../../src/presentation/hooks/useMovimientos';
import { useProductos } from '../../src/presentation/hooks/useProductos';
import { useToast } from '../../src/presentation/hooks/useToast';
import { IndicadorTurno } from '../../src/presentation/components/features/turno/IndicadorTurno';
import { BotonesMovimientos } from '../../src/presentation/components/features/turno/BotonesMovimientos';
import { AlertaInventario } from '../../src/presentation/components/features/turno/AlertaInventario';
import { ModalAbrirTurno } from '../../src/presentation/components/features/turno/ModalAbrirTurno';
import { ModalEntradas } from '../../src/presentation/components/features/turno/ModalEntradas';
import { ModalSalidasFamiliares } from '../../src/presentation/components/features/turno/ModalSalidasFamiliares';
import { ModalCambiosPrecio } from '../../src/presentation/components/features/turno/ModalCambiosPrecio';
import { ModalMermas } from '../../src/presentation/components/features/turno/ModalMermas';
import { ModalInventarioInicial } from '../../src/presentation/components/features/turno/ModalInventarioInicial';
import { ModalConfiguracion } from '../../src/presentation/components/features/configuracion/ModalConfiguracion';
import { Radius, Spacing, Typography } from '../../src/constants/theme';

type ModalActivo =
  | 'ninguno'
  | 'alerta'
  | 'abrirTurno'
  | 'editarDias'
  | 'inventarioInicial'
  | 'entradas'
  | 'salidas'
  | 'cambios'
  | 'mermas'
  | 'configuracion';

export default function InicioScreen() {
  const { C, accentLine } = useTheme();
  const toast = useToast();
  const { turno, cargando, abrirTurno, cerrarTurno, actualizarDias } = useTurno();
  const { productos } = useProductos();
  const {
    entradas, salidasFamiliares, cambiosPrecio, mermas,
    crearEntrada, actualizarEntrada, eliminarEntrada,
    crearSalidaFamiliar, actualizarSalidaFamiliar, eliminarSalidaFamiliar,
    crearCambioPrecio, actualizarCambioPrecio, eliminarCambioPrecio,
    crearMerma, actualizarMerma, eliminarMerma,
  } = useMovimientos(turno?.id ?? null);

  const [modalActivo, setModalActivo] = useState<ModalActivo>('ninguno');
  const cerrar = () => setModalActivo('ninguno');
  const turnoAbierto = turno?.estado === 'abierto';

  // ── Apertura ──────────────────────────────────────────────
  const handleSolicitarApertura = () => setModalActivo('alerta');
  const handleAlertaContinuar = () => setModalActivo('abrirTurno');
  const handleAlertaIrInventario = () => { cerrar(); router.push('/(tabs)/inventario'); };

  const handleConfirmarApertura = async (dias: number) => {
    try {
      await abrirTurno(dias);
      toast.exito('Turno abierto', `Turno de ${dias} ${dias === 1 ? 'día' : 'días'} iniciado`);
    } catch {
      toast.error('Error', 'No se pudo abrir el turno');
    }
  };

  // ── Cierre ────────────────────────────────────────────────
  const handleCerrarTurno = () => {
    Alert.alert(
      'Cerrar turno',
      '¿Estás seguro? Los movimientos se guardarán en el historial y se limpiarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar turno',
          style: 'destructive',
          onPress: async () => {
            try {
              await cerrarTurno();
              toast.exito('Turno cerrado', 'El turno fue cerrado y guardado en el historial');
            } catch {
              toast.error('Error', 'No se pudo cerrar el turno');
            }
          },
        },
      ]
    );
  };

  // ── Editar días ───────────────────────────────────────────
  const handleConfirmarEditarDias = async (dias: number) => {
    try {
      await actualizarDias(dias);
      toast.exito('Duración actualizada', `Turno actualizado a ${dias} ${dias === 1 ? 'día' : 'días'}`);
    } catch {
      toast.error('Error', 'No se pudo actualizar la duración');
    }
  };

  // ── Movimientos ───────────────────────────────────────────
  const handleCrearEntrada = async (input: Parameters<typeof crearEntrada>[0]) => {
    await crearEntrada(input);
    toast.exito('Entrada registrada', `${input.producto_nombre} agregado`);
  };

  const handleCrearSalida = async (input: Parameters<typeof crearSalidaFamiliar>[0]) => {
    await crearSalidaFamiliar(input);
    toast.exito('Salida registrada', `${input.producto_nombre} — ${input.quien_sustrajo}`);
  };

  const handleCrearCambio = async (input: Parameters<typeof crearCambioPrecio>[0]) => {
    await crearCambioPrecio(input);
    toast.exito('Cambio registrado', `Precio de ${input.producto_nombre} actualizado`);
  };

  const handleCrearMerma = async (input: Parameters<typeof crearMerma>[0]) => {
    await crearMerma(input);
    toast.exito('Merma registrada', `${input.producto_nombre} — ${input.tipo}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.titulo, { color: C.textPrimary }]}>Digital/Mind</Text>
            <View style={[accentLine, { backgroundColor: C.accent }]} />
            <Text style={[styles.subtitulo, { color: C.textSecondary }]}>Control de turno</Text>
          </View>
          {/* Botón configuración */}
          <TouchableOpacity
            style={[styles.botonConfig, { backgroundColor: C.bgSurface, borderColor: C.border }]}
            onPress={() => setModalActivo('configuracion')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Indicador de turno ── */}
        {!cargando && (
          <IndicadorTurno
            turno={turno}
            onAbrir={handleSolicitarApertura}
            onCerrar={handleCerrarTurno}
            onEditarDias={() => setModalActivo('editarDias')}
          />
        )}

        {/* ── Botón inventario inicial ── */}
        {turnoAbierto && turno && (
          <TouchableOpacity
            style={[styles.botonInventarioInicial, {
              backgroundColor: `${C.accent}0A`,
              borderColor: `${C.accent}30`,
            }]}
            onPress={() => setModalActivo('inventarioInicial')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={C.accent} />
            <View style={styles.botonInventarioTextos}>
              <Text style={[styles.botonInventarioLabel, { color: C.accent }]}>
                Inventario inicial del turno
              </Text>
              <Text style={[styles.botonInventarioSub, { color: C.textSecondary }]}>
                Ver con qué productos comenzó este turno
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        )}

        {/* ── Botones de movimientos ── */}
        {turnoAbierto && turno && (
          <BotonesMovimientos
            contadorEntradas={entradas.length}
            contadorSalidas={salidasFamiliares.length}
            contadorCambios={cambiosPrecio.length}
            contadorMermas={mermas.length}
            onEntradas={() => setModalActivo('entradas')}
            onSalidas={() => setModalActivo('salidas')}
            onCambiosPrecio={() => setModalActivo('cambios')}
            onMermas={() => setModalActivo('mermas')}
          />
        )}

        {/* ── Mensaje sin turno ── */}
        {!cargando && !turnoAbierto && (
          <View style={[styles.sinTurno, { backgroundColor: C.bgSurface, borderColor: C.border }]}>
            <Text style={[styles.sinTurnoTexto, { color: C.textSecondary }]}>
              Abre un turno para comenzar a registrar entradas, salidas, cambios de precio y mermas.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Modales ── */}
      <AlertaInventario
        visible={modalActivo === 'alerta'}
        onRevisarInventario={handleAlertaIrInventario}
        onContinuar={handleAlertaContinuar}
      />
      <ModalAbrirTurno
        visible={modalActivo === 'abrirTurno'}
        onClose={cerrar}
        onConfirmar={handleConfirmarApertura}
      />
      <ModalAbrirTurno
        visible={modalActivo === 'editarDias'}
        onClose={cerrar}
        onConfirmar={handleConfirmarEditarDias}
        diasActuales={turno?.dias_duracion ?? 1}
        modoEdicion
      />
      <ModalConfiguracion
        visible={modalActivo === 'configuracion'}
        onClose={cerrar}
      />

      {turno && (
        <>
          <ModalInventarioInicial
            visible={modalActivo === 'inventarioInicial'}
            onClose={cerrar}
            turnoId={turno.id}
            fechaApertura={turno.fecha_apertura}
          />
          <ModalEntradas
            visible={modalActivo === 'entradas'}
            onClose={cerrar}
            turnoId={turno.id}
            productos={productos}
            entradas={entradas}
            onCrear={handleCrearEntrada}
            onActualizar={async (id, cantidad, notas) => {
              await actualizarEntrada(id, cantidad, notas);
              toast.info('Entrada actualizada', 'Los datos fueron actualizados');
            }}
            onEliminar={async (id) => {
              await eliminarEntrada(id);
              toast.advertencia('Entrada eliminada', '');
            }}
          />
          <ModalSalidasFamiliares
            visible={modalActivo === 'salidas'}
            onClose={cerrar}
            turnoId={turno.id}
            productos={productos}
            salidas={salidasFamiliares}
            onCrear={handleCrearSalida}
            onActualizar={async (id, cantidad, quien, notas) => {
              await actualizarSalidaFamiliar(id, cantidad, quien, notas);
              toast.info('Salida actualizada', 'Los datos fueron actualizados');
            }}
            onEliminar={async (id) => {
              await eliminarSalidaFamiliar(id);
              toast.advertencia('Salida eliminada', '');
            }}
          />
          <ModalCambiosPrecio
            visible={modalActivo === 'cambios'}
            onClose={cerrar}
            turnoId={turno.id}
            productos={productos}
            cambios={cambiosPrecio}
            onCrear={handleCrearCambio}
            onActualizar={async (id, precioNuevo, cantidad, notas) => {
              await actualizarCambioPrecio(id, precioNuevo, cantidad, notas);
              toast.info('Cambio actualizado', 'Los datos fueron actualizados');
            }}
            onEliminar={async (id) => {
              await eliminarCambioPrecio(id);
              toast.advertencia('Cambio eliminado', '');
            }}
          />
          <ModalMermas
            visible={modalActivo === 'mermas'}
            onClose={cerrar}
            turnoId={turno.id}
            productos={productos}
            mermas={mermas}
            onCrear={handleCrearMerma}
            onActualizar={async (id, cantidad, tipo, notas) => {
              await actualizarMerma(id, cantidad, tipo, notas);
              toast.info('Merma actualizada', 'Los datos fueron actualizados');
            }}
            onEliminar={async (id) => {
              await eliminarMerma(id);
              toast.advertencia('Merma eliminada', '');
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing.xxxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  titulo: {
    fontFamily: Typography.fontFamilyExtraBold,
    fontSize: Typography.size.display,
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  botonConfig: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  botonInventarioInicial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  botonInventarioTextos: { flex: 1 },
  botonInventarioLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  botonInventarioSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  sinTurno: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  sinTurnoTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});