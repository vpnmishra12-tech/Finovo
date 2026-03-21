
import { Firestore, collection, doc, serverTimestamp, Timestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
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
 */
export function createGroup(db: Firestore, userId: string, name: string, members: {name: string, mobile: string}[]) {
  const groupsRef = collection(db, 'groups');
  const newGroupRef = doc(groupsRef); 
  
  const groupData = {
    name,
    createdBy: userId,
    memberIds: [userId],
    createdAt: serverTimestamp(),
  };

  setDocumentNonBlocking(newGroupRef, groupData, {});
  
  const creatorRef = doc(collection(db, 'groups', newGroupRef.id, 'members'), userId);
  setDocumentNonBlocking(creatorRef, {
    name: "Admin",
    mobile: "",
    userId: userId
  }, {});

  for (const member of members) {
    const memberRef = doc(collection(db, 'groups', newGroupRef.id, 'members'));
    setDocumentNonBlocking(memberRef, member, {});
  }

  return newGroupRef.id;
}

/**
 * Join an existing group using Group ID
 */
export async function joinGroup(db: Firestore, groupId: string, userId: string, userName: string) {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    throw new Error("Group not found");
  }

  // Update Group memberIds array
  await updateDoc(groupRef, {
    memberIds: arrayUnion(userId)
  });

  // Add to members sub-collection
  const memberRef = doc(collection(db, 'groups', groupId, 'members'), userId);
  setDocumentNonBlocking(memberRef, {
    name: userName,
    mobile: "",
    userId: userId
  }, {});
}

export function addMemberToGroup(db: Firestore, groupId: string, name: string, mobile: string) {
  const memberRef = doc(collection(db, 'groups', groupId, 'members'));
  setDocumentNonBlocking(memberRef, { name, mobile }, {});
}

export function removeMemberFromGroup(db: Firestore, groupId: string, memberId: string) {
  const docRef = doc(db, 'groups', groupId, 'members', memberId);
  deleteDocumentNonBlocking(docRef);
}

export function deleteGroup(db: Firestore, groupId: string) {
  const docRef = doc(db, 'groups', groupId);
  deleteDocumentNonBlocking(docRef);
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
