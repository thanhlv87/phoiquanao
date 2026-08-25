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
          // Tách riêng: core cần ngay lúc khởi động, data chỉ nạp sau khi đăng nhập.
          'firebase-core': ['@firebase/app', '@firebase/auth'],
          'firebase-data': ['@firebase/firestore', '@firebase/storage'],
        },
      },
    },
  },
});
