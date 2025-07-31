import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting application...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('main.tsx: Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Root element not found</div>';
} else {
  console.log('main.tsx: Creating React root...');
  try {
    createRoot(rootElement).render(<App />);
    console.log('main.tsx: React app rendered');
  } catch (error) {
    console.error('main.tsx: Error rendering app:', error);
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Error rendering app: ' + error + '</div>';
  }
}
