import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video' | 'app' | 'text';
  url?: string;
  content?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  resources: Resource[];
}

export interface Course {
  id?: string;
  title: string;
  category: 'escolar' | 'universitaria';
  description?: string;
  imageUrl?: string;
  modules: CourseModule[];
  createdAt: number;
}

const COURSES_COLLECTION = 'courses';

// Obtener todos los cursos de una categoría
export const getCoursesByCategory = async (category: string): Promise<Course[]> => {
  const q = query(collection(db, COURSES_COLLECTION), where('category', '==', category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};

// Obtener un curso por ID
export const getCourseById = async (id: string): Promise<Course | null> => {
  const docRef = doc(db, COURSES_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Course;
  }
  return null;
};

// Crear un nuevo curso
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'modules'>): Promise<string> => {
  const newCourse = {
    ...courseData,
    modules: [],
    createdAt: Date.now()
  };
  const docRef = await addDoc(collection(db, COURSES_COLLECTION), newCourse);
  return docRef.id;
};

// Actualizar un curso completo (ideal para cuando se agregan módulos/recursos ya que están anidados)
export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<void> => {
  const docRef = doc(db, COURSES_COLLECTION, id);
  await updateDoc(docRef, courseData);
};

// Eliminar un curso
export const deleteCourse = async (id: string): Promise<void> => {
  const docRef = doc(db, COURSES_COLLECTION, id);
  await deleteDoc(docRef);
};
