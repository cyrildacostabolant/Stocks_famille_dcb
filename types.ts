export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface StockItem {
  id: string;
  produit: string;
  quantite: number;
  categorie: string | null; // Stores the name of the category, not the ID
  created_at?: string;
}

export type ViewMode = 'list' | 'settings';
