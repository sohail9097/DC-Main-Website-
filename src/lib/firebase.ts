import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const dbId = (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === "(default)") 
  ? undefined 
  : firebaseConfig.firestoreDatabaseId;
export const db = getFirestore(app, dbId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as per instructions
async function testConnection() {
  try {
    const fetchDoc = getDocFromServer(doc(db, 'test', 'connection'));
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('connection-timeout: Could not reach backend in 3 seconds')), 3000)
    );
    await Promise.race([fetchDoc, timeout]);
    console.log("Firebase connected successfully");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('offline') ||
      msg.includes('backend') ||
      msg.includes('connection-timeout') ||
      msg.includes('10 seconds') ||
      msg.includes('Could not reach')
    ) {
      console.warn("Firebase: Cloud Firestore is operating in offline/cached mode.");
    } else if (msg.includes('permission-denied')) {
      console.error("Firebase: Permission denied for connection test. Check Firestore rules.");
    } else {
      console.warn("Firebase connection notice:", msg);
    }
  }
}
testConnection();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    if (error instanceof Error && error.message.includes('auth/unauthorized-domain')) {
      console.error("CRITICAL: Domain not authorized in Firebase Console. Please add your app domains to Authorized Domains in Firebase Authentication settings.");
    }
    throw error;
  }
};

export const signOut = () => firebaseSignOut(auth);
