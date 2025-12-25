
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env và đảm bảo giá trị chuỗi rỗng nếu không có key
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  };
});
