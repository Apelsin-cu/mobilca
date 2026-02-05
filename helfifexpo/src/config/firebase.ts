import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase конфигурация проекта food
const firebaseConfig = {
  apiKey: "AIzaSyAi6bix_bJEQnBPjCwCo2BTcX0FhxEZ_es",
  authDomain: "food-8d785.firebaseapp.com",
  projectId: "food-8d785",
  storageBucket: "food-8d785.firebasestorage.app",
  messagingSenderId: "968479567558",
  appId: "1:968479567558:web:34b9566bce454bec5531c7",
  measurementId: "G-SJ4DZ1MJ6V"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
