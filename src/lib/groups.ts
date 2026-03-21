
import { Firestore, collection, doc, serverTimestamp, Timestamp, addDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  memberIds: string[];
  createdAt: Timestamp;
}

export interface GroupMember {
  id: string;
  name: string;
  mobile: string;
  userId?: string;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  amount: number;
  category: 'Cab' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Other';
  location: string;
  description?: string;
  paidBy: string;
  paidByName: string;
  transactionDate: Timestamp | string;
  isEdited?: boolean;
  createdAt: Timestamp;
}

export async function createGroup(db: Firestore, userId: string, name: string, members: {name: string, mobile: string}[]) {
  const groupsRef = collection(db, 'groups');
  const groupData = {
    name,
    createdBy: userId,
    memberIds: [userId],
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(groupsRef, groupData);
  
  // Add initial member (creator)
  await addDoc(collection(db, 'groups', docRef.id, 'members'), {
    name: "Me",
    mobile: "",
    userId: userId
  });

  // Add other members
  for (const member of members) {
    await addDoc(collection(db, 'groups', docRef.id, 'members'), member);
  }

  return docRef.id;
}

export function addGroupExpense(db: Firestore, groupId: string, data: Omit<GroupExpense, 'id' | 'createdAt'>) {
  const colRef = collection(db, 'groups', groupId, 'expenses');
  const expenseData = {
    ...data,
    createdAt: serverTimestamp(),
    isEdited: false
  };
  addDocumentNonBlocking(colRef, expenseData);
}

export function updateGroupExpense(db: Firestore, groupId: string, expenseId: string, data: Partial<GroupExpense>) {
  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  updateDocumentNonBlocking(docRef, {
    ...data,
    isEdited: true,
    updatedAt: serverTimestamp()
  });
}

export function deleteGroupExpense(db: Firestore, groupId: string, expenseId: string) {
  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  deleteDocumentNonBlocking(docRef);
}
