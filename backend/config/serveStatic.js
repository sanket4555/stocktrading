const path = require('path');
const express = require('express');

/**
 * Configure the Express app to serve static files from the frontend/public directory
 * @param {Express} app - The Express application
 */
function configureStaticFiles(app) {
  // Serve static files from the frontend/public directory
  app.use(express.static(path.join(__dirname, '../../frontend/public')));
  
  // For any other routes, serve the index.html
  app.get('*', (req, res) => {
    // Only handle HTML requests that aren't API requests
    if (req.headers.accept && req.headers.accept.includes('text/html') && !req.url.startsWith('/api')) {
      res.sendFile(path.resolve(__dirname, '../../frontend/public/index.html'));
    } else {
      // Continue to the next middleware for API requests
      if (!res.headersSent) {
        res.status(404).json({ message: 'API endpoint not found' });
      }
    }
  });
}

module.exports = configureStaticFiles; 