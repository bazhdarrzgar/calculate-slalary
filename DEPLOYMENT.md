# Deployment Guide

This guide explains how to deploy the Iraqi Dinar Salary Calculator in different environments.

## Quick Start (Local Development)

```bash
# Clone and install
git clone https://github.com/bazhdarrzgar/calculate-slalary.git
cd calculate-slalary
yarn install

# Run
yarn dev

# Access at http://localhost:3000
```

## Kubernetes/Container Environment

### Architecture Overview

This Next.js application serves both the frontend UI and backend API routes from a single process. However, if your Kubernetes ingress routes:
- Frontend traffic → port 3000
- API traffic (`/api/*`) → port 8001

You'll need a proxy to bridge the gap.

### Solution: Dual Port Setup

**Port 3000**: Next.js server (frontend + API)  
**Port 8001**: Proxy server (forwards to 3000)

### Step-by-Step Setup

#### 1. Install Dependencies
```bash
cd /app
yarn install
yarn add http-proxy  # For proxy server
```

#### 2. Create Proxy Server

Create `/app/proxy-server.js`:
```javascript
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true, // WebSocket support for hot reload
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
  }
  res.end('Bad Gateway: Unable to connect to Next.js server');
});

const server = http.createServer((req, res) => {
  console.log(`Proxying ${req.method} ${req.url}`);
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const PORT = 8001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
```

#### 3. Configure Supervisor

**Next.js Config** (`/etc/supervisor/conf.d/nextjs.conf`):
```ini
[program:nextjs]
command=yarn dev
directory=/app
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/nextjs.err.log
stdout_logfile=/var/log/supervisor/nextjs.out.log
stopsignal=TERM
stopwaitsecs=30
stopasgroup=true
killasgroup=true
environment=NODE_ENV="development"
```

**Proxy Config** (`/etc/supervisor/conf.d/api-proxy.conf`):
```ini
[program:api-proxy]
command=node /app/proxy-server.js
directory=/app
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/api-proxy.err.log
stdout_logfile=/var/log/supervisor/api-proxy.out.log
stopsignal=TERM
stopwaitsecs=10
stopasgroup=true
killasgroup=true
priority=100
```

#### 4. Start Services

```bash
# Reload supervisor configuration
sudo supervisorctl reread
sudo supervisorctl update

# Start services
sudo supervisorctl start nextjs api-proxy

# Check status
sudo supervisorctl status
```

Expected output:
```
nextjs    RUNNING   pid 1234, uptime 0:05:00
api-proxy RUNNING   pid 1235, uptime 0:05:00
```

#### 5. Verify Setup

```bash
# Test Next.js directly
curl http://localhost:3000/api/denominations

# Test via proxy
curl http://localhost:8001/api/denominations

# Both should return the same JSON response
```

## Production Build

For production deployment:

```bash
# Build the application
yarn build

# Update supervisor to use production mode
# In /etc/supervisor/conf.d/nextjs.conf:
command=yarn start  # Instead of yarn dev

# Restart
sudo supervisorctl restart nextjs
```

## Monitoring

### Check Logs

```bash
# Next.js logs
tail -f /var/log/supervisor/nextjs.out.log
tail -f /var/log/supervisor/nextjs.err.log

# Proxy logs
tail -f /var/log/supervisor/api-proxy.out.log
tail -f /var/log/supervisor/api-proxy.err.log
```

### Check Ports

```bash
# See what's listening on ports 3000 and 8001
netstat -tulpn | grep -E ":(3000|8001)"

# Expected output:
# tcp6  0  0 :::3000  :::*  LISTEN  1234/next-server
# tcp6  0  0 :::8001  :::*  LISTEN  1235/node
```

## Troubleshooting

### 502 Bad Gateway Errors

**Symptom**: Frontend loads but API calls fail with 502

**Solution**:
1. Check if Next.js is running: `sudo supervisorctl status nextjs`
2. Check if proxy is running: `sudo supervisorctl status api-proxy`
3. Verify ports: `netstat -tulpn | grep -E ":(3000|8001)"`
4. Check logs for errors

### Port Already in Use

**Symptom**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find what's using the port
lsof -i :3000
lsof -i :8001

# Kill the process if needed
kill -9 <PID>

# Restart services
sudo supervisorctl restart nextjs api-proxy
```

### Database Not Initialized

**Symptom**: No denominations showing up

**Solution**:
```bash
# Check database file
ls -l /app/database/currency_calculator.db

# If missing, Next.js will create it on next start
sudo supervisorctl restart nextjs

# Check logs to see initialization
tail -f /var/log/supervisor/nextjs.out.log
```

### Hot Reload Not Working

**Symptom**: Changes don't reflect in browser

**Solution**:
1. Make sure you're using `yarn dev` (not `yarn start`)
2. Check WebSocket proxy is working
3. Try hard refresh in browser (Ctrl+Shift+R)

## Environment Variables

The application doesn't require environment variables for basic operation, but you can configure:

```bash
# .env.local (optional)
NODE_ENV=development
PORT=3000
```

## Security Notes

- SQLite database file should have restricted permissions
- In production, consider using a reverse proxy (nginx) with SSL
- Enable rate limiting on API endpoints for production use
- Implement proper authentication if needed

## Performance Tips

- Use production build (`yarn build && yarn start`) for better performance
- Enable compression in your reverse proxy
- Consider caching static assets
- Monitor database file size and clean old calculations if needed

## Support

For issues related to:
- Next.js: https://nextjs.org/docs
- Supervisor: http://supervisord.org/
- SQLite: https://www.sqlite.org/docs.html
