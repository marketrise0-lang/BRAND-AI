import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
  writeBatch,
  collectionGroup
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { 
  AdminProfile, 
  Template, 
  Order, 
  Subscription, 
  Post, 
  UserProfile, 
  Project, 
  AdminMetrics 
} from "../../types";

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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
}

// Admin Profile
export const checkIsAdmin = async (user: any): Promise<boolean> => {
  if (!user) return false;
  if (user.email === 'ngwanoloic256@gmail.com') return true;
  
  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    return adminDoc.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

export const createAdminProfile = async (user: any) => {
  if (!user) return;
  const adminRef = doc(db, "admins", user.uid);
  try {
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      const adminData: AdminProfile = {
        uid: user.uid,
        displayName: user.displayName || "Admin",
        email: user.email,
        role: "admin",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(adminRef, adminData);
    } else {
      await updateDoc(adminRef, { lastLoginAt: serverTimestamp() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admins/${user.uid}`);
  }
};

// Metrics
export const subscribeToAdminMetrics = (callback: (metrics: AdminMetrics) => void) => {
  let totalUsers = 0;
  let totalDesigns = 0;
  let activeSubscriptions = 0;
  let totalRevenue = 0;
  let newOrdersToday = 0;
  let recentSales: Order[] = [];
  let popularDesignType = "None";

  const updateMetrics = () => {
    callback({
      totalUsers,
      totalDesigns,
      activeSubscriptions,
      totalRevenue,
      newOrdersToday,
      recentSales,
      popularDesignType
    });
  };

  const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
    totalUsers = snap.size;
    updateMetrics();
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

  const unsubProjects = onSnapshot(collectionGroup(db, "projects"), (snap) => {
    totalDesigns = snap.size;
    
    const typeCounts: Record<string, number> = {};
    snap.forEach((doc) => {
      const type = doc.data().type;
      if (type) typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    popularDesignType = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || "None";
    
    updateMetrics();
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects (group)'));

  const unsubSubs = onSnapshot(query(collection(db, "subscriptions"), where("status", "==", "active")), (snap) => {
    activeSubscriptions = snap.size;
    updateMetrics();
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'subscriptions'));

  const unsubOrders = onSnapshot(query(collection(db, "orders"), where("paymentStatus", "==", "paid")), (snap) => {
    totalRevenue = 0;
    newOrdersToday = 0;
    const orders: Order[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    snap.forEach((doc) => {
      const data = doc.data() as Order;
      totalRevenue += data.amount;
      
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      if (createdAt >= today) {
        newOrdersToday++;
      }
      orders.push({ ...data, id: doc.id });
    });

    recentSales = orders
      .sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    updateMetrics();
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

  return () => {
    unsubUsers();
    unsubProjects();
    unsubSubs();
    unsubOrders();
  };
};

// User Management
export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  return onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (snap) => {
    const users = snap.docs.map(doc => ({ ...doc.data() as UserProfile, id: doc.id }));
    callback(users);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
};

// Project Management
export const subscribeToAllProjects = (callback: (projects: (Project & { path: string })[]) => void) => {
  return onSnapshot(collectionGroup(db, "projects"), (snap) => {
    const projects = snap.docs.map(doc => ({ ...doc.data() as Project, id: doc.id, path: doc.ref.path }));
    callback(projects);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects (group)'));
};

export const updateSystemProject = async (path: string, updates: Partial<Project>) => {
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

export const deleteSystemProject = async (path: string) => {
  try {
    const projectRef = doc(db, path);
    await deleteDoc(projectRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const deleteAllSystemProjects = async () => {
  try {
    const [projectsSnap, progressSnap, activitySnap, downloadsSnap] = await Promise.all([
      getDocs(collectionGroup(db, "projects")),
      getDocs(collectionGroup(db, "progress")),
      getDocs(collectionGroup(db, "activity")),
      getDocs(collectionGroup(db, "downloads"))
    ]);

    const batch = writeBatch(db);
    
    projectsSnap.docs.forEach(doc => batch.delete(doc.ref));
    progressSnap.docs.forEach(doc => batch.delete(doc.ref));
    activitySnap.docs.forEach(doc => batch.delete(doc.ref));
    downloadsSnap.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'all_system_projects');
  }
};

// Template Management
export const subscribeToTemplates = (callback: (templates: Template[]) => void) => {
  return onSnapshot(query(collection(db, "templates"), orderBy("createdAt", "desc")), (snap) => {
    const templates = snap.docs.map(doc => ({ ...doc.data() as Template, id: doc.id }));
    callback(templates);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'templates'));
};

export const createTemplate = async (template: Omit<Template, "id" | "createdAt">) => {
  try {
    return await addDoc(collection(db, "templates"), {
      ...template,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'templates');
  }
};

export const updateTemplate = async (id: string, updates: Partial<Template>) => {
  try {
    return await updateDoc(doc(db, "templates", id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `templates/${id}`);
  }
};

export const deleteTemplate = async (id: string) => {
  try {
    return await deleteDoc(doc(db, "templates", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `templates/${id}`);
  }
};

// Blog Management
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  return onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => {
    const posts = snap.docs.map(doc => ({ ...doc.data() as Post, id: doc.id }));
    callback(posts);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));
};

export const createPost = async (post: Omit<Post, "id" | "createdAt">) => {
  try {
    return await addDoc(collection(db, "posts"), {
      ...post,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'posts');
  }
};

export const updatePost = async (id: string, updates: Partial<Post>) => {
  try {
    return await updateDoc(doc(db, "posts", id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
  }
};

// Order Management
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  return onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
    const orders = snap.docs.map(doc => ({ ...doc.data() as Order, id: doc.id }));
    callback(orders);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
};

// Subscription Management
export const subscribeToSubscriptions = (callback: (subscriptions: Subscription[]) => void) => {
  return onSnapshot(query(collection(db, "subscriptions"), orderBy("startedAt", "desc")), (snap) => {
    const subscriptions = snap.docs.map(doc => ({ ...doc.data() as Subscription, id: doc.id }));
    callback(subscriptions);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'subscriptions'));
};
