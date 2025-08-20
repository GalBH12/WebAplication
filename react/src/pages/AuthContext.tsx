import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { login as loginRequest } from '../lib/auth'; // Using lib/auth.ts

// ---- Types ----
export type User = {
  _id: string;
  id?: string;
  username: string;
  email?: string;
  profilePicture?: string | null;
  role?: string; // <-- Add this line
};

export type AuthContextType = {
  user: User | null;

  /**
   * Backward compatibility:
   * Allows pages to pass user + token after their own API call.
   * Does not store password anywhere.
   */
  login: (user: User, opts?: { token?: string }) => void;

  /**
   * New API:
   * Performs the login request using lib/auth and updates context + localStorage.
   */
  loginWithCredentials: (username: string, password: string) => Promise<void>;

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

  // On app load: hydrate user + token from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    const tok = localStorage.getItem('token');
    if (tok) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
    }
  }, []);

  // Backward compatibility: accepts user + token from outside
  const login: AuthContextType['login'] = (u, opts) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));

    if (opts?.token) {
      localStorage.setItem('token', opts.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${opts.token}`;
    }
  };

  // New: performs login request via lib/auth.ts
  const loginWithCredentials: AuthContextType['loginWithCredentials'] = async (
    username,
    password
  ) => {
    // API request (returns { success, token, user })
    const data = await loginRequest({ username, password });

    const nextUser: User = {
      id: data.user?.id,
      username: data.user?.username ?? username,
      email: data.user?.email ?? undefined,
      profilePicture: data.user?.profilePicture ?? null,
      role: data.user?.role ?? undefined,
      _id: ''
    };

    // Update state + localStorage
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));

    if (data.token) {
      localStorage.setItem('token', data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, logout, setUser }}>
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
