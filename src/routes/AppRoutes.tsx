import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';

// Auth Pages
import { Login } from '../pages/Login';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { EmployeeManagement } from '../pages/admin/EmployeeManagement';
import { DepartmentManagement } from '../pages/admin/DepartmentManagement';
import { AdminDepartmentView } from '../pages/admin/AdminDepartmentView';
import { ProjectManagement } from '../pages/admin/ProjectManagement';
import { DailyActivities } from '../pages/admin/DailyActivities';
import { Attendance } from '../pages/admin/Attendance';
import { RetentionPolicy } from '../pages/admin/RetentionPolicy';
import { Settings } from '../pages/admin/Settings';

// Manager Pages
import { ManagerDashboard } from '../pages/manager/ManagerDashboard';
import { ManagerProjects } from '../pages/manager/ManagerProjects';
import { ManagerEmployees } from '../pages/manager/ManagerEmployees';
import { ManagerActivities } from '../pages/manager/ManagerActivities';
import { ManagerAttendance } from '../pages/manager/ManagerAttendance';

// Employee Pages
import { DepartmentDashboard } from '../pages/employee/DepartmentDashboard';
import { MyProjects } from '../pages/employee/MyProjects';
import { DailyActivityTrackerPage } from '../pages/employee/DailyActivityTrackerPage';
import { MyRecords } from '../pages/employee/MyRecords';

// Digital Marketing Dedicated Module
import { DigitalMarketingWorkspacePage } from '../pages/digital-marketing/DigitalMarketingWorkspacePage';

// Protected Route Component for Admin
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin, isManager } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to={isManager ? "/manager/dashboard" : "/employee/dashboard"} replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// Protected Route Component for Manager
const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isManager, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isManager && !isAdmin) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// Protected Route Component for Employee
const EmployeeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export const AppRoutes: React.FC = () => {
  const { currentUser, isAdmin, isManager } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <AdminRoute>
            <DepartmentManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/department/:deptId"
        element={
          <AdminRoute>
            <AdminDepartmentView />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <AdminRoute>
            <EmployeeManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <AdminRoute>
            <ProjectManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/digital-marketing"
        element={
          <AdminRoute>
            <DigitalMarketingWorkspacePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/digital-marketing/:projectId"
        element={
          <AdminRoute>
            <DigitalMarketingWorkspacePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/daily-activities"
        element={
          <AdminRoute>
            <DailyActivities />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <AdminRoute>
            <Attendance />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/retention"
        element={
          <AdminRoute>
            <RetentionPolicy />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        }
      />

      {/* Manager Protected Routes */}
      <Route
        path="/manager"
        element={
          <ManagerRoute>
            <Navigate to="/manager/dashboard" replace />
          </ManagerRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ManagerRoute>
            <ManagerDashboard />
          </ManagerRoute>
        }
      />
      <Route
        path="/manager/projects"
        element={
          <ManagerRoute>
            <ManagerProjects />
          </ManagerRoute>
        }
      />
      <Route
        path="/manager/employees"
        element={
          <ManagerRoute>
            <ManagerEmployees />
          </ManagerRoute>
        }
      />
      <Route
        path="/manager/activities"
        element={
          <ManagerRoute>
            <ManagerActivities />
          </ManagerRoute>
        }
      />
      <Route
        path="/manager/attendance"
        element={
          <ManagerRoute>
            <ManagerAttendance />
          </ManagerRoute>
        }
      />
      <Route
        path="/manager/digital-marketing"
        element={
          <ManagerRoute>
            <DigitalMarketingWorkspacePage />
          </ManagerRoute>
        }
      />
      <Route
        path="/manager/digital-marketing/:projectId"
        element={
          <ManagerRoute>
            <DigitalMarketingWorkspacePage />
          </ManagerRoute>
        }
      />

      {/* Employee Protected Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <EmployeeRoute>
            <DepartmentDashboard />
          </EmployeeRoute>
        }
      />
      <Route
        path="/employee/projects"
        element={
          <EmployeeRoute>
            <MyProjects />
          </EmployeeRoute>
        }
      />
      <Route
        path="/employee/digital-marketing"
        element={
          <EmployeeRoute>
            <DigitalMarketingWorkspacePage />
          </EmployeeRoute>
        }
      />
      <Route
        path="/employee/digital-marketing/:projectId"
        element={
          <EmployeeRoute>
            <DigitalMarketingWorkspacePage />
          </EmployeeRoute>
        }
      />
      <Route
        path="/employee/activity"
        element={
          <EmployeeRoute>
            <DailyActivityTrackerPage />
          </EmployeeRoute>
        }
      />
      <Route
        path="/employee/records"
        element={
          <EmployeeRoute>
            <MyRecords />
          </EmployeeRoute>
        }
      />

      {/* Fallback Root Redirection */}
      <Route
        path="*"
        element={
          currentUser ? (
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isManager ? (
              <Navigate to="/manager/dashboard" replace />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};
