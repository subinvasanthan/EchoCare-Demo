import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ConfirmEmail() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const token_hash = params.get('token_hash');

    async function verify() {
      try {
        if (token_hash) {
          // Supabase expects a concrete verification type. Default to 'signup'
          // for standard email confirmations. 'email_change' is also supported.
          const verificationType =
            type === 'email_change' ? 'email_change' : 'signup';
          const { error } = await supabase.auth.verifyOtp({
            type: verificationType as 'signup' | 'email_change',
            token_hash
          });
          if (error) throw error;
        }
        setStatus('ok');
      } catch {
        setStatus('error');
      }
    }
    verify();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-gray-700 dark:text-gray-300">Verifying your email…</div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      {status === 'ok' ? (
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center border border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold mb-2">Your email is verified</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You can now sign in to your account.
          </p>
          <a
            href="/signin"
            className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Go to Sign In
          </a>
        </div>
      ) : (
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center border border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold mb-2">Verification failed</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The link may have expired. Please request a new one.
          </p>
          <a
            href="/signin"
            className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Back to Sign In
          </a>
        </div>
      )}
    </div>
  );
}


