import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ensureUserProfileExists, getUserProfile, createUserProfile } from './userService';
import { FirestoreUserProfile } from '../types';

/**
 * Format Firebase Auth errors into clear, friendly, and actionable messages.
 */
export function getReadableAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';
  console.error('[Firebase Auth Error Details]:', { code, message: error.message, error });

  switch (code) {
    case 'auth/popup-blocked':
      return 'The Google sign-in pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in pop-up was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'The sign-in pop-up request was cancelled because another action was started.';
    case 'auth/account-exists-with-different-credential': {
      const existingEmail = error.customData?.email || error.email || '';
      return `An account already exists with ${existingEmail ? existingEmail : 'this email address'} using a different sign-in method (e.g. Email & Password). Please sign in using your existing password to link your Google account.`;
    }
    case 'auth/unauthorized-domain': {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      return `The domain "${currentHost}" is not authorized for Google Sign-In in Firebase Console. Please add this domain under Authentication > Settings > Authorized domains in the Firebase Console.`;
    }
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is disabled in Firebase Console for project "cucuber-f62d0". Please enable Google under Authentication > Sign-in method in the Firebase Console.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters with numbers and special symbols.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Access to this account has been temporarily disabled. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/requires-recent-login':
      return 'Please sign out and sign in again before performing this action.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Sign in or Sign up using Firebase Google Authentication.
 * Prefers popup authentication, falling back to redirect if popup is blocked.
 * Strictly respects the existing user lifecycle:
 * - If users/{uid} does not exist: creates profile with Google info, authProvider="google", onboardingCompleted=false.
 * - If users/{uid} already exists: loads existing profile preserving following, preferences, alerts, and Masterclass progress.
 */
export async function signInWithGoogle(): Promise<{
  firebaseUser: FirebaseUser;
  profile: FirestoreUserProfile;
  isNewUser: boolean;
} | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;

    // Check if Firestore document exists in users/{uid}
    const existingProfile = await getUserProfile(firebaseUser.uid);
    let profile: FirestoreUserProfile;
    let isNewUser = false;

    if (!existingProfile) {
      isNewUser = true;
      profile = await createUserProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        providerId: 'google',
      });
    } else {
      // Existing profile preserved completely.
      // Non-destructively fill missing profile avatar if present from Google
      if (!existingProfile.photoURL && firebaseUser.photoURL) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, { photoURL: firebaseUser.photoURL, updatedAt: serverTimestamp() }, { merge: true });
          existingProfile.photoURL = firebaseUser.photoURL;
        } catch (patchErr) {
          console.warn('Could not update avatar in existing profile:', patchErr);
        }
      }
      profile = existingProfile;
    }

    return { firebaseUser, profile, isNewUser };
  } catch (error: any) {
    // If popup was simply closed by user without signing in, return null gracefully (no alarming error)
    if (error?.code === 'auth/popup-closed-by-user') {
      console.log('[Google Sign-In] Popup closed by user.');
      return null;
    }

    // If popup was blocked, attempt redirect flow
    if (error?.code === 'auth/popup-blocked') {
      console.warn('[Google Sign-In] Popup blocked, attempting redirect sign-in...');
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectError: any) {
        console.error('[Google Sign-In Redirect Error]:', redirectError);
        throw new Error(getReadableAuthError(redirectError));
      }
    }

    console.error('[Google Sign-In Error]:', error);
    throw new Error(getReadableAuthError(error));
  }
}

/**
 * Checks and resolves pending redirect auth results on startup.
 */
export async function checkRedirectAuthResult(): Promise<{
  firebaseUser: FirebaseUser;
  profile: FirestoreUserProfile;
  isNewUser: boolean;
} | null> {
  try {
    const userCredential = await getRedirectResult(auth);
    if (!userCredential || !userCredential.user) {
      return null;
    }
    const firebaseUser = userCredential.user;
    const existingProfile = await getUserProfile(firebaseUser.uid);
    let profile: FirestoreUserProfile;
    let isNewUser = false;

    if (!existingProfile) {
      isNewUser = true;
      profile = await createUserProfile({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        providerId: 'google',
      });
    } else {
      profile = existingProfile;
    }

    return { firebaseUser, profile, isNewUser };
  } catch (error: any) {
    console.error('[Google Redirect Result Error]:', error);
    return null;
  }
}

/**
 * Link Google account to an already authenticated Firebase user.
 */
export async function linkGoogleAccount(user: FirebaseUser): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await linkWithPopup(user, provider);
  } catch (error: any) {
    console.error('Error linking Google account:', error);
    throw new Error(getReadableAuthError(error));
  }
}

/**
 * Sign up a new user with email and password.
 */
export async function signUpWithEmail(
  fullName: string,
  email: string,
  password: string
): Promise<{ firebaseUser: FirebaseUser; profile: FirestoreUserProfile }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update display name in Firebase Auth
    if (fullName) {
      await updateProfile(firebaseUser, { displayName: fullName });
    }

    // Send email verification link
    try {
      await sendEmailVerification(firebaseUser);
    } catch (verr) {
      console.warn('Could not send verification email immediately:', verr);
    }

    // Create or ensure Firestore user profile
    const profile = await ensureUserProfileExists({
      uid: firebaseUser.uid,
      displayName: fullName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      providerId: 'password',
    });

    return { firebaseUser, profile };
  } catch (error) {
    console.error('Sign up error:', error);
    throw new Error(getReadableAuthError(error));
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ firebaseUser: FirebaseUser; profile: FirestoreUserProfile }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Ensure profile exists in Firestore and retrieve it
    const profile = await ensureUserProfileExists({
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      providerId: 'password',
    });

    return { firebaseUser, profile };
  } catch (error) {
    console.error('Sign in error:', error);
    throw new Error(getReadableAuthError(error));
  }
}

/**
 * Resend email verification email to the current authenticated user.
 */
export async function resendVerificationEmail(user: FirebaseUser): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Resend verification error:', error);
    throw new Error(getReadableAuthError(error));
  }
}

/**
 * Refresh user state to verify if email verification link was opened.
 */
export async function checkEmailVerified(user: FirebaseUser): Promise<boolean> {
  try {
    await user.reload();
    return auth.currentUser?.emailVerified ?? false;
  } catch (error) {
    console.error('Check email verified error:', error);
    return false;
  }
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    // Note: To avoid revealing account existence if required, error can be thrown or caught depending on UI
    throw new Error(getReadableAuthError(error));
  }
}

/**
 * Sign out current user.
 */
export async function logOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error(getReadableAuthError(error));
  }
}
