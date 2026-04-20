import React, { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({ message: '', isVisible: false, type: 'error' });

  const showToast = useCallback((message, type = 'error', duration = 3500) => {
    setToast({ message, isVisible: true, type });
    
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, duration);
  }, []);

  const ToastComponent = useCallback(() => {
    if (!toast.isVisible) return null;
    
    return (
      <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className={`px-5 py-3.5 rounded-xl shadow-xl font-medium text-white flex items-center space-x-3 
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900 border border-gray-700'}`}>
           
           {toast.type === 'error' ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
           ) : (
              <svg className="w-5 h-5 shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
           )}
           
           <span className="text-sm tracking-wide">{toast.message}</span>
        </div>
      </div>
    );
  }, [toast]);

  return { showToast, ToastComponent };
};
