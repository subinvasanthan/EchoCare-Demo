import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          window.location.href = '/';
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to dashboard
          window.location.href = '/dashboard';
        } else {
          // No session, redirect to home
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Callback error:', err);
        window.location.href = '/';
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Signing you in...</p>
      </div>
    </div>
  );
}