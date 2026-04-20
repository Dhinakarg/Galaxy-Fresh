import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast.jsx';

/**
 * Login Component
 * ---------------
 * Entry point for the Galaxy Fresh ecosystem.
 * Enhanced with automated redirection and dual-theme authentication interface.
 */
export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { showToast, ToastComponent } = useToast();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const validate = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    if (!formData.email.trim()) {
      newErrors.email = 'Required address.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid protocol format.';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Required credentials.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await loginWithEmail(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      let customMessage = error.message;
      if (error.code === 'auth/invalid-credential') customMessage = 'Profile authentication failed.';
      showToast(customMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors">
      <ToastComponent />

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-500 transition-colors">
        
        {/* Visual Brand Header */}
        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="w-16 h-16 bg-white/20 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-md mb-6 shadow-xl border border-white/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">Galaxy Fresh</h1>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Inventory Domain</p>
        </div>

        <div className="p-10">
          <div className="text-center mb-10">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Security Induction</h2>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mt-2">Authorization required for terminal access.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2" htmlFor="email">Email Terminal</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@galaxyfresh.pro"
                className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-2 rounded-2xl outline-none focus:ring-4 transition-all font-bold text-sm ${
                  errors.email ? 'border-red-500 ring-red-500/10 dark:text-red-400' : 'border-gray-50 dark:border-zinc-800 focus:ring-indigo-500/10 focus:border-indigo-600 dark:text-white'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2" htmlFor="password">Encrypted Access</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-2 rounded-2xl outline-none focus:ring-4 transition-all font-mono text-lg ${
                  errors.password ? 'border-red-500 ring-red-500/10 dark:text-red-400' : 'border-gray-50 dark:border-zinc-800 focus:ring-indigo-500/10 focus:border-indigo-600 dark:text-white'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Establish Connection'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
