# Self-Hosted Piston API Setup Guide

## 🚀 Overview

This guide will help you set up a **self-hosted Piston API** instance for unlimited, free code execution without rate limits.

**Benefits:**
- ✅ Unlimited code execution
- ✅ No rate limits
- ✅ No external dependencies
- ✅ Faster response times (local network)
- ✅ Full control over supported languages

---

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+
- Minimum 2GB RAM available
- Minimum 2 CPU cores

---

## 🛠️ Setup Instructions

### 1. Start Piston Container

From the project root directory:

```bash
# Start Piston in detached mode
docker-compose up -d piston

# Check if Piston is running
docker-compose ps

# View Piston logs
docker-compose logs -f piston
```

**Expected output:**
```
piston_api is up and running on port 2000
```

### 2. Verify Piston is Running

Test the API endpoint:

```bash
# Windows PowerShell
curl http://localhost:2000/api/v2/piston/runtimes

# Or use browser
# Navigate to: http://localhost:2000/api/v2/piston/runtimes
```

You should see a JSON response with available language runtimes.

### 3. Configure Backend Environment

The backend is already configured to use the self-hosted Piston instance by default.

**Option A: Use Self-Hosted (Recommended)**
```env
# In backend/.env
PISTON_API_URL="http://localhost:2000/api/v2/piston"
```

**Option B: Use Public API (Fallback)**
```env
# In backend/.env
PISTON_API_URL="https://emkc.org/api/v2/piston"
```

### 4. Start Your Backend

```bash
cd backend
npm run dev
```

The backend will automatically connect to your self-hosted Piston instance.

---

## 📦 Installing Additional Language Support

Piston comes with most languages pre-installed, but you can add more if needed.

### List Available Packages

```bash
docker exec piston_api piston ppman list
```

### Install a Package

```bash
# Example: Install specific Python version
docker exec piston_api piston ppman install python=3.10.0

# Example: Install Node.js
docker exec piston_api piston ppman install node=18.15.0
```

### Verify Installed Packages

```bash
docker exec piston_api piston ppman list | grep installed
```

---

## 🧪 Testing Code Execution

### Test via API

Create a test file `test-piston.js`:

```javascript
const axios = require('axios');

async function testPiston() {
    try {
        const response = await axios.post('http://localhost:2000/api/v2/piston/execute', {
            language: 'python',
            version: '3.10.0',
            files: [{
                content: 'print("Hello from Piston!")'
            }]
        });
        
        console.log('Output:', response.data.run.stdout);
        console.log('Success!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testPiston();
```

Run it:
```bash
node test-piston.js
```

### Test via Your Platform

1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Login as organizer
4. Go to "Test Code" and try executing:

```python
print("Hello from self-hosted Piston!")
```

---

## 🔧 Configuration Options

### Resource Limits

Edit `docker-compose.yml` to adjust resource limits:

```yaml
services:
  piston:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Maximum CPU cores
          memory: 2G       # Maximum RAM
        reservations:
          cpus: '1.0'      # Minimum CPU cores
          memory: 1G       # Minimum RAM
```

### Environment Variables

Available Piston environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PISTON_LOG_LEVEL` | Logging level (DEBUG, INFO, WARN, ERROR) | INFO |
| `PISTON_REPO_URL` | Piston repository URL | github.com/engineer-man/piston |
| `PISTON_PACKAGES_PATH` | Path to store packages | /piston/packages |

---

## 🐛 Troubleshooting

### Issue: Container won't start

**Solution:**
```bash
# Check Docker is running
docker version

# Remove existing container
docker-compose down
docker-compose up -d piston

# Check logs
docker-compose logs piston
```

### Issue: Port 2000 already in use

**Solution:** Change the port in `docker-compose.yml`:

```yaml
ports:
  - "2001:2000"  # Use port 2001 instead
```

Then update your `.env`:
```env
PISTON_API_URL="http://localhost:2001/api/v2/piston"
```

### Issue: Language not found

**Solution:** Install the language package:

```bash
# List available languages
docker exec piston_api piston ppman list

# Install missing language
docker exec piston_api piston ppman install <language>=<version>
```

### Issue: Slow first execution

**Explanation:** The first code execution after starting Piston downloads the language runtime. Subsequent executions are much faster due to caching.

### Issue: Backend can't connect to Piston

**Solution:**
1. Verify Piston is running: `docker-compose ps`
2. Test API directly: `curl http://localhost:2000/api/v2/piston/runtimes`
3. Check backend logs for connection errors
4. Ensure `PISTON_API_URL` is correctly set in `.env`

---

## 🔄 Maintenance

### Updating Piston

```bash
# Pull latest image
docker-compose pull piston

# Restart container
docker-compose down
docker-compose up -d piston
```

### Cleaning Up

```bash
# Stop Piston
docker-compose stop piston

# Remove container but keep data
docker-compose down

# Remove container AND data (WARNING: deletes all packages)
docker-compose down -v
```

### Viewing Logs

```bash
# Real-time logs
docker-compose logs -f piston

# Last 100 lines
docker-compose logs --tail=100 piston
```

---

## 📊 Performance Comparison

| Metric | Public API | Self-Hosted |
|--------|------------|-------------|
| Rate Limit | Yes (~100/day) | ❌ None |
| Response Time | ~500-2000ms | ~50-200ms |
| Availability | 99%+ | 100% (local) |
| Cost | Free | Free |
| Setup Time | 0 min | 5 min |

---

## 🌐 Production Deployment

For production environments:

### Option 1: Docker on VPS

1. Deploy `docker-compose.yml` to your server
2. Ensure port 2000 is accessible from your backend
3. Update `PISTON_API_URL` to server IP:
   ```env
   PISTON_API_URL="http://your-server-ip:2000/api/v2/piston"
   ```

### Option 2: Same Server as Backend

If backend and Piston are on the same server:
```env
PISTON_API_URL="http://localhost:2000/api/v2/piston"
```

### Option 3: Docker Network (Recommended)

Add backend to same Docker network:

```yaml
# In docker-compose.yml
services:
  backend:
    # ... your backend config
    environment:
      - PISTON_API_URL=http://piston:2000/api/v2/piston
    depends_on:
      - piston
  
  piston:
    # ... existing piston config
```

---

## ✅ Verification Checklist

- [ ] Docker Desktop is running
- [ ] `docker-compose up -d piston` executed successfully
- [ ] `curl http://localhost:2000/api/v2/piston/runtimes` returns JSON
- [ ] Backend `.env` has `PISTON_API_URL` set
- [ ] Backend starts without errors
- [ ] Test code execution works in the platform
- [ ] All languages (C, C++, Python, Java) work correctly

---

## 📚 Additional Resources

- [Piston GitHub](https://github.com/engineer-man/piston)
- [Piston API Documentation](https://github.com/engineer-man/piston/blob/master/API.md)
- [Supported Languages](https://github.com/engineer-man/piston/blob/master/PACKAGES.md)

---

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. View Piston logs: `docker-compose logs piston`
3. Verify Docker is running: `docker version`
4. Test API directly: `curl http://localhost:2000/api/v2/piston/runtimes`
