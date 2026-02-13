import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter } from 'react-router-dom';
import { supabase } from './services/supabase';
import { Category, StockItem } from './types';
import { CategoryManager } from './components/CategoryManager';
import { StockItemModal } from './components/StockItemModal';
import { Modal } from './components/Modal';
import { 
  Settings, 
  Plus, 
  Minus,
  Search, 
  PackageOpen, 
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle,
  Database
} from 'lucide-react';
import { DEFAULT_CATEGORY_COLOR } from './constants';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // We track selection by Category Name because the stocks table links by name, not ID
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null); 
  
  // UI States
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Order by name/produit
      const [catRes, stockRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('stocks').select('*').order('produit')
      ]);

      if (catRes.error) throw new Error(`Erreur catégories: ${catRes.error.message}`);
      if (stockRes.error) throw new Error(`Erreur stocks: ${stockRes.error.message}`);

      setCategories(catRes.data || []);
      setStocks(stockRes.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Impossible de se connecter à la base de données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateQuantity = async (e: React.MouseEvent, item: StockItem, delta: number) => {
    e.stopPropagation(); // Prevent opening the modal
    const newQuantity = Math.max(0, item.quantite + delta);
    
    if (newQuantity === item.quantite) return;

    // Optimistic Update: Update UI immediately
    setStocks(prev => prev.map(s => 
      s.id === item.id ? { ...s, quantite: newQuantity } : s
    ));

    try {
      const { error } = await supabase
        .from('stocks')
        .update({ quantite: newQuantity })
        .eq('id', item.id);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating quantity:", err);
      // Revert on error by refetching
      fetchData();
    }
  };

  const filteredStocks = useMemo(() => {
    let result = stocks;
    
    // Filter by category name
    if (selectedCategoryName !== null) {
      result = result.filter(s => s.categorie === selectedCategoryName);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.produit.toLowerCase().includes(q));
    }

    return result;
  }, [stocks, selectedCategoryName, searchQuery]);

  // Find category object for color display
  const currentCategory = categories.find(c => c.name === selectedCategoryName);
  const currentColor = currentCategory?.color || DEFAULT_CATEGORY_COLOR;

  const handleOpenCreateStock = () => {
    setEditingStock(null);
    setStockModalOpen(true);
  };

  const handleEditStock = (item: StockItem) => {
    setEditingStock(item);
    setStockModalOpen(true);
  };

  // --- Components for Layout ---

  const CategoryList = () => (
    <nav className="space-y-1">
      <button
        onClick={() => setSelectedCategoryName(null)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          selectedCategoryName === null 
            ? 'bg-blue-50 text-blue-700 shadow-sm font-semibold' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="flex-1 text-left">Tout le stock</span>
        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
          {stocks.length}
        </span>
      </button>

      {categories.map(cat => {
        // Count stocks that match this category NAME
        const count = stocks.filter(s => s.categorie === cat.name).length;
        const isActive = selectedCategoryName === cat.name;
        return (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryName(cat.name)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive 
                ? 'bg-white shadow-sm ring-1 ring-black/5' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div 
              className={`w-3 h-3 rounded-full shadow-sm ${isActive ? 'scale-125' : ''}`}
              style={{ backgroundColor: cat.color }}
            />
            <span className={`flex-1 text-left truncate ${isActive ? 'font-semibold text-gray-900' : ''}`}>
              {cat.name}
            </span>
             <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-50">
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-gray-200 h-full">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageOpen className="text-blue-600" />
            HomeStock
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Catégories</div>
          <CategoryList />
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
          {/* Connection status removed as requested */}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
          >
            <Settings size={16} />
            Gérer les catégories
          </button>
        </div>
      </aside>

      {/* --- Mobile Header --- */}
      <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
             {/* Mobile Dropdown for Categories */}
             <div className="relative">
                <select
                  value={selectedCategoryName ?? 'all'}
                  onChange={(e) => setSelectedCategoryName(e.target.value === 'all' ? null : e.target.value)}
                  className="appearance-none w-full pl-10 pr-8 py-2.5 bg-gray-100 border-transparent rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                >
                  <option value="all">Tout le stock</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                   {selectedCategoryName === null ? (
                      <PackageOpen size={18} className="text-gray-500" />
                   ) : (
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: currentColor }} 
                      />
                   )}
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <Filter size={16} />
                </div>
             </div>
          </div>
          
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Header / Search Area */}
        <div className="p-4 md:p-8 pb-0 md:pb-4">
           {error && (
             <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
                <AlertCircle className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Erreur de connexion</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
                <button onClick={fetchData} className="text-sm underline hover:text-red-900">Réessayer</button>
             </div>
           )}

           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 hidden md:block">
                  {selectedCategoryName === null ? 'Tout le stock' : selectedCategoryName}
                </h2>
                <div className="flex items-center gap-2 text-gray-500 text-sm hidden md:flex">
                  <span>{filteredStocks.length} article{filteredStocks.length !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <button onClick={fetchData} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualiser
                  </button>
                </div>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition-all"
                />
              </div>
           </div>
        </div>

        {/* Scrollable Stock List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-24 md:pb-8">
          {loading ? (
             <div className="flex justify-center items-center h-40">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
          ) : filteredStocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-h-[60vh] text-gray-400 p-8 text-center">
              <PackageOpen size={64} className="mb-4 opacity-30" />
              <p className="text-xl font-bold text-gray-600 mb-2">Aucun article trouvé</p>
              
              {!searchQuery && !error && (
                <div className="max-w-md bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4 text-sm text-blue-800">
                  <p className="font-semibold mb-1">Pas de données ?</p>
                  <p>Si vous avez déjà créé des données dans Supabase, vérifiez que les <strong>Row Level Security (RLS)</strong> sont désactivées ou configurées pour l'accès public (anon) sur les tables 'stocks' et 'categories'.</p>
                </div>
              )}
              
              {searchQuery && <p className="text-sm mt-1">Essayez une autre recherche</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredStocks.map(stock => {
                // Find matching category by NAME
                const cat = categories.find(c => c.name === stock.categorie);
                const color = cat?.color || DEFAULT_CATEGORY_COLOR;
                
                return (
                  <div
                    key={stock.id}
                    onClick={() => handleEditStock(stock)}
                    className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
                  >
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5" 
                      style={{ backgroundColor: color }}
                    />
                    <div className="pl-3 mb-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 truncate max-w-[70%]">
                           {stock.categorie || 'Sans catégorie'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-2 leading-tight">
                        {stock.produit}
                      </h3>
                    </div>

                    <div className="pl-3 flex items-center justify-between mt-auto">
                        <div className="text-sm font-medium text-gray-400">En stock</div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100 shadow-sm" onClick={(e) => e.stopPropagation()}>
                           <button 
                              onClick={(e) => updateQuantity(e, stock, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 active:scale-95 transition-all"
                           >
                              <Minus size={16} strokeWidth={2.5} />
                           </button>
                           <span className="w-8 text-center font-bold text-gray-800 text-lg">
                              {stock.quantite}
                           </span>
                           <button 
                              onClick={(e) => updateQuantity(e, stock, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 active:scale-95 transition-all"
                           >
                              <Plus size={16} strokeWidth={2.5} />
                           </button>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="text-center text-xs text-gray-300 mt-8 pb-4">
            v1.0.1
          </div>
        </div>

        {/* Floating Action Button (Mobile & Desktop) */}
        <button
          onClick={handleOpenCreateStock}
          className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all z-20"
          aria-label="Ajouter un article"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </main>

      {/* --- Modals --- */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Paramètres"
      >
        <CategoryManager
          categories={categories}
          onUpdate={fetchData}
        />
      </Modal>

      <StockItemModal
        isOpen={isStockModalOpen}
        onClose={() => setStockModalOpen(false)}
        item={editingStock}
        categories={categories}
        currentCategoryName={selectedCategoryName}
        onUpdate={fetchData}
      />
    </div>
  );
}

export default function WrappedApp() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}