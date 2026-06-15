import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile, AdminProfile } from '@/types';

// ─── User Registration ───────────────────────────────────────────────────────

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  referralCode?: string;
}

export async function registerUser(data: RegisterData): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    username: data.username,
    email: data.email,
    phoneNumber: data.phoneNumber,
    role: 'user',
    status: 'active',
    referralCode: data.referralCode || '',
    createdAt: serverTimestamp(),
  } satisfies Partial<UserProfile>);
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function loginStaff(email: string, password: string): Promise<void> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const adminSnap = await getDoc(doc(db, 'admins', user.uid));
  if (!adminSnap.exists()) {
    await firebaseSignOut(auth);
    throw new Error('No staff account found. Use the user login instead.');
  }
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Password Reset ──────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ─── Profile Fetching ────────────────────────────────────────────────────────

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function fetchAdminProfile(uid: string): Promise<AdminProfile | null> {
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists() ? (snap.data() as AdminProfile) : null;
}
