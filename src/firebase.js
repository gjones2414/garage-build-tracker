import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyByNzZc7rxbTh6od01Oqn4N9_HR-Qi3nuI",
  authDomain: "busted-knuckles-garage.firebaseapp.com",
  projectId: "busted-knuckles-garage",
  storageBucket: "busted-knuckles-garage.firebasestorage.app",
  messagingSenderId: "1041440135870",
  appId: "1:1041440135870:web:b7bae162dd4b4067afdcef",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);