import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';

export interface Expense {
  id?: string;
  userId: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'EMI';
  description: string;
  date: Timestamp;
}

export interface UserProfile {
  budget: number;
  language: string;
}

export const saveExpense = async (expense: Omit<Expense, 'id'>) => {
  return await addDoc(collection(db, 'expenses'), {
    ...expense,
    date: Timestamp.now()
  });
};

export const subscribeToExpenses = (userId: string, callback: (expenses: Expense[]) => void) => {
  const q = query(
    collection(db, 'expenses'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[];
    callback(expenses);
  });
};

export const getBudget = async (userId: string): Promise<number> => {
  const docRef = doc(db, 'userProfiles', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().budget || 0;
  }
  return 0;
};

export const setBudget = async (userId: string, budget: number) => {
  const docRef = doc(db, 'userProfiles', userId);
  return await setDoc(docRef, { budget }, { merge: true });
};