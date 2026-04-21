/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { logout as logoutService } from '../services/authService';

export const AuthContext = createContext({
  user:    null,
  role:    null,
  currency: '₹',
  loading: true,
  isSynced: false, 
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
        
        const RESERVED_ROLES = {
          'manager@example.com': 'manager',
          'supervisor@example.com': 'supervisor',
          'owner@example.com': 'owner',
          'chef@example.com': 'chef'
        };

        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // OPTIMIZATION: Immediate role check for reserved demo accounts
        const reserved = RESERVED_ROLES[currentUser.email?.toLowerCase().trim()];
        if (reserved) {
          setRole(reserved);
          // Don't set loading false yet, wait for currency from Firestore
        }

        // 1. Initial Fetch (Fast Path with Self-Healing)
        let hasFirstSnapshot = false;
        
        const fetchInitial = async () => {
          try {
            console.debug(`[AuthContext] Initial fetching profile for: ${currentUser.uid}`);
            const snap = await getDoc(userDocRef);
            
            // Only update state if the real-time listener hasn't already provided data
            if (!hasFirstSnapshot) {
              let currentDbRole = null;
              if (snap.exists()) {
                const data = snap.data();
                currentDbRole = data.role;
                setRole(reserved || data.role || 'chef');
                setCurrency(data.currency || '₹');
              } else {
                setRole(reserved || 'chef');
                setCurrency('₹');
              }

              // Sync DB if needed (runs in background, doesn't block loading:false)
              if (reserved && currentDbRole !== reserved) {
                setDoc(userDocRef, {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  role: reserved,
                  updatedAt: serverTimestamp()
                }, { merge: true }).catch(e => console.warn('[AuthContext] Healing failed:', e));
              }
            }
          } catch (err) {
            console.warn('[AuthContext] Initial fetch failed:', err);
          } finally {
            if (!hasFirstSnapshot) setLoading(false);
          }
        };
        fetchInitial();

        // 2. Real-time Subscription (Background Path)
        roleUnsubscribe = onSnapshot(
          userDocRef,
          (docSnap) => {
            hasFirstSnapshot = true;
            if (docSnap.exists()) {
              const data = docSnap.data();
              setRole(reserved || data.role || 'chef');
              setCurrency(data.currency || '₹');
            }
            setLoading(false); 
          },
          (err) => {
            console.error('[AuthContext] Snapshot error:', err);
            if (!hasFirstSnapshot) setLoading(false);
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
