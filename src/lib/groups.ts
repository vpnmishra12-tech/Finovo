import { Firestore, collection, doc, serverTimestamp, Timestamp, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';

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
 * Generates a unique 6-character alphanumeric group code.
 */
function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a new group with a unique short ID and adds initial members.
 */
export async function createGroup(db: Firestore, userId: string, name: string, members: {name: string}[]) {
  const groupsRef = collection(db, 'groups');
  const shortId = generateShortId();
  const newGroupRef = doc(groupsRef, shortId); 
  
  const groupData = {
    name,
    createdBy: userId,
    memberIds: [userId],
    createdAt: serverTimestamp(),
  };

  setDocumentNonBlocking(newGroupRef, groupData, {});
  
  // Add creator as member
  const creatorRef = doc(collection(db, 'groups', shortId, 'members'), userId);
  setDocumentNonBlocking(creatorRef, {
    name: "Admin",
    userId: userId
  }, {});

  // Add other manual members
  for (const member of members) {
    const memberRef = doc(collection(db, 'groups', shortId, 'members'));
    setDocumentNonBlocking(memberRef, { name: member.name }, {});
  }

  return shortId;
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

  await updateDoc(groupRef, {
    memberIds: arrayUnion(userId)
  });

  const memberRef = doc(collection(db, 'groups', groupId, 'members'), userId);
  setDocumentNonBlocking(memberRef, {
    name: userName,
    userId: userId
  }, {});
}

export function addMemberToGroup(db: Firestore, groupId: string, name: string) {
  const memberRef = doc(collection(db, 'groups', groupId, 'members'));
  setDocumentNonBlocking(memberRef, { name }, {});
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

export function deleteGroupExpense(db: Firestore, groupId: string, expenseId: string) {
  const docRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  deleteDocumentNonBlocking(docRef);
}
