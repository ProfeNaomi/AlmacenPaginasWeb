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
  comodines?: number; // Daily rewards
  lastLoginDate?: string; // ISO string to check 24h
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

// --- MUNDO 1: BOSQUE DE LOS NATURALES ---
defaultGameLevels[0] = { ...defaultGameLevels[0], title: 'Contra Reloj: Sumas', description: 'Suma de números naturales en tiempo récord.', type: 'app', appComponentName: 'ContraRelojGame' };
defaultGameLevels[1] = { ...defaultGameLevels[1], title: 'Clasificación Binaria: Paridad', description: 'Distingue entre números pares e impares.', type: 'app', appComponentName: 'ClasificacionBinariaGame' };
defaultGameLevels[2] = { ...defaultGameLevels[2], title: 'El Intruso', description: 'Encuentra el número que no es múltiplo.', type: 'app', appComponentName: 'ElIntrusoGame' };
defaultGameLevels[3] = { ...defaultGameLevels[3], title: 'La Secuencia', description: 'Ordena los múltiplos de menor a mayor.', type: 'app', appComponentName: 'LaSecuenciaGame' };
defaultGameLevels[4] = { ...defaultGameLevels[4], title: 'Las Parejas', description: 'Une la operación con su resultado.', type: 'app', appComponentName: 'ParejasGame' };
defaultGameLevels[5] = { ...defaultGameLevels[5], title: 'La Balanza', description: 'Encuentra la equivalencia de sumas.', type: 'app', appComponentName: 'LaBalanzaGame' };
defaultGameLevels[6] = { ...defaultGameLevels[6], title: 'Matriz de Memoria', description: 'Memoriza la posición de las sumas.', type: 'app', appComponentName: 'MemoryMatrixGame' };
defaultGameLevels[7] = { ...defaultGameLevels[7], title: 'Ecuaciones en Caída', description: 'Velocidad de procesamiento de ecuaciones.', type: 'app', appComponentName: 'FallingEquationsGame' };
defaultGameLevels[8] = { ...defaultGameLevels[8], title: 'Cambia Formas', description: 'Identifica fracciones y geometría.', type: 'app', appComponentName: 'ShapeShifterGame' };
defaultGameLevels[9] = { ...defaultGameLevels[9], title: 'Jefe: El Guardián Natural', description: 'Multitarea: Matemáticas y Esquivar.', type: 'app', appComponentName: 'DualTaskGame' };

// --- MUNDO 2: PRADERA DE LOS ENTEROS ---
defaultGameLevels[10] = { ...defaultGameLevels[10], title: 'Camino Lógico', description: 'Construye la ecuación correcta.', type: 'app', appComponentName: 'LogicalPathGame' };
defaultGameLevels[11] = { ...defaultGameLevels[11], title: 'Simón Dice Matemático', description: 'Memoriza la secuencia de operaciones.', type: 'app', appComponentName: 'SimonSaysMathGame' };
defaultGameLevels[12] = { ...defaultGameLevels[12], title: 'Retorno 2 (N-Back)', description: 'Recuerda el número de 2 turnos atrás.', type: 'app', appComponentName: 'NBackMathGame' };
defaultGameLevels[13] = { ...defaultGameLevels[13], title: 'Efecto Stroop Matemático', description: 'No te dejes engañar por el tamaño visual.', type: 'app', appComponentName: 'StroopMathGame' };
defaultGameLevels[14] = { ...defaultGameLevels[14], title: 'Burbujas Ascendentes', description: 'Estalla las burbujas de menor a mayor.', type: 'app', appComponentName: 'AscendingBubblesGame' };
defaultGameLevels[15] = { ...defaultGameLevels[15], title: 'Reflejo Simétrico', description: 'Espejo de patrones simétricos.', type: 'app', appComponentName: 'SymmetricalReflexGame' };
defaultGameLevels[16] = { ...defaultGameLevels[16], title: 'Cajas Fuertes', description: 'Suma mental múltiple y memoria.', type: 'app', appComponentName: 'SafeCrackersGame' };
defaultGameLevels[17] = { ...defaultGameLevels[17], title: 'La Pieza Faltante', description: 'Álgebra intuitiva básica.', type: 'app', appComponentName: 'MissingPieceGame' };
defaultGameLevels[18] = { ...defaultGameLevels[18], title: 'Radar de Objetivos', description: 'Encuentra los múltiplos correctos.', type: 'app', appComponentName: 'TargetRadarGame' };
defaultGameLevels[19] = { ...defaultGameLevels[19], title: 'Jefe: El Titán del Cero', description: 'Rotación mental de cuadrículas.', type: 'app', appComponentName: 'GridRotationGame' };

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
    stars: {},
    comodines: 0,
    lastLoginDate: undefined
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
  
  // Extraer el ID de Google Drive de varios formatos posibles
  let driveId = null;
  
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    driveId = driveMatch[1];
  } else {
    const driveOpenMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (url.includes('drive.google.com') && driveOpenMatch && driveOpenMatch[1]) {
      driveId = driveOpenMatch[1];
    }
  }

  if (driveId) {
    // El endpoint de thumbnail es el más confiable actualmente para incrustar en img src o background-image
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w2500`;
  }
  
  return url;
};
