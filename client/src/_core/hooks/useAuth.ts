import { useEffect, useState } from "react";
import { getMe, logout as doLogout, type User } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((u) => { setUser(u); setLoading(false); });
  }, []);

  const logout = async () => {
    await doLogout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    setUser, // used by LoginScreen after successful Google login
  };
}
