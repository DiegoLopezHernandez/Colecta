export interface Category {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface ObjectType {
  id: string;
  name: string;
  emoji: string;
}

export interface PossessionStatus {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export type CoinFilterKey =
  | 'search'
  | 'category'
  | 'possessionStatus'
  | 'rarity'
  | 'condition'
  | 'priceRange'
  | 'country'
  | 'yearRange';

export type ObjectFilterKey =
  | 'search'
  | 'type'
  | 'category'
  | 'possessionStatus'
  | 'priceRange';

export type CoinDuplicateCriteria = 'numista_id' | 'name_year' | 'both';
export type ObjectDuplicateCriteria = 'exact' | 'similar';

export interface DuplicateDetectionConfig {
  enabled: boolean;
  coinCriteria: CoinDuplicateCriteria;
  objectCriteria: ObjectDuplicateCriteria;
  similarityThreshold: number; // 0..100
}

export interface AppConfig {
  numistaApiKey: string;
  ebayClientId: string;
  ebayClientSecret: string;
  coinCategories: Category[];
  objectCategories: Category[];
  objectTypes: ObjectType[];
  possessionStatuses: PossessionStatus[];
  coinVisibleFilters: CoinFilterKey[];
  objectVisibleFilters: ObjectFilterKey[];
  duplicateDetection: DuplicateDetectionConfig;
  ebayRequestDelay: number; // ms
  priceUpdateOnlyWithPrice: boolean;
  lastFullUpdateAt?: string; // ISO
}
