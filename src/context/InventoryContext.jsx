/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';

export const InventoryContext = createContext({
  ingredients: [],
  loading:     true,
  error:       null,
});

export const InventoryProvider = ({ children }) => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setIngredients([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ingredientsRef = collection(db, 'ingredients');
    const q = query(ingredientsRef);

    // 1. Initial Fetch (Fast Path)
    let hasFirstSnapshot = false;

    const fetchInitial = async () => {
      try {
        console.debug('[InventoryContext] Fast-path fetching ingredients...');
        const snapshot = await getDocs(q);
        
        if (!hasFirstSnapshot) {
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setIngredients(list);
        }
      } catch (err) {
        console.error('[InventoryContext] Initial load failed:', err);
        setError(err.message);
      } finally {
        if (!hasFirstSnapshot) setLoading(false);
      }
    };
    fetchInitial();

    // 2. Real-time Subscription (Background Path)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        hasFirstSnapshot = true;
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setIngredients(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[InventoryContext] Snapshot error:', err);
        setError(err.message);
        if (!hasFirstSnapshot) setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <InventoryContext.Provider value={{ ingredients, loading, error }}>
      {children}
    </InventoryContext.Provider>
  );
};
