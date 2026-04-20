import React, { useState, useEffect, useContext, useMemo } from 'react';
import { collectionGroup, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { InventoryContext } from '../context/InventoryContext';
import { useToast } from '../hooks/useToast.jsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

/**
 * Insights Dashboard
 * -------------------
 * Fully optimized for Light and Dark modes.
 */
const COLORS = ['#4f46e5', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Insights() {
  const { currency } = useAuth();
  const { ingredients, loading: invLoading } = useContext(InventoryContext);
  const { ToastComponent } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditData() {
      try {
        const q = query(collectionGroup(db, 'activityLogs'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => {
            const pathSegments = doc.ref.path.split('/');
            const ingredientId = pathSegments[pathSegments.length - 3];
            return { ...doc.data(), id: doc.id, ingredientId };
        });
        setLogs(data);
      } catch (err) {
        console.warn('Analytics Indexing Check:', err.code);
      } finally {
        setLogsLoading(false);
      }
    }
    fetchAuditData();
  }, []);

  const spendingTrend = useMemo(() => {
    if (!ingredients) return [];
    const monthlyMap = {};
    ingredients.forEach(item => {
      if (Array.isArray(item.batches)) {
        item.batches.forEach(batch => {
          if (!batch.purchaseDate) return;
          const date = batch.purchaseDate?.toMillis ? new Date(batch.purchaseDate.toMillis()) : new Date(batch.purchaseDate);
          if (isNaN(date.getTime())) return;
          const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (!monthlyMap[label]) monthlyMap[label] = { name: label, spending: 0 };
          monthlyMap[label].spending += (batch.qty || 0) * (batch.cost || 0);
        });
      }
    });
    return Object.values(monthlyMap).slice(-6);
  }, [ingredients]);

  const wasteAnalysis = useMemo(() => {
    const metrics = { 'Active Consumption': 0, 'Inventory Leakage': 0 };
    logs.forEach(log => {
      const parent = ingredients.find(i => i.id === log.ingredientId);
      const unitCost = parent?.cost || 0;
      const totalCost = (log.quantity || 0) * unitCost;
      if (log.reason === 'Used in Dish') {
        metrics['Active Consumption'] += totalCost;
      } else if (['Expired', 'Damaged/Dropped', 'Sent Back by Customer'].includes(log.reason)) {
        metrics['Inventory Leakage'] += totalCost;
      }
    });
    return Object.entries(metrics).filter(([_, value]) => value > 0).map(([name, value]) => ({ name, value }));
  }, [logs, ingredients]);

  const categoryCapital = useMemo(() => {
    if (!ingredients) return [];
    const catMap = {};
    ingredients.forEach(item => {
      const totalStockValue = (item.quantity || 0) * (item.cost || 0);
      if (!catMap[item.category]) catMap[item.category] = 0;
      catMap[item.category] += totalStockValue;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [ingredients]);

  if (invLoading || logsLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest text-[10px]">Filtering Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen transition-colors">
      <ToastComponent />
      
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Executive Insights</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2 font-medium">Financial health and operational waste analytics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Spending Ledger */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 min-h-[480px] flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Restock Ledger</h3>
             <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{currency}</span>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 800}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{borderRadius: '20px', border: 'none', backgroundColor: '#18181b', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)'}}
                  itemStyle={{color: '#fff', fontWeight: 800}}
                />
                <Bar dataKey="spending" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Waste vs. Usage */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 min-h-[480px] flex flex-col transition-colors">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-10">Consumption Ratio</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteAnalysis}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {wasteAnalysis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '20px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capital Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 min-h-[500px] flex flex-col transition-colors">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-10">Capital Allocation by Group</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryCapital}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={150}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryCapital.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{fontSize: '11px', fontWeight: 800, textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
