import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYb0apzMt88uazkG4uwQe5OsRFPjdtZW4",
  authDomain: "brand-ao-ef0f6.firebaseapp.com",
  databaseURL: "https://brand-ao-ef0f6-default-rtdb.firebaseio.com",
  projectId: "brand-ao-ef0f6",
  storageBucket: "brand-ao-ef0f6.firebasestorage.app",
  messagingSenderId: "439940497834",
  appId: "1:439940497834:web:6edd17a08e7b9227fd2bd3",
  measurementId: "G-L5Z35PVT0H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
