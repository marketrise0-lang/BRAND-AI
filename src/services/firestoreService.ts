import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Project, DesignProgress, Activity, Download, UserProfile } from "../../types";

// Error handling helper
const handleFirestoreError = (error: any, operation: string, path: string) => {
  const errInfo = {
    error: error.message,
    operationType: operation,
    path: path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    }
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

// User Profile
export const createUserProfile = async (uid: string, email: string, displayName: string) => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, path);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        email,
        displayName,
        role: 'user',
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, 'create', path);
  }
};

// Projects
export const createProject = async (uid: string, project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  const path = `users/${uid}/projects`;
  try {
    const projectRef = doc(collection(db, path));
    const newProject: Project = {
      ...project,
      id: projectRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(projectRef, newProject);
    
    // Initialize progress
    await updateProgress(uid, projectRef.id, {
      totalSteps: 5,
      completedSteps: 1,
      progressPercent: 20,
      lastAction: 'Project Created'
    });

    // Log activity
    await logActivity(uid, {
      type: 'logo_generation',
      projectId: projectRef.id
    });

    return projectRef.id;
  } catch (error) {
    handleFirestoreError(error, 'create', path);
  }
};

export const updateProject = async (uid: string, projectId: string, updates: Partial<Project>) => {
  const path = `users/${uid}/projects/${projectId}`;
  try {
    const projectRef = doc(db, path);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, 'update', path);
  }
};

// Progress
export const updateProgress = async (uid: string, projectId: string, progress: Omit<DesignProgress, 'projectId' | 'updatedAt'>) => {
  const path = `users/${uid}/progress/${projectId}`;
  try {
    const progressRef = doc(db, path);
    await setDoc(progressRef, {
      ...progress,
      projectId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, 'update', path);
  }
};

// Activity
export const logActivity = async (uid: string, activity: Omit<Activity, 'id' | 'createdAt'>) => {
  const path = `users/${uid}/activity`;
  try {
    const activityRef = doc(collection(db, path));
    await setDoc(activityRef, {
      ...activity,
      id: activityRef.id,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, 'create', path);
  }
};

// Downloads
export const recordDownload = async (uid: string, download: Omit<Download, 'id' | 'createdAt'>) => {
  const path = `users/${uid}/downloads`;
  try {
    const downloadRef = doc(collection(db, path));
    await setDoc(downloadRef, {
      ...download,
      id: downloadRef.id,
      createdAt: serverTimestamp()
    });
    
    // Log activity
    await logActivity(uid, {
      type: 'download',
      projectId: download.projectId
    });
  } catch (error) {
    handleFirestoreError(error, 'create', path);
  }
};

// Real-time Listeners
export const subscribeToProjects = (uid: string, callback: (projects: Project[]) => void) => {
  const path = `users/${uid}/projects`;
  const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => doc.data() as Project);
    callback(projects);
  }, (error) => handleFirestoreError(error, 'list', path));
};

export const subscribeToProgress = (uid: string, callback: (progress: DesignProgress[]) => void) => {
  const path = `users/${uid}/progress`;
  const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const progress = snapshot.docs.map(doc => doc.data() as DesignProgress);
    callback(progress);
  }, (error) => handleFirestoreError(error, 'list', path));
};

export const subscribeToActivity = (uid: string, callback: (activities: Activity[]) => void) => {
  const path = `users/${uid}/activity`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => doc.data() as Activity);
    callback(activities);
  }, (error) => handleFirestoreError(error, 'list', path));
};

export const subscribeToDownloads = (uid: string, callback: (downloads: Download[]) => void) => {
  const path = `users/${uid}/downloads`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const downloads = snapshot.docs.map(doc => doc.data() as Download);
    callback(downloads);
  }, (error) => handleFirestoreError(error, 'list', path));
};
