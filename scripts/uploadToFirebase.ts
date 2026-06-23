import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  projectId: "almacen-web-naomi-9c3f4",
  appId: "1:747990899186:web:c70e0960423ceaa78ab36b",
  storageBucket: "almacen-web-naomi-9c3f4.firebasestorage.app",
  apiKey: "AIzaSyB92Rm9e3Lla9Y6O3OKXLKI-ExYbZbKrFI",
  authDomain: "almacen-web-naomi-9c3f4.firebaseapp.com",
  messagingSenderId: "747990899186"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadData() {
  console.log("Iniciando subida a Firebase...");
  const jsonPath = path.join(__dirname, '../src/data/paes_questions_v2.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error("El archivo paes_questions_v2.json no existe.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Encontradas ${data.length} preguntas para subir.`);

  const collectionName = 'preguntas_demre';
  
  for (let i = 0; i < data.length; i++) {
    const question = data[i];
    try {
      // Usamos el ID original si existe, sino generamos uno
      const docId = question.id || `pregunta_${Date.now()}_${i}`;
      await setDoc(doc(db, collectionName, docId), {
        text: question.text || "",
        options: Object.values(question.options || {}), // Convertimos a array si es objeto
        correctAnswer: question.correctAnswer || 0,
        solution: question.solution || "<i>Solución pendiente...</i>",
        subject: question.subject || "Matemática",
        axis: question.axis || "General",
        topic: question.topic || "General",
        skill: question.skill || "Resolver problemas",
        source: question.source || "DEMRE PAES"
      });
      if ((i + 1) % 10 === 0) {
        console.log(`Subidas ${i + 1}/${data.length} preguntas...`);
      }
    } catch (error) {
      console.error(`Error al subir la pregunta ${i + 1}:`, error);
    }
  }

  console.log("¡Subida completada con éxito!");
  process.exit(0);
}

uploadData();
