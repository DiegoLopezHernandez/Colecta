import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Procesamiento de imágenes capturadas.
 *
 * Problema que resuelve:
 *   - La URI nativa de la cámara apunta al directorio caché del sistema (volátil:
 *     el SO puede limpiarlo). Si no copiamos a un directorio persistente, las
 *     fotos guardadas en la colección desaparecen al cabo del tiempo.
 *   - Las fotos en bruto pesan varios MB. Antes de persistirlas las redimensionamos
 *     a un máximo razonable y las recomprimimos.
 */

const MAX_DIM = 1600; // px en el lado mayor; suficiente para mostrar y zoom
const QUALITY = 0.7;

const PHOTOS_DIR =
  (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + 'photos/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Procesa una foto: redimensiona, recomprime y la mueve a almacenamiento
 * persistente. Devuelve la URI final que debe guardarse en el modelo.
 * Si algo falla, devuelve la URI original (mejor degradación que perder la foto).
 */
export async function processAndPersistPhoto(sourceUri: string): Promise<string> {
  if (!sourceUri) return sourceUri;
  try {
    await ensureDir();
    const manipulated = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width: MAX_DIM } }],
      { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const target = PHOTOS_DIR + filename;
    await FileSystem.moveAsync({ from: manipulated.uri, to: target });
    return target;
  } catch (e) {
    console.warn('[image] processAndPersistPhoto fallback', e);
    return sourceUri;
  }
}

/**
 * Borra una foto persistida en /photos/. Tolera URIs externas (no /photos/)
 * sin error: simplemente no hace nada.
 */
export async function deletePersistedPhoto(uri: string | undefined): Promise<void> {
  if (!uri) return;
  if (!uri.startsWith(PHOTOS_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    console.warn('[image] deletePersistedPhoto', e);
  }
}
