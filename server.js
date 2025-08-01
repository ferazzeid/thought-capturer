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

// Parse JSON bodies with increased limit for audio data
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ limit: '50mb', type: 'application/octet-stream' }));

// Add request size logging and error handling
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    console.error('Request too large:', {
      path: req.path,
      contentLength: req.get('content-length'),
      limit: '50mb'
    });
    return res.status(413).json({ 
      error: 'Request too large', 
      message: 'Audio file exceeds 50MB limit' 
    });
  }
  next(err);
});

// Serve static files from dist directory (built React app)
app.use(express.static(join(__dirname, 'dist')));

// Serve static files from public directory (robots.txt, favicon.ico, etc.)
app.use(express.static(join(__dirname, 'public')));

// API proxy to Supabase Edge Functions
app.post('/api/voice-to-text', async (req, res) => {
  console.log('Voice-to-text API called:', {
    method: req.method,
    path: req.path,
    headers: Object.keys(req.headers),
    bodySize: JSON.stringify(req.body).length
  });
  
  try {
    const response = await fetch('https://wdjvsuiyayjuzivvdxvh.supabase.co/functions/v1/voice-to-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'apikey': req.headers.apikey || process.env.SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(req.body)
    });

    console.log('Supabase response status:', response.status);
    const data = await response.json();
    console.log('Supabase response data keys:', Object.keys(data));
    
    if (!response.ok) {
      console.error('Supabase error response:', data);
      return res.status(response.status).json(data);
    }

    console.log('Successfully proxied voice-to-text request');
    res.json(data);
  } catch (error) {
    console.error('Error proxying to voice-to-text function:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Handle any other API routes that might be added
app.all('/functions/v1/*', async (req, res) => {
  const functionPath = req.path.replace('/functions/v1', '');
  try {
    const response = await fetch(`https://wdjvsuiyayjuzivvdxvh.supabase.co/functions/v1${functionPath}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'apikey': req.headers.apikey || ''
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error(`Error proxying to function ${functionPath}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
  console.log('  POST /api/voice-to-text - Voice-to-text proxy');
  console.log('  POST /functions/v1/* - General function proxy');
  console.log('  GET /* - Static file serving');
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