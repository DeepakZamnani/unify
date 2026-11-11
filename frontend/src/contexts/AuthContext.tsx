import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiGet, apiPost } from "@/lib/api";

interface User {
  name: string;
  email: string;
  company: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, company: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface ProfileResponse {
  uid: string;
  name: string;
  email: string;
  company: string;
  isAdmin: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await apiGet<ProfileResponse>("/auth/me");
        setUser({ name: profile.name, email: profile.email, company: profile.company, isAdmin: profile.isAdmin });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    const profile = await apiGet<ProfileResponse>("/auth/me");
    setUser({ name: profile.name, email: profile.email, company: profile.company, isAdmin: profile.isAdmin });
  };

  const signup = async (name: string, email: string, password: string, company: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
    const profile = await apiPost<ProfileResponse>("/auth/signup", { name, company });
    setUser({ name: profile.name, email: profile.email, company: profile.company, isAdmin: profile.isAdmin });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin: user?.isAdmin ?? false, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
