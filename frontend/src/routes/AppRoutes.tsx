import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CustomersPage } from '../features/customers/CustomersPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { ChallansPage } from '../features/challans/ChallansPage';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';

import { NotFoundPage } from '../features/error/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside AppShell */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <AppShell>
              <CustomersPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProductsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/challans"
        element={
          <ProtectedRoute>
            <AppShell>
              <ChallansPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Custom 404 Page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
