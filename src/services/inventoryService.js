import { collection, addDoc, doc, deleteDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * UTILITY: Data Sanitization
 * Converts standard JS Dates to Firestore Timestamps and strips undefined values.
 * This prevents common Firestore "invalid data" crashes.
 */
const prepareDataForStorage = (data) => {
  if (data === null || data === undefined) return undefined;
  
  // If it's already a Firestore Timestamp or a number/string/boolean, return as is
  if (data instanceof Timestamp || typeof data !== 'object') return data;
  
  // Convert standard JS Dates to Firestore Timestamps
  if (data instanceof Date) return Timestamp.fromDate(data);
  
  // Handle Arrays (specifically the batches array)
  if (Array.isArray(data)) {
    return data
      .map(item => prepareDataForStorage(item))
      .filter(v => v !== undefined);
  }
  
  // Handle Plain Objects
  // Using a more inclusive check for plain objects
  const clean = {};
  let hasProperties = false;
  
  for (const [key, value] of Object.entries(data)) {
    const cleanedValue = prepareDataForStorage(value);
    if (cleanedValue !== undefined) {
      clean[key] = cleanedValue;
      hasProperties = true;
    }
  }
  return hasProperties ? clean : undefined;
};

const COLLECTION = 'ingredients';

/**
 * addIngredient
 * provisions a brand new inventory item with its initial stock batch.
 */
export const addIngredient = async (uid, data) => {
  if (!uid) throw new Error('Authentication required to add stock.');
  const payload = prepareDataForStorage({ ...data, userId: uid });

  try {
    const ingredientsRef = collection(db, COLLECTION);
    return await addDoc(ingredientsRef, payload);
  } catch (err) {
    console.error('Core Service Error [addIngredient]:', err);
    throw err;
  }
};

/**
 * updateIngredient
 * General purpose update for metadata (Name, Category, Par Level).
 */
export const updateIngredient = async (uid, id, data) => {
  if (!uid) throw new Error('Authentication required.');
  const payload = prepareDataForStorage(data);

  try {
    // Note: This uses a direct update. For sensitive quantity changes, use logUsage instead.
    const { updateDoc } = await import('firebase/firestore'); // dynamic import for size optimization
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, payload);
  } catch (err) {
    console.error('Core Service Error [updateIngredient]:', err);
    throw err;
  }
};

/**
 * deleteIngredient
 * Removes the main document. 
 * Note: In a production scale app, you might want to soft-delete or cleanup sub-collections here.
 */
export const deleteIngredient = async (uid, id) => {
  if (!uid) throw new Error('Authentication required.');
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Core Service Error [deleteIngredient]:', err);
    throw err;
  }
};

/**
 * logUsage (CRITICAL FUNCTION)
 * ----------------------------
 * This function handles the complex logic of inventory depletion.
 * It uses a FIRESTORE TRANSACTION to ensure stock accuracy (preventing race conditions).
 * 
 * Strategy: FIFO (First-In, First-Out)
 * To minimize waste, it subtracts quantity from the OLDEST batches first.
 */
export const logUsage = async (uid, id, quantityUsed, reason = "Used in Dish") => {
  if (!uid) throw new Error('Authentication required.');

  const docRef = doc(db, COLLECTION, id);
  // Auto-generate a new ID for the audit log entry
  const logRef = doc(collection(db, COLLECTION, id, 'activityLogs'));

  try {
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) throw new Error('Ingredient not found');

      const data = docSnap.data();
      const newQuantity = Math.max(0, data.quantity - quantityUsed);
      let remainingToSubtract = quantityUsed;

      // 1. Sort batches specifically by Purchase Date (Earliest first)
      const sortedBatches = Array.isArray(data.batches) ? [...data.batches] : [];
      sortedBatches.sort((a, b) => {
        const timeA = a.purchaseDate?.toMillis ? a.purchaseDate.toMillis() : 0;
        const timeB = b.purchaseDate?.toMillis ? b.purchaseDate.toMillis() : 0;
        return timeA - timeB;
      });

      // 2. Deplete batches one by one
      const newBatches = [];
      for (const batch of sortedBatches) {
        if (remainingToSubtract <= 0) {
          newBatches.push(batch); // This batch is untouched
          continue;
        }
        
        if (batch.qty <= remainingToSubtract) {
          // This batch is totally consumed
          remainingToSubtract -= batch.qty;
        } else {
          // This batch is partially consumed
          newBatches.push({ ...batch, qty: batch.qty - remainingToSubtract });
          remainingToSubtract = 0;
        }
      }

      // 3. Commit ALL changes in a single atomic operation
      // If any part of this fails, nothing is saved.
      transaction.update(docRef, { quantity: newQuantity, batches: newBatches });
      transaction.set(logRef, {
        userId: uid,
        quantity: quantityUsed,
        reason: reason,
        timestamp: Timestamp.now(),
        previousTotal: data.quantity,
        newTotal: newQuantity
      });
    });

    return true;
  } catch (err) {
    console.error('Transaction failed [logUsage]:', err);
    throw err;
  }
};
