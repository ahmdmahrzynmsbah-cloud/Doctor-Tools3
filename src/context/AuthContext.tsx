import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (pass: string) => Promise<{success: boolean, error?: string}>;
  logout: () => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{success: boolean, error?: string}>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('autoserv_auth_state') === 'true';
  });

  const login = async (pass: string) => {
    const savedPassword = localStorage.getItem('autoserv_password') || 'admin';
    if (pass.trim() === savedPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('autoserv_auth_state', 'true');
      return { success: true };
    }
    return { success: false, error: `كلمة المرور غير صحيحة. ${savedPassword === 'admin' ? '(استخدم: admin)' : ''}`.trim() };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('autoserv_auth_state');
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    const savedPassword = localStorage.getItem('autoserv_password') || 'admin';
    if (currentPass !== savedPassword) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة!' };
    }
    localStorage.setItem('autoserv_password', newPass);
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
