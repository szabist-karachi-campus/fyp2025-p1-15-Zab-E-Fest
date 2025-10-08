import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isSignedIn: !!localStorage.getItem("token"),
  });

  const logout = () => {
    localStorage.removeItem("token");
    setAuthState({ isSignedIn: false });
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


