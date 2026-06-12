export interface GameLevel {
  id: string;
  number: number;
  title: string;
  description: string;
  type: 'app' | 'quiz'; // 'app' uses a Custom React App (like LimitsSimulation), 'quiz' uses standard PAES questions
  appComponentName?: string; // e.g. "PythagorasGame"
  quizQuestionId?: string; // If we hook it up to question bank
}

export interface GameProgress {
  unlockedLevel: number; // Highest level unlocked
  completedLevels: number[]; // Array of completed level numbers
  stars: Record<number, number>; // level number -> stars earned (1-3)
}

// Temporary in-memory level definitions (In the future, this can be fetched from Firebase)
export const defaultGameLevels: GameLevel[] = [
  {
    id: 'lvl-1',
    number: 1,
    title: 'El Teorema Perdido',
    description: 'Ayuda a Pitágoras a encontrar la hipotenusa para cruzar el río.',
    type: 'app',
    appComponentName: 'PythagorasGame'
  },
  {
    id: 'lvl-2',
    number: 2,
    title: 'Aproximación Numérica',
    description: 'Acércate al límite para desactivar el escudo.',
    type: 'app',
    appComponentName: 'LimitsSimulation'
  },
  {
    id: 'lvl-3',
    number: 3,
    title: 'Desafío Aritmético',
    description: 'Resuelve la ecuación fundamental para abrir la puerta.',
    type: 'quiz',
  },
  {
    id: 'lvl-4',
    number: 4,
    title: 'El Valle de las Funciones',
    description: 'Identifica el dominio de la función misteriosa.',
    type: 'quiz',
  },
  {
    id: 'lvl-5',
    number: 5,
    title: 'El Laberinto Derivado',
    description: 'Encuentra la pendiente de la recta tangente.',
    type: 'quiz',
  }
];

// Generamos algunos niveles extra de relleno para que el mapa se vea más largo
for (let i = 6; i <= 30; i++) {
  defaultGameLevels.push({
    id: `lvl-${i}`,
    number: i,
    title: `Desafío Matemático ${i}`,
    description: `Nivel secreto ${i}.`,
    type: 'quiz'
  });
}

// Funciones para manejar el progreso temporalmente en LocalStorage
const PROGRESS_KEY = 'mathema_game_progress';

export const getGameProgress = (): GameProgress => {
  const data = localStorage.getItem(PROGRESS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing progress", e);
    }
  }
  // Default progress
  return {
    unlockedLevel: 1,
    completedLevels: [],
    stars: {}
  };
};

export const completeLevel = (levelNumber: number, starsEarned: number = 3) => {
  const currentProgress = getGameProgress();
  
  if (!currentProgress.completedLevels.includes(levelNumber)) {
    currentProgress.completedLevels.push(levelNumber);
  }
  
  if (levelNumber === currentProgress.unlockedLevel) {
    currentProgress.unlockedLevel = levelNumber + 1;
  }

  currentProgress.stars[levelNumber] = Math.max(currentProgress.stars[levelNumber] || 0, starsEarned);
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(currentProgress));
  return currentProgress;
};

export const resetProgress = () => {
  localStorage.removeItem(PROGRESS_KEY);
};
