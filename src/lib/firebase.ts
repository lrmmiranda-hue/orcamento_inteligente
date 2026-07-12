import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1M03tg7Zik8DRbcaxNxjYRp7teDQbUyA",
  authDomain: "wcf-usinagem.firebaseapp.com",
  projectId: "wcf-usinagem",
  storageBucket: "wcf-usinagem.firebasestorage.app",
  messagingSenderId: "760990708137",
  appId: "1:760990708137:web:3875792679c01a1c7354b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore database instance
export const db = getFirestore(app);
