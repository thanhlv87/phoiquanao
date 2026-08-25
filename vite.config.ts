import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Tách vendor để firebase không phải tải lại mỗi lần code app đổi.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['@firebase/app', '@firebase/auth', '@firebase/firestore', '@firebase/storage'],
        },
      },
    },
  },
});
