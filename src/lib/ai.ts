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
  ${options.map((opt, i) => `${i + 1}) ${opt}`).join('\\n')}
  
  ${imageUrl ? `(La pregunta incluye una imagen de referencia en la URL: ${imageUrl})` : ''}
  `;

  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b', 'gemini-1.0-pro', 'gemini-pro'];
  let result;
  let lastError: any;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      result = await model.generateContent(prompt);
      break; // Si tiene éxito, salimos del bucle
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || '';
      
      // Si el error es de clave caducada o inválida, no tiene sentido probar otros modelos
      if (errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('api_key_invalid')) {
        throw new Error('Tu Clave API de Google es inválida o ha caducado. Por favor, genera una NUEVA clave en aistudio.google.com/app/apikey y actualízala en Ajustes.');
      }
      
      // Si el error es de "not found" o "404", guardamos el error y probamos el siguiente modelo
      if (errorMsg.includes('not found') || error.status === 404) {
        continue;
      }
      
      // Cualquier otro error, lo lanzamos
      throw new Error(`Ocurrió un error con la IA: ${error.message}`);
    }
  }

  // Si después de probar todos los modelos, no hay result
  if (!result) {
    throw new Error('Tu Clave API es válida, pero tu cuenta de Google no tiene permisos para usar ninguno de los modelos de Gemini disponibles en tu región. Prueba creando la clave con un correo de Gmail personal diferente.');
  }

  const response = await result.response;
  return response.text();
};
