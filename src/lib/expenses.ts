import { Firestore, collection, doc, serverTimestamp, Timestamp, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'EMI' | 'Recharge' | 'Miscellaneous';
  description: string;
  transactionDate: string;
  captureMethod: 'Text' | 'Voice' | 'Camera';
  createdAt: Timestamp;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  budgetAmount: number;
  month: number;
  year: number;
  updateCount: number;
  updatedAt: Timestamp;
}

/**
 * Saves a new expense to Firestore using non-blocking updates.
 */
export function saveExpense(db: Firestore, userId: string, data: Omit<Expense, 'id' | 'userId' | 'createdAt'>) {
  const colRef = collection(db, 'users', userId, 'expenses');
  const expenseData = {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  };
  addDocumentNonBlocking(colRef, expenseData);
}

/**
 * Deletes an expense from Firestore.
 */
export function deleteExpense(db: Firestore, userId: string, expenseId: string) {
  const docRef = doc(db, 'users', userId, 'expenses', expenseId);
  deleteDocumentNonBlocking(docRef);
}

/**
 * Updates or sets the monthly budget for a specific month.
 * Limit: Only 2 updates per month.
 */
export async function updateMonthlyBudget(db: Firestore, userId: string, amount: number, month?: number, year?: number): Promise<{ success: boolean; message?: string }> {
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();
  const budgetId = `${y}-${m}`;
  const docRef = doc(db, 'users', userId, 'monthlyBudgets', budgetId);

  const budgetSnap = await getDoc(docRef);
  const currentData = budgetSnap.exists() ? budgetSnap.data() as MonthlyBudget : null;

  if (currentData && currentData.updateCount >= 2) {
    return { success: false, message: "Budget change limit reached (Max 2 per month)" };
  }

  const budgetData = {
    userId,
    budgetAmount: amount,
    month: m,
    year: y,
    updateCount: (currentData?.updateCount || 0) + 1,
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, budgetData, { merge: true });
  return { success: true };
}

/**
 * Fetches total spent for a specific month/year.
 */
export async function getMonthlySpending(db: Firestore, userId: string, month: number, year: number): Promise<number> {
  const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, month, 0).toISOString().split('T')[0];
  
  const q = query(
    collection(db, 'users', userId, 'expenses'),
    where('transactionDate', '>=', start),
    where('transactionDate', '<=', end)
  );
  
  const snap = await getDocs(q);
  let total = 0;
  snap.forEach(doc => {
    total += (doc.data() as Expense).amount;
  });
  return total;
}
