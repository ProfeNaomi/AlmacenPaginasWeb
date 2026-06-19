export interface GameLevel {
  id: string;
  number: number;
  title: string;
  description: string;
  type: 'app' | 'quiz'; // 'app' uses a Custom React App (like LimitsSimulation), 'quiz' uses standard PAES questions
  appComponentName?: string; // e.g. "PythagorasGame"
  quizQuestionId?: string; // If we hook it up to question bank
  worldId: number; // Indicates which world this level belongs to
  isBoss: boolean; // Indicates if this is the final level of the world
}

export interface GameProgress {
  unlockedLevel: number; // Highest level unlocked
  completedLevels: number[]; // Array of completed level numbers
  stars: Record<number, number>; // level number -> stars earned (1-3)
}

export const WORLD_NAMES = [
  "Bosque de los Naturales",
  "Pradera de los Enteros",
  "Ruinas Geométricas",
  "Cañón de los Racionales",
  "Océano de las Fracciones",
  "Arrecife Decimal",
  "Desierto Algebraico",
  "Dunas de las Variables",
  "Cavernas de las Ecuaciones",
  "Minas de las Inecuaciones",
  "Volcán Probabilístico",
  "Cumbres de la Combinatoria",
  "Cielo de las Funciones",
  "Islas de los Gráficos",
  "Templo Trigonométrico",
  "Santuario de los Ángulos",
  "Ciudad Estadística",
  "Metrópolis de Datos",
  "El Vacío Infinito",
  "Horizonte del Cálculo"
];

// Temporary in-memory level definitions (In the future, this can be fetched from Firebase)
export const defaultGameLevels: GameLevel[] = [];

for (let i = 1; i <= 200; i++) {
  const worldIndex = Math.floor((i - 1) / 10);
  const worldName = WORLD_NAMES[worldIndex];
  const isBoss = i % 10 === 0;

  defaultGameLevels.push({
    id: `lvl-${i}`,
    number: i,
    title: isBoss ? `Jefe de ${worldName}` : `Desafío Matemático ${i}`,
    description: isBoss ? `¡Derrota al jefe final del ${worldName} para avanzar!` : `Resuelve el desafío en ${worldName}.`,
    type: 'quiz',
    worldId: worldIndex + 1,
    isBoss
  });
}

// Override the first 5 levels con los mini-juegos base
defaultGameLevels[0] = { ...defaultGameLevels[0], title: 'El Teorema Perdido', description: 'Ayuda a Pitágoras a encontrar la hipotenusa para cruzar el río.', type: 'app', appComponentName: 'PythagorasGame' };
defaultGameLevels[1] = { ...defaultGameLevels[1], title: 'Aproximación Numérica', description: 'Acércate al límite para desactivar el escudo.', type: 'app', appComponentName: 'LimitsSimulation' };
defaultGameLevels[2] = { ...defaultGameLevels[2], title: 'Desafío Aritmético', description: 'Resuelve la ecuación fundamental para abrir la puerta.', type: 'quiz' };
defaultGameLevels[3] = { ...defaultGameLevels[3], title: 'El Valle de las Funciones', description: 'Identifica el dominio de la función misteriosa.', type: 'quiz' };
defaultGameLevels[4] = { ...defaultGameLevels[4], title: 'El Laberinto Derivado', description: 'Encuentra la pendiente de la recta tangente.', type: 'quiz' };

// Funciones para manejar el progreso temporalmente en LocalStorage
const PROGRESS_KEY = 'mathema_game_progress';
const BACKGROUNDS_KEY = 'mathema_world_backgrounds';

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

export const getWorldBackgrounds = (): Record<number, string> => {
  const data = localStorage.getItem(BACKGROUNDS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing backgrounds", e);
    }
  }
  return {};
};

export const setWorldBackground = (worldId: number, url: string) => {
  const current = getWorldBackgrounds();
  current[worldId] = url;
  localStorage.setItem(BACKGROUNDS_KEY, JSON.stringify(current));
  return current;
};

// Helper function to convert Google Drive share links to direct image links
export const getDirectImageUrl = (url: string): string => {
  if (!url) return url;
  // Match https://drive.google.com/file/d/ID/view
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  // Match https://drive.google.com/open?id=ID
  const driveOpenMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (url.includes('drive.google.com') && driveOpenMatch && driveOpenMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }
  return url;
};
