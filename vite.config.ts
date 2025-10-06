import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// FIX: Import 'process' to resolve a TypeScript type error with 'process.cwd()'.
import process from 'process'

// https://vitejs.dev/config/
// FIX: Switched to a function export to access environment variables.
// This allows defining process.env.API_KEY for client-side code,
// making the Gemini API key available in a way that complies with the library's guidelines.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    },
  }
})
