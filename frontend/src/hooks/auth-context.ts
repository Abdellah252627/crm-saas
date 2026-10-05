import { createContext, useContext } from "react";
import type { LoginRequest, RegisterRequest, User } from "../types/auth";

export interface AuthContextValue {
  user: User | null;
  /**
   * Reactive session flag. The access token lives in localStorage, which cannot
   * trigger a render, so the provider mirrors it into state and `ProtectedRoute`
   * subscribes to it instead of reading storage on every render.
   */
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
