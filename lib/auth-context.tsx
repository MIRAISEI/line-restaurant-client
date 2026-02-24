"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { login, verifyToken, removeAuthToken, setAuthToken, getAuthToken, getUserById, liffLogin, type AuthUser, type LoginResponse } from "./admin-api";
import { useLiff } from "./liff-provider";


interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userId: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isInLiff, liffProfile, isLiffLoading } = useLiff();
  const isVerifying = useRef(false);

  console.log("AuthProvider rendered", { user: user?.userId, token: typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null });

  useEffect(() => {
    const token = getAuthToken();
    console.log("Auth Effect running", {
      isLiffLoading,
      isInLiff,
      hasLiffProfile: !!liffProfile,
      hasUser: !!user,
      hasToken: !!token,
      isVerifying: isVerifying.current
    });

    // Wait for LIFF to finish loading
    if (isLiffLoading) {
      return;
    }

    // ... rest of logic ...

    // If we have a LIFF profile and we're in LIFF, authenticate with it
    if (isInLiff && liffProfile && !user) {
      console.log("Authenticating with LIFF profile...", liffProfile);
      const tableFromUrl =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("table") ||
          new URLSearchParams(window.location.search).get("tableNumber")
          : null;
      const tableFromStorage =
        typeof window !== "undefined"
          ? localStorage.getItem("active_table_number")
          : null;
      const tableNumber = tableFromUrl || tableFromStorage || undefined;

      liffLogin({
        userId: liffProfile.userId,
        displayName: liffProfile.displayName,
        pictureUrl: liffProfile.pictureUrl,
        tableNumber,
      })
        .then((response: LoginResponse) => {
          console.log("LIFF authentication successful", response);
          setAuthToken(response.token);
          setUser(response.user);
        })
        .catch((error) => {
          console.error("LIFF authentication failed:", error);
          if (typeof window !== "undefined") {
            const message = error instanceof Error ? error.message : "Authentication failed";
            window.location.href = `/login?error=${encodeURIComponent(message)}`;
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // Otherwise, check if user is already logged in via token
    // token is already declared at top of effect
    if (token && !user) {
      if (isVerifying.current) return;

      isVerifying.current = true;
      console.log("Verifying existing token...");

      verifyToken(token)
        .then((result) => {
          if (result.valid && result.user) {
            console.log("Token verification successful");
            setUser(result.user);
          } else {
            console.warn("Token verification failed or no user returned");
            removeAuthToken();
            setUser(null);
          }
        })
        .catch((err) => {
          console.error("Token verification error:", err);
          removeAuthToken();
          setUser(null);
        })
        .finally(() => {
          isVerifying.current = false;
          setIsLoading(false);
        });
    } else if (!token && !user) {
      setIsLoading(false);
    }
  }, [isLiffLoading, isInLiff, liffProfile]);

  const handleLogin = async (userId: string, password: string) => {
    const response: LoginResponse = await login(userId, password);
    setAuthToken(response.token);
    setUser(response.user);
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
  };

  const handleRefreshUser = async () => {
    if (!user) return;

    try {
      const userId = user._id || user.id; // AuthUser has both _id and id
      if (!userId) return;

      const updatedUser = await getUserById(userId);
      // Convert User to AuthUser format
      const authUser: AuthUser = {
        _id: updatedUser._id,
        id: updatedUser._id,
        userId: updatedUser.userId,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        lineUserId: updatedUser.lineUserId,
      };
      setUser(authUser);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // Don't throw error, just log it
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout,
        refreshUser: handleRefreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

