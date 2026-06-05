import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface LessonElement {
  id: string;
  type: 'text' | 'video' | 'image' | 'app' | 'gadget' | 'row';
  content: string; // Text content, URL for video/image/app, or gadget type
  columns?: {
    id: string;
    elements: Omit<LessonElement, 'columns'>[];
  }[];
}

export interface LessonPage {
  id: string;
  title: string;
  elements: LessonElement[];
}

export interface Block {
  id: string;
  type: 'text' | 'image' | 'video' | 'app' | 'row' | 'box' | 'page-break';
  content?: string; // For text and box
  url?: string; // For image, video, app
  zoom?: boolean; // For image
  title?: string; // For box header
  theme?: 'history' | 'situation' | 'formula' | 'exercise' | 'warning'; // For box
  columns?: {
    id: string;
    blocks: Omit<Block, 'columns'>[];
  }[];
}

export interface QuizQuestion {
  id: string;
  type: 'math' | 'knowledge' | 'paes';
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  questions: QuizQuestion[];
  passingScore: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video' | 'app' | 'text' | 'lesson';
  url?: string;
  content?: string;
  pages?: LessonPage[]; // Deprecated for lessons, kept for backwards compatibility
  blocks?: Block[]; // New Notion-like sequential blocks
  quiz?: Quiz;
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
