import React, { useState, useEffect, useContext, useMemo } from 'react';
import { collectionGroup, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { InventoryContext } from '../context/InventoryContext';
import { useToast } from '../hooks/useToast.jsx';

// ─── SVG PIE CHART COMPONENT ───────────────────────────────────────────────
const SimplePieChart = ({ data, colors }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-gray-400 italic">No usage data logged yet.</div>;

  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="flex items-center gap-8">
      <svg viewBox="-1 -1 2 2" className="w-48 h-48 -rotate-90">
        {data.map((item, i) => {
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += item.value / total;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = item.value / total > 0.5 ? 1 : 0;
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          return <path key={i} d={pathData} fill={colors[i % colors.length]} className="hover:opacity-80 transition-opacity" />;
        })}
      </svg>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center text-sm">
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[i % colors.length] }}></span>
            <span className="font-medium text-gray-700">{item.label}:</span>
            <span className="ml-2 font-bold text-gray-900">{((item.value / total) * 100).toFixed(1)}%</span>
            <span className="ml-2 text-gray-400 text-xs text-right">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN REPORTS PAGE ─────────────────────────────────────────────────────
export default function Reports() {
  const { ingredients, loading: invLoading } = useContext(InventoryContext);
  const { showToast, ToastComponent } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Fetch all activity records across all ingredients
  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const q = query(collectionGroup(db, 'activityLogs'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setLogs(data);
      } catch (err) {
        console.error('Audit Log Fetch Error:', err);
        showToast("Note: Reporting requires a Firestore index. If this is a new setup, it may take 5 mins to build.", "info");
      } finally {
        setLogsLoading(false);
      }
    }
    fetchAuditLogs();
  }, [showToast]);

  // 1. Inflow Calculation (Grouped by Invoice)
  const inflowItems = useMemo(() => {
    if (!ingredients) return [];
    const invoiceMap = {};

    ingredients.forEach(item => {
      if (Array.isArray(item.batches)) {
        item.batches.forEach(batch => {
          const id = batch.invoiceId || 'UNTRACKED';
          if (!invoiceMap[id]) {
            invoiceMap[id] = { id, items: [], totalValue: 0, date: batch.purchaseDate };
          }
          const val = (batch.qty || 0) * (batch.cost || 0);
          invoiceMap[id].totalValue += val;
          invoiceMap[id].items.push({ name: item.name, qty: batch.qty, unit: item.unit, cost: batch.cost });
        });
      }
    });

    return Object.values(invoiceMap).sort((a, b) => {
        const dateA = a.date?.toMillis ? a.date.toMillis() : 0;
        const dateB = b.date?.toMillis ? b.date.toMillis() : 0;
        return dateB - dateA;
    });
  }, [ingredients]);

  // 2. Consumption Pulse (Pie Chart mapping)
  const consumptionData = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
      const reason = log.reason || 'Used in Dish';
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [logs]);

  // 3. Critical Items Forecast
  const criticalItems = useMemo(() => {
    if (!ingredients) return [];
    return ingredients.filter(i => i.quantity <= i.parLevel * 0.2) // Critical = < 20% of Par
      .sort((a,b) => a.quantity - b.quantity);
  }, [ingredients]);

  // Export CSV Helper
  const downloadCSV = () => {
    let csv = "Invoice ID,Total Value,Purchase Date\n";
    inflowItems.forEach(i => {
      const date = i.date?.toMillis ? new Date(i.date.toMillis()).toLocaleDateString() : 'N/A';
      csv += `"${i.id}",$${i.totalValue.toFixed(2)},${date}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Galaxy_Fresh_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (invLoading || logsLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Assembling Analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <ToastComponent />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Intelligence Reports</h1>
          <p className="text-gray-500 mt-2 font-medium">Kitchen operations and financial insights.</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV Summary
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Consumption Pie */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide text-sm underline decoration-indigo-200 underline-offset-8 decoration-4">Consumption Pulse</h3>
             <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">All Units</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
             <SimplePieChart 
               data={consumptionData} 
               colors={['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#3b82f6']} 
             />
          </div>
        </div>

        {/* 2. Critical Stock Forecast */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide text-sm underline decoration-red-200 underline-offset-8 decoration-4">Critical Stock Forecast</h3>
          {criticalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-gray-500 font-medium">All essential items are within par boundaries.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {criticalItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <div className="font-bold text-gray-900">{item.name}</div>
                    <div className="text-xs text-red-600 font-bold uppercase">Severe Deficiency Identified</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-red-600">{item.quantity} <span className="text-xs">{item.unit}</span></div>
                    <div className="text-xs text-gray-400 font-medium">Par: {item.parLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Inflow Ledger */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide text-sm underline decoration-indigo-200 underline-offset-8 decoration-4">Inflow Ledger (By Invoice)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Reference / Invoice ID</th>
                  <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest">Est. Capital Value</th>
                  <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-widest text-right">Acquisition Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inflowItems.map((inflow, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 font-mono text-sm font-bold text-indigo-600">{inflow.id}</td>
                    <td className="py-4">
                       <span className="font-black text-gray-900 text-lg">${inflow.totalValue.toFixed(2)}</span>
                       <span className="ml-2 text-xs text-gray-400">({inflow.items.length} materials)</span>
                    </td>
                    <td className="py-4 text-right text-sm text-gray-500 font-medium">
                      {inflow.date?.toMillis ? new Date(inflow.date.toMillis()).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
