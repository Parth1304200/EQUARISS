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

// User-provided Firebase project credentials (equaris-a2e02)
const firebaseConfig = {
  apiKey: "AIzaSyDrqW_zogLwI8khBjUvZ6HPr6sUzLXnwsA",
  authDomain: "equaris-a2e02.firebaseapp.com",
  projectId: "equaris-a2e02",
  storageBucket: "equaris-a2e02.firebasestorage.app",
  messagingSenderId: "187252919751",
  appId: "1:187252919751:web:acb9ff085239ba3345dde2",
  measurementId: "G-1Y58ZDTWR2",
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
