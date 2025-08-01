import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies (standard limit sufficient for non-audio data)
app.use(express.json());

// Serve static files from dist directory (built React app)
app.use(express.static(join(__dirname, 'dist')));

// Serve static files from public directory (robots.txt, favicon.ico, etc.)
app.use(express.static(join(__dirname, 'public')));


// SPA fallback - serve index.html for all other routes (React Router)
app.get('*', (req, res) => {
  // Don't serve index.html for actual files that don't exist
  if (req.path.includes('.') && !req.path.includes('.html')) {
    return res.status(404).send('File not found');
  }
  
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Create HTTP server
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Available routes:');
  console.log('  GET /* - Static file serving and SPA routing');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});