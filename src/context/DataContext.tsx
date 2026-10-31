import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Department, Employee, Project, DailyActivity, ActivityStatus } from '../types';
import { api, ApiError } from '../lib/api';
import { useAuth } from './AuthContext';
import { getFormattedDate } from '../lib/date';

interface DataContextType {
  departments: Department[];
  employees: Employee[];
  projects: Project[];
  activities: DailyActivity[];
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Department operations
  addDepartment: (dept: {
    name: string;
    description?: string;
    color?: string;
    slug?: string;
    status?: 'active' | 'inactive';
  }) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  toggleDepartmentStatus: (id: string) => Promise<void>;

  // Employee operations
  addEmployee: (emp: {
    fullName: string;
    username: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'employee';
    assignedDepartments: string[];
    status?: 'active' | 'inactive';
  }) => Promise<{ success: boolean; message?: string }>;
  updateEmployee: (
    id: string,
    updates: Partial<Employee>
  ) => Promise<{ success: boolean; message?: string }>;
  deleteEmployee: (id: string) => Promise<void>;

  // Project operations
  addProject: (proj: {
    name: string;
    departmentId: string;
    createdBy?: string;
    createdByName?: string;
    description?: string;
  }) => Promise<void>;
  renameProject: (id: string, newName: string, description?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Daily Activity operations
  joinToday: (employeeId?: string, departmentId?: string) => Promise<{ success: boolean; message: string }>;
  endToday: (employeeId?: string, departmentId?: string) => Promise<{ success: boolean; message: string }>;
  saveDailyNotes: (employeeId: string, departmentId: string, notes: string) => Promise<void>;
  getEmployeeTodayActivity: (employeeId: string, departmentId?: string) => DailyActivity | undefined;

  // Reset demo
  resetToDefaultData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeDepartmentId } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch all primary dataset from real Express REST backend
  const refreshData = useCallback(async () => {
    if (!currentUser) {
      setDepartments([]);
      setEmployees([]);
      setProjects([]);
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Concurrent fetch of core modules
      const fetches: Promise<any>[] = [
        api.get<Department[]>('/departments'),
        api.get<Project[]>('/projects'),
        api.get<DailyActivity[]>('/activities'),
      ];

      // Admin has access to employees list
      if (currentUser.role === 'admin') {
        fetches.push(api.get<Employee[]>('/employees'));
      }

      const [deptsData, projectsData, activitiesData, employeesData] = await Promise.all(fetches);

      setDepartments(deptsData || []);
      setProjects(projectsData || []);
      setActivities(activitiesData || []);

      if (employeesData) {
        setEmployees(employeesData);
      } else {
        // For employee view, populate with current user
        setEmployees([currentUser]);
      }
    } catch (error) {
      console.error('Failed to load data from backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-polling: refresh data every 30 seconds for live updates
  useEffect(() => {
    if (!currentUser) return;
    const pollInterval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [currentUser, refreshData]);

  // Department operations
  const addDepartment = async (dept: {
    name: string;
    description?: string;
    color?: string;
    slug?: string;
    status?: 'active' | 'inactive';
  }) => {
    try {
      const created = await api.post<Department>('/departments', dept);
      setDepartments((prev) => [created, ...prev]);
      // Background refresh for full consistency
      refreshData();
    } catch (err: any) {
      console.error('Error adding department:', err);
      throw err;
    }
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      const updated = await api.patch<Department>(`/departments/${id}`, updates);
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      refreshData();
    } catch (err: any) {
      console.error('Error updating department:', err);
      throw err;
    }
  };

  const toggleDepartmentStatus = async (id: string) => {
    const dept = departments.find((d) => d.id === id);
    if (!dept) return;
    const newActiveState = dept.status !== 'active';

    try {
      const updated = await api.patch<Department>(`/departments/${id}/status`, {
        isActive: newActiveState,
      });
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      refreshData();
    } catch (err: any) {
      console.error('Error toggling department status:', err);
      throw err;
    }
  };

  // Employee operations
  const addEmployee = async (emp: {
    fullName: string;
    username: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'employee';
    assignedDepartments: string[];
    status?: 'active' | 'inactive';
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const created = await api.post<Employee>('/employees', emp);
      setEmployees((prev) => [created, ...prev]);
      refreshData();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to create employee account',
      };
    }
  };

  const updateEmployee = async (
    id: string,
    updates: Partial<Employee>
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const updated = await api.patch<Employee>(`/employees/${id}`, updates);
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
      refreshData();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to update employee account',
      };
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      refreshData();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      throw err;
    }
  };

  // Project operations
  const addProject = async (proj: {
    name: string;
    departmentId: string;
    createdBy?: string;
    createdByName?: string;
    description?: string;
  }) => {
    try {
      const created = await api.post<Project>('/projects', {
        name: proj.name,
        departmentId: proj.departmentId,
        description: proj.description,
      });
      setProjects((prev) => [created, ...prev]);
      refreshData();
    } catch (err: any) {
      console.error('Error adding project:', err);
      throw err;
    }
  };

  const renameProject = async (id: string, newName: string, description?: string) => {
    try {
      const payload: { name: string; description?: string } = { name: newName };
      if (description !== undefined) {
        payload.description = description;
      }
      const updated = await api.patch<Project>(`/projects/${id}`, payload);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      refreshData();
    } catch (err: any) {
      console.error('Error renaming project:', err);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      refreshData();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      throw err;
    }
  };

  // Daily Activity operations
  const getEmployeeTodayActivity = (
    employeeId: string,
    departmentId?: string
  ): DailyActivity | undefined => {
    const today = getFormattedDate();
    return activities.find(
      (a) =>
        a.employeeId === employeeId &&
        a.date === today &&
        (!departmentId || a.departmentId === departmentId)
    );
  };

  const joinToday = async (
    employeeId?: string,
    departmentId?: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetDeptId = departmentId || activeDepartmentId || departments[0]?.id;
    if (!targetDeptId) {
      return { success: false, message: 'Please select a department workspace first.' };
    }

    try {
      const activity = await api.post<DailyActivity>('/activities/join', {
        departmentId: targetDeptId,
      });

      // Update local state
      setActivities((prev) => {
        const filtered = prev.filter((a) => a.id !== activity.id);
        return [activity, ...filtered];
      });

      return {
        success: true,
        message: `Joined successfully at ${activity.joinTime || 'now'}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to clock in for today.',
      };
    }
  };

  const endToday = async (
    employeeId?: string,
    departmentId?: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetDeptId = departmentId || activeDepartmentId || departments[0]?.id;

    try {
      const activity = await api.post<DailyActivity>('/activities/end', {
        departmentId: targetDeptId,
      });

      // Update local state
      setActivities((prev) => {
        const filtered = prev.filter((a) => a.id !== activity.id);
        return [activity, ...filtered];
      });

      return {
        success: true,
        message: `Work session clocked out at ${activity.endTime}. Total: ${activity.workingHours || '0m'}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to clock out.',
      };
    }
  };

  const saveDailyNotes = async (
    employeeId: string,
    departmentId: string,
    notes: string
  ) => {
    try {
      const today = getFormattedDate();
      const existing = activities.find(
        (a) => a.employeeId === employeeId && a.date === today
      );

      if (existing) {
        const updated = await api.patch<{ id: string; notes: string; updatedAt: string }>(
          `/activities/${existing.id}/notes`,
          { notes }
        );
        setActivities((prev) =>
          prev.map((a) => (a.id === existing.id ? { ...a, notes: updated.notes } : a))
        );
      } else {
        const targetDeptId = departmentId || activeDepartmentId || departments[0]?.id;
        const result = await api.post<{ id: string; notes: string; updatedAt: string }>(
          '/activities/save-notes',
          { departmentId: targetDeptId, notes }
        );
        // Refresh activities to include the newly created row
        const refreshed = await api.get<DailyActivity[]>('/activities');
        setActivities(refreshed);
      }
    } catch (err: any) {
      console.error('Error saving daily notes:', err);
      throw err;
    }
  };

  const resetToDefaultData = async () => {
    // In database-backed mode, refresh from real database records
    await refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        departments,
        employees,
        projects,
        activities,
        isLoading,
        refreshData,
        addDepartment,
        updateDepartment,
        toggleDepartmentStatus,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addProject,
        renameProject,
        deleteProject,
        joinToday,
        endToday,
        saveDailyNotes,
        getEmployeeTodayActivity,
        resetToDefaultData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
