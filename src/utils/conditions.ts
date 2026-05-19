import type { CoinCondition, CoinRarity } from '@/types';

export const CONDITION_LABEL_ES: Record<CoinCondition, string> = {
  Poor: 'Mala (P)',
  Fair: 'Aceptable (F)',
  Good: 'Buena (G)',
  'Very Good': 'Muy Buena (VG)',
  Fine: 'Bien (F)',
  'Very Fine': 'Muy Bien (MBC)',
  'Extremely Fine': 'Excelente (EBC)',
  'About Uncirculated': 'Casi Sin Circular (SC-)',
  Uncirculated: 'Sin Circular (SC)',
  'Mint State': 'Flor de Cuño (FDC)',
};

export const RARITY_LABEL_ES: Record<CoinRarity, string> = {
  Common: 'Común',
  Uncommon: 'Poco común',
  Rare: 'Rara',
  'Very Rare': 'Muy rara',
};

export const RARITY_ORDER: Record<CoinRarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  'Very Rare': 3,
};
