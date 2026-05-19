/**
 * eBay Finding API (legacy, deprecada pero funcional).
 * Devuelve listings VENDIDOS (sold/completed) reales.
 *
 * Auth: solo App ID (alias del Client ID, no requiere Client Secret).
 * Endpoint: https://svcs.ebay.com/services/search/FindingService/v1
 * Operación principal: findCompletedItems con filter SoldItemsOnly=true.
 * Fallback automático: findItemsAdvanced (activos) si findCompletedItems no
 * está disponible para la cuenta.
 *
 * Marketplace por defecto: EBAY-ES (España, EUR).
 */
export type EbayPriceSource = 'sold' | 'active' | 'none';

export interface EbayPriceResult {
  price: number;
  currency: string;
  endDate?: string; // ISO. Sólo para sold; en active, fecha de listado.
  itemUrl?: string;
  title?: string;
  source: EbayPriceSource;
}

const FINDING_ENDPOINT = 'https://svcs.ebay.com/services/search/FindingService/v1';

export class EbayError extends Error {
  status?: number;
  constructor(msg: string, status?: number) {
    super(msg);
    this.status = status;
  }
}

function commonHeaders(appId: string, operation: string, globalId: string) {
  return {
    'X-EBAY-SOA-OPERATION-NAME': operation,
    'X-EBAY-SOA-SECURITY-APPNAME': appId,
    'X-EBAY-SOA-GLOBAL-ID': globalId,
    'X-EBAY-SOA-RESPONSE-DATA-FORMAT': 'JSON',
    'X-EBAY-SOA-SERVICE-VERSION': '1.13.0',
  } as HeadersInit;
}

function buildQuery(
  operation: 'findCompletedItems' | 'findItemsAdvanced',
  keywords: string,
  options: {
    soldOnly?: boolean;
    entriesPerPage?: number;
  } = {}
): string {
  const params = new URLSearchParams();
  params.set('keywords', keywords);
  params.set('paginationInput.entriesPerPage', String(options.entriesPerPage ?? 5));
  params.set('sortOrder', 'EndTimeSoonest');
  if (operation === 'findCompletedItems' && options.soldOnly) {
    params.set('itemFilter(0).name', 'SoldItemsOnly');
    params.set('itemFilter(0).value', 'true');
  }
  return params.toString();
}

interface FindingItem {
  itemId?: [string];
  title?: [string];
  viewItemURL?: [string];
  sellingStatus?: [
    {
      currentPrice?: [{ '@currencyId': string; __value__: string }];
      convertedCurrentPrice?: [{ '@currencyId': string; __value__: string }];
    }
  ];
  listingInfo?: [{ endTime?: [string]; startTime?: [string] }];
}

interface FindingResponse {
  [k: string]: Array<{
    ack?: ['Success' | 'Warning' | 'Failure'];
    errorMessage?: unknown;
    searchResult?: [{ '@count': string; item?: FindingItem[] }];
  }>;
}

function extractFromResponse(json: FindingResponse, opName: string): EbayPriceResult | null {
  const root = json[`${opName}Response`];
  if (!root || !root[0]) return null;
  const r = root[0];
  if (r.ack && r.ack[0] === 'Failure') {
    return null;
  }
  const items = r.searchResult?.[0]?.item;
  if (!items || items.length === 0) return null;
  // Tomar la primera (más reciente por EndTimeSoonest)
  const it = items[0]!;
  const ss = it.sellingStatus?.[0];
  const price = ss?.currentPrice?.[0] ?? ss?.convertedCurrentPrice?.[0];
  if (!price) return null;
  const amount = parseFloat(price.__value__);
  if (isNaN(amount)) return null;
  return {
    price: amount,
    currency: price['@currencyId'] || 'EUR',
    endDate: it.listingInfo?.[0]?.endTime?.[0],
    itemUrl: it.viewItemURL?.[0],
    title: it.title?.[0],
    source: 'none', // se asigna por quien llama
  };
}

/**
 * Verifica si las credenciales eBay son válidas haciendo una llamada mínima
 * a findItemsAdvanced (siempre disponible para cualquier App ID válido).
 */
export async function verifyCredentials(
  appId: string,
  globalId = 'EBAY-ES'
): Promise<boolean> {
  if (!appId) return false;
  const url = `${FINDING_ENDPOINT}?${buildQuery('findItemsAdvanced', 'test', {
    entriesPerPage: 1,
  })}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: commonHeaders(appId, 'findItemsAdvanced', globalId),
  });
  return res.ok;
}

/**
 * Consulta el último precio vendido. Si findCompletedItems falla
 * (típicamente porque la App no tiene acceso a SoldItemsOnly),
 * hace fallback a findItemsAdvanced (precio de listado activo).
 *
 * Devuelve null si no hay resultados en ninguna ruta.
 */
export async function fetchLastPrice(
  appId: string,
  keywords: string,
  globalId = 'EBAY-ES'
): Promise<EbayPriceResult | null> {
  if (!appId) throw new EbayError('Falta el App ID de eBay (Client ID).');
  if (!keywords || !keywords.trim()) return null;

  // 1) Intentar findCompletedItems con SoldItemsOnly
  try {
    const url = `${FINDING_ENDPOINT}?${buildQuery('findCompletedItems', keywords, {
      soldOnly: true,
      entriesPerPage: 5,
    })}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: commonHeaders(appId, 'findCompletedItems', globalId),
    });
    if (res.ok) {
      const json = (await res.json()) as FindingResponse;
      const r = extractFromResponse(json, 'findCompletedItems');
      if (r) return { ...r, source: 'sold' };
    }
  } catch (e) {
    console.warn('[ebayService] findCompletedItems failed, falling back', e);
  }

  // 2) Fallback a findItemsAdvanced (precio activo)
  try {
    const url = `${FINDING_ENDPOINT}?${buildQuery('findItemsAdvanced', keywords, {
      entriesPerPage: 5,
    })}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: commonHeaders(appId, 'findItemsAdvanced', globalId),
    });
    if (!res.ok) {
      throw new EbayError(`eBay respondió ${res.status}`, res.status);
    }
    const json = (await res.json()) as FindingResponse;
    const r = extractFromResponse(json, 'findItemsAdvanced');
    if (r) return { ...r, source: 'active' };
  } catch (e) {
    if (e instanceof EbayError) throw e;
    throw new EbayError(`Error consultando eBay: ${(e as Error).message}`);
  }

  return null;
}

/**
 * Búsqueda con varios resultados para "Optional visual match" del módulo Objects.
 */
export async function searchListings(
  appId: string,
  keywords: string,
  limit = 6,
  globalId = 'EBAY-ES'
): Promise<
  Array<{ title: string; price: number; currency: string; itemUrl?: string; imageUrl?: string }>
> {
  if (!appId) throw new EbayError('Falta el App ID de eBay (Client ID).');
  const params = new URLSearchParams();
  params.set('keywords', keywords);
  params.set('paginationInput.entriesPerPage', String(limit));
  params.set('sortOrder', 'BestMatch');
  params.set('outputSelector(0)', 'PictureURLLarge');
  params.set('outputSelector(1)', 'GalleryInfo');
  const url = `${FINDING_ENDPOINT}?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: commonHeaders(appId, 'findItemsAdvanced', globalId),
  });
  if (!res.ok) throw new EbayError(`eBay respondió ${res.status}`, res.status);
  const json = (await res.json()) as FindingResponse;
  const root = json['findItemsAdvancedResponse'];
  const items = root?.[0]?.searchResult?.[0]?.item || [];
  const result: Array<{
    title: string;
    price: number;
    currency: string;
    itemUrl?: string;
    imageUrl?: string;
  }> = [];
  for (const it of items as Array<FindingItem & {
    galleryURL?: [string];
    pictureURLLarge?: [string];
  }>) {
    const ss = it.sellingStatus?.[0];
    const p = ss?.currentPrice?.[0] ?? ss?.convertedCurrentPrice?.[0];
    if (!p) continue;
    result.push({
      title: it.title?.[0] || '',
      price: parseFloat(p.__value__),
      currency: p['@currencyId'] || 'EUR',
      itemUrl: it.viewItemURL?.[0],
      imageUrl: it.pictureURLLarge?.[0] || it.galleryURL?.[0],
    });
  }
  return result;
}
