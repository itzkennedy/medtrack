import { createContext, useContext, useState } from "react";
import * as api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setTokenState(data.token);
    setUser(data.user);
    api.setToken(data.token);
    return data;
  };

  const register = async (formData) => {
    await api.register(formData);
    const loginData = await api.login(formData.email, formData.password);
    setTokenState(loginData.token);
    setUser(loginData.user);
    api.setToken(loginData.token);
    return loginData;
  };

  const logout = () => {
    setTokenState(null);
    setUser(null);
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
