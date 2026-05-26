# Auditoría — AppMovilNumismatica

> Foco solicitado: bugs visuales concretos, UX/flujos, limpieza de código UI, rendimiento de cámara/captura + análisis general. Modo: auditoría primero, tú apruebas cada bloque.

Cada hallazgo lleva un identificador (`B-#`, `U-#`, `R-#`, `P-#`, `F-#`). Cuando quieras aplicar algo, dime los IDs (p. ej. "aplica B-1, B-3 y P-2").

Severidad: 🔴 crítico · 🟠 alto · 🟡 medio · 🔵 bajo

---

## 1. Bugs visuales y de comportamiento (concretos)

### 🔴 B-1 — Hooks después de `return` en CoinEditScreen
`src/modules/coins/screens/CoinEditScreen.tsx:30-55`. La pantalla hace `return <View/>` si la moneda no existe **antes** de los `useState`. Las directivas `eslint-disable react-hooks/rules-of-hooks` están enmascarando una violación real de las reglas de hooks. Si el usuario navega a una moneda recién borrada, React puede crashear o desincronizar el orden de hooks. Mover todos los `useState` arriba del `if (!coin)`.

### 🔴 B-2 — Contraste WCAG en botón primario
`src/components/PrimaryButton.tsx:33`: `primary` usa texto **blanco** (`#FFFFFF`) sobre fondo dorado (`#D4A24B`). Ratio ≈ 2.6:1 (falla WCAG AA). El propio `tailwind.config.js` define `primaryFg: '#1A1206'` para este caso, y `Badge` con `variant=solid` ya usa `#0B0B0D`. Hay que cambiar `fg` a `#1A1206`. Aplica también a los **chips activos** en `CoinFilters.tsx:107,338` y `ObjectFilters` equivalente.

### 🟠 B-3 — Strings sin acentos / mojibake
Pantallas afectadas: `CoinAddCoinScreen`, `CoinAddConfirmScreen`, `CoinDetailScreen`, `CoinEditScreen`, `CoinsListScreen`, `PhotoCapture`, `CoinsNavigator`, `ObjectDetailScreen`, `ObjectAddConfirmScreen`, `DataMgmtScreen`, `numistaService`. Aparecen literales "Pais", "Ano", "Anadir", "Camara", "Galeria", "Estadisticas", "Conservacion", "Categoria", "Posesion", "Numista tipico", "respondio". Es inconsistente con Objects/Settings que sí tienen acentos. Probablemente un guardado con encoding incorrecto en su día. Toca normalizar a UTF-8 con tildes y eñes en todos los `Text`/`Alert`/títulos.

### 🟠 B-4 — Imágenes oficiales con `cover` cuando solo hay foto oficial
`CoinCard.tsx:57,123`: si la moneda tiene `officialObverseUrl` pero no `frontImageUri`, se usa `resizeMode='contain'` correctamente. Pero en `ObjectCard.tsx:48,107` se usa siempre `cover` sin contemplar imágenes con fondo blanco/transparente, recortando los bordes.

### 🟠 B-5 — Cabecera de `CoinsListScreen` se desborda con `Anadir`
`CoinsListScreen.tsx:71-76`: con tres acciones a la derecha (layout, stats, botón "Añadir") en pantallas de 360 px (Android pequeño) el `flex: 1` del título queda con poco espacio y "Mis Monedas" puede truncar. Tras pasar a "Añadir" con tilde queda peor. Mismo problema en `ObjectsListScreen`.

### 🟡 B-6 — `Modal` zoom de imagen sin gesto de cierre por swipe
`CoinDetailScreen.tsx:128-159`: solo se cierra con el botón ✕ o tocando la imagen. No hay pellizco-zoom ni swipe-down. La experiencia esperada hoy es zoom + arrastrar para cerrar.

### 🟡 B-7 — `CoinFilters` muestra "1000 €" por defecto sin que el usuario haya tocado el slider
`CoinFilters.tsx:222-232`: si `state.priceMax` es `undefined`, el label muestra "1000" igualmente. Es confuso (parece un filtro aplicado). Mostrar "—" o "Sin límite" cuando `priceMax === undefined`.

### 🟡 B-8 — `ScrollView` horizontales sin `keyboardShouldPersistTaps`
Chips de orden y categoría en `CoinFilters.tsx:78` / `Chips:315`. Si el usuario está escribiendo en el buscador, el primer tap en un chip cierra el teclado pero no dispara el `onPress`. Añadir `keyboardShouldPersistTaps="handled"`.

### 🟡 B-9 — Sin `KeyboardAvoidingView` en formularios largos
`CoinAddCoinScreen`, `CoinAddConfirmScreen`, `CoinEditScreen`, `ObjectAddConfirmScreen`. En Android con teclado abierto el botón "Guardar" queda tapado y hay que cerrar manualmente. Falta envolver el `ScrollView` en `KeyboardAvoidingView` con `behavior` por plataforma.

### 🟡 B-10 — `Image` sin `onError` ni placeholder de fallo
Si la URL de Numista falla (404), se ve un cuadrado vacío gris sin pista. Mejor: capturar `onError` y mostrar el emoji 🪙 como en el caso `no imageUri`.

### 🔵 B-11 — `tailwind.config.js` define paleta semántica que NO se usa
Todo el código usa hex literales. El tema (`bg`, `surface`, `primary`, `border`…) está definido pero invisible. O migramos a `className` con tokens, o eliminamos el tema para no engañar. Recomiendo migrar (ver R-1).

### 🔵 B-12 — `CoinAddCaptureScreen` y `CoinAddManualScreen` son zombis
Devuelven `<View/>` vacío. Si no están registradas en navegación (no aparecen en `CoinsNavigator.tsx`), borrarlas.

### 🔵 B-13 — `useEffect` con `eslint-disable exhaustive-deps`
`CoinDetailScreen.tsx:71`, `CoinAddIdentifyScreen.tsx:68`, `CoinAddConfirmScreen.tsx:73`. Comentarios `eslint-disable` que ocultan dependencias faltantes. En `CoinDetailScreen` además se recalcula la cabecera en cada render porque `coins.find` devuelve referencia distinta — debería usarse `useMemo`.

### 🔵 B-14 — `formatCurrency` recibe `undefined` con frecuencia y dibuja "—" inconsistente
En `CoinCard` y `ObjectCard` se muestra `"—"` o cadena vacía según camino. Comprobar `utils/format.ts` y unificar (no leído aún, pero el síntoma es visible).

---

## 2. UX / flujos

### 🟠 U-1 — Confirmación de borrado no diferenciada
`CoinDetailScreen.tsx:34-46`: `Alert.alert("Eliminar moneda")` con botón "Eliminar" rojo, OK. Pero un borrado accidental no es recuperable. Sugiero **soft-delete** con undo de 5 s vía toast (ver F-3), o exigir mantener pulsado.

### 🟠 U-2 — Sin feedback háptico en acciones destructivas/exitosas
Hay `expo-haptics` instalado pero no se usa. Faltan vibraciones cortas en: foto capturada, moneda guardada, candidata seleccionada, borrar.

### 🟠 U-3 — Identificación: el "Top 1" es solo borde dorado
`CoinAddIdentifyScreen.tsx:131`. Si la mejor coincidencia es dudosa (confidence < 50%), el usuario igualmente la ve resaltada. Mostrar el porcentaje de confianza como chip y degradar visualmente cuando es bajo. Y permitir "ninguna coincide → reintentar con otro nombre" sin volver atrás.

### 🟠 U-4 — Cámara: no se puede revisar la foto antes de aceptarla
`PhotoCapture.tsx:35-45`: tras `takePhoto` se acepta directamente. Esperado: pantalla de previsualización con "Reintentar" / "Usar". Ahora la única forma es ver la previa en la card y tocar "Repetir".

### 🟠 U-5 — Cámara: sin flash, sin grid, sin pinch-to-zoom, sin enfoque al tocar
Con la `CameraView` actual (expo-camera) son props/extensiones, no son grandes refactors. Las monedas se fotografían frecuentemente con poca luz; el flash y el enfoque por toque son básicos.

### 🟡 U-6 — La lista de filtros se queda abierta tras seleccionar
`CoinFilters` con `expanded=true`. Al filtrar por categoría, el panel ocupa media pantalla y el usuario sigue viendo la lista comprimida. Auto-colapsar tras 1 s de inactividad o mostrar como bottom-sheet modal.

### 🟡 U-7 — Sin pull-to-refresh
Listas de Monedas/Objetos no permiten `RefreshControl`. Útil para forzar reload tras importar.

### 🟡 U-8 — Búsqueda sin debounce
`CoinFilters` filtra en cada keystroke. Con 1000+ piezas re-renderiza la `FlatList` entera por cada tecla. Debounce 200 ms (ver P-4).

### 🟡 U-9 — Tabs sin estado de carga / contador
Las pestañas inferiores no muestran cuántas monedas/objetos hay. Pequeño badge numérico discreto ayudaría.

### 🔵 U-10 — Empty state genérico
`EmptyState` siempre pone "Pulsa Añadir". Cuando hay filtros aplicados sin resultados sería mejor un botón "Limpiar filtros" inline (hoy hay que abrir el panel).

### 🔵 U-11 — Sin breadcrumbs/progreso en el flujo de alta
El flujo es Capture → Identify → Confirm (3 pasos) pero el header solo muestra el título de la pantalla. Un indicador "Paso 2 de 3" tranquiliza.

---

## 3. Refactor / limpieza de UI

### 🟠 R-1 — Hex literales en lugar de tokens (paleta no usada)
70+ ocurrencias de `#141417`, `#26262B`, `#0B0B0D`, `#A1A1AA`, `#D4A24B`. El tema NativeWind está definido pero ignorado.

Acción: extraer un `src/theme/colors.ts` (constantes TS) **y** usarlo desde estilos inline + className. NativeWind por sí solo no llega a estilos inline, así que conviene una constante única. Tras eso, un cambio de marca es trivial.

### 🟠 R-2 — `DataRow` duplicado en 3 pantallas
`CoinDetailScreen`, `CoinAddConfirmScreen`, `CoinEditScreen` (como `InfoRow`). Extraer a `src/components/DataRow.tsx`.

### 🟠 R-3 — `Selector` duplicado en 2 pantallas
Mismo patrón en `CoinAddConfirmScreen` y `CoinEditScreen`. Extraer.

### 🟠 R-4 — `IconButton` 36×36 inline en varias pantallas
Definido localmente en `CoinsListScreen` (líneas 123-145) y replicado a mano en `ObjectsListScreen` (37-55). Mover a `src/components/IconButton.tsx`.

### 🟠 R-5 — `Chips` definido localmente en `CoinFilters`
Probablemente repetido en `ObjectFilters`. Extraer un `<ChipsGroup label options value onChange/>`.

### 🟡 R-6 — `CoinCard` y `ObjectCard` ≈ 80% solapados
Tres layouts (list/grid2/grid4) con la misma estructura. Considerar un `<ItemCard>` genérico parametrizado, o al menos extraer el `<Thumbnail>` y `<PriceBadge>` comunes.

### 🟡 R-7 — `CoinFilters` y `ObjectFilters` tienen lógica clónica
Mismo patrón de chips horizontales, expand/collapse, slider de precio. Probablemente factorizable en un `<Filters config={…}/>` configurable, aunque cada módulo añade campos específicos.

### 🟡 R-8 — `numColumns` clave con `key={layout}` fuerza desmontaje completo
`CoinsListScreen.tsx:97`. Cada vez que cambia el layout, la `FlatList` se desmonta y vuelve a montar (pérdida de scroll, recarga de imágenes). Funcional pero ineficiente. Alternativa: `FlashList` (Shopify) o memoizar y usar `numColumns` directamente — RN ya tolera el cambio si pasas `key` solo cuando es realmente necesario.

### 🟡 R-9 — Estilos inline gigantes
Pantallas como `CoinDetailScreen` tienen 150+ líneas de `style={{…}}`. Extraer a `StyleSheet.create` (o usar NativeWind) mejora rendimiento (las refs de estilo son estables) y legibilidad.

### 🔵 R-10 — `Section` recibe `card` boolean pero el caso `card=true` duplica los estilos de `Card`
`Section.tsx:38-48`. Si `card` es true, debería renderizar `<Card>` directamente en vez de duplicar el `View` con los mismos estilos.

### 🔵 R-11 — `ScreenHeader` solo se usa en algunas pantallas
Las de detalle no la usan, ponen un `Text` directamente. Unificar.

---

## 4. Rendimiento

### 🔴 P-1 — Reescritura completa del JSON en cada save
`coinStorage.saveCoins(items)` serializa **toda** la colección a JSON y la persiste en cada cambio. Con 500 monedas + imágenes URIs eso son cientos de KB por save. Lo dispara cualquier edición individual.

Opciones, de menor a mayor esfuerzo:
- Debounce + batching de saves (≈30 líneas).
- Migrar a SQLite (`expo-sqlite`): tabla por entidad, índices por país/año/categoría. Es el camino correcto a largo plazo. Lecturas instantáneas, ordering/filter en SQL, sin reescribir todo al editar uno.
- MMKV (`react-native-mmkv`): drop-in faster AsyncStorage, no resuelve la reescritura total pero sí el coste por write.

### 🔴 P-2 — Imágenes sin compresión ni redimensionado
`PhotoCapture.tsx:37`: `quality: 0.8` y se guarda la URI del caché de la cámara. Resultado: 3-8 MB por foto, **y** la URI vive en caché temporal — al limpiar la app, las imágenes desaparecen.

Acciones:
1. `expo-image-manipulator`: resize a 1600 px max + `compress: 0.7` → ~200-400 KB.
2. Copiar el resultado a `FileSystem.documentDirectory + 'coins/' + id + '.jpg'` (URI persistente).
3. Borrar la URI antigua al reemplazar/eliminar la moneda.

### 🟠 P-3 — `Image` nativa sin caché en disco
`react-native` `Image` no cachea de forma robusta. Para fotos remotas (Numista) usar `expo-image` (`<Image>` con `cachePolicy="memory-disk"`, soporta blurhash). Ya está disponible en SDK 51.

### 🟠 P-4 — Filtros sin debounce y sin memo de `renderItem`
`useCoinFilters` recalcula `filtered` en cada keystroke. `<CoinCard/>` no está envuelto en `React.memo`. Con 200+ piezas hay re-renders perceptibles.

Acciones: `useMemo` ya está en el hook (correcto), pero el componente padre se re-renderiza, así que `<CoinCard/>` debe ser `memo` con comparador por id+updatedAt. Y el filtro de texto con debounce 200 ms.

### 🟠 P-5 — `CollectionContext` invalida todas las closures en cada cambio
`addOrUpdateCoin` depende de `coins`, lo que recrea la callback cada vez que cambian. Mejor: usar setter funcional (`setCoins(prev => …)`) y dependencias vacías. Eso evita que todos los consumidores de la context re-rendericen al cambiar identidades.

### 🟠 P-6 — `FlatList` sin `getItemLayout`, `removeClippedSubviews`, `windowSize`
En `CoinsListScreen` y `ObjectsListScreen`. Con layout `list` la altura es fija (72+padding) → `getItemLayout` es trivial y mejora scroll. `removeClippedSubviews={true}` ayuda en Android.

### 🟡 P-7 — pHash binario no decodifica JPEG real
`imageMatchService.ts`: el comentario lo admite. El "hash" se calcula sobre bytes del JPEG, no sobre píxeles, así que dos JPEGs visualmente idénticos pero comprimidos distinto dan hashes distintos. La similaridad reportada engaña al usuario.

Alternativas:
- `react-native-fast-image-hash` o un pHash nativo via expo modules.
- Servidor: enviar miniaturas a un endpoint con un pHash real (más complejo, sale del scope del cliente).
- Mientras tanto: o **eliminamos** el ranking visual y ordenamos solo por año/título, o etiquetamos honestamente "similitud aproximada".

### 🟡 P-8 — `fetchLastPrice` se llama sin throttle desde "Actualización de precios"
No leí `PriceUpdateScreen.tsx` aún, pero `defaults.ts` tiene `ebayRequestDelay: 500`. Si se actualizan 200 monedas: 100 s mínimo. La pantalla debe mostrar progreso (n/total) y poderse cancelar.

### 🔵 P-9 — `Dimensions.get('window')` no reacciona a rotación
`CoinsListScreen.tsx:43`, `CoinsStatsScreen.tsx:63`. Sustituir por `useWindowDimensions()`.

### 🔵 P-10 — `react-native-chart-kit` es pesado y bug-prone
Probablemente suficiente para Stats actual, pero si quieres pulir las gráficas: `victory-native` o `react-native-skia-charts` rinden mejor y se ven más profesionales.

---

## 5. Nuevas utilidades sugeridas (di sí/no)

### F-1 — Toast / Snackbar global
Reemplazar `Alert.alert` para feedback rápido (guardado, copiado, error de red). Implementación: provider + hook `useToast()`. ≈80 líneas.

### F-2 — Sistema de temas (claro/oscuro) con `appearance` del SO
Hoy hay un solo tema oscuro. Con la centralización de tokens (R-1) el coste de añadir tema claro es bajo. Útil si la app se mira con sol directo.

### F-3 — Undo de borrado (soft delete + snackbar)
Junto con F-1. Al borrar, marcar `deletedAt` durante 5 s antes de purgar. Snackbar con "Deshacer".

### F-4 — Búsqueda global con OCR
Tomar foto → reconocer texto en la moneda (año, país) → autocompletar campos. `expo-camera` + `expo-mlkit-ocr` (no oficial; alternativa: enviar a un endpoint OCR remoto).

### F-5 — Modo "wishlist": objetivo + alerta de precio
Cuando una moneda tiene `possessionStatus = "Quiero"`, programar un job que consulte eBay cada N días y notifique si baja del umbral. Requiere `expo-notifications` y job scheduler (`expo-background-fetch`). Útil para un coleccionista.

### F-6 — Compartir ficha como imagen (Stories-style)
"Generar tarjeta" desde el detalle: imagen 1:1 con foto + datos + valor → guardar/compartir. `react-native-view-shot` ya hace esto en pocas líneas.

### F-7 — Sincronización en la nube
Backup automático (Drive/iCloud) además del export JSON manual. Mantiene tu opción off-line-first, pero da paz mental. Complejo.

### F-8 — Importar desde CSV
La gente migra desde apps como Numista o tablas Excel. Un importador CSV con mapping de columnas es muy demandado.

### F-9 — Comparativa de valor a lo largo del tiempo por moneda
Hoy `CollectionValueSnapshot` parece guardar solo el total. Guardar también el histórico por moneda permite ver tendencias individuales.

### F-10 — Detección de duplicados por hash perceptual al guardar
Cuando se añade una moneda, comparar su foto con las existentes (no solo título/numista_id) y avisar de potenciales duplicados. Combina con F-4.

### F-11 — Modo "Inventario rápido"
Cámara continua que reconoce → autofill mínimo → siguiente. Para añadir 20 monedas seguidas sin entrar y salir de pantallas.

### F-12 — Plantillas de export (CSV, PDF de catálogo)
Generar PDF con thumbnails + ficha técnica de toda la colección. Útil para seguros o intercambios.

### F-13 — Tags libres además de las categorías cerradas
Texto libre, autocompletado con tags existentes. Más flexible que crear N categorías.

### F-14 — Migración a Reanimated 3 + Gesture Handler para pinch-zoom
Reemplaza el `Modal` de zoom actual por un viewer con pellizco y arrastrar para cerrar.

---

## 6. Plan sugerido por bloques (orden recomendado)

Si me dices "adelante con el bloque N", lo aplico:

**Bloque A — Higiene y bugs visibles (1-2 sesiones)**
B-1, B-2, B-3, B-7, B-8, B-9, B-12, B-13.

**Bloque B — Centralización y refactor (1 sesión)**
R-1 (tokens), R-2/R-3/R-4/R-5 (extraer comunes), R-10.

**Bloque C — Rendimiento crítico (1-2 sesiones)**
P-2 (compresión y persistencia de imágenes), P-3 (expo-image), P-5 (closures de contexto), P-6 (FlatList), P-4 (debounce + memo).

**Bloque D — UX (varias sesiones, ir picando)**
U-2 (haptics), U-3 (mejor identificación), U-4 (preview de foto), B-6/F-14 (zoom moderno), U-7 (pull-to-refresh), U-8.

**Bloque E — Storage serio (sesión densa)**
P-1: migración AsyncStorage → SQLite o MMKV. Es invasivo pero es la única forma de escalar más allá de 500 piezas con fluidez.

**Bloque F — Funcionalidades nuevas**
Las que marques de F-1…F-14.

---

## 7. Dudas que necesito resolver contigo

1. **Encoding**: ¿prefieres que normalice todos los strings a UTF-8 con tildes/eñes en un único PR, o pantalla a pantalla?
2. **Storage**: ¿la colección típica esperada está en cientos o en miles? Si son cientos, P-1 puede esperar; si son miles, es prioritario.
3. **eBay Finding API**: está deprecada. ¿Tienes plan B (Browse API con OAuth) o nos quedamos mientras funcione?
4. **Identificación visual (P-7)**: ¿quieres mantener el "ranking" actual aunque sea aproximado, o lo retiramos hasta tener un pHash real?
5. **Catálogos por defecto** (`defaults.ts`): ¿son fijos o el usuario los cambia? Si los cambia, no debería reescribir IDs nuevos cada vez (`newId()` se ejecuta al importar el módulo — ver tema).

---

Dame los IDs (o bloques) que quieres aplicar y procedo.
