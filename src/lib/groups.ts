
import { Firestore, collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';

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

/**
 * Creates a new group and adds initial members.
 * Follows non-blocking patterns by pre-generating IDs.
 */
export function createGroup(db: Firestore, userId: string, name: string, members: {name: string, mobile: string}[]) {
  const groupsRef = collection(db, 'groups');
  const newGroupRef = doc(groupsRef); // Generate ID on client
  
  const groupData = {
    name,
    createdBy: userId,
    memberIds: [userId],
    createdAt: serverTimestamp(),
  };

  // Create group document
  setDocumentNonBlocking(newGroupRef, groupData, {});
  
  // Add initial member (creator)
  const creatorRef = doc(collection(db, 'groups', newGroupRef.id, 'members'));
  setDocumentNonBlocking(creatorRef, {
    name: "Me",
    mobile: "",
    userId: userId
  }, {});

  // Add other members
  for (const member of members) {
    const memberRef = doc(collection(db, 'groups', newGroupRef.id, 'members'));
    setDocumentNonBlocking(memberRef, member, {});
  }

  return newGroupRef.id;
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
