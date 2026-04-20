import React, { useState, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { InventoryContext } from '../context/InventoryContext';
import { addIngredient, updateIngredient, deleteIngredient } from '../services/inventoryService';
import { getPermissions } from '../utils/permissions';
import { useToast } from '../hooks/useToast.jsx';

// Visual indicators for stock health (Theme-Aware)
const STATUS_COLORS = {
  'critical': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  'warning': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  'safe': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
};

const initialFormState = {
  name: '',
  category: 'Produce',
  quantity: '',
  unit: 'kg',
  parLevel: '',
  purchaseDate: '',
  expiryDate: '',
  invoiceId: '',
  cost: ''
};

/**
 * Inventory Module
 * The primary operations center for tracking ingredients and managing stock batches.
 * Fully optimized for Light and Dark modes.
 */
export default function Inventory() {
  const { user, role, currency } = useAuth();
  const perms = getPermissions(role);
  const { showToast, ToastComponent } = useToast();
  
  // Real-time globally synced inventory state
  const { ingredients, loading, error } = useContext(InventoryContext);
  
  // UI State Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = (ingredient = null) => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        category: ingredient.category,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        parLevel: ingredient.parLevel ?? '',
        purchaseDate: formatDate(ingredient.purchaseDate),
        expiryDate: formatDate(ingredient.expiryDate),
        invoiceId: '', 
        cost: ingredient.cost ?? '',
      });
      setEditingId(ingredient.id);
    } else {
      setFormData(initialFormState);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const dataToSave = {
      ...formData,
      quantity: Number(formData.quantity) || 0,
      unit: formData.unit,
      parLevel: Number(formData.parLevel) || 0,
      cost: Number(formData.cost) || 0,
    };
    
    if (formData.purchaseDate) dataToSave.purchaseDate = new Date(formData.purchaseDate);
    if (formData.expiryDate) dataToSave.expiryDate = new Date(formData.expiryDate);
    
    try {
      if (editingId) {
        await updateIngredient(user.uid, editingId, dataToSave);
        showToast('Ingredient metadata updated.', 'success');
      } else {
        const initialBatch = { 
          qty: dataToSave.quantity,
          invoiceId: formData.invoiceId,
          cost: dataToSave.cost,
        };
        if (dataToSave.purchaseDate) initialBatch.purchaseDate = dataToSave.purchaseDate;
        if (dataToSave.expiryDate) initialBatch.expiryDate = dataToSave.expiryDate;
        
        dataToSave.batches = [initialBatch];
        await addIngredient(user.uid, dataToSave);
        showToast('New ingredient provisioned.', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast('Inventory update failed: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this ingredient and all associated history?')) {
      try {
        await deleteIngredient(user.uid, id);
        showToast('Ingredient removed.', 'success');
      } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
      }
    }
  };

  const getStockStatus = (qty, par) => {
    if (!par) return 'safe';
    if (qty <= par * 0.2) return 'critical';
    if (qty < par) return 'warning';
    return 'safe';
  };

  const formatDate = (val) => {
    if (!val) return '';
    const date = val.toMillis ? new Date(val.toMillis()) : new Date(val);
    return date.toISOString().split('T')[0];
  };

  if (loading) return <div className="p-12 text-center text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Inventory...</div>;
  if (error) return <div className="p-12 text-center text-red-500">Inventory Sync Error: {error}</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto transition-colors">
      <ToastComponent />
      
      {/* Module Navigation & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Full Inventory</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2 font-medium">Global stock visibility across all kitchen stations.</p>
        </div>
        {perms.canAdd && (
          <button 
            onClick={() => openModal()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Add New Ingredient
          </button>
        )}
      </div>

      {/* Main Inventory Board */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
            <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Level</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Health</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {ingredients.map((item) => {
                const status = getStockStatus(item.quantity, item.parLevel);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900 dark:text-white text-lg">{item.name}</div>
                      <div className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Cost: {currency}{item.cost || 0} / {item.unit}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-gray-600 dark:text-zinc-400 px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg uppercase tracking-wider">{item.category}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-lg font-black text-gray-800 dark:text-zinc-200">{item.quantity} <span className="text-xs font-bold text-gray-400">{item.unit}</span></div>
                      <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase">Par: {item.parLevel} {item.unit}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${STATUS_COLORS[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      {perms.canEdit && (
                        <button onClick={() => openModal(item)} className="text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                      {perms.canDelete && (
                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Core Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 transition-colors">
            <div className="bg-indigo-600 p-8 text-white">
               <h2 className="text-2xl font-black">{editingId ? 'Modify Inventory Member' : 'Provision New Ingredient'}</h2>
               <p className="text-indigo-100 text-sm mt-1 font-medium">Configure stock parameters and health boundaries.</p>
            </div>
            
            <form onSubmit={handleSave} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Ingredient Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors" placeholder="e.g. Bluefin Tuna" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors">
                    <option>Produce</option>
                    <option>Dairy</option>
                    <option>Meat</option>
                    <option>Seafood</option>
                    <option>Dry Goods</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Unit of Measure *</label>
                  <select required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors">
                    <option value="kg">kilograms (kg)</option>
                    <option value="g">grams (g)</option>
                    <option value="L">litres (L)</option>
                    <option value="ml">millilitres (ml)</option>
                    <option value="lbs">pounds (lbs)</option>
                    <option value="oz">ounces (oz)</option>
                    <option value="gal">gallons (gal)</option>
                    <option value="units">units / pcs</option>
                    <option value="box">boxes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Available Stock *</label>
                  <input required type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors" placeholder="0.00" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Critical Par Level *</label>
                  <input required type="number" step="0.01" value={formData.parLevel} onChange={e => setFormData({...formData, parLevel: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors" placeholder="Minimum threshold" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Cost ({currency}) per {formData.unit}</label>
                  <input required type="number" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors" placeholder="0.00" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Invoice / Ref #</label>
                  <input required={!editingId} type="text" value={formData.invoiceId} onChange={e => setFormData({...formData, invoiceId: e.target.value})} className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-zinc-800 dark:text-white transition-colors" placeholder="INV-001" />
                </div>
              </div>

              <div className="pt-10 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {isSubmitting ? 'Syncing...' : (editingId ? 'Update Ingredient' : 'Provision Stock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
