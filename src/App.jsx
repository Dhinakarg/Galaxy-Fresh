import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute, { RoleRoute, PermissionRoute } from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Eagerly loaded pages (critical path)
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Inventory       from './pages/Inventory';
import ManagePermissions from './pages/ManagePermissions';
import Reports           from './pages/Reports';
import Insights          from './pages/Insights';

// Lazy loaded (non-critical)
const ShoppingList = lazy(() => import('./pages/ShoppingList'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InventoryProvider>
          <Router>
            <ErrorBoundary>
              <Routes>

                {/* Public */}
                <Route path="/login" element={<Login />} />

                {/* Protected — requires authentication */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard"  element={<Dashboard />} />
                  <Route path="/inventory"  element={<Inventory />} />
                  
                  {/* Chefs cannot access Restock */}
                  <Route element={<PermissionRoute permission="canRestock" />}>
                    <Route path="/shopping"   element={
                      <Suspense fallback={
                        <div className="flex items-center justify-center min-h-screen bg-gray-50">
                          <div className="text-xl font-bold text-gray-400 animate-pulse">Building List...</div>
                        </div>
                      }>
                        <ShoppingList />
                      </Suspense>
                    } />
                  </Route>

                  {/* Manager-only: role gate is enforced at the route level */}
                  <Route element={<RoleRoute requiredRole="manager" />}>
                    <Route path="/permissions" element={<ManagePermissions />} />
                  </Route>

                  {/* Manager/Owner Insights */}
                  <Route element={<PermissionRoute permission="canViewReports" />}>
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/reports" element={<Reports />} />
                  </Route>
                </Route>

                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

              </Routes>
            </ErrorBoundary>
          </Router>
        </InventoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
