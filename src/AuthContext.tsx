import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, onSnapshot, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, setDoc } from './firebase';
import { createSession, clearCurrentSession, validateAndRefreshSession, getLocalSessionExpiry } from './lib/sessionService';
import { transferVisitorCartToUser } from './lib/visitorCart';
import { createReferralDoc, processReferral } from './lib/referralService';

export type UserRole = 'user' | 'admin' | 'super_admin' | 'client';
export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  username: string;
  phoneNumber?: string;
  balance?: number;
  personalEmail?: string;
  createdAt?: string;
}

export interface AdminProfile extends UserProfile {
  role: 'admin' | 'super_admin' | 'client';
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  sessionExpiresAt: string | null;
  adminMode: boolean;
  setAdminMode: (v: boolean) => void;
  signout: () => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData, type: 'user' | 'admin') => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  phoneNumber?: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(getLocalSessionExpiry());
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (u) {
        try {
          // Validate existing session
          const { valid, expiresAt } = await validateAndRefreshSession();
          if (expiresAt) setSessionExpiresAt(expiresAt);
          if (!valid) {
            // Session invalid or expired — sign out silently
            await signOut(auth);
            return;
          }

          const userRef = doc(db, 'users', u.uid);
          const adminRef = doc(db, 'admins', u.uid);

          // Listen to both collections simultaneously.
          // This handles the signup race condition where onAuthStateChanged fires
          // before setDoc(users/uid) completes — userRef will fire again once created.
          // userRef always takes priority over adminRef.
          let profileLoaded = false;

          const unsubUser = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              profileLoaded = true;
              setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
              setLoading(false);
            }
          });

          const unsubAdmin = onSnapshot(adminRef, (snap) => {
            if (profileLoaded) return;
            if (snap.exists()) {
              profileLoaded = true;
              setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          });

          unsubscribeProfile = () => {
            unsubUser();
            unsubAdmin();
          };
        } catch (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  const signin = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // Determine role from Firestore
    let role = 'user';
    try {
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      if (adminSnap.exists()) {
        role = adminSnap.data().role || 'client';
      }
    } catch {}

    // Create session + transfer visitor cart (fire and forget)
    try {
      const expiresAt = await createSession(uid, role).then(() => getLocalSessionExpiry());
      if (expiresAt) setSessionExpiresAt(expiresAt);
    } catch {}

    try {
      await transferVisitorCartToUser(uid);
    } catch {}
  };

  const signout = async () => {
    await clearCurrentSession();
    setSessionExpiresAt(null);
    await signOut(auth);
  };

  const register = async (data: RegisterData, type: 'user' | 'admin') => {
    const { email, password, username, phoneNumber } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    if (type === 'user') {
      const referralCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      await setDoc(doc(db, 'users', uid), {
        uid,
        username,
        email,
        phoneNumber: phoneNumber || '',
        role: 'user',
        status: 'active',
        balance: 0,
        referralCode,
        createdAt: new Date().toISOString(),
      });

      // Create referral doc
      try { await createReferralDoc(uid); } catch {}

      // Process referral if code provided
      if (data.referralCode) {
        try { await processReferral(uid, data.referralCode); } catch {}
      }

      // Create session + transfer visitor cart
      try {
        const expiresAt = await createSession(uid, 'user').then(() => getLocalSessionExpiry());
        if (expiresAt) setSessionExpiresAt(expiresAt);
      } catch {}

      try {
        await transferVisitorCartToUser(uid);
      } catch {}
    } else {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        username,
        email,
        phoneNumber: phoneNumber || '',
        role: 'client',
        status: 'inactive',
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, 'admin_secrets', uid), {
        uid,
        password,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin, isSuperAdmin, sessionExpiresAt,
      adminMode, setAdminMode,
      signin, signout, register
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
