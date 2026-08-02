// src/presentation/components/features/configuracion/ModalConfiguracion.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal } from '../../ui/Modal';
import { ModalConfirmacion } from '../../ui/ModalConfirmacion';
import { useTheme } from '../../../hooks/useTheme';
import { Spacing, Radius, Typography } from '../../../../constants/theme';
import { useProductosStore } from '../../../stores/productosStore';
import {
  exportarProductos,
  guardarEnMemoria,
  seleccionarArchivoImportacion,
  importarProductos,
  ArchivoProductos,
  ModoImportacion,
} from '../../../../domain/usecases/exportarImportarProductos';

interface ModalConfiguracionProps {
  visible: boolean;
  onClose: () => void;
}

type FaseImportacion =
  | 'idle'
  | 'leyendo'
  | 'confirmando'
  | 'importando'
  | 'resultado';

interface DatosImportacion {
  archivo: ArchivoProductos;
  modo: ModoImportacion;
}

export function ModalConfiguracion({ visible, onClose }: ModalConfiguracionProps) {
  const { C, toggleModo, esOscuro } = useTheme();
  const marcarActualizado = useProductosStore((s) => s.marcarActualizado);

  // ── Estado exportación / guardar ──
  const [exportando, setExportando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // ── Estado importación ──
  const [faseImportacion, setFaseImportacion] = useState<FaseImportacion>('idle');
  const [datosImportacion, setDatosImportacion] = useState<DatosImportacion | null>(null);
  const [resultadoTexto, setResultadoTexto] = useState<string | null>(null);
  const [modalModoVisible, setModalModoVisible] = useState(false);
  const [modalReemplazarVisible, setModalReemplazarVisible] = useState(false);

  // ── Banners ──
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const limpiarMensajes = () => {
    setMensajeExito(null);
    setMensajeError(null);
  };

  // ── EXPORTAR: compartir por WhatsApp, Zapya, Bluetooth ───────────────────

  const handleExportar = async () => {
    limpiarMensajes();
    setExportando(true);
    try {
      await exportarProductos();
      // No mostramos banner de éxito — el sheet nativo del SO es la confirmación visual
    } catch (e: any) {
      if (e?.message !== 'CANCELADO') {
        setMensajeError(e?.message ?? 'No se pudo exportar. Intenta de nuevo.');
      }
    } finally {
      setExportando(false);
    }
  };

  // ── GUARDAR EN MEMORIA: el usuario elige la carpeta ──────────────────────

  const handleGuardarEnMemoria = async () => {
    limpiarMensajes();
    setGuardando(true);
    try {
      const carpeta = await guardarEnMemoria();
      setMensajeExito(`Archivo guardado en: ${carpeta}`);
    } catch (e: any) {
      if (e?.message !== 'CANCELADO') {
        setMensajeError(e?.message ?? 'No se pudo guardar el archivo.');
      }
    } finally {
      setGuardando(false);
    }
  };

  // ── IMPORTAR — Fase 1: seleccionar archivo ────────────────────────────────

  const handleSeleccionarArchivo = async () => {
    limpiarMensajes();
    setFaseImportacion('leyendo');
    try {
      const archivo = await seleccionarArchivoImportacion();
      setDatosImportacion({ archivo, modo: 'añadir' });
      setFaseImportacion('confirmando');
      setModalModoVisible(true);
    } catch (e: any) {
      setFaseImportacion('idle');
      if (e?.message !== 'CANCELADO') {
        setMensajeError(e?.message ?? 'No se pudo leer el archivo.');
      }
    }
  };

  // ── IMPORTAR — Fase 2a: Añadir ────────────────────────────────────────────

  const handleConfirmarAñadir = () => {
    setModalModoVisible(false);
    if (!datosImportacion) return;
    ejecutarImportacion({ ...datosImportacion, modo: 'añadir' });
  };

  // ── IMPORTAR — Fase 2b: Reemplazar (pide segunda confirmación) ────────────

  const handleSolicitarReemplazar = () => {
    setModalModoVisible(false);
    setModalReemplazarVisible(true);
  };

  const handleConfirmarReemplazar = () => {
    setModalReemplazarVisible(false);
    if (!datosImportacion) return;
    ejecutarImportacion({ ...datosImportacion, modo: 'reemplazar' });
  };

  // ── IMPORTAR — Fase 3: Ejecutar inserción en SQLite ───────────────────────

  const ejecutarImportacion = async (datos: DatosImportacion) => {
    setFaseImportacion('importando');
    try {
      const resultado = await importarProductos(datos.archivo, datos.modo);
      marcarActualizado();

      const accion = datos.modo === 'reemplazar' ? 'reemplazados' : 'añadidos';
      let texto = `✓ ${resultado.importados} productos ${accion} correctamente.`;
      if (resultado.omitidos > 0) {
        texto += ` ${resultado.omitidos} omitidos por datos inválidos.`;
      }
      setResultadoTexto(texto);
      setFaseImportacion('resultado');
    } catch (e: any) {
      setFaseImportacion('idle');
      setMensajeError(e?.message ?? 'Error al importar. Intenta de nuevo.');
    }
  };

  const resetImportacion = () => {
    setFaseImportacion('idle');
    setDatosImportacion(null);
    setResultadoTexto(null);
  };

  const importando = faseImportacion === 'leyendo' || faseImportacion === 'importando';
  const totalImportar = datosImportacion?.archivo.total ?? 0;
  const algunaOperacion = exportando || guardando || importando;

  return (
    <>
      <Modal visible={visible} title="Configuración" onClose={onClose} scrollable>

        {/* ── Apariencia ─────────────────────────────────────────────── */}
        <Text style={[estilos.seccionLabel, { color: C.textSecondary }]}>
          Apariencia
        </Text>

        <View style={[estilos.opcionCard, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
          <View style={estilos.opcionFila}>
            <View style={estilos.opcionIcono}>
              <MaterialCommunityIcons
                name={esOscuro ? 'moon-waning-crescent' : 'white-balance-sunny'}
                size={22}
                color={C.accent}
              />
            </View>
            <View style={estilos.opcionTextos}>
              <Text style={[estilos.opcionTitulo, { color: C.textPrimary }]}>
                {esOscuro ? 'Modo oscuro' : 'Modo claro'}
              </Text>
              <Text style={[estilos.opcionDescripcion, { color: C.textSecondary }]}>
                {esOscuro
                  ? 'Interfaz oscura para ambientes con poca luz'
                  : 'Interfaz clara para ambientes iluminados'}
              </Text>
            </View>
            <Switch
              value={esOscuro}
              onValueChange={toggleModo}
              trackColor={{ false: C.border, true: `${C.accent}60` }}
              thumbColor={esOscuro ? C.accent : C.textDisabled}
            />
          </View>

          <View style={[estilos.previews, { borderTopColor: C.divider }]}>
            <TouchableOpacity
              style={[
                estilos.previewItem,
                { backgroundColor: '#0D0D0F', borderColor: !esOscuro ? C.border : C.accent },
                !esOscuro && estilos.previewInactivo,
              ]}
              onPress={() => { if (!esOscuro) toggleModo(); }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="moon-waning-crescent" size={18} color={esOscuro ? '#4F8EF7' : '#555'} />
              <Text style={[estilos.previewLabel, { color: esOscuro ? '#F0F0F5' : '#888' }]}>Oscuro</Text>
              {esOscuro && <MaterialCommunityIcons name="check-circle" size={14} color="#4F8EF7" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.previewItem,
                { backgroundColor: '#F4F4F8', borderColor: esOscuro ? C.border : '#2E6EE1' },
                esOscuro && estilos.previewInactivo,
              ]}
              onPress={() => { if (esOscuro) toggleModo(); }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="white-balance-sunny" size={18} color={!esOscuro ? '#2E6EE1' : '#aaa'} />
              <Text style={[estilos.previewLabel, { color: !esOscuro ? '#12121A' : '#aaa' }]}>Claro</Text>
              {!esOscuro && <MaterialCommunityIcons name="check-circle" size={14} color="#2E6EE1" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Exportar ───────────────────────────────────────────────── */}
        <Text style={[estilos.seccionLabel, { color: C.textSecondary, marginTop: Spacing.lg }]}>
          Exportar productos
        </Text>

        <View style={[estilos.opcionCard, { backgroundColor: C.bgElevated, borderColor: C.border }]}>

          {/* Compartir por app */}
          <TouchableOpacity
            style={[estilos.accionFila, { borderBottomWidth: 1, borderBottomColor: C.divider }]}
            onPress={handleExportar}
            disabled={algunaOperacion}
            activeOpacity={0.75}
          >
            <View style={[estilos.accionIcono, { backgroundColor: `${C.accentSuccess}15` }]}>
              {exportando
                ? <ActivityIndicator size="small" color={C.accentSuccess} />
                : <MaterialCommunityIcons name="whatsapp" size={20} color={C.accentSuccess} />
              }
            </View>
            <View style={estilos.opcionTextos}>
              <Text style={[estilos.opcionTitulo, { color: C.textPrimary }]}>
                Compartir archivo
              </Text>
              <Text style={[estilos.opcionDescripcion, { color: C.textSecondary }]}>
                {exportando ? 'Preparando...' : 'WhatsApp, Zapya, Bluetooth y otras apps'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.textDisabled} />
          </TouchableOpacity>

          {/* Guardar en memoria interna */}
          <TouchableOpacity
            style={estilos.accionFila}
            onPress={handleGuardarEnMemoria}
            disabled={algunaOperacion}
            activeOpacity={0.75}
          >
            <View style={[estilos.accionIcono, { backgroundColor: `${C.accent}15` }]}>
              {guardando
                ? <ActivityIndicator size="small" color={C.accent} />
                : <MaterialCommunityIcons name="folder-download-outline" size={20} color={C.accent} />
              }
            </View>
            <View style={estilos.opcionTextos}>
              <Text style={[estilos.opcionTitulo, { color: C.textPrimary }]}>
                Guardar en el teléfono
              </Text>
              <Text style={[estilos.opcionDescripcion, { color: C.textSecondary }]}>
                {guardando ? 'Guardando...' : 'Elige la carpeta de destino (Descargas, Documentos, etc.)'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.textDisabled} />
          </TouchableOpacity>
        </View>

        {/* ── Banner éxito/error de exportación ──────────────────────── */}
        {mensajeExito && (
          <View style={[estilos.banner, { backgroundColor: `${C.accentSuccess}15`, borderColor: `${C.accentSuccess}40` }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color={C.accentSuccess} />
            <Text style={[estilos.bannerTexto, { color: C.accentSuccess }]}>{mensajeExito}</Text>
          </View>
        )}
        {mensajeError && (
          <View style={[estilos.banner, { backgroundColor: `${C.accentDanger}15`, borderColor: `${C.accentDanger}40` }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={C.accentDanger} />
            <Text style={[estilos.bannerTexto, { color: C.accentDanger }]}>{mensajeError}</Text>
          </View>
        )}

        {/* ── Importar ───────────────────────────────────────────────── */}
        <Text style={[estilos.seccionLabel, { color: C.textSecondary, marginTop: Spacing.lg }]}>
          Importar productos
        </Text>

        <View style={[estilos.opcionCard, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
          <TouchableOpacity
            style={estilos.accionFila}
            onPress={faseImportacion === 'resultado' ? resetImportacion : handleSeleccionarArchivo}
            disabled={algunaOperacion && faseImportacion !== 'resultado'}
            activeOpacity={0.75}
          >
            <View style={[estilos.accionIcono, { backgroundColor: `${C.accentWarning}15` }]}>
              {importando
                ? <ActivityIndicator size="small" color={C.accentWarning} />
                : <MaterialCommunityIcons name="import" size={20} color={C.accentWarning} />
              }
            </View>
            <View style={estilos.opcionTextos}>
              <Text style={[estilos.opcionTitulo, { color: C.textPrimary }]}>
                Cargar desde archivo
              </Text>
              <Text style={[estilos.opcionDescripcion, { color: C.textSecondary }]}>
                {faseImportacion === 'leyendo' && 'Leyendo archivo...'}
                {faseImportacion === 'importando' && `Importando ${totalImportar} productos...`}
                {faseImportacion === 'resultado' && resultadoTexto}
                {faseImportacion === 'idle' && 'Selecciona un archivo digitalmind-productos.json'}
                {faseImportacion === 'confirmando' && 'Selecciona cómo importar...'}
              </Text>
            </View>
            {faseImportacion === 'resultado'
              ? <MaterialCommunityIcons name="refresh" size={18} color={C.textDisabled} />
              : <MaterialCommunityIcons name="chevron-right" size={18} color={C.textDisabled} />
            }
          </TouchableOpacity>
        </View>

        {/* ── Info de la app ─────────────────────────────────────────── */}
        <Text style={[estilos.seccionLabel, { color: C.textSecondary, marginTop: Spacing.lg }]}>
          Información
        </Text>

        <View style={[estilos.opcionCard, { backgroundColor: C.bgElevated, borderColor: C.border }]}>
          <InfoFila icono="application-outline" label="Aplicación" valor="Digital/Mind" color={C} />
          <InfoFila icono="tag-outline" label="Versión" valor="1.0.0" color={C} />
          <InfoFila icono="code-tags" label="Desarrollador" valor="@yerald.dev" color={C} ultimo />
        </View>

      </Modal>

      {/* ── Modal: elegir modo de importación ──────────────────────────── */}
      <ModalConfirmacion
        visible={modalModoVisible}
        titulo={`Importar ${totalImportar} productos`}
        mensaje={`¿Cómo quieres importar los productos del archivo?\n\n• Añadir — conserva los productos actuales y agrega los nuevos.\n• Reemplazar — elimina todos los productos actuales y carga los del archivo.`}
        labelConfirmar="Añadir a los actuales"
        labelCancelar="Reemplazar todo"
        variante="warning"
        onConfirmar={handleConfirmarAñadir}
        onCancelar={handleSolicitarReemplazar}
      />

      {/* ── Modal: confirmar reemplazo destructivo ──────────────────────── */}
      <ModalConfirmacion
        visible={modalReemplazarVisible}
        titulo="¿Reemplazar todos los productos?"
        mensaje={`Esto eliminará permanentemente todos los productos actuales y los reemplazará con los ${totalImportar} del archivo. Esta acción no se puede deshacer.`}
        labelConfirmar="Sí, reemplazar todo"
        labelCancelar="Cancelar"
        variante="danger"
        onConfirmar={handleConfirmarReemplazar}
        onCancelar={() => {
          setModalReemplazarVisible(false);
          resetImportacion();
        }}
      />
    </>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function InfoFila({
  icono, label, valor, color, ultimo,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  valor: string;
  color: any;
  ultimo?: boolean;
}) {
  return (
    <View style={[
      estilos.infoFila,
      !ultimo && { borderBottomWidth: 1, borderBottomColor: color.divider },
    ]}>
      <MaterialCommunityIcons name={icono} size={16} color={color.textSecondary} />
      <Text style={[estilos.infoLabel, { color: color.textSecondary }]}>{label}</Text>
      <Text style={[estilos.infoValor, { color: color.textPrimary }]}>{valor}</Text>
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  seccionLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  opcionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  opcionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  accionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  opcionIcono: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(79,142,247,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accionIcono: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionTextos: { flex: 1 },
  opcionTitulo: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  opcionDescripcion: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  previews: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  previewItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 2,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  previewInactivo: { opacity: 0.5 },
  previewLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  bannerTexto: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    flex: 1,
    lineHeight: 18,
  },
  infoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  infoLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  infoValor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
});