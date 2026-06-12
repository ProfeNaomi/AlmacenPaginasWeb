import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

export interface Cover {
  id: string;
  name: string;
  frontContent: string;
  backContent: string;
  createdAt: number;
}

const COVERS_COLLECTION = 'covers';

export const getCovers = async (): Promise<Cover[]> => {
  const q = query(collection(db, COVERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cover));
};

export const getCoverById = async (id: string): Promise<Cover | null> => {
  const docRef = await getDoc(doc(db, COVERS_COLLECTION, id));
  return docRef.exists() ? ({ id: docRef.id, ...docRef.data() } as Cover) : null;
};

export const createCover = async (data: Omit<Cover, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COVERS_COLLECTION), {
    ...data,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const updateCover = async (id: string, data: Partial<Cover>): Promise<void> => {
  await updateDoc(doc(db, COVERS_COLLECTION, id), data);
};

export const deleteCover = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COVERS_COLLECTION, id));
};
