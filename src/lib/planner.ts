import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { AprendizajeEsperado } from './curriculumData';

const PLANS_COLLECTION = 'annual_plans';
const OA_BANK_COLLECTION = 'oa_bank';

// ==============================
// PLANES ANUALES
// ==============================

export const savePlan = async (userId: string, planId: string, planData: any) => {
  const docRef = doc(db, PLANS_COLLECTION, planId);
  await setDoc(docRef, {
    ...planData,
    userId,
    updatedAt: new Date().toISOString()
  });
};

export const getUserPlans = async (userId: string) => {
  // Simplificado sin query index para evitar errores iniciales de Firebase
  const snapshot = await getDocs(collection(db, PLANS_COLLECTION));
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((doc: any) => doc.userId === userId)
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const getPlanById = async (planId: string) => {
  const docRef = doc(db, PLANS_COLLECTION, planId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

export const deletePlan = async (planId: string) => {
  await deleteDoc(doc(db, PLANS_COLLECTION, planId));
};

// ==============================
// BANCO DE OAs E INDICADORES
// ==============================

export interface CustomOA extends AprendizajeEsperado {
  indicadores: string[];
}

export const saveCustomOA = async (oa: CustomOA) => {
  const docRef = doc(db, OA_BANK_COLLECTION, oa.id);
  await setDoc(docRef, oa);
};

export const getOABank = async () => {
  const snapshot = await getDocs(collection(db, OA_BANK_COLLECTION));
  return snapshot.docs.map(doc => doc.data() as CustomOA);
};

export const deleteCustomOA = async (oaId: string) => {
  await deleteDoc(doc(db, OA_BANK_COLLECTION, oaId));
};
