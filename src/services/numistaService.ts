import type { NumistaCandidate, NumistaFullData, CoinRarity } from '@/types';

const BASE = 'https://api.numista.com/api/v3';

function authHeaders(apiKey: string): HeadersInit {
  return {
    Accept: 'application/json',
    'Numista-API-Key': apiKey,
  };
}

export class NumistaError extends Error {
  status?: number;
  constructor(msg: string, status?: number) {
    super(msg);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Cache en memoria (session)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

interface CacheEntry {
  data: NumistaCandidate[];
  ts: number;
}

const candidateCache = new Map<string, CacheEntry>();

function cacheKey(countryCode: string, year: number, query?: string): string {
  return `${countryCode.toUpperCase()}-${year}-${query?.trim().toLowerCase() || ''}`;
}

export function clearNumistaCache(): void {
  candidateCache.clear();
}

// ---------------------------------------------------------------------------

interface NumistaSearchResponse {
  count: number;
  types: Array<{
    id: number;
    title: string;
    category?: string;
    min_year?: number;
    max_year?: number;
    issuer?: { code?: string; name?: string };
    obverse_thumbnail?: string;
    reverse_thumbnail?: string;
  }>;
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const res = await fetch(`${BASE}/types?q=euro&count=1&page=1&lang=es`, {
    headers: authHeaders(apiKey),
  });
  return res.ok;
}

const ISSUER_SLUG: Record<string, string> = {
  ES: 'spain', FR: 'france', DE: 'germany', IT: 'italy', PT: 'portugal',
  GB: 'united-kingdom', US: 'united-states', CA: 'canada', MX: 'mexico',
  BR: 'brazil', AR: 'argentina', JP: 'japan', CN: 'china', RU: 'russia',
  CH: 'switzerland', NL: 'netherlands', BE: 'belgium', AT: 'austria',
  SE: 'sweden', NO: 'norway', DK: 'denmark', FI: 'finland', PL: 'poland',
  GR: 'greece', IE: 'ireland', AU: 'australia', NZ: 'new-zealand',
  IN: 'india', KR: 'korea-south', TR: 'turkey', MA: 'morocco',
  ZA: 'south-africa', EG: 'egypt', IL: 'israel', AE: 'united-arab-emirates',
  CL: 'chile', CO: 'colombia', PE: 'peru', UY: 'uruguay', VE: 'venezuela',
  CU: 'cuba', DO: 'dominican-republic', PA: 'panama', CR: 'costa-rica',
  CZ: 'czech-republic', SK: 'slovakia', HU: 'hungary', RO: 'romania',
  BG: 'bulgaria', HR: 'croatia', SI: 'slovenia', EE: 'estonia',
  LV: 'latvia', LT: 'lithuania', UA: 'ukraine', RS: 'serbia',
  LU: 'luxembourg', IS: 'iceland', AD: 'andorra', MC: 'monaco',
  SM: 'san-marino', VA: 'vatican-city', MT: 'malta', CY: 'cyprus',
};

/**
 * Buscar candidatos por pais y query opcional.
 * NOTA: Numista API v3 /types NO acepta year_min ni year_max — causan 400.
 * Filtrado por ano: se hace client-side usando min_year/max_year de la respuesta.
 * Los resultados se cachean 30 min por clave (pais, ano, query).
 */
export async function searchCandidates(
  apiKey: string,
  countryCode: string,
  year: number,
  query?: string
): Promise<NumistaCandidate[]> {
  if (!apiKey) throw new NumistaError('Falta la API key de Numista.');

  // Comprobar cache
  const key = cacheKey(countryCode, year, query);
  const cached = candidateCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    console.log('[numista] cache hit:', key);
    return cached.data;
  }

  const slug = ISSUER_SLUG[countryCode.toUpperCase()];
  const params = new URLSearchParams();
  params.set('category', 'coin');
  if (slug) params.set('issuer', slug);
  const qParts: string[] = [String(year)];
  if (query && query.trim()) qParts.push(query.trim());
  params.set('q', qParts.join(' '));
  params.set('count', '50');
  params.set('page', '1');
  params.set('lang', 'es');

  const url = `${BASE}/types?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(apiKey) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new NumistaError(
      `Numista ${res.status}: ${txt.slice(0, 200)} | url=${url}`,
      res.status
    );
  }
  const data = (await res.json()) as NumistaSearchResponse;

  const TOLERANCE = 5;
  const raw = data.types || [];
  const yearFiltered = raw.filter((t) => {
    const maxY = t.max_year ?? t.min_year;
    const minY = t.min_year ?? t.max_year;
    if (maxY === undefined && minY === undefined) return true;
    if (maxY !== undefined && maxY < year - TOLERANCE) return false;
    if (minY !== undefined && minY > year + TOLERANCE) return false;
    return true;
  });

  yearFiltered.sort((a, b) => {
    const aY = a.min_year ?? a.max_year ?? 0;
    const bY = b.min_year ?? b.max_year ?? 0;
    return Math.abs(aY - year) - Math.abs(bY - year);
  });

  const result: NumistaCandidate[] = yearFiltered.map((t) => ({
    numista_id: t.id,
    title: t.title,
    country: t.issuer?.name || countryCode,
    year,
    obverse_thumb: t.obverse_thumbnail,
    reverse_thumb: t.reverse_thumbnail,
  }));

  // Guardar en cache
  candidateCache.set(key, { data: result, ts: Date.now() });

  return result;
}

interface NumistaTypeDetail {
  id: number;
  title: string;
  category?: string;
  min_year?: number;
  max_year?: number;
  issuer?: { code?: string; name?: string };
  value?: {
    numeric_value?: number;
    text?: string;
    currency?: { name?: string; short_name?: string };
  };
  composition?: string | {
    text?: string;
    name?: string;
    base?: string;
    additional_details?: string;
  };
  weight?: number;
  size?: number;
  thickness?: number;
  mintage?: number | { total?: number };
  rarity?: string;
  price?: { min?: number; avg?: number; max?: number; currency?: string };
  obverse?: { picture?: string; thumbnail?: string; description?: string };
  reverse?: { picture?: string; thumbnail?: string; description?: string };
  url?: string;
}

function resolveComposition(raw: NumistaTypeDetail['composition']): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw;
  return raw.text || raw.name || raw.base || undefined;
}

function resolveMintage(raw: NumistaTypeDetail['mintage']): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') return raw;
  return raw.total;
}

function mapRarity(s?: string): CoinRarity | undefined {
  if (!s) return undefined;
  const v = s.toLowerCase();
  if (v.includes('very rare')) return 'Very Rare';
  if (v.includes('rare')) return 'Rare';
  if (v.includes('uncommon')) return 'Uncommon';
  if (v.includes('common')) return 'Common';
  return undefined;
}

export async function fetchFullData(
  apiKey: string,
  numistaId: number
): Promise<NumistaFullData> {
  if (!apiKey) throw new NumistaError('Falta la API key de Numista.');
  const url = `${BASE}/types/${numistaId}?lang=es`;
  const res = await fetch(url, { headers: authHeaders(apiKey) });
  if (!res.ok) {
    throw new NumistaError(`Numista respondió ${res.status}`, res.status);
  }
  const t = (await res.json()) as NumistaTypeDetail;

  const denomination =
    t.value?.text ||
    (t.value?.numeric_value !== undefined
      ? `${t.value.numeric_value}${t.value.currency?.short_name ? ' ' + t.value.currency.short_name : ''}`
      : undefined);

  return {
    numista_id: t.id,
    title: t.title,
    country: t.issuer?.name || '',
    year: t.min_year || t.max_year || 0,
    denomination,
    composition: resolveComposition(t.composition),
    weight_g: t.weight,
    diameter_mm: t.size,
    mintage: resolveMintage(t.mintage),
    rarity: mapRarity(t.rarity),
    numista_min_value: t.price?.min,
    numista_typical_value: t.price?.avg,
    numista_max_value: t.price?.max,
    officialObverseUrl: t.obverse?.picture || t.obverse?.thumbnail,
    officialReverseUrl: t.reverse?.picture || t.reverse?.thumbnail,
    numista_url: t.url,
  };
}
