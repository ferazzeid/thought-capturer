#!/usr/bin/env node
// Production start script
// This ensures the Express server runs instead of the Deno function

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Express.js server...');
console.log('Process working directory:', process.cwd());
console.log('Server file location:', path.resolve('./server.js'));

// Start the Express server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('error', (err) => {
  console.error('Failed to start Express server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Express server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down Express server...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down Express server...');
  server.kill('SIGINT');
});