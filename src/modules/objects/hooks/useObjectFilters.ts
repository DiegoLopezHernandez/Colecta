import { useMemo, useState } from 'react';
import type { ObjectItem } from '@/types';

export type ObjectSortKey = 'date' | 'name' | 'price';

export interface ObjectFilterState {
  search: string;
  typeId?: string;
  categoryId?: string;
  possessionStatusId?: string;
  priceMin?: number;
  priceMax?: number;
  sort: ObjectSortKey;
  sortDir: 'asc' | 'desc';
}

export const defaultObjectFilterState: ObjectFilterState = {
  search: '',
  sort: 'date',
  sortDir: 'desc',
};

export function useObjectFilters(items: ObjectItem[]) {
  const [state, setState] = useState<ObjectFilterState>(defaultObjectFilterState);

  const filtered = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    let arr = items.filter((o) => {
      if (term && !o.name.toLowerCase().includes(term)) return false;
      if (state.typeId && o.typeId !== state.typeId) return false;
      if (state.categoryId && o.categoryId !== state.categoryId) return false;
      if (
        state.possessionStatusId &&
        o.possessionStatusId !== state.possessionStatusId
      )
        return false;
      const price = o.ebay_last_price;
      if (state.priceMin && (price ?? 0) < state.priceMin) return false;
      if (state.priceMax && (price ?? Infinity) > state.priceMax) return false;
      return true;
    });
    const dir = state.sortDir === 'asc' ? 1 : -1;
    arr = [...arr].sort((a, b) => {
      switch (state.sort) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'price':
          return ((a.ebay_last_price ?? 0) - (b.ebay_last_price ?? 0)) * dir;
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
