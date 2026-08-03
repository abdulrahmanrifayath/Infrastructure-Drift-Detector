import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { ResourceInventory } from '../pages/ResourceInventory';
import { CloudSync } from '../pages/CloudSync';
import { DriftHistory } from '../pages/DriftHistory';
import { ResourceComparison } from '../pages/ResourceComparison';
import { UserProfile } from '../pages/UserProfile';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading platform context...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <ResourceInventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sync"
        element={
          <ProtectedRoute>
            <CloudSync />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drift"
        element={
          <ProtectedRoute>
            <DriftHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comparison"
        element={
          <ProtectedRoute>
            <ResourceComparison />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
