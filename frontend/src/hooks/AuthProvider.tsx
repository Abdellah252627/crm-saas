import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from "../api/auth";
import { getAccessToken, onSessionExpired } from "../api/axios";
import { toast } from "../lib/toast";
import type { LoginRequest, RegisterRequest, User } from "../types/auth";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => getAccessToken() !== null,
  );
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync: loginMutation } = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setUser(data.user);
      setIsAuthenticated(true);
    },
  });

  const { mutateAsync: registerMutation } = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setUser(data.user);
      setIsAuthenticated(true);
    },
  });

  const { mutateAsync: logoutMutation } = useMutation({
    mutationFn: logoutApi,
  });

  // Ends the local session and always lands on /login, even when the network
  // call failed: the token is already gone, so staying on a protected route
  // would only show broken data behind a stale layout.
  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  }, [logoutMutation, navigate, queryClient]);

  useEffect(() => {
    onSessionExpired(() => {
      setUser(null);
      setIsAuthenticated(false);
      toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد");
      queryClient.clear();
      navigate("/login", { replace: true });
    });
  }, [navigate, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      login: async (credentials: LoginRequest) => {
        await loginMutation(credentials);
      },
      register: async (input: RegisterRequest) => {
        await registerMutation(input);
      },
      logout,
    }),
    [user, isAuthenticated, loginMutation, registerMutation, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
