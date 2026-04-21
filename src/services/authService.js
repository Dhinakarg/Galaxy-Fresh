import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, createSecondaryAuth } from './firebase';

/**
 * Creates a new user in Firebase Auth and provisions a profile document
 * in the /users collection with a default role of 'chef'.
 */
export const signupWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Provision user profile with correct role (handling reserved demo emails)
    const RESERVED_ROLES = {
      'manager@example.com': 'manager',
      'supervisor@example.com': 'supervisor',
      'owner@example.com': 'owner',
      'chef@example.com': 'chef'
    };
    const assignedRole = RESERVED_ROLES[email.toLowerCase().trim()] || 'chef';

    await setDoc(doc(db, 'users', user.uid), {
      uid:       user.uid,
      email:     user.email,
      role:      assignedRole,
      createdAt: serverTimestamp(),
      currency:  '₹', // default currency
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (uid, data) => {
  const userDocRef = doc(db, 'users', uid);
  return updateDoc(userDocRef, data);
};

/**
 * Admin function to create a user for the organization without logging out the manager.
 * Uses a secondary auth instance.
 */
export const provisionUser = async (email, password, role = 'chef') => {
  const secondaryAuth = createSecondaryAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;

    // Create the profile document
    await setDoc(doc(db, 'users', newUser.uid), {
      uid:       newUser.uid,
      email:     newUser.email,
      role:      role,
      createdAt: serverTimestamp(),
    });

    // Sign out from the secondary app instantly to clean up memory
    await signOut(secondaryAuth);
    return newUser;
  } catch (error) {
    throw error;
  }
};
