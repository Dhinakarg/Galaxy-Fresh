import React, { useState, useContext, useCallback, useMemo } from 'react';
import { InventoryContext } from '../context/InventoryContext';
import { useAuth } from '../hooks/useAuth';
import { useInventoryFilter } from '../hooks/useInventoryFilter';
import { getPermissions } from '../utils/permissions';
import IngredientCard from '../components/IngredientCard';
import SkeletonCard from '../components/SkeletonCard';
import LogUsageModal from '../components/LogUsageModal';

/**
 * Dashboard Component
 * -------------------
 * The visual nerve center for real-time stock monitoring.
 * Fully responsive design with deep Dark Mode integration.
 */
export default function Dashboard() {
  const { role } = useAuth();
  const perms = getPermissions(role);
  const { ingredients, loading, error } = useContext(InventoryContext);
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const { filtered, criticalCount, warningCount, lowStockCount } = useInventoryFilter(ingredients, categoryFilter, statusFilter);
  
  const categories = useMemo(() => {
    if (!ingredients) return ['All'];
    const cats = new Set(ingredients.map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [ingredients]);
  
  const statuses = ['All', 'critical', 'warning', 'low-stock', 'safe'];

  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenLogModal = useCallback((ingredient) => {
    setSelectedIngredient(ingredient);
    setIsModalOpen(true);
  }, []);
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <div className="p-10 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-3xl max-w-md text-center border border-red-100 dark:border-red-900/30 shadow-xl transition-colors">
           <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="text-xl font-black block mb-2">Sync Error</span>
          <p className="text-sm font-medium opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen transition-colors">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Inventory Dashboard</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2 font-medium">Real-time health monitoring of all active ingredients.</p>
      </div>
      
      {/* Top Summary Metric Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-red-500/10 dark:border-red-500/20 p-8 flex flex-col justify-center items-center transition-all">
          <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Critical Alerts</span>
          <span className="text-6xl font-black text-[#E24B4A]">{criticalCount}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-amber-500/10 dark:border-amber-500/20 p-8 flex flex-col justify-center items-center transition-all">
          <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Warnings Issued</span>
          <span className="text-6xl font-black text-[#EF9F27]">{warningCount}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-blue-500/10 dark:border-blue-500/20 p-8 flex flex-col justify-center items-center transition-all">
          <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Low Stock Zones</span>
          <span className="text-6xl font-black text-blue-500">{lowStockCount}</span>
        </div>
      </div>
      
      {/* Controls & Filters Section */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm mb-10 space-y-6 border border-gray-100 dark:border-zinc-800 transition-colors">
        <div className="flex flex-col sm:flex-row items-baseline space-y-1 sm:space-y-0 sm:space-x-6">
          <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest min-w-[100px]">Filter Health:</span>
          <div className="flex flex-wrap gap-2">
            {statuses.map(s => (
              <button 
                key={s} 
                onClick={() => setStatusFilter(s)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${
                  statusFilter === s 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {s === 'All' ? 'All Alerts' : s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full h-px bg-gray-50 dark:bg-zinc-800"></div>
        
        <div className="flex flex-col sm:flex-row items-baseline space-y-1 sm:space-y-0 sm:space-x-6">
          <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest min-w-[100px]">Filter Group:</span>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button 
                key={c} 
                onClick={() => setCategoryFilter(c)}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${
                  categoryFilter === c 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Responsive Grid of Ingredient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 transition-colors">
            <span className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Ingredients Detected</span>
            <p className="text-gray-500 dark:text-zinc-400 max-w-sm text-center px-6">Your inventory is currently empty or filtered out.</p>
          </div>
        ) : (
          filtered.map(ingredient => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onLogUsage={perms.canLog ? handleOpenLogModal : null}
            />
          ))
        )}
      </div>

      <LogUsageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        ingredient={selectedIngredient} 
      />
    </div>
  );
}
