import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

// ---- Types ----
export type User = {
  id?: string;
  username: string;
  email?: string;
  profilePicture?: string | null;
};

export type AuthContextType = {
  user: User | null;
  // Login and optionally store JWT token
  login: (user: User, opts?: { token?: string }) => void;
  // Logout and clear token
  logout: () => void;
  // Manually update user (e.g., after editing profile)
  setUser: (user: User | null) => void;
};

// ---- Create Context ----
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Provider ----
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Runs once on app load
  useEffect(() => {
    // Load user from localStorage
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }

    // Load token from localStorage and set it in axios
    const tok = localStorage.getItem('token');
    if (tok) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${tok}`;
    }
  }, []);

  // Login function
  const login: AuthContextType['login'] = (u, opts) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));

    // Save token and set Authorization header for axios
    if (opts?.token) {
      localStorage.setItem('token', opts.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${opts.token}`;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common["Authorization"];
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      
      {children}
    </AuthContext.Provider>
  );
};

// ---- Hook to access AuthContext ----
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};