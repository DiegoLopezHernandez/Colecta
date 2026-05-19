export type CoinRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare';

export type CoinCondition =
  | 'Poor'
  | 'Fair'
  | 'Good'
  | 'Very Good'
  | 'Fine'
  | 'Very Fine'
  | 'Extremely Fine'
  | 'About Uncirculated'
  | 'Uncirculated'
  | 'Mint State';

export const COIN_CONDITIONS: CoinCondition[] = [
  'Poor',
  'Fair',
  'Good',
  'Very Good',
  'Fine',
  'Very Fine',
  'Extremely Fine',
  'About Uncirculated',
  'Uncirculated',
  'Mint State',
];

export const COIN_RARITIES: CoinRarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Very Rare',
];

export interface CoinItem {
  id: string;
  module: 'coin';
  numista_id?: number;
  title: string;
  country: string;
  year: number;
  denomination?: string;
  composition?: string;
  weight_g?: number;
  diameter_mm?: number;
  mintage?: number;
  rarity?: CoinRarity;
  numista_min_value?: number;
  numista_typical_value?: number;
  numista_max_value?: number;
  numista_url?: string;
  ebay_last_price?: number;
  ebay_last_price_currency?: string;
  ebay_last_price_date?: string;
  ebay_last_price_updated_at?: string;
  ebay_price_not_found?: boolean;
  frontImageUri: string;
  backImageUri?: string;
  officialObverseUrl?: string;
  officialReverseUrl?: string;
  condition: CoinCondition;
  possessionStatusId: string;
  categoryId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NumistaCandidate {
  numista_id: number;
  title: string;
  country: string;
  year: number;
  obverse_thumb?: string;
  reverse_thumb?: string;
  hammingDistance?: number;
  confidence?: number;
}

export interface NumistaFullData {
  numista_id: number;
  title: string;
  country: string;
  year: number;
  denomination?: string;
  composition?: string;
  weight_g?: number;
  diameter_mm?: number;
  mintage?: number;
  rarity?: CoinRarity;
  numista_min_value?: number;
  numista_typical_value?: number;
  numista_max_value?: number;
  officialObverseUrl?: string;
  officialReverseUrl?: string;
  numista_url?: string;
}
