import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  memoryLocalCache,
  serverTimestamp,
  setLogLevel,
  getDocFromServer,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppData } from './storage';
import { AuthUser } from '../types';
import { sanitizeAppDataForFirestore } from './imageCompressor';

// Suppress internal Firestore clock skew and offline sync warnings in sandboxed browser logs
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const dbId = ((firebaseConfig as any).firestoreDatabaseId && (firebaseConfig as any).firestoreDatabaseId !== '(default)')
  ? (firebaseConfig as any).firestoreDatabaseId
  : undefined;

// Initialize Firestore with memory cache and long-polling for sandboxed iframe environments
let firestoreDb: Firestore;
try {
  const firestoreSettings = {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache(),
    ignoreUndefinedProperties: true
  };

  firestoreDb = dbId 
    ? initializeFirestore(app, firestoreSettings, dbId)
    : initializeFirestore(app, firestoreSettings);
} catch {
  firestoreDb = dbId 
    ? getFirestore(app, dbId)
    : getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
  return errInfo;
}

// Standard Google Auth Provider for Firebase Authentication
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google Account using Firebase Auth
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (error: any) {
    console.warn('Google Popup sign-in:', error);
    throw error;
  }
}

/**
 * Register with Email & Password
 */
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string,
  companyName?: string
): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred.user;
}

/**
 * Sign in with Email & Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

/**
 * Sign out from Firebase
 */
export async function logoutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Convert FirebaseUser to AuthUser application type
 */
export function mapFirebaseUserToAuthUser(user: FirebaseUser, extraCompany?: string): AuthUser {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Google User',
    email: user.email || 'user@gmail.com',
    companyName: extraCompany || 'Waimao International Trade Partner',
    role: 'Verified Google Account'
  };
}

/**
 * Compatibility token storage helpers
 */
export function getValidGoogleAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('google_oauth_token_data');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.access_token && parsed.expires_at > Date.now()) {
      return parsed.access_token;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveGoogleAccessToken(token: string, expiresInSeconds: number = 3599) {
  try {
    const data = {
      access_token: token,
      expires_at: Date.now() + (expiresInSeconds * 1000),
      timestamp: Date.now()
    };
    localStorage.setItem('google_oauth_token_data', JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearGoogleAccessToken() {
  try {
    localStorage.removeItem('google_oauth_token_data');
  } catch {
    // ignore
  }
}

/**
 * Fetch User's App Data from Firestore (Single Source of Truth)
 */
export async function fetchUserDataFromFirestore(uid: string): Promise<AppData | null> {
  const targetUid = auth.currentUser?.uid || uid;
  if (!targetUid) return null;
  const path = `users/${targetUid}`;
  try {
    const userDocRef = doc(db, 'users', targetUid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const docData = snap.data();
      if (docData.appData) {
        return docData.appData as AppData;
      }
    }
    return null;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Save User's App Data directly to Cloud Firestore
 */
export async function saveUserDataToFirestore(uid: string, appData: AppData): Promise<void> {
  const targetUid = auth.currentUser?.uid || uid;
  if (!targetUid) return;
  const path = `users/${targetUid}`;
  try {
    const userDocRef = doc(db, 'users', targetUid);

    // Sanitize and compress any large base64 images to stay safely under Firestore document limits
    const cleanData = await sanitizeAppDataForFirestore(appData);

    await setDoc(userDocRef, {
      uid: targetUid,
      email: auth.currentUser?.email || '',
      appData: cleanData,
      updatedAt: serverTimestamp(),
      lastClientSync: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

/**
 * Real-time listener for User's App Data from Cloud Firestore.
 * Fires whenever changes occur on this or any other device.
 */
export function subscribeToUserDataInFirestore(
  uid: string, 
  onUpdate: (appData: AppData) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const targetUid = auth.currentUser?.uid || uid;
  if (!targetUid) return () => {};
  const path = `users/${targetUid}`;
  const userDocRef = doc(db, 'users', targetUid);

  return onSnapshot(userDocRef, {
    next: (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.appData) {
          onUpdate(data.appData as AppData);
        }
      }
    },
    error: (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  });
}

/**
 * Migration helper: If Firestore has no data for this authenticated user,
 * safely uploads existing local/migrated data to Firestore so no existing user work is lost.
 */
export async function migrateExistingDataToFirestore(uid: string, localData: AppData): Promise<AppData> {
  const targetUid = auth.currentUser?.uid || uid;
  if (!targetUid) return localData;

  const existingCloud = await fetchUserDataFromFirestore(targetUid);
  if (existingCloud) {
    // Cloud is already populated and authoritative
    return existingCloud;
  }

  // Upload local dataset to Firestore for this account
  await saveUserDataToFirestore(targetUid, localData);
  return localData;
}
