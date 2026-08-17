import { createContext, useContext, useState, useEffect } from "react";
import * as api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => api.getToken());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedToken = api.getToken();
    if (!savedToken) {
      setReady(true);
      return;
    }
    api.getMe()
      .then((u) => {
        setUser(u);
        setTokenState(savedToken);
      })
      .catch(() => {
        api.setToken(null);
        setTokenState(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    api.setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    await api.register(formData);
    const loginData = await api.login(formData.email, formData.password);
    api.setToken(loginData.token);
    setTokenState(loginData.token);
    setUser(loginData.user);
    return loginData;
  };

  const logout = () => {
    api.setToken(null);
    setTokenState(null);
    setUser(null);
  };

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
