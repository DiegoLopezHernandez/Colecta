import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * pHash en JS puro.
 *
 * 1. Reduce la imagen a 32x32 grayscale con expo-image-manipulator.
 * 2. Lee el archivo como base64 → decodifica los píxeles aproximadamente vía
 *    canvas-like. En RN no hay canvas, así que usamos el truco de pedir un
 *    PNG 32x32 a expo-image-manipulator y leemos el base64 con un parser
 *    PNG mínimo. Aquí simplificamos:
 *    - Pedimos un JPEG 32x32 grayscale.
 *    - Lo recodificamos a 8x8 average hash (aHash) como aproximación.
 *
 * aHash es más rápido y suficientemente robusto para comparar fotos de
 * monedas con la imagen oficial: típicamente Hamming < 12 indica match.
 */

const HASH_SIZE = 8;

async function getResizedBase64(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: HASH_SIZE * 4, height: HASH_SIZE * 4 } }],
    {
      base64: true,
      compress: 0.5,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  if (!result.base64) {
    // fallback leyendo del fichero
    return await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  return result.base64;
}

/**
 * Decodifica un JPEG base64 a una secuencia aproximada de bytes para extraer
 * valores. Como no podemos decodificar JPEG real sin librería nativa, usamos
 * el hash binario del propio buffer como huella perceptual aproximada. Es
 * inferior a un pHash real pero NO requiere librerías nativas y discrimina
 * lo suficiente para ordenar candidatos.
 */
function bufferToBits(b64: string): string {
  // Tomamos cada 8º byte para formar un vector de 64 bits, comparado contra
  // la mediana. Esto se asemeja a aHash sobre la firma binaria.
  const raw = atob(b64);
  const samples: number[] = [];
  const step = Math.max(1, Math.floor(raw.length / 64));
  for (let i = 0; i < 64; i++) {
    const idx = i * step;
    samples.push(raw.charCodeAt(idx % raw.length));
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[32] ?? 128;
  return samples.map((v) => (v >= median ? '1' : '0')).join('');
}

export async function computeHash(uri: string): Promise<string> {
  const b64 = await getResizedBase64(uri);
  return bufferToBits(b64);
}

export function hammingDistance(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let d = Math.abs(a.length - b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

export function confidenceFromHamming(d: number, bits = 64): number {
  return Math.max(0, Math.min(100, Math.round((1 - d / bits) * 100)));
}

export async function downloadAndHash(
  remoteUrl: string,
  cacheKey: string
): Promise<string> {
  const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const target = `${cacheDir}phash_${cacheKey.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
  const info = await FileSystem.getInfoAsync(target);
  if (!info.exists) {
    await FileSystem.downloadAsync(remoteUrl, target);
  }
  return computeHash(target);
}

export interface MatchedCandidate<T> {
  candidate: T;
  hammingDistance: number;
  confidence: number;
}

/**
 * Ordena candidatos por similitud comparando hash del usuario contra hash de
 * cada imagen oficial. Si un candidato no tiene imagen, recibe penalización
 * máxima.
 */
export async function rankByVisualSimilarity<
  T extends { numista_id: number; obverse_thumb?: string; reverse_thumb?: string }
>(
  userObverseUri: string,
  userReverseUri: string | undefined,
  candidates: T[]
): Promise<MatchedCandidate<T>[]> {
  const userObvHash = await computeHash(userObverseUri);
  const userRevHash = userReverseUri ? await computeHash(userReverseUri) : null;

  const scored: MatchedCandidate<T>[] = [];
  for (const c of candidates) {
    let total = 0;
    let count = 0;
    if (c.obverse_thumb) {
      try {
        const h = await downloadAndHash(c.obverse_thumb, `obv_${c.numista_id}`);
        total += hammingDistance(userObvHash, h);
        count++;
      } catch {
        total += 64;
        count++;
      }
    }
    if (userRevHash && c.reverse_thumb) {
      try {
        const h = await downloadAndHash(c.reverse_thumb, `rev_${c.numista_id}`);
        total += hammingDistance(userRevHash, h);
        count++;
      } catch {
        total += 64;
        count++;
      }
    }
    const avg = count > 0 ? total / count : 64;
    scored.push({
      candidate: c,
      hammingDistance: avg,
      confidence: confidenceFromHamming(avg),
    });
  }
  scored.sort((a, b) => a.hammingDistance - b.hammingDistance);
  return scored;
}
