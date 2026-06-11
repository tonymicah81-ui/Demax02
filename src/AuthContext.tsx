import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, onSnapshot, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, setDoc } from './firebase';

export type UserRole = 'user' | 'client' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive';

interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  username: string;
  phone?: string;
  balance?: number;
  createdAt?: any;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signout: () => Promise<void>;
  signin: (email: string, password: string) => Promise<any>;
  register: (data: any, type: 'user' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (u) {
        // Find which collection the user belongs to
        const userRef = doc(db, 'users', u.uid);
        const adminRef = doc(db, 'admins', u.uid);
        
        try {
          const userSnap = await getDoc(userRef);
          const targetRef = userSnap.exists() ? userRef : adminRef;
          
          unsubscribeProfile = onSnapshot(targetRef, (snap) => {
            if (snap.exists()) {
              setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          });
        } catch (error) {
          console.error("Error fetching profile:", error);
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
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signout = async () => {
    await signOut(auth);
  };

  const register = async (data: any, type: 'user' | 'admin') => {
    const { email, password, username, phoneNumber, tfaEnabled } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    if (type === 'user') {
      await setDoc(doc(db, 'users', uid), {
        username,
        email,
        phoneNumber: phoneNumber || '',
        tfaEnabled: tfaEnabled || false,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString()
      });
    } else {
      // Vault/Staff Registration (Admin ID collection)
      await setDoc(doc(db, 'admins', uid), {
        username,
        email,
        phoneNumber,
        password, // As requested: "We will have the information, sign-up information, and also the password."
        role: 'client', // As requested: "The role will be clients"
        status: 'inactive', // As requested: "The status will be inactive"
        createdAt: new Date().toISOString()
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isSuperAdmin, signin, signout, register }}>
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
