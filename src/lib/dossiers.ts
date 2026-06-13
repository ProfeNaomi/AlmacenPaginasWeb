import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';

export interface DossierTemplate {
  id: string;
  name: string;
  headerContent: string;
  footerContent: string;
  createdAt: number;
}

export interface DossierPage {
  id: string;
  blocks: any[]; // Using any[] for now, we'll reuse Block from courses
}

export interface Dossier {
  id: string;
  title: string;
  description: string;
  templateId?: string;
  headerContent?: string;
  footerContent?: string;
  pages: DossierPage[];
  isPublished: boolean;
  createdAt: number;
}

const TEMPLATES_COLLECTION = 'dossierTemplates';
const DOSSIERS_COLLECTION = 'dossiers';

// --- Templates ---
export const getDossierTemplates = async (): Promise<DossierTemplate[]> => {
  const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DossierTemplate));
};

export const getDossierTemplateById = async (id: string): Promise<DossierTemplate | null> => {
  const d = await getDoc(doc(db, TEMPLATES_COLLECTION, id));
  if (d.exists()) {
    return { id: d.id, ...d.data() } as DossierTemplate;
  }
  return null;
};

export const createDossierTemplate = async (template: Omit<DossierTemplate, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
    ...template,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const updateDossierTemplate = async (id: string, template: Partial<DossierTemplate>): Promise<void> => {
  await updateDoc(doc(db, TEMPLATES_COLLECTION, id), template);
};

export const deleteDossierTemplate = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
};

// --- Dossiers ---
export const getDossiers = async (): Promise<Dossier[]> => {
  const q = query(collection(db, DOSSIERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dossier));
};

export const getDossierById = async (id: string): Promise<Dossier | null> => {
  const d = await getDoc(doc(db, DOSSIERS_COLLECTION, id));
  if (d.exists()) {
    return { id: d.id, ...d.data() } as Dossier;
  }
  return null;
};

export const createDossier = async (dossier: Omit<Dossier, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, DOSSIERS_COLLECTION), {
    ...dossier,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const updateDossier = async (id: string, dossier: Partial<Dossier>): Promise<void> => {
  await updateDoc(doc(db, DOSSIERS_COLLECTION, id), dossier);
};

export const deleteDossier = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, DOSSIERS_COLLECTION, id));
};
