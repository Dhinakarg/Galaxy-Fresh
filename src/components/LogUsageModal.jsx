import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { logUsage } from '../services/inventoryService';
import { useToast } from '../hooks/useToast.jsx';

/**
 * LogUsageModal Component
 * -----------------------
 * Interactive pop-over for recording ingredient consumption.
 * Optimized with real-time FIFO depletion preview and Dark Mode fidelity.
 */
export default function LogUsageModal({ isOpen, onClose, ingredient }) {
  const { user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  
  const [usageInput, setUsageInput] = useState('');
  const [reason, setReason] = useState('Select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const USAGE_REASONS = [
    'Select',
    'Used in Dish',
    'Expired',
    'Damaged/Dropped',
    'Sent Back by Customer'
  ];

  const sortedBatches = useMemo(() => {
    if (!ingredient || !Array.isArray(ingredient.batches)) return [];
    const batchesCopy = [...ingredient.batches];
    return batchesCopy.sort((a, b) => {
      const timeA = a.purchaseDate?.toMillis 
        ? a.purchaseDate.toMillis() 
        : (a.purchaseDate instanceof Date ? a.purchaseDate.getTime() : new Date(a.purchaseDate).getTime() || 0);
      const timeB = b.purchaseDate?.toMillis 
        ? b.purchaseDate.toMillis() 
        : (b.purchaseDate instanceof Date ? b.purchaseDate.getTime() : new Date(b.purchaseDate).getTime() || 0);
      return timeA - timeB;
    });
  }, [ingredient]);

  const previewData = useMemo(() => {
    const qtyUsed = parseFloat(usageInput);
    if (isNaN(qtyUsed) || qtyUsed <= 0) return sortedBatches.map(b => ({ ...b, isDepleted: false, newQty: b.qty }));
    
    let remainingToSubtract = qtyUsed;
    const result = [];
    
    for (const batch of sortedBatches) {
      if (remainingToSubtract <= 0) {
        result.push({ ...batch, isDepleted: false, newQty: batch.qty });
        continue;
      }
      
      if (batch.qty <= remainingToSubtract) {
        remainingToSubtract -= batch.qty;
        result.push({ ...batch, isDepleted: true, newQty: 0 });
      } else {
        result.push({
          ...batch,
          isDepleted: false,
          newQty: batch.qty - remainingToSubtract
        });
        remainingToSubtract = 0;
      }
    }
    
    return result;
  }, [sortedBatches, usageInput]);

  if (!isOpen || !ingredient) return null;

  const inputNumber = parseFloat(usageInput);
  const isInvalid = isNaN(inputNumber) || inputNumber <= 0;
  const exceedsStock = inputNumber > ingredient.quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user?.uid || isInvalid || exceedsStock || reason === 'Select') return;
    
    setIsSubmitting(true);
    logUsage(user.uid, ingredient.id, inputNumber, reason)
      .then(() => {
        showToast(`Successfully logged ${inputNumber} ${ingredient.unit} as ${reason}`, 'success');
        setTimeout(() => {
            setUsageInput('');
            onClose();
            setIsSubmitting(false);
          }, 300);
      })
      .catch((err) => {
        showToast("Sync failure: " + err.message, 'error');
        setIsSubmitting(false);
      });
  };

  const handleClose = () => {
    setUsageInput('');
    onClose();
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = dateValue.toMillis ? new Date(dateValue.toMillis()) : new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <ToastComponent />
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
        
        {/* Header Section */}
        <div className="p-8 bg-gray-50 dark:bg-zinc-800/50 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{ingredient.name}</h2>
            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Log Depletion Activity</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Available Stock</div>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{ingredient.quantity} <span className="text-xs opacity-50 uppercase">{ingredient.unit}</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Input Quantitiy */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Usage Volume</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={usageInput}
                  onChange={(e) => setUsageInput(e.target.value)}
                  className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-2 rounded-2xl outline-none focus:ring-4 transition-all font-black text-lg ${
                    exceedsStock ? 'border-red-500 ring-red-500/10 dark:text-red-400' : 'border-transparent focus:ring-indigo-500/10 focus:border-indigo-600 dark:text-white'
                  }`}
                  placeholder="0.00"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-600 font-bold uppercase text-xs">{ingredient.unit}</span>
              </div>
              {exceedsStock && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase">Input exceeds available inventory.</p>}
            </div>

            {/* Reason Code */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Protocol Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-2 border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-sm dark:text-white appearance-none cursor-pointer"
              >
                {USAGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* FIFO Visual Preview */}
          <div className="bg-gray-50 dark:bg-zinc-800/30 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-4">FIFO Depletion Preview</h3>
            <div className="space-y-3">
              {previewData.slice(0, 3).map((batch, i) => (
                <div key={i} className={`flex justify-between items-center p-3 rounded-xl transition-all ${batch.isDepleted ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20' : 'bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700'}`}>
                  <div>
                    <div className={`text-xs font-black uppercase ${batch.isDepleted ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>Batch {i + 1}</div>
                    <div className="text-[10px] font-bold text-gray-400">Pur: {formatDate(batch.purchaseDate)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${batch.isDepleted ? 'line-through text-red-500 opacity-50' : 'dark:text-white'}`}>{batch.qty} → {batch.newQty}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{batch.isDepleted ? 'Consumed' : 'Remaining'}</div>
                  </div>
                </div>
              ))}
              {previewData.length > 3 && <div className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">+{previewData.length - 3} Additional Batches</div>}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end space-x-4">
            <button 
              type="button" 
              onClick={handleClose}
              className="px-6 py-3 text-sm font-black text-gray-500 dark:text-zinc-400 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors uppercase tracking-widest"
              disabled={isSubmitting}
            >
              Discard
            </button>
            <button 
              type="submit" 
              className="px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex items-center"
              disabled={isSubmitting || exceedsStock || isInvalid || reason === 'Select'}
            >
              {isSubmitting ? 'Syncing...' : 'Confirm Depletion'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
