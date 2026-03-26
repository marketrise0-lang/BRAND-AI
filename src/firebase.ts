import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with long polling enabled for better stability in iframe environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || "(default)");

// Explicitly pass the bucket URL and ensure it has the gs:// prefix if needed
const bucketUrl = firebaseConfig.storageBucket.startsWith('gs://') 
  ? firebaseConfig.storageBucket 
  : `gs://${firebaseConfig.storageBucket}`;

export const storage = getStorage(app, bucketUrl);

export default app;
