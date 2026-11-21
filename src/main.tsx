import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, reloading...');
  },
  onOfflineReady() {
    console.log('Mythos PWA ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(<App />);

