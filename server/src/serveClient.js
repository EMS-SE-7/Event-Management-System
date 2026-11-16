const fs = require('fs');
const path = require('path');
const express = require('express');

// In production the API also serves the built React app (client/dist), so the
// whole system deploys as one Render web service on one URL with no CORS setup.
// Any path that is not under /api gets index.html, so React Router can handle it.
function serveClient(app, distDir) {
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.warn(`Client build not found at ${distDir}; serving the API only`);
    return false;
  }
  app.use(express.static(distDir));
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => res.sendFile(indexHtml));
  return true;
}

module.exports = serveClient;
