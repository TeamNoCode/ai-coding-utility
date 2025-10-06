// ====================================================
//  VERSION: 007-index
//  FILE: 007-App.tsx
// ====================================================

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import ChatInterface from './components/007-ChatInterface';
import AuthComponent from './components/007-Auth';
import { supabase, supabaseUrl, supabaseAnonKey } from './services/007-supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const isSupabaseConfigured =
    supabaseUrl !== 'YOUR_SUPABASE_URL' &&
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      // Close auth modal on successful login
      if (session) {
        setShowAuth(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-lg shadow-lg border border-red-500 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Configuration Required</h1>
          <p className="text-gray-300 mb-2">
            You need to add your Supabase URL and Anon Key to use this application.
          </p>
          <p className="text-gray-300 mb-6">
            Please open the file <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded">services/supabaseClient.ts</code> and replace the placeholder values.
          </p>
          <p className="text-gray-500 text-sm">
            You can find these keys in your Supabase project settings under the "API" section.
          </p>
        </div>
      </div>
    );
  }

  if (loading && isSupabaseConfigured) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <p className="text-white">Loading...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative">
      <ChatInterface
        key={session?.user.id || 'anonymous'}
        session={session}
        onLoginClick={() => setShowAuth(true)}
      />
      {showAuth && !session && (
        <AuthComponent onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default App;