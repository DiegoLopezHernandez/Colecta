# AppMovilNumismatica

App móvil personal para catalogar tu colección de monedas y otros coleccionables.
React Native + Expo SDK 51, TypeScript estricto, NativeWind, AsyncStorage.

## Estructura

```
src/
├── modules/coins/        Módulo Numismática (independiente)
├── modules/objects/      Módulo Objetos (independiente)
├── config/               Módulo Ajustes
├── services/             numista, ebay, image match (sin estado)
├── storage/              wrappers de AsyncStorage
├── context/              ConfigContext, CollectionContext (realtime)
├── components/           UI compartida genérica (sin lógica de negocio)
├── navigation/           Bottom tabs raíz
├── types/                Modelos TypeScript
└── utils/                helpers puros (id, format, countries, etc.)
```

Los módulos `coins` y `objects` **no comparten lógica**. Sólo comparten:
- componentes genéricos en `src/components`
- servicios isolados en `src/services`
- contextos globales (config, colección)

---

## Instalación

```bash
npm install
```

> Node 20+ recomendado. La primera instalación tarda unos minutos.

---

## Ejecutar con Expo Go (más rápido)

1. Instala **Expo Go** en tu móvil:
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779
2. En el ordenador (en la raíz del proyecto):
   ```bash
   npx expo start
   ```
3. Escanea el QR con la cámara (iOS) o desde la propia Expo Go (Android).
4. La primera vez tarda un poco al construir el bundle JS.

**Limitación de Expo Go**: si en el futuro se añaden librerías nativas no incluidas en Expo SDK, habrá que usar un dev build (siguiente sección).

---

## Compilar un APK / IPA con EAS Build

Para tener un APK instalable directamente en el móvil (sin Expo Go) o subir a TestFlight:

1. Crea cuenta gratuita en https://expo.dev
2. Instala el CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. Inicializa la configuración EAS:
   ```bash
   eas build:configure
   ```
4. APK de Android (instalable directo):
   ```bash
   eas build --profile preview --platform android
   ```
   Cuando termine, te devuelve un enlace para descargar el `.apk`.

5. iOS (requiere cuenta Apple Developer 99$/año):
   ```bash
   eas build --profile preview --platform ios
   ```

**Tier gratuito**: ~30 builds/mes. Más que suficiente para uso personal.

---

## Build automatizado con GitHub Actions (opcional)

1. Sube el repo a GitHub.
2. En Expo dashboard, genera un **EAS Token**.
3. Añádelo como secret en GitHub: `EXPO_TOKEN`.
4. Crea `.github/workflows/build.yml`:

```yaml
name: EAS Build
on:
  workflow_dispatch:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform android --profile preview --non-interactive --no-wait
```

Cada push a `main` lanza un build de Android automáticamente.

---

## Obtener las claves API

### Numista (gratis)
1. Crea cuenta en https://numista.com
2. Ve a tu perfil → API → Generate API key
3. Pégala en la app: **Ajustes → API Keys → Numista API Key**

Limitaciones del tier gratuito: ~250 peticiones/día. Suficiente para uso normal.

### eBay (gratis, App ID)
1. Regístrate en https://developer.ebay.com
2. Crea una App de Production → obtienes un **App ID** (también llamado **Client ID**), formato `MyApp-Name-PRD-xxxxxxxxx-xxxxxxxx`.
3. Pégalo en la app: **Ajustes → API Keys → eBay Client ID**

> El **Client Secret** no es necesario con la Finding API; lo conservamos en Settings por si en el futuro migras a la Browse API moderna.

### Comportamiento real de eBay
La app usa la **Finding API legacy** con `findCompletedItems + SoldItemsOnly=true` para obtener precios de venta REALES. Esta API está deprecada por eBay y puede dejar de funcionar o ser restringida para tu App ID. Si pasa, la app hace **fallback automático** a `findItemsAdvanced` (devuelve precios de listings ACTIVOS, no vendidos) y marca la fuente del precio con `source: 'active'`.

---

## Flujo de uso

### Añadir moneda
1. Pestaña **Monedas** → `+ Añadir`
2. Captura anverso y reverso (cámara o galería)
3. Selecciona país y año
4. La app consulta Numista, descarga thumbs de candidatos y los compara visualmente con tus fotos (pHash en JS)
5. Te enseña top 3 con porcentaje de similitud
6. Confirmas → la app descarga la ficha completa y consulta eBay automáticamente
7. Ajustas conservación / categoría / posesión / notas → Guardar

### Añadir objeto (más simple)
1. Pestaña **Objetos** → `+ Añadir`
2. Foto principal (opcional una secundaria)
3. Nombre, tipo y categoría
4. La app consulta eBay y muestra hasta 6 resultados; puedes elegir uno para importar el título exacto
5. Posesión y notas → Guardar

### Actualizar precios masivamente
**Ajustes → Actualización de precios → Actualizar todos los precios**
- Itera todas las piezas con precio (o también las que no, según el toggle)
- Progreso visible "Actualizando X de Y"
- Botón **Cancelar** detiene en limpio: las ya actualizadas conservan precio nuevo, las pendientes el anterior
- Resumen final: actualizadas / sin resultados / errores
- Se guarda un snapshot del valor total para la gráfica histórica
- Delay configurable entre peticiones (200-2000 ms) para no saturar eBay

---

## Modelos de datos

Todo lo persistido (config + colecciones + snapshots) vive en **AsyncStorage**.
Las imágenes se guardan en la cache local de la app (file://). El export JSON
incluye sólo metadatos, no las imágenes en base64.

---

## Notas técnicas

- **pHash**: implementación JS pura. Hace resize a 32x32 con `expo-image-manipulator` y calcula un hash de 64 bits sobre la firma binaria del JPEG reducido. No es un pHash DCT estricto, pero discrimina lo suficiente para ordenar top-N candidatos. Funciona en Expo Go sin builds nativos.
- **Realtime config**: cambios en Ajustes se aplican vía `ConfigContext` sin reiniciar.
- **Modo offline**: navegar y filtrar la colección NO requiere red. Sólo identificación y actualización de precios la necesitan.
- **TypeScript estricto**: `strict: true`, `noUncheckedIndexedAccess: true`.

---

## Solución de problemas

- **"No camera permission"**: en Ajustes del móvil habilita cámara para Expo Go o la app.
- **Numista devuelve 401**: tu API key no es válida o expiró. Genera otra.
- **eBay devuelve 0 resultados constantemente**: prueba a buscar términos más genéricos en el título de la moneda; la Finding API es sensible al wording.
- **`Intl is not defined`**: si aparece en Android antiguo, instala `@formatjs/intl`. En SDK 51 está incluido por defecto.

---

## Scripts

```bash
npm start          # Inicia Expo dev server
npm run android    # Abre directamente en Android
npm run ios        # Abre directamente en iOS
npm run tsc        # Type check sin emitir
```

---

## Licencia

Uso personal.
