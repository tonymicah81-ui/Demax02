'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { validateSession, createSession, clearLocalSession } from '@/lib/sessionService';
import { signOut } from '@/lib/authService';
import type { UserProfile, AdminProfile, UserRole } from '@/types';

interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole;
  profile: UserProfile | AdminProfile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isUser: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  isUser: false, isAdmin: false, isSuperAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Validate session
      const { valid } = await validateSession();
      if (!valid) {
        await signOut();
        clearLocalSession();
        setUser(null);
        setLoading(false);
        return;
      }

      // Listen to both user and admin docs simultaneously
      let resolved = false;
      const userRef = doc(db, 'users', firebaseUser.uid);
      const adminRef = doc(db, 'admins', firebaseUser.uid);

      const unsubUser = onSnapshot(userRef, snap => {
        if (snap.exists()) {
          const profile = snap.data() as UserProfile;
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: profile.role, profile });
          if (!resolved) { resolved = true; setLoading(false); }
        }
      });

      const unsubAdmin = onSnapshot(adminRef, snap => {
        if (snap.exists() && !doc(db, 'users', firebaseUser.uid)) {
          const profile = snap.data() as AdminProfile;
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: profile.role, profile });
          if (!resolved) { resolved = true; setLoading(false); }
        }
      });

      // Create session on first login
      await createSession(firebaseUser.uid).catch(() => {});

      return () => { unsubUser(); unsubAdmin(); };
    });

    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isUser: user?.role === 'user',
      isAdmin: user?.role === 'admin',
      isSuperAdmin: user?.role === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
