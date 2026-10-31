import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';
import { api, ApiError } from '../lib/api';

interface AuthContextType {
  currentUser: Employee | null;
  activeDepartmentId: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  setActiveDepartmentId: (deptId: string) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_DEPT_KEY = 'worktrack_active_dept';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeDepartmentId, setActiveDepartmentIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_DEPT_KEY) || null;
    } catch {
      return null;
    }
  });

  // Verify session on initial mount from HTTP-only cookie
  useEffect(() => {
    let isMounted = true;
    async function checkAuthSession() {
      try {
        const user = await api.get<any>('/auth/me');
        if (isMounted && user) {
          setCurrentUser({
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email || '',
            role: user.role,
            status: user.isActive ? 'active' : 'inactive',
            assignedDepartments: user.assignedDepartments || [],
            createdAt: user.createdAt || new Date().toISOString(),
          });

          // Set active department if not set
          if (user.assignedDepartments?.length > 0) {
            const savedDept = localStorage.getItem(ACTIVE_DEPT_KEY);
            if (savedDept && user.assignedDepartments.includes(savedDept)) {
              setActiveDepartmentIdState(savedDept);
            } else {
              setActiveDepartmentIdState(user.assignedDepartments[0]);
              localStorage.setItem(ACTIVE_DEPT_KEY, user.assignedDepartments[0]);
            }
          }
        }
      } catch (err) {
        // Not authenticated
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuthSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const setActiveDepartmentId = (deptId: string) => {
    setActiveDepartmentIdState(deptId);
    try {
      localStorage.setItem(ACTIVE_DEPT_KEY, deptId);
    } catch {
      // ignore
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post<{ user: any; token: string }>('/auth/login', {
        username,
        password,
      });

      const { user } = response;
      const formattedUser: Employee = {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email || '',
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        assignedDepartments: user.assignedDepartments || [],
        createdAt: user.createdAt || new Date().toISOString(),
      };

      setCurrentUser(formattedUser);

      if (user.assignedDepartments?.length > 0) {
        const firstDept = user.assignedDepartments[0];
        setActiveDepartmentIdState(firstDept);
        localStorage.setItem(ACTIVE_DEPT_KEY, firstDept);
      } else {
        setActiveDepartmentIdState(null);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Invalid username or password',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout network errors
    } finally {
      setCurrentUser(null);
      setActiveDepartmentIdState(null);
      try {
        localStorage.removeItem(ACTIVE_DEPT_KEY);
      } catch {
        // ignore
      }
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeDepartmentId,
        isLoading,
        login,
        logout,
        setActiveDepartmentId,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
