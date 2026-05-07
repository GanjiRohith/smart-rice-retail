import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        if (isMounted) {
          setUser({
            email: payload.sub,
            role: payload.role,
            name: payload.name || payload.sub,
            user_id: payload.user_id,
          });
        }
      } else {
        logout();
      }
    } else {
      if (isMounted) setUser(null);
    }

    if (isMounted) setLoading(false);

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, role, name, user_id } = res.data;
    
    localStorage.setItem("token", access_token);
    setToken(access_token);
    setUser({ email, role, name, user_id });
    
    if (role === "owner") {
      navigate("/owner", { replace: true });
    } else {
      navigate("/customer", { replace: true });
    }
    return res.data;
  }, [navigate]);

  const register = useCallback(async (data) => {
    const res = await api.post("/auth/register", { ...data, role: "customer" });
    return res.data;
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout
  }), [user, token, loading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}