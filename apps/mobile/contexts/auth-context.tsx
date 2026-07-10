import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { http, setUnauthorizedHandler } from "@/lib/api";
import * as tokenStorage from "@/lib/token-storage";
import type { User } from "@armali/schemas";

export type MobileUser = Pick<
  User,
  "id" | "email" | "firstname" | "lastname" | "role" | "avatarUrl"
>;

type AuthSession = { user: MobileUser; accessToken: string; refreshToken: string };

type RegisterPayload = {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
};

type AuthContextValue = {
  user: MobileUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  /**
   * Pose un faux utilisateur en mémoire, sans appel réseau ni token persisté.
   * Utile pour naviguer l'app sur un vrai téléphone tant que l'API locale
   * (WSL2/Docker) n'est pas joignable depuis le LAN. Absent des builds prod
   * car gardé par __DEV__ côté UI.
   */
  devLogin: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<MobileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback(async (session: AuthSession) => {
    await tokenStorage.setItem("accessToken", session.accessToken);
    await tokenStorage.setItem("refreshToken", session.refreshToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      router.replace("/login");
    });
  }, [router]);

  useEffect(() => {
    (async () => {
      const token = await tokenStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await http.get<MobileUser>("/auth/me");
        setUser(me);
      } catch {
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await http.post<AuthSession>("/auth/login", { email, password });
      await setSession(data);
    },
    [setSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await http.post<AuthSession>("/auth/register", payload);
      await setSession(data);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    const refreshToken = await tokenStorage.getItem("refreshToken");
    try {
      await http.post("/auth/logout", { refreshToken });
    } catch {
      // le token local est supprimé de toute façon
    }
    await clearSession();
  }, [clearSession]);

  const forgotPassword = useCallback(async (email: string) => {
    await http.post<{ message: string }>("/auth/forgot-password", { email });
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await http.post("/auth/reset-password", { email, code, newPassword });
  }, []);

  const devLogin = useCallback(() => {
    setUser({
      id: "00000000-0000-0000-0000-000000000000" as MobileUser["id"],
      email: "dev@armali.fr",
      firstname: "Dev",
      lastname: "Testeur",
      role: "CLIENT",
      avatarUrl: null,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        devLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
