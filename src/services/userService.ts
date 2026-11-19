import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreUserProfile, FirestoreUserPreferences, MasterclassProgress } from '../types';

export const DEFAULT_MASTERCLASS_PROGRESS: MasterclassProgress = {
  completedLessons: [],
  currentLesson: null,
  battingProgress: 0,
  bowlingProgress: 0,
  lastActiveLessonId: null,
};

export const DEFAULT_USER_PREFERENCES: FirestoreUserPreferences = {
  theme: 'dark',
  language: 'en',
  defaultAlertPreset: 'balanced',
  busyModeEnabled: false,
  notificationPreferences: {
    wickets: true,
    milestones: true,
    rainDelays: true,
    inningsBreak: true,
    matchResult: true,
    hourlyDigest: true,
    sound: true,
    boundaries: false,
  },
  newsPreferences: {
    categories: ['Latest', 'For You'],
  },
  followedTeams: [],
  followedPlayers: [],
  followedTournaments: [],
  savedNews: [],
};

export interface AuthUserInfo {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  providerId?: string;
}

/**
 * Fetch a user's profile document from Firestore by UID.
 */
export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return snapshot.data() as FirestoreUserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to load user profile. Please check your connection.');
  }
}

/**
 * Subscribes in real time to the user profile document in Firestore (`users/{uid}`).
 * Any changes made from any client, device, or browser tab are reflected immediately.
 * Returns an unsubscribe function.
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: FirestoreUserProfile | null) => void,
  onError?: (err: Error) => void
): () => void {
  if (!uid) {
    onUpdate(null);
    return () => {};
  }

  try {
    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as FirestoreUserProfile);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.warn('[Firestore Real-time] Profile snapshot notice:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error initializing user profile real-time subscription:', err);
    return () => {};
  }
}

/**
 * Create a new user profile document in Firestore (`users/{uid}`).
 * Never stores passwords or secret authentication tokens in Firestore.
 */
export async function createUserProfile(
  userInfo: AuthUserInfo,
  customPreferences?: Partial<FirestoreUserPreferences>
): Promise<FirestoreUserProfile> {
  const { uid, displayName = null, email = null, photoURL = null, providerId = 'password' } = userInfo;

  const initialProfile: FirestoreUserProfile = {
    uid,
    displayName: displayName || null,
    email: email || null,
    photoURL: photoURL || null,
    authProvider: providerId || 'password',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    onboardingCompleted: false,
    preferences: {
      ...DEFAULT_USER_PREFERENCES,
      ...customPreferences,
    },
    masterclassProgress: DEFAULT_MASTERCLASS_PROGRESS,
  };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, initialProfile);
    return initialProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile document.');
  }
}

/**
 * Ensures a user profile document exists for an authenticated user.
 * Reads existing profile first and only creates if missing to prevent overwriting user preferences.
 */
export async function ensureUserProfileExists(
  userInfo: AuthUserInfo
): Promise<FirestoreUserProfile> {
  if (!userInfo?.uid) {
    throw new Error('Authentication state unavailable.');
  }

  try {
    const existingProfile = await getUserProfile(userInfo.uid);
    if (existingProfile) {
      return existingProfile;
    }
    return await createUserProfile(userInfo);
  } catch (error) {
    console.error('Error ensuring user profile exists:', error);
    throw new Error('Unable to verify or initialize user profile.');
  }
}

/**
 * Update top-level fields on the user profile document in Firestore.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<FirestoreUserProfile, 'uid' | 'createdAt'>>
): Promise<void> {
  if (!uid) throw new Error('User ID required.');

  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile.');
  }
}

/**
 * Update user preferences inside the user document in Firestore.
 */
export async function updateUserPreferences(
  uid: string,
  preferencesUpdate: Partial<FirestoreUserPreferences>
): Promise<void> {
  if (!uid) throw new Error('User ID required.');

  try {
    const userRef = doc(db, 'users', uid);
    const currentProfile = await getUserProfile(uid);

    if (!currentProfile) {
      throw new Error('User profile document missing.');
    }

    const updatedPreferences = {
      ...currentProfile.preferences,
      ...preferencesUpdate,
    };

    await updateDoc(userRef, {
      preferences: updatedPreferences,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error('Failed to update user preferences.');
  }
}

/**
 * Get user preferences specifically from Firestore.
 */
export async function getUserPreferences(uid: string): Promise<FirestoreUserPreferences | null> {
  const profile = await getUserProfile(uid);
  return profile?.preferences || null;
}

/**
 * Updates Masterclass progress (completed lessons, active lesson, discipline percentages)
 * under the authenticated user's document in Firestore (`users/{uid}`).
 * Preserves previously completed lessons and never resets progress on refresh.
 */
export async function updateUserMasterclassProgress(
  uid: string,
  progressUpdate: Partial<MasterclassProgress>
): Promise<void> {
  if (!uid) return;

  try {
    const userRef = doc(db, 'users', uid);
    const currentProfile = await getUserProfile(uid);

    const existingProgress = currentProfile?.masterclassProgress || DEFAULT_MASTERCLASS_PROGRESS;

    const mergedProgress: MasterclassProgress = {
      completedLessons: progressUpdate.completedLessons !== undefined 
        ? progressUpdate.completedLessons 
        : existingProgress.completedLessons || [],
      currentLesson: progressUpdate.currentLesson !== undefined 
        ? progressUpdate.currentLesson 
        : existingProgress.currentLesson || null,
      battingProgress: progressUpdate.battingProgress !== undefined 
        ? progressUpdate.battingProgress 
        : existingProgress.battingProgress || 0,
      bowlingProgress: progressUpdate.bowlingProgress !== undefined 
        ? progressUpdate.bowlingProgress 
        : existingProgress.bowlingProgress || 0,
      lastActiveLessonId: progressUpdate.lastActiveLessonId !== undefined 
        ? progressUpdate.lastActiveLessonId 
        : existingProgress.lastActiveLessonId || null,
    };

    await setDoc(
      userRef,
      {
        masterclassProgress: mergedProgress,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating Masterclass progress in Firestore:', error);
  }
}

