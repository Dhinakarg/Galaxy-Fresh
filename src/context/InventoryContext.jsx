/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
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

    /**
     * Multi-tenant: All authenticated users in the organisation share
     * the same ingredients pool. The `userId` field on each document
     * now records who *created* it (audit trail) rather than restricting access.
     *
     * Previously: where('userId', '==', user.uid)  ← single-user
     * Now:        no filter                          ← org-wide shared data
     */
    const ingredientsRef = collection(db, 'ingredients');
    const q = query(ingredientsRef); // shared across all org members

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setIngredients(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[InventoryContext] Firestore error:', err);
        setError(err.message);
        setLoading(false);
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
