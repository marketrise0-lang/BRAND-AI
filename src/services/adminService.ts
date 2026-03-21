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
};

// Metrics
export const subscribeToAdminMetrics = (callback: (metrics: AdminMetrics) => void) => {
  // This is a complex one because Firestore doesn't support count() in real-time listeners easily without cloud functions
  // For this demo, we'll use snapshots of collections and calculate client-side
  // In production, we'd use a dedicated metrics document updated by cloud functions
  
  const unsubUsers = onSnapshot(collection(db, "users"), (usersSnap) => {
    const totalUsers = usersSnap.size;
    
    onSnapshot(collectionGroup(db, "projects"), (projectsSnap) => {
      const totalDesigns = projectsSnap.size;
      
      onSnapshot(query(collection(db, "subscriptions"), where("status", "==", "active")), (subsSnap) => {
        const activeSubscriptions = subsSnap.size;
        
        onSnapshot(query(collection(db, "orders"), where("paymentStatus", "==", "paid")), (ordersSnap) => {
          let totalRevenue = 0;
          const orders: Order[] = [];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let newOrdersToday = 0;

          ordersSnap.forEach((doc) => {
            const data = doc.data() as Order;
            totalRevenue += data.amount;
            
            const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
            if (createdAt >= today) {
              newOrdersToday++;
            }
            orders.push({ ...data, id: doc.id });
          });

          // Sort and get recent sales
          const recentSales = orders
            .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
            .slice(0, 5);

          // Popular design type
          const typeCounts: Record<string, number> = {};
          projectsSnap.forEach((doc) => {
            const type = doc.data().type;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          const popularDesignType = Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || "None";

          callback({
            totalUsers,
            totalDesigns,
            activeSubscriptions,
            totalRevenue,
            newOrdersToday,
            recentSales,
            popularDesignType
          });
        });
      });
    });
  });

  return () => {
    unsubUsers();
    // Note: In a real app, we'd need to clean up all listeners correctly
  };
};

// User Management
export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  return onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (snap) => {
    const users = snap.docs.map(doc => ({ ...doc.data() as UserProfile, id: doc.id }));
    callback(users);
  });
};

// Project Management
export const subscribeToAllProjects = (callback: (projects: Project[]) => void) => {
  return onSnapshot(collectionGroup(db, "projects"), (snap) => {
    const projects = snap.docs.map(doc => ({ ...doc.data() as Project, id: doc.id }));
    callback(projects);
  });
};

// Template Management
export const subscribeToTemplates = (callback: (templates: Template[]) => void) => {
  return onSnapshot(query(collection(db, "templates"), orderBy("createdAt", "desc")), (snap) => {
    const templates = snap.docs.map(doc => ({ ...doc.data() as Template, id: doc.id }));
    callback(templates);
  });
};

export const createTemplate = async (template: Omit<Template, "id" | "createdAt">) => {
  return addDoc(collection(db, "templates"), {
    ...template,
    createdAt: serverTimestamp(),
  });
};

export const updateTemplate = async (id: string, updates: Partial<Template>) => {
  return updateDoc(doc(db, "templates", id), updates);
};

export const deleteTemplate = async (id: string) => {
  return deleteDoc(doc(db, "templates", id));
};

// Blog Management
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  return onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => {
    const posts = snap.docs.map(doc => ({ ...doc.data() as Post, id: doc.id }));
    callback(posts);
  });
};

export const createPost = async (post: Omit<Post, "id" | "createdAt">) => {
  return addDoc(collection(db, "posts"), {
    ...post,
    createdAt: serverTimestamp(),
  });
};

export const updatePost = async (id: string, updates: Partial<Post>) => {
  return updateDoc(doc(db, "posts", id), updates);
};

// Order Management
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  return onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
    const orders = snap.docs.map(doc => ({ ...doc.data() as Order, id: doc.id }));
    callback(orders);
  });
};

// Subscription Management
export const subscribeToSubscriptions = (callback: (subscriptions: Subscription[]) => void) => {
  return onSnapshot(query(collection(db, "subscriptions"), orderBy("startedAt", "desc")), (snap) => {
    const subscriptions = snap.docs.map(doc => ({ ...doc.data() as Subscription, id: doc.id }));
    callback(subscriptions);
  });
};
