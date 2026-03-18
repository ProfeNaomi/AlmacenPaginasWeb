import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "almacen-web-naomi-9c3f4",
  appId: "1:747990899186:web:c70e0960423ceaa78ab36b",
  storageBucket: "almacen-web-naomi-9c3f4.firebasestorage.app",
  apiKey: "AIzaSyB92Rm9e3Lla9Y6O3OKXLKI-ExYbZbKrFI",
  authDomain: "almacen-web-naomi-9c3f4.firebaseapp.com",
  messagingSenderId: "747990899186"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
