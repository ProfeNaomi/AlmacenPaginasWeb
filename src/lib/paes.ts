import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export type QuestionAxis = 'Números' | 'Álgebra y Funciones' | 'Geometría' | 'Probabilidad y Estadística';
export type QuestionSource = 'DEMRE' | 'Propio' | 'Otro';

export interface Question {
  id: string;
  text: string; // Rich text
  imageUrl?: string;
  options: string[]; // Usually 4 or 5 options
  correctAnswer: number; // Index of the correct option
  solution: string; // Rich text
  source: QuestionSource;
  axis: QuestionAxis;
  topic: string; // e.g. "Teorema de Pitágoras"
  skill: string; // e.g. "Resolver problemas"
  createdAt: number;
}

export interface PaesExam {
  id: string;
  title: string;
  description: string;
  type: 'Oficial DEMRE' | 'Simulacro' | 'Temático';
  questions: string[]; // Array of Question IDs
  isPublished: boolean;
  durationMinutes: number;
  createdAt: number;
}

// Questions CRUD
export const getQuestions = async (): Promise<Question[]> => {
  const snapshot = await getDocs(query(collection(db, 'questions'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  const docRef = await getDoc(doc(db, 'questions', id));
  return docRef.exists() ? ({ id: docRef.id, ...docRef.data() } as Question) : null;
};

export const createQuestion = async (questionData: Omit<Question, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'questions'), {
    ...questionData,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const updateQuestion = async (id: string, questionData: Partial<Question>): Promise<void> => {
  await updateDoc(doc(db, 'questions', id), questionData);
};

export const deleteQuestion = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'questions', id));
};

// Exams CRUD
export const getExams = async (publishedOnly = false): Promise<PaesExam[]> => {
  let q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
  if (publishedOnly) {
    q = query(collection(db, 'exams'), where('isPublished', '==', true), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaesExam));
};

export const getExamById = async (id: string): Promise<PaesExam | null> => {
  const docRef = await getDoc(doc(db, 'exams', id));
  return docRef.exists() ? ({ id: docRef.id, ...docRef.data() } as PaesExam) : null;
};

export const createExam = async (examData: Omit<PaesExam, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'exams'), {
    ...examData,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const updateExam = async (id: string, examData: Partial<PaesExam>): Promise<void> => {
  await updateDoc(doc(db, 'exams', id), examData);
};

export const deleteExam = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'exams', id));
};
