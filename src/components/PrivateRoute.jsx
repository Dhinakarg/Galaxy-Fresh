import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getPermissions } from '../utils/permissions';
import Navbar from './Navbar';

/**
 * PrivateRoute — Ensures user is authenticated.
 * Renders the Navbar + page content for all protected routes.
 */
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950 transition-colors">
        <div className="flex items-center space-x-3 text-gray-500 dark:text-zinc-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-bold uppercase tracking-widest text-xs">Authenticating Profile...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors flex flex-col">
      <Navbar />
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
    </div>
  );
};

/**
 * RoleRoute — Renders children only if the user's role matches `requiredRole`.
 * Must be used *inside* a PrivateRoute (auth is assumed).
 */
export const RoleRoute = ({ requiredRole }) => {
  const { role, loading } = useAuth();

  if (loading) return null;

  if (role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          This page requires <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{requiredRole}</span> access.
          Your current role does not have permission to view it.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

/**
 * PermissionRoute — Renders children only if the user has the required permission.
 */
export const PermissionRoute = ({ permission }) => {
  const { role, loading } = useAuth();
  const perms = getPermissions(role);

  if (loading) return null;

  if (!perms[permission]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Your role (<span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{role}</span>) does not have permission to access this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
