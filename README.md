# Digital/Mind — Documentación Completa del Proyecto

> Sistema de gestión de turnos y cuadre de caja para negocios locales.
> Desarrollado con React Native + Expo SDK 54, base de datos local SQLite, sin necesidad de internet.

---

## Tabla de contenidos

1. [¿Qué es Digital/Mind?](#1-qué-es-digitalmind)
2. [¿Para quién es esta documentación?](#2-para-quién-es-esta-documentación)
3. [Resumen visual de la aplicación](#3-resumen-visual-de-la-aplicación)
4. [Tecnologías utilizadas](#4-tecnologías-utilizadas)
5. [Arquitectura del proyecto](#5-arquitectura-del-proyecto)
6. [Base de datos — Cómo está organizada la información](#6-base-de-datos--cómo-está-organizada-la-información)
7. [Fase 1 — Setup, tema global y navegación](#7-fase-1--setup-tema-global-y-navegación)
8. [Fase 2 — Base de datos SQLite](#8-fase-2--base-de-datos-sqlite)
9. [Fase 3 — Pantalla de Inventario](#9-fase-3--pantalla-de-inventario)
10. [Fase 4 — Pantalla de Inicio y gestión del turno](#10-fase-4--pantalla-de-inicio-y-gestión-del-turno)
11. [Fase 5 — Cuadre de caja](#11-fase-5--cuadre-de-caja)
12. [Fase 6 — Historial de turnos](#12-fase-6--historial-de-turnos)
13. [Fase 7 — Modo claro/oscuro y configuración](#13-fase-7--modo-clarooscuro-y-configuración)
14. [Lógica pura del cuadre de caja — Explicación detallada](#14-lógica-pura-del-cuadre-de-caja--explicación-detallada)
15. [Sistema de toasts](#15-sistema-de-toasts)
16. [Cómo instalar y correr el proyecto](#16-cómo-instalar-y-correr-el-proyecto)
17. [Guía para escalar el proyecto](#17-guía-para-escalar-el-proyecto)
18. [Glosario de términos técnicos](#18-glosario-de-términos-técnicos)

---

## 1. ¿Qué es Digital/Mind?

Digital/Mind es una aplicación móvil diseñada para negocios pequeños como cafeterías, bodegas o tiendas que necesitan controlar sus turnos de trabajo de forma rápida, precisa y sin errores. Reemplaza el clásico "IPV en papel" (inventario, entradas, salidas, cuadre de caja) con una herramienta digital que calcula todo automáticamente.

### ¿Qué problema resuelve?

En muchos negocios cubanos y latinoamericanos, el control diario de una tienda se hace a mano en papel. Esto genera errores de cálculo, pérdida de registros, y mucho tiempo invertido en sumar y restar manualmente. Digital/Mind digitaliza ese proceso completo.

### ¿Qué puede hacer la aplicación?

- Registrar todos los productos del negocio con sus precios de costo y venta.
- Abrir y cerrar turnos de trabajo de 1 a 6 días.
- Registrar durante el turno: entradas de productos, salidas familiares, cambios de precio y mermas (productos rotos o vencidos).
- Calcular automáticamente el cuadre de caja al final del turno.
- Guardar el historial de todos los turnos cerrados para consultarlos en cualquier momento.
- Calcular los salarios de las trabajadoras y la ganancia neta del dueño.
- Funcionar completamente sin internet, usando una base de datos local en el teléfono.

---

## 2. ¿Para quién es esta documentación?

Esta documentación está escrita en dos niveles al mismo tiempo:

**Para personas sin conocimientos técnicos:** Encontrarán explicaciones en lenguaje cotidiano de qué hace cada parte de la aplicación, por qué se diseñó así y cómo funciona la lógica del negocio.

**Para programadores o futuros desarrolladores:** Encontrarán la arquitectura técnica, los patrones de diseño usados, la estructura de la base de datos, los flujos de datos y una guía completa para escalar o modificar el proyecto.

---

## 3. Resumen visual de la aplicación

La aplicación tiene 4 pantallas principales accesibles desde una barra de navegación inferior:

```
┌─────────────────────────────────────────┐
│           Digital/Mind                   │
│                                          │
│  [Inicio] [Inventario] [Cuadre] [Hist.] │
└─────────────────────────────────────────┘
```

### Pantalla de Inicio
El centro de operaciones. Aquí se abre y cierra el turno, y se registran todos los movimientos del día: entradas, salidas familiares, cambios de precio y mermas.

### Pantalla de Inventario
El catálogo de todos los productos del negocio. Cada producto tiene nombre, precio de costo, precio de venta y cantidad en existencia. Se pueden reordenar arrastrando, buscar en tiempo real y editar con un carrusel para ir producto por producto sin cerrar el formulario.

### Pantalla de Cuadre
Donde se realiza el cierre financiero del turno. El usuario ingresa el inventario final (cuánto quedó de cada producto), el efectivo recaudado por día, las transferencias recibidas y el USD si lo hubo. La app calcula automáticamente si hay sobrante o faltante.

### Pantalla de Historial
Todos los turnos cerrados quedan guardados aquí con su resumen completo. Se pueden consultar en cualquier momento.

---

## 4. Tecnologías utilizadas

### ¿Qué es React Native?
Es un framework (conjunto de herramientas) que permite crear aplicaciones móviles para Android e iOS usando JavaScript/TypeScript. En lugar de escribir código separado para cada sistema operativo, se escribe una sola vez y funciona en ambos.

### ¿Qué es Expo?
Es una plataforma que simplifica el desarrollo con React Native. Provee herramientas para correr la aplicación en el teléfono durante el desarrollo (Expo Go), construir el APK final y acceder a funciones del teléfono como almacenamiento y notificaciones.

### ¿Qué es TypeScript?
Es JavaScript con tipado estático. Esto significa que cuando defines una variable, declaras qué tipo de dato va a contener (número, texto, objeto, etc.). Esto evita muchos errores comunes y hace el código más predecible y fácil de mantener.

### ¿Qué es SQLite?
Es una base de datos que vive directamente en el teléfono, sin necesidad de internet ni de un servidor externo. Todos los datos se guardan en un archivo local en el dispositivo. Es perfecta para aplicaciones offline como Digital/Mind.

### Lista completa de dependencias

| Librería | Versión | Para qué sirve |
|---|---|---|
| `expo` | ~54.0.35 | Plataforma base de desarrollo |
| `expo-router` | ~6.0.24 | Navegación entre pantallas basada en archivos |
| `expo-sqlite` | ~16.0.10 | Base de datos local en el teléfono |
| `zustand` | ^5.0.14 | Estado global de la aplicación |
| `react-hook-form` | ^7.54.0 | Manejo de formularios con validación |
| `zod` | ^3.24.0 | Validación de datos con esquemas |
| `@hookform/resolvers` | ^3.9.0 | Conecta zod con react-hook-form |
| `@expo-google-fonts/inter` | ^0.4.2 | Tipografía Inter para toda la app |
| `@expo/vector-icons` | ^15.0.3 | Iconos MaterialCommunityIcons |
| `react-native-gesture-handler` | recomendada por Expo | Soporte de gestos táctiles |
| `@react-native-async-storage/async-storage` | recomendada por Expo | Guardar preferencias del usuario |
| `react-native-safe-area-context` | ~5.6.0 | Respetar bordes seguros del teléfono |
| `react-native-screens` | ~4.16.0 | Optimización de pantallas nativas |

---

## 5. Arquitectura del proyecto

### ¿Qué es arquitectura en programación?

La arquitectura es la forma en que organizas el código de un proyecto. Así como una casa tiene planos que definen dónde van las habitaciones, la cocina y el baño, el software tiene una arquitectura que define dónde va cada tipo de código.

### La arquitectura de Digital/Mind

El proyecto usa una arquitectura en capas inspirada en **Clean Architecture**. La idea central es que cada capa tiene una responsabilidad específica y no se mezcla con las otras.

```
┌─────────────────────────────────────────────────────┐
│                PRESENTACIÓN (UI)                     │
│  Pantallas, componentes, hooks de presentación       │
│  Lo que el usuario ve y toca                         │
├─────────────────────────────────────────────────────┤
│                  DOMINIO (Lógica)                    │
│  Entidades, casos de uso, cálculos puros             │
│  Las reglas del negocio sin depender de UI ni DB     │
├─────────────────────────────────────────────────────┤
│                    DATOS (DB)                        │
│  Schema, repositorios, instancia de SQLite           │
│  Cómo se guardan y recuperan los datos               │
└─────────────────────────────────────────────────────┘
```

### Estructura de carpetas explicada

```
DigitalMind/
│
├── app/                          # Pantallas (Expo Router)
│   ├── _layout.tsx               # Configuración raíz: fuentes, DB, tema
│   └── (tabs)/                   # Navegación por pestañas
│       ├── _layout.tsx           # Barra de navegación inferior
│       ├── index.tsx             # Pantalla Inicio
│       ├── inventario.tsx        # Pantalla Inventario
│       ├── cuadre.tsx            # Pantalla Cuadre de caja
│       └── historial.tsx         # Pantalla Historial
│
└── src/                          # Todo el código de negocio
    │
    ├── constants/
    │   └── theme.ts              # ← ARCHIVO SAGRADO: todos los colores,
    │                             #   tamaños y espaciados de la app
    │
    ├── domain/                   # CAPA DE DOMINIO (lógica pura)
    │   ├── entities/             # Definición de cada tipo de dato
    │   │   ├── Producto.ts       # Qué es un producto
    │   │   ├── Turno.ts          # Qué es un turno
    │   │   ├── Entrada.ts        # Qué es una entrada de productos
    │   │   ├── SalidaFamiliar.ts # Qué es una salida familiar
    │   │   ├── CambioPrecio.ts   # Qué es un cambio de precio
    │   │   ├── Merma.ts          # Qué es una merma
    │   │   ├── Transferencia.ts  # Qué es una transferencia
    │   │   ├── Gasto.ts          # Qué es un gasto
    │   │   ├── CajaDia.ts        # Qué es la caja de un día
    │   │   ├── RegistroUSD.ts    # Qué es un registro de USD
    │   │   ├── InventarioTurno.ts # Snapshot de inventario
    │   │   └── HistorialTurno.ts # Registro del historial
    │   └── usecases/
    │       └── calcularCuadre.ts # ← La lógica más importante:
    │                             #   calcula el cuadre de caja
    │
    ├── data/                     # CAPA DE DATOS
    │   ├── database/
    │   │   ├── schema.ts         # Definición de todas las tablas
    │   │   └── db.ts             # Conexión única a la base de datos
    │   └── repositories/         # Operaciones de lectura/escritura
    │       ├── ProductoRepository.ts
    │       ├── TurnoRepository.ts
    │       ├── MovimientoRepository.ts
    │       └── HistorialRepository.ts
    │
    ├── presentation/             # CAPA DE PRESENTACIÓN
    │   ├── components/
    │   │   ├── ui/               # Componentes base reutilizables
    │   │   │   ├── Button.tsx
    │   │   │   ├── Card.tsx
    │   │   │   ├── Input.tsx
    │   │   │   ├── Modal.tsx
    │   │   │   ├── Badge.tsx
    │   │   │   ├── Divider.tsx
    │   │   │   ├── SearchBar.tsx
    │   │   │   ├── SelectorProducto.tsx
    │   │   │   └── Toast/        # Sistema de notificaciones
    │   │   └── features/         # Componentes específicos por pantalla
    │   │       ├── turno/
    │   │       ├── inventario/
    │   │       ├── cuadre/
    │   │       ├── historial/
    │   │       └── configuracion/
    │   ├── hooks/                # Lógica de UI reutilizable
    │   │   ├── useTurno.ts
    │   │   ├── useProductos.ts
    │   │   ├── useMovimientos.ts
    │   │   ├── useCuadre.ts
    │   │   ├── useHistorial.ts
    │   │   ├── useInventarioFinal.ts
    │   │   ├── useBusquedaProductos.ts
    │   │   ├── useToast.ts
    │   │   └── useTheme.ts
    │   └── stores/               # Estado global (Zustand)
    │       ├── toastStore.ts
    │       └── temaStore.ts
    │
    └── utils/
        ├── formatters.ts         # Formateo de moneda, fechas, etc.
        └── validators.ts         # Esquemas de validación con Zod
```

---

## 6. Base de datos — Cómo está organizada la información

### ¿Qué es una base de datos relacional?

Imagina una hoja de cálculo de Excel. Cada hoja es una tabla, cada fila es un registro y cada columna es un campo. Una base de datos relacional tiene muchas de estas "hojas" que se pueden relacionar entre sí. Por ejemplo, la tabla de entradas se relaciona con la tabla de productos a través del ID del producto.

### Las 11 tablas de Digital/Mind

#### Tabla `productos`
Almacena el catálogo de productos del negocio.

```
| Campo          | Tipo    | Descripción                              |
|----------------|---------|------------------------------------------|
| id             | INTEGER | Identificador único (se asigna solo)     |
| nombre         | TEXT    | Nombre del producto (ej: "Café")         |
| precio_costo   | REAL    | Cuánto le cuesta al dueño               |
| precio_venta   | REAL    | Cuánto se le cobra al cliente           |
| cantidad       | REAL    | Existencia actual en el inventario       |
| orden          | INTEGER | Posición en la lista (para reordenar)   |
| creado_en      | TEXT    | Fecha y hora de creación                |
| actualizado_en | TEXT    | Fecha y hora de última modificación     |
```

#### Tabla `turnos`
Cada turno de trabajo abierto o cerrado.

```
| Campo          | Tipo    | Descripción                              |
|----------------|---------|------------------------------------------|
| id             | INTEGER | Identificador único                      |
| dias_duracion  | INTEGER | Cuántos días dura (1 a 6)               |
| estado         | TEXT    | "abierto" o "cerrado"                   |
| fecha_apertura | TEXT    | Cuándo se abrió                         |
| fecha_cierre   | TEXT    | Cuándo se cerró (vacío si está abierto) |
```

#### Tabla `inventario_turno`
Fotografía (snapshot) del inventario al abrir y al cerrar un turno.

```
| Campo           | Tipo    | Descripción                             |
|-----------------|---------|-----------------------------------------|
| turno_id        | INTEGER | A qué turno pertenece                   |
| producto_id     | INTEGER | Qué producto es                         |
| producto_nombre | TEXT    | Nombre guardado en el momento           |
| precio_costo    | REAL    | Precio de costo en ese momento          |
| precio_venta    | REAL    | Precio de venta en ese momento          |
| cantidad        | REAL    | Cuántas unidades había                  |
| tipo            | TEXT    | "inicial" o "final"                     |
```

> **¿Por qué guardar el nombre y precio en esta tabla si ya están en productos?**
> Porque los precios pueden cambiar. Si guardas solo el ID del producto, al consultar el historial de hace 3 meses verías los precios actuales, no los que tenía en ese momento. Al guardar una "fotografía" de los datos en ese instante, el historial siempre muestra la realidad de ese día.

#### Tabla `entradas`
Productos que ingresan durante el turno (reposición de inventario).

```
| Campo           | Tipo    | Descripción                             |
|-----------------|---------|-----------------------------------------|
| turno_id        | INTEGER | A qué turno pertenece                   |
| producto_id     | INTEGER | Qué producto entró                      |
| producto_nombre | TEXT    | Nombre en el momento                    |
| cantidad        | REAL    | Cuántas unidades entraron               |
| precio_costo    | REAL    | Precio de costo en ese momento          |
| notas           | TEXT    | Observaciones (opcional)                |
```

> **Nota importante:** Si un mismo producto tiene dos entradas en el mismo turno, el sistema las suma en un solo registro para simplificar los cálculos del cuadre.

#### Tabla `salidas_familiares`
Productos que se retiran del inventario para consumo familiar o personal.

```
| Campo           | Tipo    | Descripción                             |
|-----------------|---------|-----------------------------------------|
| turno_id        | INTEGER | A qué turno pertenece                   |
| producto_id     | INTEGER | Qué producto salió                      |
| cantidad        | REAL    | Cuántas unidades salieron               |
| quien_sustrajo  | TEXT    | Nombre de quien retiró el producto      |
| notas           | TEXT    | Observaciones (opcional)                |
```

#### Tabla `cambios_precio`
Registro de cada vez que se cambia el precio de venta de un producto durante el turno.

```
| Campo              | Tipo    | Descripción                          |
|--------------------|---------|--------------------------------------|
| turno_id           | INTEGER | A qué turno pertenece                |
| producto_id        | INTEGER | Qué producto cambió de precio        |
| precio_anterior    | REAL    | Cuánto costaba antes                 |
| precio_nuevo       | REAL    | Cuánto cuesta ahora                  |
| cantidad_existente | REAL    | Cuántas unidades había en ese momento|
```

> **¿Por qué es crítico el campo `cantidad_existente`?**
> Porque si un producto tuvo dos precios durante el turno, necesitamos saber cuántas unidades se vendieron a cada precio. Si había 10 unidades cuando cambió el precio y al final quedan 2, entonces 8 se vendieron al precio nuevo. Las que se vendieron antes del cambio se calculan por diferencia.

#### Tabla `mermas`
Productos que se dan de baja por estar rotos, vencidos u otras razones.

```
| Campo           | Tipo    | Descripción                             |
|-----------------|---------|-----------------------------------------|
| turno_id        | INTEGER | A qué turno pertenece                   |
| producto_id     | INTEGER | Qué producto se perdió                  |
| cantidad        | REAL    | Cuántas unidades se dieron de baja      |
| tipo            | TEXT    | "roto", "vencido" u "otro"             |
| notas           | TEXT    | Observaciones (opcional)                |
```

#### Tabla `transferencias`
Pagos recibidos de forma digital (transferencia bancaria, MLC, etc.).

```
| Campo    | Tipo    | Descripción                                    |
|----------|---------|------------------------------------------------|
| turno_id | INTEGER | A qué turno pertenece                          |
| monto    | REAL    | Cuánto dinero entró por transferencia          |
| concepto | TEXT    | Descripción del pago (opcional)                |
```

#### Tabla `gastos`
Diferencia entre el precio real de un producto y el precio cobrado a un trabajador. Esta diferencia se descuenta de la caja.

```
| Campo          | Tipo    | Descripción                              |
|----------------|---------|------------------------------------------|
| turno_id       | INTEGER | A qué turno pertenece                    |
| producto_nombre| TEXT    | Qué producto fue                         |
| precio_venta   | REAL    | Precio real de venta                     |
| precio_cobrado | REAL    | Precio que pagó el trabajador            |
| diferencia     | REAL    | precio_venta - precio_cobrado (descuento)|
| cantidad       | REAL    | Cuántas unidades                         |
```

#### Tabla `caja_por_dia`
El efectivo físico contado en caja, separado por cada día del turno.

```
| Campo          | Tipo    | Descripción                              |
|----------------|---------|------------------------------------------|
| turno_id       | INTEGER | A qué turno pertenece                    |
| dia_numero     | INTEGER | Día 1, 2, 3... del turno                |
| monto_efectivo | REAL    | Cuánto efectivo había ese día            |
```

#### Tabla `registros_usd`
Dólares recibidos durante el turno, convertidos a CUP.

```
| Campo          | Tipo    | Descripción                              |
|----------------|---------|------------------------------------------|
| turno_id       | INTEGER | A qué turno pertenece                    |
| cantidad_usd   | REAL    | Cuántos dólares se recibieron            |
| tasa_cambio    | REAL    | A cuánto se cambió cada dólar            |
| equivalente_cup| REAL    | cantidad_usd × tasa_cambio               |
```

#### Tabla `historial_turnos`
Resumen permanente de cada turno cerrado.

```
| Campo               | Tipo    | Descripción                          |
|---------------------|---------|--------------------------------------|
| turno_id            | INTEGER | ID del turno original                |
| fecha_apertura      | TEXT    | Cuándo abrió                         |
| fecha_cierre        | TEXT    | Cuándo cerró                         |
| total_ventas        | REAL    | Total calculado de ventas            |
| total_esperado      | REAL    | Ventas - gastos                      |
| total_real          | REAL    | Efectivo + transferencias + USD      |
| diferencia          | REAL    | Real - esperado                      |
| estado_cuadre       | TEXT    | "exacto", "sobrante" o "faltante"   |
| ganancia_neta       | REAL    | Ganancia neta del dueño              |
| detalle_json        | TEXT    | Todos los datos completos en JSON    |
```

---

## 7. Fase 1 — Setup, tema global y navegación

### ¿Qué se hizo?

Se creó la estructura base del proyecto, se instalaron todas las dependencias necesarias, se definió el sistema visual de la aplicación y se construyó la navegación entre pantallas.

### El archivo sagrado: theme.ts

Este es el archivo más importante de toda la interfaz visual. Contiene **todos** los valores de color, tipografía y espaciado usados en la aplicación. La regla de oro es: ningún componente puede tener un color escrito directamente ("hardcodeado"). Siempre debe importar el valor desde `theme.ts`.

**¿Por qué esta regla?** Porque cuando se implementó el modo claro, solo fue necesario cambiar los valores en un lugar (theme.ts) y toda la aplicación se actualizó automáticamente.

```typescript
// Ejemplo de cómo se usa el tema en un componente
import { Colors, Typography, Spacing } from '../constants/theme';

const styles = StyleSheet.create({
  titulo: {
    color: Colors.textPrimary,      // no: '#F0F0F5'
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xxl,
    marginBottom: Spacing.lg,
  }
});
```

### Sistema de navegación con Expo Router

Expo Router es diferente a los sistemas de navegación tradicionales. En lugar de definir rutas en código, **la estructura de carpetas define las rutas automáticamente**. Si creas el archivo `app/inventario.tsx`, automáticamente existe la pantalla "inventario".

La carpeta `(tabs)` es una convención de Expo Router: el nombre entre paréntesis indica que no crea una ruta real, sino que agrupa las pantallas bajo un navegador de pestañas.

```
app/
├── _layout.tsx        → configuración raíz
└── (tabs)/
    ├── _layout.tsx    → barra de pestañas inferior
    ├── index.tsx      → pantalla "/"  (Inicio)
    ├── inventario.tsx → pantalla "/inventario"
    ├── cuadre.tsx     → pantalla "/cuadre"
    └── historial.tsx  → pantalla "/historial"
```

### Componentes UI base

Se construyó una biblioteca de componentes reutilizables. Esto sigue el principio DRY (Don't Repeat Yourself — No te repitas). En lugar de escribir el mismo código de un botón en 20 lugares diferentes, se escribe una vez en `Button.tsx` y se usa en todos lados.

Los componentes base son: `Button`, `Card`, `Input`, `Modal`, `Badge`, `Divider`, `SearchBar` y `SelectorProducto`.

---

## 8. Fase 2 — Base de datos SQLite

### ¿Cómo funciona la base de datos en el teléfono?

SQLite crea un archivo llamado `digitalmind.db` en el almacenamiento interno del teléfono. Todas las operaciones (guardar, leer, actualizar, eliminar) se hacen sobre ese archivo. Cuando el usuario desinstala la app, ese archivo se elimina junto con todos los datos.

### El patrón Singleton

La aplicación necesita una sola conexión a la base de datos que se comparte en todo el código. Si cada parte del código abriera su propia conexión, podrían ocurrir conflictos al escribir datos simultáneamente.

```typescript
// db.ts — Solo existe UNA instancia de la base de datos
let db: SQLite.SQLiteDatabase | null = null;

function initDatabase(): SQLite.SQLiteDatabase {
  if (db) return db;  // Si ya existe, devolver la misma
  db = SQLite.openDatabaseSync('digitalmind.db');
  // ... configuración inicial
  return db;
}
```

### ¿Por qué `openDatabaseSync` en vez de `openDatabaseAsync`?

Esto fue una corrección crítica durante el desarrollo. La Nueva Arquitectura de React Native (Fabric) tiene un comportamiento diferente con las operaciones asíncronas de la base de datos. Cuando se usaba `openDatabaseAsync`, la conexión se perdía entre operaciones y daba el error `NativeDatabase.prepareAsync → NullPointerException`. Al cambiar a `openDatabaseSync`, la conexión persiste de forma estable durante toda la vida de la aplicación.

### El patrón Repositorio

En lugar de escribir consultas SQL directamente en los componentes de la interfaz, se crearon "repositorios": clases que encapsulan todas las operaciones de una entidad.

```typescript
// Mal enfoque (SQL mezclado con UI):
// En algún componente...
const productos = await db.getAllAsync('SELECT * FROM productos');

// Buen enfoque (repositorio):
// En ProductoRepository.ts:
async getAll(): Promise<Producto[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Producto>(
    'SELECT * FROM productos ORDER BY orden ASC'
  );
}

// En el componente, limpio y sin SQL:
const productos = await ProductoRepository.getAll();
```

### Migraciones de base de datos

Cuando se añade una nueva columna a una tabla existente (por ejemplo, la columna `cantidad` que se añadió a `productos`), los usuarios que ya tienen la app instalada no tienen esa columna. Una migración es código que actualiza la estructura de la base de datos existente sin perder los datos.

```typescript
// Migración segura: intenta añadir la columna,
// si ya existe, SQLite lanza error y lo ignoramos
try {
  db.execSync('ALTER TABLE productos ADD COLUMN cantidad REAL NOT NULL DEFAULT 0;');
} catch {
  // La columna ya existe — ignorar
}
```

---

## 9. Fase 3 — Pantalla de Inventario

### ¿Qué se construyó?

Un CRUD completo de productos (Create, Read, Update, Delete — Crear, Leer, Actualizar, Eliminar), con tres funcionalidades adicionales importantes: búsqueda en tiempo real, reordenamiento por arrastre y un carrusel de edición.

### Búsqueda inteligente con useMemo

La búsqueda no consulta la base de datos cada vez que el usuario escribe una letra. En cambio, carga todos los productos una vez y filtra en memoria usando `useMemo`, un mecanismo de React que memoriza el resultado de un cálculo y solo lo recalcula cuando cambian sus dependencias.

```typescript
const resultados = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (!q) return productos;  // Si no hay búsqueda, devolver todo

  return productos.filter((p) => {
    // Buscar en el nombre
    if (p.nombre.toLowerCase().includes(q)) return true;
    // Buscar por iniciales (ej: "cf" encuentra "Café")
    const iniciales = p.nombre.split(' ').map((w) => w[0]).join('');
    if (iniciales.includes(q)) return true;
    // Buscar por precio
    if (String(p.precio_venta).includes(q)) return true;
    return false;
  });
}, [query, productos]);
// Solo recalcula cuando query o productos cambian
```

### Drag & Drop con PanResponder

El reordenamiento por arrastre fue uno de los mayores desafíos técnicos del proyecto. Se intentaron varias librerías externas (`react-native-reanimated`, `react-native-draggable-flatlist`) pero todas requerían un "build nativo" incompatible con Expo Go.

La solución final fue implementar el arrastre desde cero usando `PanResponder` y `Animated` de React Native puro, que sí funciona en Expo Go sin builds adicionales.

**Cómo funciona:**
1. Cuando el usuario presiona el handle de arrastre, `onPanResponderGrant` registra la posición inicial.
2. Mientras arrastra, `onPanResponderMove` mueve el elemento visualmente usando `Animated.Value` y calcula qué posición destino corresponde según cuántos píxeles se movió.
3. Cuando suelta, `onPanResponderRelease` persiste el nuevo orden en la base de datos.

### El carrusel de edición

Para poder editar productos sin cerrar el modal y volver a abrirlo, se implementó un carrusel. El modal recibe la lista completa de productos y el índice del que se está editando. Los botones "Anterior" y "Siguiente" cambian el índice, lo que recarga el formulario con los datos del nuevo producto.

```typescript
// Cuando cambia el índice, recargar el formulario
useEffect(() => {
  if (productoActual) {
    reset({
      nombre: productoActual.nombre,
      precio_costo: productoActual.precio_costo,
      precio_venta: productoActual.precio_venta,
      cantidad: productoActual.cantidad,
    });
  }
}, [productoActual?.id, indiceActual]);
// El formulario se actualiza cada vez que cambia el producto actual
```

---

## 10. Fase 4 — Pantalla de Inicio y gestión del turno

### El flujo de apertura de un turno

Abrir un turno no es simplemente cambiar un campo en la base de datos. Es un proceso de varios pasos:

```
Usuario toca "Abrir turno"
        ↓
Aparece alerta: "Revisa el inventario antes de continuar"
        ↓
Usuario confirma que todo está bien
        ↓
Aparece selector de días (1-6)
        ↓
Usuario selecciona duración y confirma
        ↓
Se crea el registro del turno en la tabla turnos
        ↓
Se leen todos los productos del inventario
        ↓
Se guarda un SNAPSHOT (fotografía) del inventario
  como inventario_inicial en la tabla inventario_turno
        ↓
El turno queda "abierto"
```

La alerta antes de abrir es una decisión de diseño de negocio importante: garantiza que el inventario esté actualizado con las cantidades correctas antes de comenzar, porque esas cantidades serán la base del cálculo de ventas.

### Los 4 tipos de movimientos

Cada movimiento tiene su propio modal con formulario, lista de registros existentes y posibilidad de editar o eliminar cada uno.

**Entradas:** Cuando llega mercancía nueva. Si ya existe una entrada del mismo producto en el turno activo, se suma a la existente en lugar de crear un duplicado. Esto simplifica el cuadre porque siempre habrá una sola cifra de entradas por producto.

**Salidas familiares:** Cuando el dueño o un familiar retira productos para consumo personal. Se registra quién retiró los productos, lo que añade trazabilidad.

**Cambios de precio:** Cuando el precio de venta de un producto cambia durante el turno. El dato crítico aquí es `cantidad_existente`: cuántas unidades había en el momento del cambio. Sin este dato, sería imposible calcular cuánto se vendió a cada precio.

**Mermas:** Productos que se retiran del inventario por deterioro, rotura o vencimiento. Se clasifican como "roto", "vencido" u "otro" para tener estadísticas de pérdidas.

### El hook useTurno

Los hooks en React son funciones que encapsulan lógica reutilizable. `useTurno` es el cerebro del turno: gestiona el estado del turno activo, expone funciones para abrirlo, cerrarlo y editarlo, y mantiene sincronizado el estado de la UI con la base de datos.

```typescript
// Cómo se usa en un componente (muy limpio):
const { turno, abrirTurno, cerrarTurno } = useTurno();

// Para abrir:
await abrirTurno(3); // turno de 3 días

// Para cerrar:
await cerrarTurno(); // hace todo el proceso de cierre
```

---

## 11. Fase 5 — Cuadre de caja

Esta es la fase más compleja matemáticamente. El cuadre de caja responde a la pregunta: ¿coincide el dinero real que hay en caja con el dinero que debería haber según las ventas calculadas?

### La lógica del cuadre — Para no programadores

Imagina que vendiste 10 cafés a $50 cada uno. Eso debería darte $500. Pero también recibiste una transferencia de $100 y tus trabajadoras compraron café a mitad de precio, así que hay un descuento de $25. El cálculo sería:

- **Esperado:** $500 (ventas) - $25 (gastos) = $475
- **Real:** $350 (efectivo en caja) + $100 (transferencia) + $25 (USD en CUP) = $475
- **Diferencia:** $475 - $475 = $0 → Cuadre exacto

### La lógica del cuadre — Para programadores

```typescript
// DINERO ESPERADO (lo que debería haber entrado por ventas)
const total_ventas = suma de (cantidad_vendida × precio_venta) por producto
const total_gastos = suma de diferencias de precios trabajadores
const total_esperado = total_ventas - total_gastos

// DINERO REAL (lo que realmente entró a la caja)
const total_efectivo = suma de montos por día
const total_transferencias = suma de todas las transferencias
const total_usd = suma de (cantidad_usd × tasa_cambio)
const total_real = total_efectivo + total_transferencias + total_usd

// RESULTADO
const diferencia = total_real - total_esperado
// > 0 → sobrante (hay más de lo esperado)
// < 0 → faltante (hay menos de lo esperado)
// = 0 → exacto
```

### Cálculo de ventas por producto

Para calcular cuánto vendió cada producto, el sistema usa la fórmula:

```
Vendidas = Inicial + Entradas - Salidas Familiares - Mermas - Final

Donde:
- Inicial  = cantidad al abrir el turno (inventario inicial)
- Entradas = productos que llegaron durante el turno
- Salidas  = productos retirados por familiares
- Mermas   = productos dados de baja (rotos, vencidos)
- Final    = cantidad contada físicamente al cerrar el turno
```

### Tramos de precio — El caso complejo

Cuando un producto cambia de precio a mitad del turno, no se puede multiplicar las unidades vendidas por un solo precio. Se necesita calcular cuántas se vendieron antes del cambio y cuántas después.

**Ejemplo práctico:**
- Café empezó el turno a $45
- A mitad del turno quedaban 8 unidades y subió a $50
- Al final del turno quedaban 2 unidades
- Total inicial: 20 unidades + 0 entradas

```
Paso 1: Calcular vendidas antes del cambio
  = Inicial (20) - Existentes al cambiar (8)
  = 12 unidades a $45 = $540

Paso 2: Calcular vendidas después del cambio
  = Existentes al cambiar (8) - Final (2)
  = 6 unidades a $50 = $300

Paso 3: Total aportado por el café
  = $540 + $300 = $840
```

Esta lógica está implementada en `src/domain/usecases/calcularCuadre.ts` y es completamente independiente de la interfaz gráfica. Se puede testear de forma aislada.

### Cálculo de salarios y ganancias

```typescript
const salario_mostrador = total_ventas * 0.01    // 1% de las ventas
const salario_salon = total_ventas * 0.005        // 0.5% de las ventas
const costo_productos = suma de (vendidas × precio_costo) por producto
const ganancia_neta = total_ventas - costo_productos - salario_mostrador - salario_salon - gastos
```

### La pantalla de cuadre — Navegación por secciones

Para no saturar al usuario con toda la información de una vez, la pantalla de cuadre usa una barra de navegación horizontal con 6 secciones: Inventario Final, Transferencias, USD, Gastos, Caja por Día y Resultado. El usuario completa cada sección y al final toca "Calcular".

---

## 12. Fase 6 — Historial de turnos

### ¿Qué pasa cuando se cierra un turno?

El cierre de un turno es el proceso más importante de la aplicación porque involucra varios pasos encadenados que deben ejecutarse en orden:

```
1. Marcar el turno como "cerrado" en la tabla turnos
        ↓
2. Leer TODOS los datos del turno antes de limpiar
   (inventario, entradas, salidas, cambios, mermas,
    transferencias, gastos, caja, USD)
        ↓
3. Calcular el cuadre con esos datos
        ↓
4. Guardar el resumen en historial_turnos
   (incluyendo todos los datos en formato JSON
    para poder consultarlos después)
        ↓
5. Actualizar la cantidad de cada producto
   con las cantidades finales del turno
   (esto sirve como inventario inicial del próximo turno)
        ↓
6. Eliminar todos los movimientos del turno
   (limpiar las 9 tablas de movimientos)
        ↓
7. La pantalla de Inicio muestra "Sin turno activo"
```

### ¿Por qué guardar el JSON completo?

El campo `detalle_json` de la tabla `historial_turnos` contiene absolutamente todos los datos del turno en formato texto (JSON). Esto puede parecer redundante, pero tiene una razón importante: cuando el usuario consulta el historial de un turno de hace 6 meses, los productos pueden haber cambiado de precio o incluso haber sido eliminados. El JSON garantiza que la información histórica sea inmutable y exacta.

### Actualización automática del inventario

Cuando el turno cierra con inventario final registrado, cada producto en la tabla `productos` se actualiza con la cantidad que quedó:

```typescript
for (const item of inventarioFinal) {
  await ProductoRepository.update(item.producto_id, {
    cantidad: item.cantidad,  // La cantidad final del turno
  });
}
```

Al abrir el próximo turno, `useTurno.abrirTurno` lee estos productos actualizados y los guarda como inventario inicial del nuevo turno. El ciclo se cierra perfectamente.

---

## 13. Fase 7 — Modo claro/oscuro y configuración

### Cómo funciona el sistema de temas

El sistema de temas tiene tres partes:

**1. Los tokens de color (theme.ts)**
Se definen dos paletas completas: una oscura y una clara. Cada paleta tiene exactamente los mismos nombres de variables pero con valores diferentes.

```typescript
const PaletaDark = { bgPrimary: '#0D0D0F', textPrimary: '#F0F0F5', ... }
const PaletaLight = { bgPrimary: '#F4F4F8', textPrimary: '#12121A', ... }

function getColors(modo: 'oscuro' | 'claro') {
  return modo === 'claro' ? PaletaLight : PaletaDark;
}
```

**2. El store del tema (temaStore.ts)**
Zustand guarda el modo actual y expone una función para cambiarlo. Cuando cambia el modo, AsyncStorage lo persiste para que se recuerde la próxima vez que se abra la app.

**3. El hook useTheme**
Cualquier componente que necesite colores importa `useTheme()` y obtiene los colores correctos según el modo activo.

```typescript
// En cualquier componente:
const { C, T, S } = useTheme();
// C = Colors del modo actual
// T = Typography
// S = Spacing

const styles = StyleSheet.create({
  container: { backgroundColor: C.bgPrimary },
  texto: { color: C.textPrimary, fontFamily: T.fontFamilyBold },
});
```

### Persistencia con AsyncStorage

AsyncStorage es como el `localStorage` del navegador web pero para React Native. Guarda pares clave-valor como texto. La preferencia del tema se guarda bajo la clave `"digitalmind_tema"` y se carga al iniciar la aplicación en el `RootLayout`.

---

## 14. Lógica pura del cuadre de caja — Explicación detallada

Esta sección profundiza en el archivo más importante del proyecto: `src/domain/usecases/calcularCuadre.ts`.

### ¿Qué es "lógica pura"?

Una función pura es aquella que dado los mismos datos de entrada, siempre devuelve el mismo resultado, sin efectos secundarios. No guarda nada en la base de datos, no muestra nada en pantalla, solo calcula. Esto la hace 100% predecible y fácilmente testeable.

### Flujo completo del cálculo

```
ENTRADA: DatosCuadre {
  inventarioInicial  → qué había al inicio
  inventarioFinal    → qué quedó al cierre
  entradas           → qué llegó durante el turno
  salidasFamiliares  → qué se retiró para familia
  cambiosPrecio      → cuándo y cuánto cambió cada precio
  mermas             → qué se perdió
  transferencias     → pagos digitales recibidos
  gastos             → descuentos a trabajadores
  cajaPorDia         → efectivo contado cada día
  registrosUSD       → dólares recibidos
}

PROCESO: Para cada producto en inventarioInicial:
  1. Calcular cantidad_vendida
  2. Identificar tramos de precio (si hubo cambios)
  3. Calcular dinero_aportado por tramo
  4. Sumar tramos → dinero_aportado total

SALIDA: ResultadoCuadre {
  // Por producto:
  resultados_productos → detalle de cada producto
  
  // Dinero esperado:
  total_ventas_esperado → suma de aportes de todos los productos
  total_gastos          → descuentos aplicados
  total_esperado        → ventas - gastos
  
  // Dinero real:
  total_efectivo_caja   → suma de caja por día
  total_transferencias  → suma de transferencias
  total_usd_en_cup      → USD convertidos
  total_real            → efectivo + transferencias + USD
  
  // Resultado:
  diferencia   → real - esperado
  estado       → "exacto" | "sobrante" | "faltante"
  
  // Salarios:
  salario_mostrador → 1% de ventas
  salario_salon     → 0.5% de ventas
  ganancia_neta     → ventas - costos - salarios - gastos
}
```

### Por qué se usa `Math.round(valor * 100) / 100`

Los números decimales en computación tienen un problema conocido llamado "error de punto flotante". Por ejemplo, `0.1 + 0.2` en JavaScript da `0.30000000000000004` en lugar de `0.3`. Para el cuadre de caja, este error de milésimas podría hacer que un cuadre exacto aparezca como "faltante $0.0000000001". La función `redondear` soluciona esto redondeando siempre a 2 decimales.

---

## 15. Sistema de toasts

Los toasts son pequeñas notificaciones que aparecen en la parte superior de la pantalla para confirmar acciones. El sistema de Digital/Mind tiene 4 variantes: éxito (verde), error (rojo), advertencia (ámbar) e información (azul).

### Arquitectura del sistema de toasts

```
useToast (hook)          → interfaz pública para mostrar toasts
    ↓
useToastStore (Zustand)  → estado global: lista de toasts activos
    ↓
ToastContainer           → renderiza todos los toasts activos
    ↓
ToastItem                → un toast individual con animación
```

### Las animaciones del toast

Cada toast tiene tres animaciones simultáneas:
1. **Entrada:** Desliza desde arriba con `Animated.spring` (efecto de rebote natural)
2. **Barra de progreso:** Se reduce de 100% a 0% durante el tiempo de vida del toast
3. **Salida:** Desliza hacia arriba con `Animated.timing` (lineal)

```typescript
// Barra de progreso — anima el WIDTH (no puede usar nativeDriver)
Animated.timing(progressWidth, {
  toValue: 0,
  duration: duracion,
  useNativeDriver: false,  // width no es soportado por native driver
}).start();

// Entrada — anima la POSICIÓN (puede usar nativeDriver para mejor rendimiento)
Animated.spring(translateY, {
  toValue: 0,
  damping: 20,
  stiffness: 220,
  useNativeDriver: true,  // transform sí es soportado
}).start();
```

---

## 16. Cómo instalar y correr el proyecto

### Requisitos previos

- Node.js v18 o superior instalado
- npm v9 o superior
- Expo Go instalado en el teléfono Android o iOS
- El teléfono y la computadora en la misma red WiFi

### Pasos de instalación

```bash
# 1. Clonar o descargar el proyecto
cd C:\Users\TuUsuario\Desktop
# (copiar la carpeta DigitalMind aquí)

# 2. Entrar a la carpeta del proyecto
cd DigitalMind

# 3. Instalar todas las dependencias
npm install --legacy-peer-deps

# 4. Iniciar el servidor de desarrollo
npx expo start --clear
```

### ¿Por qué se usa `--legacy-peer-deps`?

Expo SDK 54 usa versiones específicas de sus dependencias que a veces entran en conflicto con la verificación estricta de pares (peer dependencies) de npm v7+. La bandera `--legacy-peer-deps` le dice a npm que use el comportamiento más permisivo de npm v6, que es lo que Expo espera.

### Correr en el teléfono

1. Abrir la app Expo Go en el teléfono
2. Escanear el código QR que aparece en la terminal
3. La app carga automáticamente

### Verificar que el TypeScript está correcto

```bash
npx tsc --noEmit
```

Este comando verifica que no hay errores de tipos en el código sin compilar nada. Debe ejecutarse sin errores antes de hacer cualquier cambio importante.

---

## 17. Guía para escalar el proyecto

### Añadir una nueva pantalla

1. Crear el archivo en `app/(tabs)/nueva-pantalla.tsx`
2. Añadir la pantalla al `_layout.tsx` de tabs
3. Crear los componentes en `src/presentation/components/features/nueva-pantalla/`
4. Si necesita datos de la DB, crear el repositorio en `src/data/repositories/`
5. Crear el hook en `src/presentation/hooks/useNuevaPantalla.ts`

### Añadir un nuevo tipo de movimiento

1. Crear la entidad en `src/domain/entities/NuevoMovimiento.ts`
2. Añadir la tabla al schema en `src/data/database/schema.ts`
3. Añadir la migración en `src/data/database/db.ts`
4. Añadir los métodos al repositorio correspondiente
5. Añadir el validator en `src/utils/validators.ts`
6. Crear el modal en `src/presentation/components/features/turno/`
7. Integrar en el hook `useMovimientos`
8. Añadir el botón en `BotonesMovimientos`
9. Integrar el modal en `app/(tabs)/index.tsx`
10. Actualizar `calcularCuadre.ts` si afecta el cálculo

### Añadir un campo al cuadre de caja

1. Añadir la tabla o campo en el schema
2. Añadir la migración en db.ts
3. Crear la entidad correspondiente
4. Añadir los métodos al repositorio
5. Actualizar `DatosCuadre` en `calcularCuadre.ts`
6. Actualizar `ResultadoCuadre` con los nuevos totales
7. Actualizar la lógica de cálculo
8. Crear la sección visual en `src/presentation/components/features/cuadre/`
9. Integrar en `app/(tabs)/cuadre.tsx`
10. Actualizar `historial_turnos` para guardar el nuevo dato

### Migrar a una base de datos en la nube (Supabase)

Si en el futuro se quiere sincronizar datos entre varios dispositivos:

1. Los repositorios son el único lugar donde cambiaría el código de acceso a datos
2. En lugar de `db.getAllAsync`, se haría `supabase.from('productos').select('*')`
3. Las entidades y la lógica de negocio (calcularCuadre.ts) no cambiarían
4. Los hooks y componentes tampoco cambiarían

Esta es la ventaja de la arquitectura en capas: los cambios en la capa de datos no afectan la presentación ni el dominio.

### Añadir notificaciones push

La librería `expo-notifications` ya es compatible con el proyecto. Se puede usar para:
- Recordatorio al inicio del día para abrir el turno
- Alerta cuando hay un faltante significativo en el cuadre
- Resumen diario de ventas

### Añadir sincronización entre dispositivos

Si el negocio tiene varios empleados con teléfonos diferentes:
1. Implementar Supabase como base de datos en la nube
2. Añadir autenticación con `expo-auth-session`
3. Implementar sincronización en tiempo real con `Supabase Realtime`
4. Añadir resolución de conflictos (qué pasa si dos personas modifican lo mismo a la vez)

---

## 18. Glosario de términos técnicos

**APK:** Archivo de instalación para Android. Es el equivalente al `.exe` de Windows pero para Android.

**Arquitectura en capas:** Forma de organizar el código separando responsabilidades: presentación (lo que el usuario ve), dominio (lógica de negocio) y datos (base de datos).

**AsyncStorage:** Almacenamiento de pares clave-valor en el dispositivo, similar a las cookies del navegador web. Se usa para guardar preferencias del usuario.

**Bundle / Bundler:** El proceso que convierte el código TypeScript/JavaScript en un archivo optimizado que el teléfono puede ejecutar. Metro es el bundler de React Native.

**CRUD:** Acrónimo de Create, Read, Update, Delete. Las cuatro operaciones básicas de cualquier sistema de gestión de datos.

**Componente:** En React, una función que devuelve elementos visuales. Es la unidad básica de construcción de interfaces.

**Estado (State):** Datos que pueden cambiar con el tiempo y que cuando cambian, actualizan automáticamente la interfaz. Por ejemplo, la lista de productos es estado: cuando se añade uno nuevo, la lista se actualiza sola.

**Expo Go:** Aplicación oficial de Expo que permite correr apps en desarrollo directamente en el teléfono sin necesidad de compilar un APK.

**Hook:** En React, una función que permite usar características de React (estado, efectos, contexto) en componentes funcionales. Los hooks siempre empiezan con `use`.

**JSON:** JavaScript Object Notation. Formato de texto para representar datos estructurados. `{"nombre": "Café", "precio": 50}` es JSON.

**Migración:** Script de código que actualiza la estructura de la base de datos (añade columnas, crea tablas) sin perder los datos existentes.

**Modo oscuro / claro:** Esquemas de colores alternativos para la interfaz. El modo oscuro usa fondos negros/oscuros y el modo claro usa fondos blancos/claros.

**npm:** Node Package Manager. El gestor de paquetes de Node.js, usado para instalar librerías.

**Peer dependency:** Dependencia que una librería necesita que el proyecto también tenga instalada, pero en una versión específica.

**Props:** Propiedades que se pasan a un componente de React, como los parámetros de una función.

**React Native:** Framework para crear apps móviles con JavaScript/TypeScript.

**Repositorio:** Clase que encapsula todas las operaciones de acceso a datos de una entidad específica.

**Singleton:** Patrón de diseño que garantiza que solo exista una instancia de un objeto. Se usa para la conexión a la base de datos.

**Snapshot:** "Fotografía" de los datos en un momento específico. En Digital/Mind se toma un snapshot del inventario al abrir y al cerrar cada turno.

**SQLite:** Sistema de base de datos que vive en un solo archivo, sin servidor. Ideal para apps móviles.

**Store (Zustand):** Contenedor de estado global accesible desde cualquier componente de la aplicación.

**TypeScript:** Superset de JavaScript que añade tipos estáticos. Ayuda a detectar errores antes de ejecutar el código.

**UI:** User Interface (Interfaz de Usuario). Todo lo que el usuario ve y con lo que interactúa.

**UX:** User Experience (Experiencia de Usuario). Cómo se siente usar la aplicación: si es fácil, intuitiva y agradable.

**Zustand:** Librería de gestión de estado global para React. Permite compartir datos entre componentes que no están directamente relacionados en la jerarquía de componentes.

---

## Créditos

Desarrollado por **@yerald.dev**

Aplicación diseñada para negocios locales cubanos que necesitan digitalizar sus procesos de control de inventario y cuadre de caja.

---

*Digital/Mind — Versión 1.0.0*
*Documentación generada junto con Claude (Anthropic)*