import type { NumistaCandidate, NumistaFullData, CoinRarity } from '@/types';

const BASE = 'https://api.numista.com/api/v3';

/**
 * Numista API v3.
 * Auth: header `Numista-API-Key: <key>`.
 * Documentación: https://api.numista.com/api-doc.html
 * NOTA: si la API cambia a OAuth, ajustar `authHeaders()`.
 */
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

/**
 * Verifica si la API key es válida realizando una llamada mínima.
 */
export async function verifyApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  const res = await fetch(`${BASE}/types?q=euro&count=1&page=1&lang=es`, {
    headers: authHeaders(apiKey),
  });
  return res.ok;
}

/**
 * Buscar candidatos por país y año.
 * @param countryCode ISO Alpha-2 (ES, FR, US...)
 * @param year año exacto
 */
export async function searchCandidates(
  apiKey: string,
  countryCode: string,
  year: number
): Promise<NumistaCandidate[]> {
  if (!apiKey) throw new NumistaError('Falta la API key de Numista.');
  const params = new URLSearchParams({
    q: '',
    issuer: countryCode.toLowerCase(),
    category: 'coin',
    year: String(year),
    count: '20',
    page: '1',
    lang: 'es',
  });
  const url = `${BASE}/types?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(apiKey) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new NumistaError(
      `Numista respondió ${res.status}: ${txt.slice(0, 120)}`,
      res.status
    );
  }
  const data = (await res.json()) as NumistaSearchResponse;
  return (data.types || []).map((t) => ({
    numista_id: t.id,
    title: t.title,
    country: t.issuer?.name || countryCode,
    year,
    obverse_thumb: t.obverse_thumbnail,
    reverse_thumb: t.reverse_thumbnail,
  }));
}

interface NumistaTypeDetail {
  id: number;
  title: string;
  category?: string;
  min_year?: number;
  max_year?: number;
  issuer?: { code?: string; name?: string };
  value?: { numeric?: number; text?: string };
  composition?: { text?: string; name?: string };
  weight?: number;
  size?: number;
  mintage?: { total?: number };
  rarity?: string;
  price?: { min?: number; avg?: number; max?: number; currency?: string };
  obverse?: { picture?: string; thumbnail?: string };
  reverse?: { picture?: string; thumbnail?: string };
  url?: string;
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

/**
 * Detalle completo del tipo por id.
 */
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
  return {
    numista_id: t.id,
    title: t.title,
    country: t.issuer?.name || '',
    year: t.min_year || t.max_year || 0,
    denomination: t.value?.text,
    composition: t.composition?.text || t.composition?.name,
    weight_g: t.weight,
    diameter_mm: t.size,
    mintage: t.mintage?.total,
    rarity: mapRarity(t.rarity),
    numista_min_value: t.price?.min,
    numista_typical_value: t.price?.avg,
    numista_max_value: t.price?.max,
    officialObverseUrl: t.obverse?.picture || t.obverse?.thumbnail,
    officialReverseUrl: t.reverse?.picture || t.reverse?.thumbnail,
    numista_url: t.url,
  };
}
