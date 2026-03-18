import { Firestore, collection, query, where, orderBy, onSnapshot, Timestamp, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';

export interface Expense {
  id?: string;
  userId: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'EMI';
  description: string;
  date: Timestamp;
  createdAt: string;
  updatedAt: string;
  transactionDate: string;
  captureMethod: string;
}

export interface UserProfile {
  budget: number;
  language: string;
}

// Save expense to the user's specific subcollection as per backend.json
export const saveExpense = async (db: Firestore, expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'transactionDate' | 'captureMethod'>) => {
  const now = new Date().toISOString();
  const expenseData = {
    ...expense,
    date: Timestamp.now(),
    createdAt: now,
    updatedAt: now,
    transactionDate: now.split('T')[0],
    captureMethod: 'Text' // Default, can be overridden
  };
  
  return await addDoc(collection(db, 'users', expense.userId, 'expenses'), expenseData);
};

// Subscribe to user's expenses subcollection
export const subscribeToExpenses = (db: Firestore, userId: string, callback: (expenses: Expense[]) => void) => {
  const q = query(
    collection(db, 'users', userId, 'expenses'),
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

export const getBudget = async (db: Firestore, userId: string): Promise<number> => {
  const docRef = doc(db, 'users', userId, 'monthlyBudgets', 'current');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().budgetAmount || 0;
  }
  return 0;
};

export const setBudget = async (db: Firestore, userId: string, budget: number) => {
  const docRef = doc(db, 'users', userId, 'monthlyBudgets', 'current');
  const now = new Date();
  return await setDoc(docRef, { 
    userId,
    budgetAmount: budget,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    id: 'current'
  }, { merge: true });
};
