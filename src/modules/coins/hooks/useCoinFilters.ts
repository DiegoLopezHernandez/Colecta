import { useMemo, useState } from 'react';
import type { CoinItem, CoinRarity, CoinCondition } from '@/types';
import { RARITY_ORDER } from '@/utils/conditions';

export type CoinSortKey = 'date' | 'year' | 'country' | 'rarity' | 'price';

export interface CoinFilterState {
  search: string;
  categoryId?: string;
  possessionStatusId?: string;
  rarity?: CoinRarity;
  condition?: CoinCondition;
  priceMin?: number;
  priceMax?: number;
  country?: string;
  yearMin?: number;
  yearMax?: number;
  sort: CoinSortKey;
  sortDir: 'asc' | 'desc';
}

export const defaultCoinFilterState: CoinFilterState = {
  search: '',
  sort: 'date',
  sortDir: 'desc',
};

export function useCoinFilters(items: CoinItem[]) {
  const [state, setState] = useState<CoinFilterState>(defaultCoinFilterState);

  const filtered = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    let arr = items.filter((c) => {
      if (term) {
        const hay = `${c.title} ${c.country} ${c.year} ${c.denomination ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (state.categoryId && c.categoryId !== state.categoryId) return false;
      if (
        state.possessionStatusId &&
        c.possessionStatusId !== state.possessionStatusId
      )
        return false;
      if (state.rarity && c.rarity !== state.rarity) return false;
      if (state.condition && c.condition !== state.condition) return false;
      if (state.country && c.country !== state.country) return false;
      if (state.yearMin && c.year < state.yearMin) return false;
      if (state.yearMax && c.year > state.yearMax) return false;
      const price = c.ebay_last_price ?? c.numista_typical_value;
      if (state.priceMin && (price ?? 0) < state.priceMin) return false;
      if (state.priceMax && (price ?? Infinity) > state.priceMax) return false;
      return true;
    });

    const dir = state.sortDir === 'asc' ? 1 : -1;
    arr = [...arr].sort((a, b) => {
      switch (state.sort) {
        case 'year':
          return (a.year - b.year) * dir;
        case 'country':
          return a.country.localeCompare(b.country) * dir;
        case 'rarity':
          return (
            ((a.rarity ? RARITY_ORDER[a.rarity] : -1) -
              (b.rarity ? RARITY_ORDER[b.rarity] : -1)) *
            dir
          );
        case 'price': {
          const pa = a.ebay_last_price ?? a.numista_typical_value ?? 0;
          const pb = b.ebay_last_price ?? b.numista_typical_value ?? 0;
          return (pa - pb) * dir;
        }
        case 'date':
        default:
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
            dir
          );
      }
    });
    return arr;
  }, [items, state]);

  return { state, setState, filtered };
}
