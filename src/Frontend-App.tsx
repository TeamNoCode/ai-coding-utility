import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import ChatInterface from './components/Frontend-ChatInterface';
import { supabase, supabaseEnabled } from './services/Frontend-supabaseClient';

interface ConfigurationWarningProps {
  onClose: () => void;
}

const ConfigurationWarning: React.FC<ConfigurationWarningProps> = ({ onClose }) => (
    <div className="bg-yellow-500 text-black p-3 text-center text-sm shadow-lg flex justify-center items-center relative">
      <span>
        <strong className="font-bold">Configuration Needed:</strong> User accounts are not enabled. Please add your Supabase credentials to the <code>.env</code> file and follow the setup instructions in <code>README.md</code> to unlock user features.
      </span>
      <button onClick={onClose} className="absolute right-4 text-black hover:text-gray-700 transition-colors" aria-label="Close warning">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
);


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(true);

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
      {!supabaseEnabled && showWarning && <ConfigurationWarning onClose={() => setShowWarning(false)} />}
      <ChatInterface
        key={session?.user.id || 'anonymous'}
        session={session}
      />
    </div>
  );
};

export default App;
