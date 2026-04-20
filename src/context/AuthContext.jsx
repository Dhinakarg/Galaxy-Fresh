/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { logout as logoutService } from '../services/authService';

export const AuthContext = createContext({
  user:    null,
  role:    null,
  currency: '₹',
  loading: true,
  logout:  () => {},
  updateCurrency: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null);
  const [currency, setCurrency] = useState('₹');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let roleUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Clean up any previous role listener before setting up a new one
      if (roleUnsubscribe) {
        roleUnsubscribe();
        roleUnsubscribe = null;
      }

      if (currentUser) {
        setUser(currentUser);
        // Subscribe to the user's profile document for live role updates
        const userDocRef = doc(db, 'users', currentUser.uid);
        roleUnsubscribe = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setRole(data.role || 'chef');
              setCurrency(data.currency || '₹');
            } else {
              setRole('chef');
              setCurrency('₹');
            }
            setLoading(false);
          },
          (err) => {
            // If we can't read role (e.g. rules not yet deployed), fall back gracefully
            console.warn('[AuthContext] Could not fetch role, defaulting to chef:', err.code);
            setRole('chef');
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (roleUnsubscribe) roleUnsubscribe();
    };
  }, []);

  const value = {
    user,
    role,
    currency,
    loading,
    logout: logoutService,
    updateCurrency: async (newSymbol) => {
        if (user) {
            setCurrency(newSymbol); // Optimistic UI update
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { currency: newSymbol });
        }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
