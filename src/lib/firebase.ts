import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== 'undefined') {
  console.log('[Firebase Initialized] Project ID:', app.options.projectId);
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore (using custom databaseId if configured)
const customDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = customDatabaseId
  ? getFirestore(app, customDatabaseId)
  : getFirestore(app);

// Validate initial connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Real-time connection validated.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Offline mode active or network disconnected.');
      return false;
    }
    // Permission denied or missing doc is normal for test doc
    return true;
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export default app;

