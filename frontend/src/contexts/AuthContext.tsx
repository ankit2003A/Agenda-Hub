import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from "firebase/firestore";

interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => void;
  logout: () => void;
  googleSignIn: () => Promise<void>;
  updateUser: (data: { displayName?: string; photoURL?: string }) => void;
  getAgentHubId: (uid: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAgentHubId(uid: string) {
    return `AGENDA-${uid.slice(0, 8).toUpperCase()}`;
}

const manageUserInFirestore = async (user: User) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        // New user, create a document for them
        await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0],
            email: user.email,
            photoURL: user.photoURL,
            agentHubId: getAgentHubId(user.uid)
        });
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const isAuthenticated = !loading && user !== null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await manageUserInFirestore(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (data: LoginData) => {
    // This is a mock login. In a real app, you would sign in with firebase
    const mockUser = {
        displayName: data.email.split('@')[0],
        email: data.email,
    } as User;
    setUser(mockUser);
    console.log("User logged in", data);
    navigate('/');
  };

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle navigation
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        setUser(null);
        navigate('/login');
    } catch(error) {
        console.error("Logout error", error);
    }
  };

  const updateUser = (data: { displayName?: string; photoURL?: string }) => {
    if(user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser as User);
        // Also update in firestore
        if (auth.currentUser) {
            const userRef = doc(db, "users", auth.currentUser.uid);
            setDoc(userRef, data, { merge: true });
        }
    }
  }

  const getAgentHubId = (uid: string) => {
    const hash = uid.substring(0, 6).toUpperCase();
    return `AGENDA-${hash}`;
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    googleSignIn,
    updateUser,
    getAgentHubId,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 