import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Firestore'ду импорттоо

const firebaseConfig = {
    apiKey: "AIzaSyAtmgZv5gq-goS6slRwZ85_nEm4WA3-Wsg",
    authDomain: "test-321e8.firebaseapp.com",
    projectId: "test-321e8",
    storageBucket: "test-321e8.firebasestorage.app",
    messagingSenderId: "309839929177",
    appId: "1:309839929177:web:3aa67fc9f1f514e3d7b648"
};

const app = initializeApp(firebaseConfig);

// Экспорттор
export const auth = getAuth(app);
export const db = getFirestore(app); // Мына ушул жер жок болчу, коштук