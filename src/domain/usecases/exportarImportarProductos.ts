// src/domain/usecases/exportarImportarProductos.ts
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../../data/database/db';

// ── Tipos ──────────────────────────────────────────────────────────────────

export type ModoImportacion = 'reemplazar' | 'añadir';

export interface ArchivoProductos {
  app: string;
  version: number;
  exportado_en: string;
  total: number;
  productos: ProductoExportado[];
}

interface ProductoExportado {
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  cantidad: number;
  orden: number;
}

export interface ResultadoImportacion {
  total: number;
  importados: number;
  omitidos: number;
  errores: string[];
}

// ── Constantes ─────────────────────────────────────────────────────────────

const NOMBRE_ARCHIVO = 'digitalmind-productos.json';
const VERSION_FORMATO = 1;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Genera el JSON del catálogo y lo escribe en caché. Retorna el File. */
async function generarArchivoEnCache(): Promise<{ file: File; contenido: string; total: number }> {
  const db = getDatabase();

  const productos = await db.getAllAsync<{
    nombre: string;
    precio_costo: number;
    precio_venta: number;
    cantidad: number;
    orden: number;
  }>('SELECT nombre, precio_costo, precio_venta, cantidad, orden FROM productos ORDER BY orden ASC, id ASC');

  if (productos.length === 0) {
    throw new Error('No hay productos para exportar. Añade productos en la pantalla de Inventario primero.');
  }

  const exportados: ProductoExportado[] = productos.map((p, index) => ({
    nombre: p.nombre,
    precio_costo: p.precio_costo,
    precio_venta: p.precio_venta,
    cantidad: p.cantidad,
    orden: index,
  }));

  const archivo: ArchivoProductos = {
    app: 'Digital/Mind',
    version: VERSION_FORMATO,
    exportado_en: new Date().toISOString(),
    total: exportados.length,
    productos: exportados,
  };

  const contenido = JSON.stringify(archivo, null, 2);

  // Escribir en caché del dispositivo
  const file = new File(Paths.cache, NOMBRE_ARCHIVO);
  if (file.exists) file.delete();
  file.create();
  file.write(contenido);

  return { file, contenido, total: productos.length };
}

// ── EXPORTAR: Compartir por WhatsApp, Zapya, Bluetooth, etc. ──────────────

export async function exportarProductos(): Promise<void> {
  const { file, total } = await generarArchivoEnCache();

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('El sistema no soporta compartir archivos en este dispositivo.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: `Exportar ${total} productos — Digital/Mind`,
    UTI: 'public.json',
  });
}

// ── GUARDAR EN MEMORIA: el usuario elige la carpeta (Descargas, etc.) ──────

export async function guardarEnMemoria(): Promise<string> {
  // 1. Generar el archivo en caché
  const { contenido } = await generarArchivoEnCache();

  // 2. Pedir al usuario que elija la carpeta de destino
  //    El picker abrirá el explorador de Android (Descargas, Documentos, etc.)
  const permisos = await StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permisos.granted) {
    throw new Error('CANCELADO');
  }

  // 3. Crear el archivo en la carpeta elegida por el usuario
  const uriDestino = await StorageAccessFramework.createFileAsync(
    permisos.directoryUri,
    NOMBRE_ARCHIVO,
    'application/json'
  );

  // 4. Escribir el contenido en base64 (requerido por SAF)
  //    Convertir el string JSON a base64 manualmente
  const base64 = btoa(unescape(encodeURIComponent(contenido)));
  await StorageAccessFramework.writeAsStringAsync(uriDestino, base64, {
    encoding: 'base64' as any,
  });

  // Retornar el nombre de la carpeta elegida para mostrarlo en el toast
  // El directoryUri tiene formato content://...%3A<carpeta>
  try {
    const partes = decodeURIComponent(permisos.directoryUri).split(':');
    const carpeta = partes[partes.length - 1] || 'la carpeta seleccionada';
    return carpeta.replace(/\//g, ' › ');
  } catch {
    return 'la carpeta seleccionada';
  }
}

// ── IMPORTAR — Fase 1: seleccionar archivo ────────────────────────────────

export async function seleccionarArchivoImportacion(): Promise<ArchivoProductos> {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
    throw new Error('CANCELADO');
  }

  const asset = resultado.assets[0];

  // Leer el contenido usando la nueva API de SDK 54
  const file = new File(asset.uri);
  if (!file.exists) {
    throw new Error('No se pudo acceder al archivo seleccionado.');
  }

  const contenido = file.textSync();

  // Parsear JSON
  let datos: any;
  try {
    datos = JSON.parse(contenido);
  } catch {
    throw new Error('El archivo seleccionado no es un JSON válido. Asegúrate de exportar desde Digital/Mind.');
  }

  // Validar estructura
  if (!datos || typeof datos !== 'object') {
    throw new Error('Formato de archivo inválido.');
  }
  if (datos.app !== 'Digital/Mind') {
    throw new Error('Este archivo no fue exportado por Digital/Mind.');
  }
  if (!Array.isArray(datos.productos)) {
    throw new Error('El archivo no contiene una lista de productos válida.');
  }
  if (datos.productos.length === 0) {
    throw new Error('El archivo no contiene ningún producto.');
  }

  return datos as ArchivoProductos;
}

// ── IMPORTAR — Fase 2: insertar en SQLite ─────────────────────────────────

export async function importarProductos(
  datos: ArchivoProductos,
  modo: ModoImportacion
): Promise<ResultadoImportacion> {
  const db = getDatabase();
  const resultado: ResultadoImportacion = {
    total: datos.productos.length,
    importados: 0,
    omitidos: 0,
    errores: [],
  };

  await db.withTransactionAsync(async () => {
    if (modo === 'reemplazar') {
      await db.runAsync('DELETE FROM productos');
    }

    let ordenBase = 0;
    if (modo === 'añadir') {
      const maxOrden = await db.getFirstAsync<{ max_orden: number | null }>(
        'SELECT MAX(orden) as max_orden FROM productos'
      );
      ordenBase = (maxOrden?.max_orden ?? -1) + 1;
    }

    for (let i = 0; i < datos.productos.length; i++) {
      const p = datos.productos[i];

      const nombre = typeof p.nombre === 'string' ? p.nombre.trim() : '';
      const precio_costo = Number(p.precio_costo);
      const precio_venta = Number(p.precio_venta);
      const cantidad = Number(p.cantidad);

      if (!nombre) {
        resultado.omitidos++;
        resultado.errores.push(`Producto #${i + 1}: nombre vacío, omitido.`);
        continue;
      }
      if (isNaN(precio_costo) || precio_costo < 0) {
        resultado.omitidos++;
        resultado.errores.push(`"${nombre}": precio de costo inválido, omitido.`);
        continue;
      }
      if (isNaN(precio_venta) || precio_venta < 0) {
        resultado.omitidos++;
        resultado.errores.push(`"${nombre}": precio de venta inválido, omitido.`);
        continue;
      }
      if (isNaN(cantidad) || cantidad < 0) {
        resultado.omitidos++;
        resultado.errores.push(`"${nombre}": cantidad inválida, omitido.`);
        continue;
      }

      await db.runAsync(
        `INSERT INTO productos (nombre, precio_costo, precio_venta, cantidad, orden)
         VALUES (?, ?, ?, ?, ?)`,
        [nombre, precio_costo, precio_venta, cantidad, ordenBase + i]
      );

      resultado.importados++;
    }
  });

  return resultado;
}