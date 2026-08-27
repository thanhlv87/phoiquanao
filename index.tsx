
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { HashRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <App />
    </HashRouter>
  </React.StrictMode>
);

// Service worker chỉ chạy ở bản build. Ở chế độ dev nó cache đè lên file của
// Vite, sửa CSS/JS xong vẫn thấy bản cũ và phải tự tay xoá cache mới gỡ được.
// Gate theo import.meta.env.PROD chứ không theo hostname, để `vite preview`
// (cũng chạy localhost) vẫn thử được service worker thật.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error('Đăng ký service worker thất bại:', error);
      });
    });
  } else {
    // Dọn dấu vết của lần chạy trước: máy nào từng mở bản deploy trên cùng
    // origin sẽ còn service worker cũ nằm đó chặn mất bản dev.
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
    caches?.keys().then(keys => keys.forEach(key => caches.delete(key)));
  }
}
