import type {
  AppConfig,
  Category,
  ObjectType,
  PossessionStatus,
} from '@/types';
import { newId } from './id';

export const buildDefaultCoinCategories = (): Category[] => [
  { id: newId(), name: 'Euro', color: '#3b82f6', emoji: '€' },
  { id: newId(), name: 'Europa pre-Euro', color: '#8b5cf6', emoji: '🏛️' },
  { id: newId(), name: 'Europa no-Euro', color: '#06b6d4', emoji: '🇪🇺' },
  { id: newId(), name: 'Asia Moderna', color: '#ef4444', emoji: '🐉' },
  { id: newId(), name: 'África Moderna', color: '#f59e0b', emoji: '🌍' },
  { id: newId(), name: 'Oceanía', color: '#10b981', emoji: '🦘' },
  { id: newId(), name: 'América Moderna', color: '#f97316', emoji: '🗽' },
  { id: newId(), name: 'África Antigua', color: '#84cc16', emoji: '🏺' },
  { id: newId(), name: 'América Antigua', color: '#ec4899', emoji: '🛕' },
  { id: newId(), name: 'Asia Antigua', color: '#a855f7', emoji: '⛩️' },
];

export const buildDefaultObjectCategories = (): Category[] => [
  { id: newId(), name: 'Coleccionable', color: '#3b82f6', emoji: '⭐' },
  { id: newId(), name: 'Vintage', color: '#a855f7', emoji: '🕰️' },
  { id: newId(), name: 'Moderno', color: '#22c55e', emoji: '✨' },
];

export const buildDefaultObjectTypes = (): ObjectType[] => [
  { id: newId(), name: 'Carta deportiva', emoji: '🏆' },
  { id: newId(), name: 'Carta Pokémon', emoji: '🎴' },
  { id: newId(), name: 'Figura', emoji: '🧸' },
  { id: newId(), name: 'Libro', emoji: '📚' },
  { id: newId(), name: 'Otro', emoji: '📦' },
];

export const buildDefaultPossessionStatuses = (): PossessionStatus[] => [
  { id: newId(), name: 'Tengo', emoji: '✅', color: '#22c55e' },
  { id: newId(), name: 'Quiero', emoji: '🎯', color: '#3b82f6' },
  { id: newId(), name: 'Cambio', emoji: '🔄', color: '#f59e0b' },
];

export const buildDefaultConfig = (): AppConfig => ({
  numistaApiKey: '',
  ebayClientId: '',
  ebayClientSecret: '',
  coinCategories: buildDefaultCoinCategories(),
  objectCategories: buildDefaultObjectCategories(),
  objectTypes: buildDefaultObjectTypes(),
  possessionStatuses: buildDefaultPossessionStatuses(),
  coinVisibleFilters: [
    'search',
    'category',
    'possessionStatus',
    'rarity',
    'condition',
    'priceRange',
    'country',
    'yearRange',
  ],
  objectVisibleFilters: [
    'search',
    'type',
    'category',
    'possessionStatus',
    'priceRange',
  ],
  duplicateDetection: {
    enabled: true,
    coinCriteria: 'numista_id',
    objectCriteria: 'exact',
    similarityThreshold: 80,
  },
  ebayRequestDelay: 500,
  priceUpdateOnlyWithPrice: true,
});
