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

// Extensión .dmind — exclusiva de Digital/Mind, evita conflictos con otros JSON
const NOMBRE_ARCHIVO = 'digitalmind-productos.dmind';
const VERSION_FORMATO = 1;

// ── Helper: generar y escribir el archivo en caché ─────────────────────────

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

  const file = new File(Paths.cache, NOMBRE_ARCHIVO);
  if (file.exists) file.delete();
  file.create();
  file.write(contenido);

  return { file, contenido, total: productos.length };
}

// ── EXPORTAR: compartir por WhatsApp, Zapya, Bluetooth ────────────────────

export async function exportarProductos(): Promise<void> {
  const { file, total } = await generarArchivoEnCache();

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('El sistema no soporta compartir archivos en este dispositivo.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.digitalmind',
    dialogTitle: `Exportar ${total} productos — Digital/Mind`,
    UTI: 'com.yerald.digitalmind.productos',
  });
}

// ── GUARDAR EN MEMORIA: el usuario elige la carpeta ───────────────────────

export async function guardarEnMemoria(): Promise<string> {
  const { contenido } = await generarArchivoEnCache();

  const permisos = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permisos.granted) {
    throw new Error('CANCELADO');
  }

  const uriDestino = await StorageAccessFramework.createFileAsync(
    permisos.directoryUri,
    NOMBRE_ARCHIVO,
    'application/vnd.digitalmind'
  );

  const base64 = btoa(unescape(encodeURIComponent(contenido)));
  await StorageAccessFramework.writeAsStringAsync(uriDestino, base64, {
    encoding: 'base64' as any,
  });

  try {
    const partes = decodeURIComponent(permisos.directoryUri).split(':');
    const carpeta = partes[partes.length - 1] || 'la carpeta seleccionada';
    return carpeta.replace(/\//g, ' › ');
  } catch {
    return 'la carpeta seleccionada';
  }
}

// ── PARSEAR: leer y validar un archivo desde cualquier URI ────────────────
// Usado por el intent handler en _layout.tsx cuando el usuario abre un .dmind
// desde WhatsApp, Zapya, Bluetooth, explorador de archivos, etc.

export async function parsearArchivoImportacion(uri: string): Promise<ArchivoProductos> {
  let contenido: string;

  try {
    const file = new File(uri);
    if (!file.exists) {
      throw new Error('No se pudo acceder al archivo.');
    }
    contenido = file.textSync();
  } catch {
    // Algunos proveedores de contenido (content://) no funcionan con la nueva API
    // Fallback: leer con legacy readAsStringAsync
    try {
      const { readAsStringAsync } = await import('expo-file-system/legacy');
      contenido = await readAsStringAsync(uri);
    } catch {
      throw new Error('No se pudo leer el archivo. Intenta guardarlo primero y abrirlo desde el almacenamiento.');
    }
  }

  return validarContenidoJSON(contenido);
}

// ── SELECCIONAR: abrir el explorador de archivos manualmente ──────────────

export async function seleccionarArchivoImportacion(): Promise<ArchivoProductos> {
  const resultado = await DocumentPicker.getDocumentAsync({
    // Aceptar tanto .dmind como .json para compatibilidad con versiones anteriores
    type: ['application/vnd.digitalmind', 'application/json', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
    throw new Error('CANCELADO');
  }

  const asset = resultado.assets[0];
  return await parsearArchivoImportacion(asset.uri);
}

// ── VALIDAR: parsear y validar el contenido JSON ──────────────────────────

function validarContenidoJSON(contenido: string): ArchivoProductos {
  let datos: any;
  try {
    datos = JSON.parse(contenido);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  if (!datos || typeof datos !== 'object') {
    throw new Error('Formato de archivo inválido.');
  }
  if (datos.app !== 'Digital/Mind') {
    // No es un archivo de Digital/Mind — ignorar silenciosamente
    throw new Error('NO_ES_DIGITALMIND');
  }
  if (!Array.isArray(datos.productos) || datos.productos.length === 0) {
    throw new Error('El archivo no contiene productos.');
  }

  return datos as ArchivoProductos;
}

// ── IMPORTAR: insertar productos en SQLite ────────────────────────────────

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