import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

async function processQuestions() {
  const text = fs.readFileSync('competencias_extracted.txt', 'utf-8');
  
  // Clean text and extract chunks of questions (basic heuristic)
  // PAES usually has questions starting with a number from 1 to 65
  const questions = [];
  
  const prompt = `
A continuación se presenta el texto extraído de la prueba oficial de PAES de Competencia Matemática 1 (M1).
Extrae las 65 preguntas y devuélvelas en un arreglo JSON. Si hay menos o más, intenta extraer las verdaderas preguntas de la prueba (están enumeradas del 1 al 65).
Para cada pregunta, devuelve el siguiente formato:
{
  "text": "<p>Texto de la pregunta con formato HTML básico...</p>",
  "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "correctAnswer": 0,
  "solution": "<i>Solución pendiente de revisión...</i>",
  "level": "Secundaria",
  "axis": "Eje temático de la PAES M1 (ej. Números, Álgebra y Funciones, Geometría, Probabilidad y Estadística)",
  "source": "DEMRE",
  "topic": "Tema específico (ej. Porcentajes, Funciones Lineales, Área y Perímetro)",
  "skill": "Habilidad (ej. Resolver problemas, Representar, Modelar, Argumentar)"
}

Es MUY IMPORTANTE que deduzcas el "axis", "topic" y "skill" correctos para cada pregunta según el temario oficial del DEMRE para la PAES de Matemáticas.

TEXTO DE LA PRUEBA:
${text.substring(0, 45000)} // Limitar si es necesario, 36KB cabe bien.
`;

  try {
    console.log("Consultando a la IA...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonArray = JSON.parse(responseText);
    
    fs.writeFileSync('competencias_lote_importar.json', JSON.stringify(jsonArray, null, 2), 'utf-8');
    console.log(`¡Éxito! Se procesaron ${jsonArray.length} preguntas en competencias_lote_importar.json`);
  } catch (err) {
    console.error("Error al procesar:", err);
  }
}

processQuestions();
