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
   * Connexion avec le compte client seedé (client@gmail.com), pour avoir de
   * vraies données (commandes, RDV, animaux...) en dev. Si ce compte n'existe
   * pas côté API (ex: pas encore seedé en prod), retombe sur une session
   * factice hors-ligne pour au moins naviguer l'UI. Absent des builds prod
   * car gardé par __DEV__ côté UI.
   */
  devLogin: () => Promise<void>;
  /** Met à jour l'utilisateur en mémoire (ex: après upload d'avatar). */
  updateUser: (user: MobileUser) => void;
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

  const devLogin = useCallback(async () => {
    try {
      const data = await http.post<AuthSession>("/auth/login", {
        email: "client@gmail.com",
        password: "Password123!",
      });
      await setSession(data);
    } catch {
      // Compte non disponible côté API (ex: pas seedé en prod) : session hors-ligne
      setUser({
        id: "00000000-0000-0000-0000-000000000000" as MobileUser["id"],
        email: "dev@armali.fr",
        firstname: "Dev",
        lastname: "Testeur",
        role: "CLIENT",
        avatarUrl: null,
      });
    }
  }, [setSession]);

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
        updateUser: setUser,
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
