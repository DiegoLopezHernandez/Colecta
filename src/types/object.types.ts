export interface ObjectItem {
  id: string;
  module: 'object';
  name: string;
  typeId: string;
  categoryId: string;
  ebay_last_price?: number;
  ebay_last_price_currency?: string;
  ebay_last_price_date?: string;
  ebay_last_price_updated_at?: string;
  ebay_price_not_found?: boolean;
  frontImageUri: string;
  backImageUri?: string;
  possessionStatusId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionValueSnapshot {
  date: string; // ISO
  totalEbayValue: number;
  totalNumistaValue: number;
  itemCount: number;
}
