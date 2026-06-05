import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

// The user will save their API key in localStorage via the Settings page
export const initializeAI = () => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
};

export const hasAIConfigured = () => {
  return !!localStorage.getItem('gemini_api_key');
};

export const generateMathSolution = async (questionText: string, options: string[], imageUrl?: string): Promise<string> => {
  if (!genAI) {
    initializeAI();
  }
  
  if (!genAI) {
    throw new Error('La clave de API de Gemini no está configurada. Por favor, configúrala en Ajustes.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
  Eres un profesor experto en matemáticas y en la prueba PAES de Chile.
  Te entregaré una pregunta de matemática con sus alternativas.
  Tu tarea es generar un SOLUCIONARIO detallado, paso a paso, explicando claramente el razonamiento lógico y matemático para llegar a la alternativa correcta.
  
  Escribe tu respuesta usando formato HTML limpio y amigable. Usa:
  - <b> o <strong> para resaltar cosas importantes.
  - <br> o párrafos <p> para separar los pasos.
  - Si hay fórmulas matemáticas, intenta explicarlas de forma sencilla.
  - Al final, indica claramente cuál es la alternativa correcta.
  
  Pregunta:
  ${questionText}
  
  Alternativas:
  ${options.map((opt, i) => `${i + 1}) ${opt}`).join('\n')}
  
  ${imageUrl ? `(La pregunta incluye una imagen de referencia en la URL: ${imageUrl})` : ''}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
