import React, { useMemo, useState, useContext } from 'react';
import { InventoryContext } from '../context/InventoryContext';
import { useAuth } from '../hooks/useAuth';
import { updateIngredient } from '../services/inventoryService';
import { useToast } from '../hooks/useToast.jsx';

/**
 * ShoppingList Component
 * -----------------------
 * Dynamic procurement module that identifies stock deficits.
 * Optimized for screen viewing (Light/Dark) and high-fidelity PDF printing.
 */
export default function ShoppingList() {
  const { user } = useAuth();
  const { ingredients, loading, error } = useContext(InventoryContext);
  const { showToast, ToastComponent } = useToast();

  const lowStockItems = useMemo(() => {
    if (!ingredients) return [];
    return ingredients.filter(i => i.quantity < i.parLevel).sort((a,b) => a.name.localeCompare(b.name));
  }, [ingredients]);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expiryDates, setExpiryDates] = useState({});
  const [invoiceId, setInvoiceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultExpiry = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const toggleSelect = (id) => {
    const nextIds = new Set(selectedIds);
    if (nextIds.has(id)) nextIds.delete(id);
    else nextIds.add(id);
    setSelectedIds(nextIds);
  };

  const handleExpiryChange = (id, value) => {
    setExpiryDates(prev => ({ ...prev, [id]: value }));
  };

  const handlePurchase = async () => {
    if (!user?.uid || selectedIds.size === 0) return;
    if (!invoiceId.trim()) {
      showToast('Authentication of Invoice ID required.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const promises = Array.from(selectedIds).map(id => {
        const item = ingredients.find(i => i.id === id);
        if (!item) return Promise.resolve();
        const targetQty = item.parLevel;
        const qtyToAdd = targetQty - item.quantity;
        const dateStr = expiryDates[id] || defaultExpiry;
        
        const newBatch = {
          qty: qtyToAdd,
          invoiceId: invoiceId,
          cost: item.cost || 0,
          purchaseDate: new Date(),
          expiryDate: new Date(dateStr)
        };
        
        const existingBatches = Array.isArray(item.batches) ? [...item.batches] : [];
        existingBatches.push(newBatch);
        
        return updateIngredient(user.uid, id, {
          quantity: targetQty,
          batches: existingBatches
        });
      });
      
      await Promise.all(promises);
      setSelectedIds(new Set());
      setExpiryDates({});
      setInvoiceId('');
      showToast('Procurement verified. Global state updated.', 'success');
    } catch (err) {
      showToast('Sync failure: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <div className="p-12 text-center text-red-500 font-black uppercase tracking-widest text-[10px]">Sync Error: {error}</div>;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen transition-colors">
      <ToastComponent />
      <style>
        {`
          @media print {
            body { background: white !important; color: black !important; }
            .print\\:hidden { display: none !important; }
            @page { margin: 1.5cm; }
          }
        `}
      </style>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 print:hidden">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Shopping List</h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2 font-medium">Critical stock deficit verification protocol.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 font-bold rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition"
          >
            Checklist
          </button>

          <input 
            type="text"
            placeholder="INV-CODE-X"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-transparent dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm dark:text-white"
          />
          
          <button
            onClick={handlePurchase}
            disabled={selectedIds.size === 0 || isSubmitting || !invoiceId.trim()}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {isSubmitting ? 'Syncing...' : `Confirm (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-24 text-center">
          <div className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">Scanning Deficits...</div>
        </div>
      ) : lowStockItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-16 text-center border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 font-black text-2xl">✓</div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Inventory Optimal</h3>
          <p className="text-gray-500 dark:text-zinc-400 font-medium text-sm">All ingredients are currently balanced above Par Levels.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-8 py-6 text-left w-12 print:hidden">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                      checked={selectedIds.size === lowStockItems.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(lowStockItems.map(i => i.id)) : new Set())}
                    />
                  </th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Deficit Item</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Available / Par</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Order Vol</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest print:hidden">Exp Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {lowStockItems.map(item => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <tr key={item.id} className={`transition-colors ${isChecked ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/50'}`}>
                      <td className="px-8 py-7 print:hidden">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(item.id)}
                          className="w-5 h-5 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-8 py-7">
                        <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</div>
                        <div className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{item.category}</div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="text-sm font-black dark:text-zinc-200">
                           <span className="text-red-500">{item.quantity}</span> 
                           <span className="mx-1 text-gray-300 dark:text-zinc-600">/</span> 
                           <span>{item.parLevel}</span>
                           <span className="ml-1.5 opacity-40">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-black rounded-lg">
                          + {item.parLevel - item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-8 py-7 text-right print:hidden">
                        <input 
                          type="date"
                          value={expiryDates[item.id] || defaultExpiry}
                          onChange={(e) => handleExpiryChange(item.id, e.target.value)}
                          disabled={!isChecked}
                          className="bg-gray-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-2 text-xs font-black text-gray-600 dark:text-zinc-300 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-30 transition-all font-mono"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
