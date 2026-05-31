import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProgress {
  userId: string;
  completedLessons: string[]; // Array of lesson (resource) IDs that have been passed
  lessonScores: Record<string, number>; // Mapping of lessonId to highest score achieved
}

const PROGRESS_COLLECTION = 'user_progress';

// Obtener el progreso de un usuario
export const getUserProgress = async (userId: string): Promise<UserProgress> => {
  const docRef = doc(db, PROGRESS_COLLECTION, userId);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return snapshot.data() as UserProgress;
  }
  
  // Si no existe, retornar un progreso inicial vacío
  return {
    userId,
    completedLessons: [],
    lessonScores: {}
  };
};

// Registrar el resultado de un quiz de una lección
export const recordLessonResult = async (userId: string, lessonId: string, score: number, passed: boolean): Promise<void> => {
  const docRef = doc(db, PROGRESS_COLLECTION, userId);
  const snapshot = await getDoc(docRef);
  
  let currentProgress: UserProgress;
  
  if (snapshot.exists()) {
    currentProgress = snapshot.data() as UserProgress;
  } else {
    currentProgress = { userId, completedLessons: [], lessonScores: {} };
  }

  // Actualizar el puntaje más alto
  const currentScore = currentProgress.lessonScores[lessonId] || 0;
  if (score > currentScore) {
    currentProgress.lessonScores[lessonId] = score;
  }

  // Añadir a lecciones completadas si pasó y no estaba antes
  if (passed && !currentProgress.completedLessons.includes(lessonId)) {
    currentProgress.completedLessons.push(lessonId);
  }

  await setDoc(docRef, currentProgress);
};
