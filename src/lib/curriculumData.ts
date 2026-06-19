export interface AprendizajeEsperado {
  id: string;
  nivel: string;
  asignatura: string;
  eje: string;
  codigo: string;
  descripcion: string;
}

export const OAsMineduc: AprendizajeEsperado[] = [
  // 7MO BÁSICO - MATEMÁTICA
  {
    id: "mat-7-oa1",
    nivel: "7mo Básico",
    asignatura: "Matemática",
    eje: "Números",
    codigo: "OA 1",
    descripcion: "Mostrar que comprenden la adición y la sustracción de números enteros: representando los números enteros en la recta numérica..."
  },
  {
    id: "mat-7-oa10",
    nivel: "7mo Básico",
    asignatura: "Matemática",
    eje: "Geometría",
    codigo: "OA 10",
    descripcion: "Descubrir relaciones que involucran ángulos exteriores o interiores de diferentes polígonos."
  },
  {
    id: "mat-7-oa11",
    nivel: "7mo Básico",
    asignatura: "Matemática",
    eje: "Geometría",
    codigo: "OA 11",
    descripcion: "Mostrar que comprenden el círculo: describiendo las relaciones entre el radio, el diámetro y el perímetro del círculo..."
  },
  
  // 8VO BÁSICO - MATEMÁTICA
  {
    id: "mat-8-oa1",
    nivel: "8vo Básico",
    asignatura: "Matemática",
    eje: "Números",
    codigo: "OA 1",
    descripcion: "Mostrar que comprenden la multiplicación y la división de números enteros..."
  },
  {
    id: "mat-8-oa11",
    nivel: "8vo Básico",
    asignatura: "Matemática",
    eje: "Geometría",
    codigo: "OA 11",
    descripcion: "Desarrollar las fórmulas para encontrar el área de superficies y el volumen de prismas rectos con diferentes bases y cilindros."
  },
  {
    id: "mat-8-oa12",
    nivel: "8vo Básico",
    asignatura: "Matemática",
    eje: "Geometría",
    codigo: "OA 12",
    descripcion: "Explicar, de manera concreta, pictórica y simbólica, la validez del teorema de Pitágoras y aplicar a la resolución de problemas geométricos y de la vida cotidiana."
  }
];

// Opciones de niveles disponibles en el sistema
export const NivelesEducativos = [
  "Pre-Kínder",
  "Kínder",
  "1ro Básico",
  "2do Básico",
  "3ro Básico",
  "4to Básico",
  "5to Básico",
  "6to Básico",
  "7mo Básico",
  "8vo Básico",
  "1ro Medio",
  "2do Medio",
  "3ro Medio",
  "4to Medio"
];

// Asignaturas base
export const AsignaturasBase = [
  "Matemática",
  "Lenguaje y Comunicación",
  "Ciencias Naturales",
  "Historia, Geografía y Ciencias Sociales",
  "Inglés",
  "Educación Física y Salud",
  "Artes Visuales",
  "Música",
  "Tecnología"
];
