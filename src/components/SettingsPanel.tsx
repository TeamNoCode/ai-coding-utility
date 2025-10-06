import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseEnabled } from '../services/supabaseClient';
import { SUPPORTED_LANGUAGES } from '../constants';
import { ChatHistory } from '../types';
import { UserIcon, LogoutIcon, ChevronDoubleLeftIcon, ChevronDownIcon, ChevronUpIcon, GoogleIcon, GearIcon } from './icons';

interface SidePanelProps {
  session: Session | null;
  language: string;
  setLanguage: (lang: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  activeChatId: string | null;
  onToggle: () => void;
  onOpenSettingsModal: () => void;
}

const AuthBlock: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true);
    const [message, setMessage] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(false);

    const handleAuth = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!supabase) return;

        setLoading(true);
        setMessage('');

        const { error } = isLoginView
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (error) {
            setMessage(error.message);
        } else if (!isLoginView) {
            setMessage('Registration successful! Please check your email to verify your account.');
        }
        // On success, the onAuthStateChange listener in App.tsx will handle UI changes.
        setLoading(false);
    };

    const signInWithGoogle = async () => {
        if (!supabase) return;

        setLoading(true);
        setMessage('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            if (error.message.includes("Unsupported provider")) {
                 setMessage("Error: Google provider is not enabled. Please enable it in your Supabase project's Authentication > Providers settings.");
            } else {
                setMessage(`OAuth Error: ${error.message}. Please ensure this app's URL is listed in your Supabase project's Redirect URL configuration.`);
            }
            setLoading(false);
        }
    };

    return (
        <div className="text-center p-4 border border-dashed border-gray-600 rounded-md space-y-4">
            <div>
                <p className="text-sm text-gray-400 mb-3">
                    Sign in to save conversations and access your chat history.
                </p>
                <button
                    onClick={signInWithGoogle}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-200 hover:bg-gray-600 disabled:opacity-50 btn-tactile"
                >
                    <GoogleIcon className="w-5 h-5 mr-2" />
                    Sign in with Google
                </button>
            </div>

            {message && <p className="text-center text-sm text-red-400">{message}</p>}

            <div>
                <button 
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="text-xs text-gray-500 hover:text-gray-300"
                >
                    {showEmailForm ? 'Cancel' : 'Or sign in with email'}
                </button>
            </div>
            
            {showEmailForm && (
                <form className="space-y-4 text-left" onSubmit={handleAuth}>
                    <h3 className="text-lg font-semibold text-center text-white">{isLoginView ? 'Sign In' : 'Sign Up'}</h3>
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 btn-tactile"
                    >
                        {loading ? 'Loading...' : (isLoginView ? 'Sign in' : 'Sign up')}
                    </button>
                     <p className="mt-2 text-center text-xs text-gray-400">
                        {isLoginView ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-indigo-400 hover:text-indigo-300">
                        {isLoginView ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </form>
            )}
        </div>
    );
};


const SidePanel: React.FC<SidePanelProps> = ({
  session,
  language,
  setLanguage,
  temperature,
  setTemperature,
  customPrompt,
  setCustomPrompt,
  onNewChat,
  onSelectChat,
  activeChatId,
  onToggle,
  onOpenSettingsModal,
}) => {
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false);
  
  const fetchHistory = async () => {
    if (!session || !supabase) return;
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat history:', error);
    } else {
      setHistory(data);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (session && supabaseEnabled) {
      fetchHistory();
    } else {
      setHistory([]);
      setLoadingHistory(false);
    }
  }, [session]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-200 truncate">AI Code Assistant</h1>
        <button 
            onClick={onToggle} 
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md ml-2 btn-tactile"
            aria-label="Collapse sidebar"
        >
            <ChevronDoubleLeftIcon className="w-6 h-6" />
        </button>
      </div>
      
      <button
        onClick={onNewChat}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 mb-6 btn-tactile"
      >
        + New Chat
      </button>

      <div className="flex-grow overflow-y-auto mb-4">
        <h2 className="text-lg font-semibold text-gray-400 mb-2">History</h2>
        {supabaseEnabled ? (
          session ? (
              loadingHistory ? (
                  <p className="text-gray-500">Loading history...</p>
              ) : (
                  <ul className="space-y-2">
                      {history.map((chat) => (
                          <li key={chat.id}>
                              <button
                                  onClick={() => onSelectChat(chat.id)}
                                  className={`w-full text-left p-2 rounded-md truncate ${activeChatId === chat.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                              >
                                  {chat.title || 'Untitled Chat'}
                              </button>
                          </li>
                      ))}
                  </ul>
              )
          ) : (
              <AuthBlock />
          )
        ) : (
          <div className="text-center p-4 border border-dashed border-gray-600 rounded-md">
            <p className="text-sm text-gray-400">User accounts are not configured. Set up Supabase to enable chat history.</p>
          </div>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-400">Settings</h2>
            <button 
                onClick={onOpenSettingsModal}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md btn-tactile"
                aria-label="Provider Settings"
            >
                <GearIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="space-y-4">
            <div>
                <label htmlFor="language-select" className="block text-sm font-medium text-gray-400 mb-2">
                Language
                </label>
                <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
                >
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                    {lang}
                    </option>
                ))}
                </select>
            </div>

            <div>
              <button
                onClick={() => setIsCustomPromptOpen(!isCustomPromptOpen)}
                className="w-full flex justify-between items-center text-sm font-medium text-gray-400 mb-2"
              >
                Custom Prompt
                {isCustomPromptOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
              {isCustomPromptOpen && (
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Always use Vue.js and TypeScript"
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm transition-all"
                />
              )}
            </div>

            <div>
                <label htmlFor="temperature-slider" className="block text-sm font-medium text-gray-400 mb-2">
                Creativity (Temperature)
                </label>
                <input
                id="temperature-slider"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center text-gray-400 text-sm mt-1">{temperature.toFixed(1)}</div>
            </div>
        </div>
      </div>
      
      <div className="border-t border-gray-700 mt-6 pt-4">
        {supabaseEnabled && session ? (
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 overflow-hidden">
                    <UserIcon className="w-6 h-6 flex-shrink-0" />
                    <span className="truncate text-sm">{session.user.email}</span>
                </div>
                <button onClick={handleLogout} title="Log out" className="text-gray-400 hover:text-white p-1 rounded-md btn-tactile">
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </div>
        ) : (
            <div className="text-center text-sm text-gray-500">
                You are browsing as a guest.
            </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel;
