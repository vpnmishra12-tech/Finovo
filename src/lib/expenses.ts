
import { Firestore, collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'EMI';
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
 * Updates or sets the monthly budget for the current month.
 */
export function updateMonthlyBudget(db: Firestore, userId: string, amount: number) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const budgetId = `${year}-${month}`;
  const docRef = doc(db, 'users', userId, 'monthlyBudgets', budgetId);

  const budgetData = {
    userId,
    budgetAmount: amount,
    month,
    year,
    updatedAt: serverTimestamp(),
  };

  setDocumentNonBlocking(docRef, budgetData, { merge: true });
}
