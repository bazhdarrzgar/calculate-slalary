const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server
const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for hot reload
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
  }
  res.end('Bad Gateway: Unable to connect to Next.js server');
});

// Create HTTP server that proxies to Next.js
const server = http.createServer((req, res) => {
  console.log(`Proxying ${req.method} ${req.url} from port 8001 to 3000`);
  proxy.web(req, res);
});

// Proxy WebSocket connections for hot reload
server.on('upgrade', (req, socket, head) => {
  console.log('Proxying WebSocket connection');
  proxy.ws(req, socket, head);
});

const PORT = 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server listening on port ${PORT}, forwarding to port 3000`);
});
