import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { login as loginRequest } from "../lib/auth";

// ---- Types ----

export type User = {
  _id: string;
  id?: string; // תאימות אם מגיע id במקום _id
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string; // ISO string
  profilePicture?: string | null;
  // שדות אופציונליים לתאימות לאחור:
  username?: string;
  role?: string;
};

export type AuthContextType = {
  user: User | null;

  /**
   * תאימות לאחור:
   * מאפשר לדפים להעביר user + token אחרי קריאת API עצמאית שלהם.
   * לא נשמר סיסמה בשום מקום.
   */
  login: (user: User, opts?: { token?: string }) => void;

  /**
   * API מודרני:
   * מבצע התחברות דרך lib/auth ומעדכן context + localStorage.
   */
  loginWithCredentials: (username: string, password: string) => Promise<void>;

  // התנתקות וניקוי טוקן
  logout: () => void;

  // עדכון ידני של המשתמש (למשל אחרי עריכת פרופיל)
  setUser: (user: User | null) => void;
};

// ---- Create Context ----
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Provider ----
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // בעת טעינת האפליקציה: הידרציה מ-localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // נרמול מזהה: אם אין _id אך יש id – נשתמש בו
        const normalized: User = { ...parsed, _id: parsed?._id ?? parsed?.id ?? "" };
        setUser(normalized);
      } catch {
        // מתעלמים בשקט
      }
    }
    const tok = localStorage.getItem("token");
    if (tok) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${tok}`;
    }
  }, []);

  // תאימות לאחור: קבלה של user + token חיצוני
  const login: AuthContextType["login"] = (u, opts) => {
    const normalized: User = { ...u, _id: u?._id ?? u?.id ?? "" };
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));

    if (opts?.token) {
      localStorage.setItem("token", opts.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${opts.token}`;
    }
  };

  // מודרני: התחברות דרך lib/auth.ts
  const loginWithCredentials: AuthContextType["loginWithCredentials"] = async (
    username,
    password
  ) => {
    // API request (returns { success, token, user })
    const data = await loginRequest({ username, password });

    const nextUser: User = {
      _id: data.user?._id ?? data.user?.id ?? "",
      firstName: data.user?.firstName ?? data.user?.username ?? username ?? "",
      lastName: data.user?.lastName ?? "",
      email: data.user?.email ?? undefined,
      phone: data.user?.phone ?? undefined,
      birthDate: data.user?.birthDate ?? undefined,
      profilePicture: data.user?.profilePicture ?? null,
      // שדות תאימות אם קיימים במקומות אחרים
      username: data.user?.username,
      role: data.user?.role,
    };

    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));

    if (data.token) {
      localStorage.setItem("token", data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ---- Hook to access AuthContext ----
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
