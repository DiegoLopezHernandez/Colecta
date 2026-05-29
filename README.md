# Colecta

App Android nativa para gestionar tu colección de monedas y objetos. Identifica
monedas en Numista a partir de país + año (opcionalmente con foto), consulta
precios en eBay y guarda todo en local con SQLite.

## Stack

- Kotlin + Jetpack Compose + Material 3
- Hilt para inyección de dependencias
- Room (SQLite) para persistencia
- Retrofit + Moshi para llamadas a Numista y eBay
- Coil para imágenes
- DataStore para API keys
- Cámara/galería del sistema vía ActivityResult APIs

## Cómo compilar la APK

### Vía GitHub Actions (recomendado, sin instalar nada)

1. Sube este proyecto a un repo de GitHub.
2. Cada push a `main` lanza el workflow `Build Android APK`.
3. Cuando termine (~5 min), descarga el APK desde la pestaña **Releases**.
4. Instálalo en tu móvil (desinstala el anterior si lo tenías).

### Vía Android Studio (local)

1. Abre la carpeta en Android Studio.
2. Espera a que Gradle sincronice (descargará el wrapper automáticamente).
3. Run ▶ — instala en móvil USB o emulador.

## Configurar API keys

Tras instalar la app, pestaña **Ajustes**:

- **Numista API Key**: https://numista.com/api/
- **eBay App ID (Client ID)**: https://developer.ebay.com/

Las claves se guardan localmente, solo en tu dispositivo.

## Estructura

```
app/src/main/java/com/colecta/app/
├── data/
│   ├── api/       Retrofit Numista + eBay
│   ├── db/        Room entities, DAOs, AppDatabase
│   ├── prefs/     DataStore (API keys)
│   └── repo/      Repositorios
├── di/            Módulos Hilt
├── domain/model/  Modelos
├── ui/
│   ├── components/  Composables compartidos
│   ├── navigation/  NavHost + BottomBar
│   ├── screens/
│   │   ├── coins/    Lista, detalle, alta, edición
│   │   ├── objects/  Lista, detalle, alta
│   │   ├── stats/    Estadísticas
│   │   └── settings/ Ajustes (API keys)
│   └── theme/        Color, Type, Theme
└── util/          Países, Format, ImageUtil
```

## Privacidad

Todos los datos viven en el dispositivo. La app no envía nada a servidores
propios; solo llama a la API pública de Numista y eBay con las claves que tú
configuras.
