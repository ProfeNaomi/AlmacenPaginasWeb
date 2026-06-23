import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { GameProgress, getGameProgress as getLocalProgress, completeLevel as completeLocalLevel } from '../lib/gameMap';

export function useGameProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<GameProgress>({ unlockedLevel: 1, completedLevels: [], stars: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Si no hay usuario, usa localStorage y revisa recompensa
      const localProgress = getLocalProgress();
      const now = new Date();
      let needsUpdate = false;

      if (!localProgress.lastLoginDate) {
        localProgress.comodines = (localProgress.comodines || 0) + 1;
        localProgress.lastLoginDate = now.toISOString();
        needsUpdate = true;
      } else {
        const lastDate = new Date(localProgress.lastLoginDate);
        const diffMs = now.getTime() - lastDate.getTime();
        if (diffMs >= 24 * 60 * 60 * 1000) {
          localProgress.comodines = (localProgress.comodines || 0) + 1;
          localProgress.lastLoginDate = now.toISOString();
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        localStorage.setItem('mathema_game_progress', JSON.stringify(localProgress));
      }
      
      setProgress(localProgress);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid, 'gameProgress', 'main');
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameProgress;
        const now = new Date();
        let needsUpdate = false;

        if (!data.lastLoginDate) {
          data.comodines = (data.comodines || 0) + 1;
          data.lastLoginDate = now.toISOString();
          needsUpdate = true;
        } else {
          const lastDate = new Date(data.lastLoginDate);
          const diffMs = now.getTime() - lastDate.getTime();
          if (diffMs >= 24 * 60 * 60 * 1000) {
            data.comodines = (data.comodines || 0) + 1;
            data.lastLoginDate = now.toISOString();
            needsUpdate = true;
          }
        }

        setProgress(data);
        if (needsUpdate) {
          setDoc(userDocRef, data, { merge: true });
        }
      } else {
        // Inicializar documento en Firestore usando el local si existe, o el por defecto
        const localProgress = getLocalProgress();
        setDoc(userDocRef, localProgress, { merge: true });
        setProgress(localProgress);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const completeLevel = async (levelNumber: number, starsEarned: number = 3) => {
    if (!user) {
      const newProgress = completeLocalLevel(levelNumber, starsEarned);
      setProgress(newProgress);
      return newProgress;
    }

    // Lógica para actualizar en Firestore
    const newProgress = { ...progress };
    if (!newProgress.completedLevels.includes(levelNumber)) {
      newProgress.completedLevels.push(levelNumber);
    }
    if (levelNumber === newProgress.unlockedLevel) {
      newProgress.unlockedLevel = levelNumber + 1;
    }
    newProgress.stars[levelNumber] = Math.max(newProgress.stars[levelNumber] || 0, starsEarned);
    
    // Optimistic UI update
    setProgress(newProgress);

    const userDocRef = doc(db, 'users', user.uid, 'gameProgress', 'main');
    await setDoc(userDocRef, newProgress, { merge: true });
    
    return newProgress;
  };

  return { progress, loading, completeLevel };
}
