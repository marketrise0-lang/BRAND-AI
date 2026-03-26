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
  deleteDoc,
  limit
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Project, DesignProgress, Activity, Download, UserProfile, Subscription } from "../../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('unavailable') || message.includes('offline')) {
    console.error("Firestore is currently unavailable or offline. This might be a network issue or a configuration problem.");
  }

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
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
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
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
    handleFirestoreError(error, OperationType.CREATE, path);
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
    handleFirestoreError(error, OperationType.UPDATE, path);
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
    handleFirestoreError(error, OperationType.UPDATE, path);
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
    handleFirestoreError(error, OperationType.CREATE, path);
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
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// Real-time Listeners
export const subscribeToProjects = (uid: string, callback: (projects: Project[]) => void) => {
  const path = `users/${uid}/projects`;
  const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => doc.data() as Project);
    callback(projects);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const subscribeToProgress = (uid: string, callback: (progress: DesignProgress[]) => void) => {
  const path = `users/${uid}/progress`;
  const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const progress = snapshot.docs.map(doc => doc.data() as DesignProgress);
    callback(progress);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const subscribeToActivity = (uid: string, callback: (activities: Activity[]) => void) => {
  const path = `users/${uid}/activity`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => doc.data() as Activity);
    callback(activities);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const subscribeToDownloads = (uid: string, callback: (downloads: Download[]) => void) => {
  const path = `users/${uid}/downloads`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const downloads = snapshot.docs.map(doc => doc.data() as Download);
    callback(downloads);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const subscribeToUserSubscription = (uid: string, callback: (subscription: Subscription | null) => void) => {
  const q = query(collection(db, "subscriptions"), where("userId", "==", uid), limit(1));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
    } else {
      callback({ ...snapshot.docs[0].data() as Subscription, id: snapshot.docs[0].id });
    }
  }, (error) => handleFirestoreError(error, OperationType.GET, 'subscriptions'));
};
