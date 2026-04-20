import { useMemo } from 'react';

/**
 * Pure helper function to compute the expiry/stock status of an ingredient.
 * Handles both JS Dates and Firestore Timestamp objects gracefully.
 */
export const getExpiryStatus = (expiryDate, quantity, parLevel) => {
  if (!expiryDate) {
    if (quantity < parLevel) return 'low-stock';
    return 'safe';
  }

  const expiryMillis = expiryDate.toMillis 
    ? expiryDate.toMillis() 
    : (expiryDate instanceof Date ? expiryDate.getTime() : new Date(expiryDate).getTime());
  
  if (isNaN(expiryMillis)) {
    if (quantity < parLevel) return 'low-stock';
    return 'safe';
  }

  const now = new Date();
  
  // Set times to the start of the day to ensure exact difference in days
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expireDate = new Date(expiryMillis);
  const expireStart = new Date(expireDate.getFullYear(), expireDate.getMonth(), expireDate.getDate()).getTime();
  
  const diffDays = Math.floor((expireStart - todayStart) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'critical'; // Expiring today or already past
  if (diffDays <= 3) return 'warning';  // Expiring in 1-3 days
  
  if (quantity < parLevel) return 'low-stock';
  
  return 'safe';
};

// Fixed mapping to enforce logic sorting order
const STATUS_RANK = {
  'critical': 0,
  'warning': 1,
  'low-stock': 2,
  'safe': 3,
};

export const useInventoryFilter = (ingredients, categoryFilter, statusFilter) => {
  return useMemo(() => {
    let criticalCount = 0;
    let warningCount = 0;
    let lowStockCount = 0;

    if (!ingredients || ingredients.length === 0) {
      return { filtered: [], criticalCount, warningCount, lowStockCount };
    }

    // 1. Process items to compute their statuses and increment total counts
    const processed = ingredients.map((item) => {
      const computedStatus = getExpiryStatus(item.expiryDate, item.quantity, item.parLevel);
      
      // Calculate global counts (can be useful for indicator badges in the UI)
      if (computedStatus === 'critical') criticalCount++;
      else if (computedStatus === 'warning') warningCount++;
      else if (computedStatus === 'low-stock') lowStockCount++;
      
      return { ...item, computedStatus };
    });

    // 2. Filter items based on criteria strings
    const filtered = processed.filter((item) => {
      if (categoryFilter && categoryFilter.toLowerCase() !== 'all') {
        if (item.category !== categoryFilter) return false;
      }
      
      if (statusFilter && statusFilter.toLowerCase() !== 'all') {
        if (item.computedStatus !== statusFilter) return false;
      }
      
      return true;
    });

    // 3. Sort standard groups: critical -> warning -> low-stock -> safe
    // and correctly fallback sorting individually by ascending expiry date logic
    filtered.sort((a, b) => {
      const rankA = STATUS_RANK[a.computedStatus];
      const rankB = STATUS_RANK[b.computedStatus];

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Within the same rank group, execute FIFO logic (Oldest expiry first)
      const parseTime = (dateObj) => {
        if (!dateObj) return Infinity; // Items without expiry date go to the bottom
        return dateObj.toMillis ? dateObj.toMillis() : (dateObj instanceof Date ? dateObj.getTime() : new Date(dateObj).getTime() || Infinity);
      };

      const timeA = parseTime(a.expiryDate);
      const timeB = parseTime(b.expiryDate);

      return timeA - timeB;
    });

    return {
      filtered,
      criticalCount,
      warningCount,
      lowStockCount,
    };
  }, [ingredients, categoryFilter, statusFilter]);
};
