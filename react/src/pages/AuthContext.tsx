import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { login as loginRequest } from "../lib/auth";

// ---- Types ----

/**
 * User shape stored in the auth context and localStorage.
 * Includes a normalized `_id` plus optional fields for backward compatibility.
 */
export type User = {
  _id: string;              // normalized id (falls back to `id` if needed)
  id?: string;              // compatibility when API returns `id` instead of `_id`
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;       // ISO string
  profilePicture?: string | null;
  // Optional, for backward compatibility across the app:
  username?: string;
  role?: string;
};

/**
 * Public shape of the authentication context.
 */
export type AuthContextType = {
  user: User | null;

  /**
   * Backward compatibility:
   * Allows pages to pass user + token after their own API call.
   * (No password is ever stored.)
   */
  login: (user: User, opts?: { token?: string }) => void;

  /**
   * Modern API:
   * Performs login via lib/auth and updates context + localStorage.
   */
  loginWithCredentials: (username: string, password: string) => Promise<void>;

  // Sign out and clear token
  logout: () => void;

  // Manually update the user (e.g., after profile edit)
  setUser: (user: User | null) => void;
};

// ---- Create Context ----
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Provider ----

/**
 * AuthProvider
 *
 * - Holds the authenticated `user` in state and syncs to localStorage.
 * - On mount, hydrates from localStorage (user + token) and sets Axios default header.
 * - Exposes:
 *    • login (compatibility method: set user + optional token)
 *    • loginWithCredentials (calls API, stores token + user)
 *    • logout (clears everything)
 *    • setUser (manual update)
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // On app load: hydrate from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // Normalize id: prefer _id; fallback to id
        const normalized: User = { ...parsed, _id: parsed?._id ?? parsed?.id ?? "" };
        setUser(normalized);
      } catch {
        // ignore parse errors silently
      }
    }
    // If a token exists, set Axios default Authorization header
    const tok = localStorage.getItem("token");
    if (tok) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${tok}`;
    }
  }, []);

  /**
   * Backward-compatible login:
   * Accept external user + optional token, persist them, and set Axios header.
   */
  const login: AuthContextType["login"] = (u, opts) => {
    const normalized: User = { ...u, _id: u?._id ?? u?.id ?? "" };
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));

    if (opts?.token) {
      localStorage.setItem("token", opts.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${opts.token}`;
    }
  };

  /**
   * Modern login flow:
   * Calls the API (via lib/auth), normalizes the user, stores token + user,
   * and sets Axios default Authorization header.
   */
  const loginWithCredentials: AuthContextType["loginWithCredentials"] = async (
    username,
    password
  ) => {
    // API request (returns { success, token, user })
    const data = await loginRequest({ username, password });

    // Normalize user fields for internal consistency
    const nextUser: User = {
      _id: data.user?._id ?? data.user?.id ?? "",
      firstName: data.user?.firstName ?? data.user?.username ?? username ?? "",
      lastName: data.user?.lastName ?? "",
      email: data.user?.email ?? undefined,
      phone: data.user?.phone ?? undefined,
      birthDate: data.user?.birthDate ?? undefined,
      profilePicture: data.user?.profilePicture ?? null,
      // compatibility fields
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

  /**
   * Clear user + token from state, localStorage, and Axios defaults.
   */
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

/**
 * React hook to consume the AuthContext safely.
 * Throws if used outside of an AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
