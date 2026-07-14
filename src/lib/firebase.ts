/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// User-provided Firebase project credentials (equaris-e462c)
const firebaseConfig = {
  apiKey: "AIzaSyDxLpqniKqCHQnKM8xS02K9nRBGhL5DmWY",
  authDomain: "equaris-e462c.firebaseapp.com",
  projectId: "equaris-e462c",
  storageBucket: "equaris-e462c.firebasestorage.app",
  messagingSenderId: "767901784588",
  appId: "1:767901784588:web:f2406c3ceb00f3600bac29",
  measurementId: "G-R60GDEW2CR",
};

// Initialize core Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore against the default database
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Authentication helpers
export const googleProvider = new GoogleAuthProvider();

/** Sign in with Google popup */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Authentication sign-in failed:", error);
    throw error;
  }
}

/** Sign in with email + password */
export async function loginWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email/Password sign-in failed:", error);
    throw error;
  }
}

/** Create a new account with email + password, and set displayName */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName.trim()) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    return result.user;
  } catch (error) {
    console.error("Email/Password registration failed:", error);
    throw error;
  }
}

/** Send a password-reset email */
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset email failed:", error);
    throw error;
  }
}

/** Sign out the current user */
export async function logoutUser() {
  await signOut(auth);
}
