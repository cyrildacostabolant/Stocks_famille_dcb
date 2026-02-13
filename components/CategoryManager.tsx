import React, { useState } from 'react';
import { Category } from '../types';
import { supabase } from '../services/supabase';
import { COLORS } from '../constants';
import { Trash2, Edit2, Plus, Check, X as XIcon } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  onUpdate: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Les articles associés n'auront plus de catégorie.`)) return;
    
    setLoading(true);
    try {
      // 1. Unlink stocks (set categorie to null where it matches the name)
      await supabase.from('stocks').update({ categorie: null }).eq('categorie', category.name);
      
      // 2. Delete category
      const { error } = await supabase.from('categories').delete().eq('id', category.id);
      if (error) throw error;
      
      onUpdate();
    } catch (err) {
      alert('Erreur lors de la suppression');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setIsCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return;
    
    const oldCategory = categories.find(c => c.id === editingId);
    if (!oldCategory) return;

    setLoading(true);
    try {
      // 1. Update stocks if name changed
      if (oldCategory.name !== editName) {
        await supabase
          .from('stocks')
          .update({ categorie: editName })
          .eq('categorie', oldCategory.name);
      }

      // 2. Update category
      const { error } = await supabase
        .from('categories')
        .update({ name: editName, color: editColor })
        .eq('id', editingId);
      
      if (error) throw error;
      setEditingId(null);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newName, color: newColor }]);
      
      if (error) throw error;
      setNewName('');
      setNewColor(COLORS[0]);
      setIsCreating(false);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const renderColorPicker = (selected: string, onSelect: (c: string) => void) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSelect(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
            selected === c ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Gérer les catégories</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Nouvelle
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Nom</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Cuisine"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Couleur</label>
              {renderColorPicker(newColor, setNewColor)}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-md text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !newName.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? '...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className="flex flex-col p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            {editingId === cat.id ? (
              <div className="space-y-3">
                 <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                 {renderColorPicker(editColor, setEditColor)}
                 <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                    >
                      <XIcon size={18} />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50"
                    >
                      <Check size={18} />
                    </button>
                 </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-gray-800">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && !isCreating && (
          <p className="text-center text-gray-500 py-4 text-sm">Aucune catégorie définie</p>
        )}
      </div>
    </div>
  );
};
