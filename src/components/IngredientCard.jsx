import React from 'react';

const BORDER_COLORS = {
  'critical': 'border-l-red-500',
  'warning': 'border-l-amber-500',
  'low-stock': 'border-l-blue-500',
  'safe': 'border-l-green-500'
};

const getDaysUntil = (expiry) => {
   if (!expiry) return 'N/A';
   const expiryMillis = expiry.toMillis ? expiry.toMillis() : (expiry instanceof Date ? expiry.getTime() : new Date(expiry).getTime());
   if (isNaN(expiryMillis)) return 'N/A';
   
   const now = new Date();
   const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
   const expireStart = new Date(new Date(expiryMillis).getFullYear(), new Date(expiryMillis).getMonth(), new Date(expiryMillis).getDate()).getTime();
   
   const diff = Math.floor((expireStart - todayStart) / 86400000);
   
   if (diff < 0) return `${Math.abs(diff)} days past`;
   if (diff === 0) return `Today`;
   return `In ${diff} days`;
};

/**
 * IngredientCard Component
 * -----------------------
 * Visual representation of a single stock item.
 * Supports dynamic theme switching and status badges.
 */
export default function IngredientCard({ ingredient, onLogUsage }) {
  const borderClass = BORDER_COLORS[ingredient.computedStatus] || 'border-l-gray-300 dark:border-l-zinc-700';
  
  return (
    <div className={`bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl p-6 border-l-4 ${borderClass} flex flex-col justify-between border border-gray-100/50 dark:border-zinc-800/50`}>
      <div>
        <div className="flex justify-between items-start mb-5">
          <h3 className="text-xl font-black text-gray-800 dark:text-white line-clamp-1 tracking-tight" title={ingredient.name}>
            {ingredient.name}
          </h3>
          <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-wider rounded-lg text-gray-500 dark:text-zinc-400 whitespace-nowrap ml-3">
            {ingredient.category}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-zinc-400 mb-6 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-zinc-800/50">
            <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Expiration</span> 
            <span className="font-black text-gray-900 dark:text-zinc-200">{getDaysUntil(ingredient.expiryDate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Current Stock</span>
            <div className="text-right">
              <span className={`text-lg font-black ${ingredient.quantity < ingredient.parLevel ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                {ingredient.quantity}
              </span>
              <span className="ml-1 text-xs font-bold text-gray-400">{ingredient.unit}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6">
        {onLogUsage ? (
          <button
            onClick={() => onLogUsage(ingredient)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
          >
            Log Activity
          </button>
        ) : (
          <div className="w-full text-center py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Read Only
          </div>
        )}
      </div>
    </div>
  );
}
