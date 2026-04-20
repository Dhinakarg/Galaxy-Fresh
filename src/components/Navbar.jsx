import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ROLE_COLORS, ROLE_LABELS, getPermissions } from '../utils/permissions';

/**
 * Galaxy Fresh — Principal Navigation
 * ----------------------------------
 * Handles responsive routing and global theme/currency state.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { role, currency, updateCurrency, logout } = useAuth();
  const perms = getPermissions(role);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout protocol failed:', err);
    }
  };

  /**
   * Adaptive Link Style
   * Dynamically shifts colors and shadows based on Active state and Theme mode.
   */
  const linkStyle = ({ isActive }) =>
    `px-4 py-2 font-bold text-sm rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-900'
    }`;

  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.chef;
  const roleLabel = ROLE_LABELS[role]  || 'Chef';

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 shadow-sm sticky top-0 z-40 print:hidden transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md">
              GF
            </div>
            <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight hidden sm:block">
              Galaxy Fresh
            </span>
          </div>

          {/* Core Navigation Cluster */}
          <div className="hidden md:flex items-center space-x-2">
            <NavLink to="/dashboard"  className={linkStyle}>Dashboard</NavLink>
            <NavLink to="/inventory"  className={linkStyle}>Inventory</NavLink>
            {perms.canRestock && <NavLink to="/shopping"   className={linkStyle}>Restock</NavLink>}
            {perms.canViewReports && <NavLink to="/insights" className={linkStyle}>Insights</NavLink>}
            {role === 'manager' && (
              <NavLink to="/permissions" className={linkStyle}>Manage Team</NavLink>
            )}
          </div>

          {/* Action Center (Theme, Currency, Profile) */}
          <div className="flex items-center space-x-3 border-l border-gray-100 dark:border-zinc-800 pl-4">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-900 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Toggle Appearance"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>

            {/* Global Currency Selection */}
            <select 
              value={currency}
              onChange={(e) => updateCurrency(e.target.value)}
              className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-lg px-2 py-1 outline-none hover:border-indigo-300 transition-colors cursor-pointer"
            >
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
              <option value="AED">AED</option>
            </select>

            {/* Role Badge */}
            <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${roleColor}`}>
              {roleLabel}
            </span>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="text-sm font-black text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 px-3 py-2 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
