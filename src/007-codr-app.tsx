// ====================================================
//  VERSION: codr-src
//  FILE: src/007-codr-app.tsx
// ====================================================

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import ChatInterface from './components/codr-src-ChatInterface';
import { supabase, supabaseEnabled } from './services/codr-src-supabaseClient';

const ConfigurationWarning = () => (
    <div className="bg-yellow-500 text-black p-3 text-center text-sm shadow-lg">
      <strong className="font-bold">Configuration Needed:</strong> User accounts are not enabled. Please add your Supabase credentials to the <code>.env</code> file and follow the setup instructions in <code>README.md</code> to unlock user features.
    </div>
);


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If supabase is not configured, the client is null. We can just stop loading.
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Set initial loading state only if Supabase is configured
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading && supabaseEnabled) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <p className="text-white">Loading...</p>
        </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative">
      {!supabaseEnabled && <ConfigurationWarning />}
      <ChatInterface
        key={session?.user.id || 'anonymous'}
        session={session}
      />
    </div>
  );
};

export default App;