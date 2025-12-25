import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env để code hiện tại (dùng process.env.API_KEY) hoạt động được trên Vite
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Giữ lại process.env.NODE_ENV
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  };
});