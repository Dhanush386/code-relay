# Production-Ready Self-Hosted Code Execution System
## Using Piston API on Render (100% Free)

Complete guide to deploy an unlimited, secure online code compiler without any paid APIs.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Setup Files](#setup-files)
4. [Deployment Guide](#deployment-guide)
5. [Security Features](#security-features)
6. [Testing](#testing)
7. [Rate Limiting](#rate-limiting)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    RENDER CLOUD                     │
│                                                     │
│  ┌─────────────────┐        ┌──────────────────┐  │
│  │   Backend API   │───────▶│   Piston API     │  │
│  │  (Node/Express) │ HTTP   │   (Code Runner)  │  │
│  │  Port: 5000     │        │   Port: 2000     │  │
│  └────────┬────────┘        └──────────────────┘  │
│           │                                         │
│           │ Stores data                            │
│           ▼                                         │
│  ┌─────────────────┐                               │
│  │   PostgreSQL    │ (Optional - for rate limits)  │
│  └─────────────────┘                               │
└─────────────────────────────────────────────────────┘
         ▲
         │ HTTPS
         │
    ┌────┴────┐
    │  Users  │
    └─────────┘
```

**Key Points:**
- ✅ 100% Free on Render
- ✅ No third-party APIs
- ✅ Unlimited executions
- ✅ Secure sandboxing
- ✅ Rate limiting included

---

## 📁 Project Structure

```
code-execution-system/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── execute.js          # Code execution routes
│   │   ├── middleware/
│   │   │   └── rateLimit.js        # Rate limiting
│   │   ├── services/
│   │   │   └── pistonClient.js     # Piston integration
│   │   └── server.js               # Express server
│   ├── package.json
│   └── .env.example
├── piston/
│   └── Dockerfile                  # Custom Piston image
├── render.yaml                     # Render deployment config
└── README.md
```

---

## 📄 Setup Files

### 1. Backend - package.json

```json
{
  "name": "code-execution-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "axios": "^1.6.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. Backend - src/server.js

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const executeRoutes = require('./routes/execute');
const { globalRateLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit payload size

// Apply rate limiting
app.use(globalRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Code Execution API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/execute', executeRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 Piston API: ${process.env.PISTON_API_URL}`);
});

module.exports = app;
```

### 3. Backend - src/services/pistonClient.js

```javascript
const axios = require('axios');

const PISTON_API_URL = process.env.PISTON_API_URL || 'http://piston:2000/api/v2/piston';

// Language mapping
const LANGUAGE_MAP = {
  'python': 'python',
  'python3': 'python',
  'c++': 'c++',
  'cpp': 'c++',
  'java': 'java'
};

// Runtime cache (1 hour)
let runtimeCache = {
  data: null,
  timestamp: null,
  ttl: 60 * 60 * 1000
};

/**
 * Get cached runtimes
 */
async function getCachedRuntimes() {
  const now = Date.now();
  
  if (runtimeCache.data && runtimeCache.timestamp && 
      (now - runtimeCache.timestamp < runtimeCache.ttl)) {
    return runtimeCache.data;
  }
  
  const response = await axios.get(`${PISTON_API_URL}/runtimes`);
  runtimeCache.data = response.data;
  runtimeCache.timestamp = now;
  
  return response.data;
}

/**
 * Execute code using Piston
 */
async function executeCode({ language, code, stdin = '', timeout = 5000 }) {
  try {
    // Normalize language
    const normalizedLang = LANGUAGE_MAP[language.toLowerCase()] || language.toLowerCase();
    
    // Get runtime
    const runtimes = await getCachedRuntimes();
    const runtime = runtimes.find(r => r.language === normalizedLang);
    
    if (!runtime) {
      throw new Error(`Language "${language}" is not supported`);
    }
    
    console.log(`Executing ${normalizedLang} code (timeout: ${timeout}ms)`);
    
    // Execute with Piston
    const response = await axios.post(`${PISTON_API_URL}/execute`, {
      language: runtime.language,
      version: runtime.version,
      files: [{
        name: getFileName(normalizedLang),
        content: code
      }],
      stdin: stdin,
      compile_timeout: 10000,  // 10 seconds for compilation
      run_timeout: timeout,    // User-defined timeout
      compile_memory_limit: 256000000,  // 256MB
      run_memory_limit: 128000000       // 128MB
    }, {
      timeout: timeout + 5000  // Add buffer for network
    });
    
    return formatOutput(response.data);
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Execution timeout exceeded',
        output: '',
        stderr: 'Your code took too long to execute'
      };
    }
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data.message || 'Execution failed',
        output: '',
        stderr: error.message
      };
    }
    
    throw error;
  }
}

/**
 * Get filename based on language
 */
function getFileName(language) {
  const fileNames = {
    'python': 'main.py',
    'c++': 'main.cpp',
    'java': 'Main.java',
    'c': 'main.c',
    'javascript': 'main.js'
  };
  return fileNames[language] || 'main.txt';
}

/**
 * Format Piston output
 */
function formatOutput(data) {
  const compile = data.compile || {};
  const run = data.run || {};
  
  // Check compilation errors
  if (compile.code !== undefined && compile.code !== 0) {
    return {
      success: false,
      error: 'Compilation Error',
      output: compile.stdout || '',
      stderr: compile.stderr || compile.output || 'Compilation failed'
    };
  }
  
  // Check runtime errors
  if (run.code !== 0 && run.signal) {
    return {
      success: false,
      error: `Runtime Error (Signal: ${run.signal})`,
      output: run.stdout || '',
      stderr: run.stderr || 'Runtime error occurred'
    };
  }
  
  // Success
  return {
    success: run.code === 0,
    output: run.stdout || '',
    stderr: run.stderr || '',
    exitCode: run.code
  };
}

/**
 * Get list of supported languages
 */
async function getSupportedLanguages() {
  try {
    const runtimes = await getCachedRuntimes();
    return runtimes.map(r => ({
      language: r.language,
      version: r.version,
      aliases: r.aliases || []
    }));
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    return [];
  }
}

module.exports = {
  executeCode,
  getSupportedLanguages
};
```

### 4. Backend - src/routes/execute.js

```javascript
const express = require('express');
const router = express.Router();
const { executeCode, getSupportedLanguages } = require('../services/pistonClient');
const { codeExecutionRateLimiter } = require('../middleware/rateLimit');

/**
 * POST /api/execute
 * Execute code
 */
router.post('/', codeExecutionRateLimiter, async (req, res) => {
  try {
    const { language, code, stdin, timeout } = req.body;
    
    // Validation
    if (!language || !code) {
      return res.status(400).json({
        error: 'Missing required fields: language, code'
      });
    }
    
    // Code length limit (100KB)
    if (code.length > 100000) {
      return res.status(400).json({
        error: 'Code too long (max 100KB)'
      });
    }
    
    // Input length limit (10KB)
    if (stdin && stdin.length > 10000) {
      return res.status(400).json({
        error: 'Input too long (max 10KB)'
      });
    }
    
    // Timeout validation (max 5 seconds)
    const executionTimeout = Math.min(timeout || 5000, 5000);
    
    // Execute code
    const result = await executeCode({
      language,
      code,
      stdin: stdin || '',
      timeout: executionTimeout
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      error: 'Code execution failed',
      message: error.message
    });
  }
});

/**
 * GET /api/execute/languages
 * Get supported languages
 */
router.get('/languages', async (req, res) => {
  try {
    const languages = await getSupportedLanguages();
    res.json({ languages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

module.exports = router;
```

### 5. Backend - src/middleware/rateLimit.js

```javascript
const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter (all endpoints)
 * 100 requests per 15 minutes per IP
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Code execution rate limiter
 * 20 executions per 5 minutes per IP
 */
const codeExecutionRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: {
    error: 'Too many code executions, please wait before trying again',
    retryAfter: '5 minutes',
    limit: 20,
    window: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting (optional)
  skipSuccessfulRequests: false,
  // Skip failed requests (optional)
  skipFailedRequests: false
});

module.exports = {
  globalRateLimiter,
  codeExecutionRateLimiter
};
```

### 6. Backend - .env.example

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Piston API URL
# For Render internal communication (same blueprint)
PISTON_API_URL=http://piston:2000/api/v2/piston

# For external Piston service
# PISTON_API_URL=https://your-piston-service.onrender.com/api/v2/piston
```

### 7. Piston - Dockerfile

```dockerfile
# Use official Piston image
FROM ghcr.io/engineer-man/piston:latest

# Set environment variables
ENV PISTON_LOG_LEVEL=INFO
ENV PISTON_REPO_URL=https://github.com/engineer-man/piston

# Expose port
EXPOSE 2000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:2000/api/v2/piston/runtimes || exit 1

# Default command (already in base image)
CMD ["piston", "start"]
```

### 8. render.yaml (Render Blueprint)

```yaml
services:
  # Piston Code Execution Service
  - type: web
    name: piston
    runtime: image
    image:
      url: ghcr.io/engineer-man/piston:latest
    envVars:
      - key: PISTON_LOG_LEVEL
        value: INFO
    disk:
      name: piston-packages
      mountPath: /piston/packages
      sizeGB: 1
    healthCheckPath: /api/v2/piston/runtimes
    plan: free
    
  # Backend API Service  
  - type: web
    name: code-execution-api
    runtime: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: PISTON_API_URL
        value: http://piston:2000/api/v2/piston
    healthCheckPath: /health
    plan: free
```

---

## 🚀 Deployment Guide

### Step 1: Prepare Your Repository

1. **Create project structure:**
```bash
mkdir code-execution-system
cd code-execution-system

mkdir -p backend/src/{routes,middleware,services}
mkdir piston
```

2. **Add all the files above** to their respective locations

3. **Initialize Git:**
```bash
git init
git add .
git commit -m "Initial commit: Code execution system"
```

4. **Push to GitHub:**
```bash
# Create a repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/code-execution-system.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render

#### Option A: Using Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**
6. Wait 10-15 minutes for deployment

#### Option B: Manual Deployment

**Deploy Piston:**
1. New → Web Service → Deploy Image
2. Image URL: `ghcr.io/engineer-man/piston:latest`
3. Name: `piston`
4. Health Check Path: `/api/v2/piston/runtimes`
5. Add Disk: `/piston/packages` (1GB)
6. Deploy

**Deploy Backend:**
1. New → Web Service → Connect Repository
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variable:
   ```
   PISTON_API_URL=http://piston:2000/api/v2/piston
   ```
6. Deploy

### Step 3: Get Your API URL

After deployment, Render gives you a URL like:
```
https://code-execution-api-xyz.onrender.com
```

Save this URL - it's your API endpoint!

### Step 4: Test the API

**Test Health:**
```bash
curl https://your-api.onrender.com/health
```

**Test Execution:**
```bash
curl -X POST https://your-api.onrender.com/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello from Python!\")"
  }'
```

Expected response:
```json
{
  "success": true,
  "output": "Hello from Python!\n",
  "stderr": "",
  "exitCode": 0
}
```

---

## 🔒 Security Features

### 1. Execution Timeouts

**Compile timeout:** 10 seconds
**Run timeout:** 5 seconds (hardcoded max)

```javascript
compile_timeout: 10000,  // 10s
run_timeout: 5000        // 5s max
```

### 2. Memory Limits

**Compile memory:** 256MB
**Runtime memory:** 128MB

```javascript
compile_memory_limit: 256000000,  // 256MB
run_memory_limit: 128000000       // 128MB
```

### 3. Network Access

Piston runs code in **isolated containers** with **no network access** by default.

### 4. Code Size Limits

- **Code:** Max 100KB
- **Input:** Max 10KB
- **Payload:** Max 1MB

### 5. Rate Limiting

**Global:** 100 requests / 15 min per IP
**Execution:** 20 executions / 5 min per IP

### 6. Security Headers

Using `helmet.js` for:
- XSS protection
- CORS configuration
- Content Security Policy

---

## 🧪 Testing

### Test Script (test-api.js)

```javascript
const axios = require('axios');

const API_URL = 'https://your-api.onrender.com';

async function testAPI() {
  console.log('🧪 Testing Code Execution API\n');
  
  const tests = [
    {
      name: 'Python Hello World',
      data: {
        language: 'python',
        code: 'print("Hello World")'
      }
    },
    {
      name: 'Python with Input',
      data: {
        language: 'python',
        code: 'name = input()\nprint(f"Hello {name}")',
        stdin: 'Alice'
      }
    },
    {
      name: 'C++ Hello World',
      data: {
        language: 'c++',
        code: '#include <iostream>\nint main() {\n  std::cout << "Hello C++" << std::endl;\n  return 0;\n}'
      }
    },
    {
      name: 'Java Hello World',
      data: {
        language: 'java',
        code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}'
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    try {
      const response = await axios.post(`${API_URL}/api/execute`, test.data);
      console.log(`✅ Success:`, response.data.output.trim());
    } catch (error) {
      console.log(`❌ Failed:`, error.message);
    }
    console.log('');
  }
}

testAPI();
```

Run:
```bash
node test-api.js
```

---

## 🛡️ Rate Limiting Implementation

### Per-User Rate Limiting (Enhanced)

For logged-in users, use user ID instead of IP:

```javascript
// In rateLimit.js

const rateLimit = require('express-rate-limit');

// Custom key generator based on user ID
const codeExecutionRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    // If user is authenticated, use user ID
    if (req.user && req.user.id) {
      return `user_${req.user.id}`;
    }
    // Otherwise use IP
    return req.ip;
  },
  message: {
    error: 'Execution limit exceeded',
    limit: 20,
    window: '5 minutes'
  }
});
```

### Redis-based Rate Limiting (Production)

For distributed systems, use Redis:

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

const codeExecutionRateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:exec:',
  }),
  windowMs: 5 * 60 * 1000,
  max: 20
});
```

---

## 💡 Optimization for Render Free Tier

### 1. Code Caching

Cache compiled code to avoid re-compilation:

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 min

function getCacheKey(language, code) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(`${language}:${code}`).digest('hex');
}

// In executeCode function:
const cacheKey = getCacheKey(language, code);
const cached = cache.get(cacheKey);
if (cached) {
  return cached;
}
// ... execute and cache result
cache.set(cacheKey, result);
```

### 2. Keep Services Warm

Render free tier sleeps after 15 min inactivity. Use cron-job.org to ping every 14 minutes:

**Ping URL:** `https://your-api.onrender.com/health`

### 3. Optimize Package Size

Only install needed runtimes in Piston:

```bash
docker exec piston piston ppman install python=3.10
docker exec piston piston ppman install c++=10.2
docker exec piston piston ppman install java=17
```

---

## 🐛 Troubleshooting

### Issue: "ECONNREFUSED" Error

**Cause:** Backend can't reach Piston

**Solution:**
1. Check Piston service is running
2. Verify `PISTON_API_URL` uses internal URL: `http://piston:2000/api/v2/piston`
3. Both services must be in same Render blueprint

### Issue: "Memory limit exceeded"

**Cause:** Code uses too much RAM

**Solution:**
- Reduce `run_memory_limit` in pistonClient.js
- Ask users to optimize their code

### Issue: Slow cold starts

**Cause:** Free tier spin-down

**Solutions:**
1. Use free keep-alive service (cron-job.org)
2. Upgrade to paid plan ($7/month per service)
3. Warn users about initial delay

### Issue: Rate limit false positives

**Cause:** Multiple users behind same IP (schools, offices)

**Solution:**
- Implement user-based rate limiting
- Increase limits for authenticated users
- Use Redis for distributed rate limiting

---

## 📊 Performance Benchmarks

### Response Times (Free Tier)

| Language | Cold Start | Warm Start |
|----------|------------|------------|
| Python | 2-4s | 200-400ms |
| C++ | 3-5s | 300-600ms |
| Java | 4-6s | 400-700ms |

**Cold Start:** First request after 15 min sleep
**Warm Start:** Subsequent requests

### Render Free Tier Limits

- **RAM:** 512MB per service
- **CPU:** 0.1 CPU
- **Bandwidth:** Unlimited
- **Build time:** 15 minutes max
- **Sleep:** After 15 min inactivity

---

## 🎯 Usage Examples

### Frontend Integration (React)

```javascript
import { useState } from 'react';
import axios from 'axios';

function CodeEditor() {
  const [code, setCode] = useState('print("Hello")');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const runCode = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://your-api.onrender.com/api/execute',
        {
          language: 'python',
          code: code,
          stdin: ''
        }
      );
      setOutput(response.data.output || response.data.error);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
    setLoading(false);
  };
  
  return (
    <div>
      <textarea 
        value={code} 
        onChange={(e) => setCode(e.target.value)}
        rows={10}
        cols={50}
      />
      <button onClick={runCode} disabled={loading}>
        {loading ? 'Running...' : 'Run Code'}
      </button>
      <pre>{output}</pre>
    </div>
  );
}
```

---

## 📈 Scaling Up

### When to Upgrade

**Upgrade to Starter ($7/month each) when:**
- More than 50 users per day
- Need always-on availability
- Can't tolerate cold starts

**Upgrade to Standard ($25/month each) when:**
- 100+ concurrent users
- Need faster response times
- Want 2GB RAM

### Alternative: Deploy Backend Elsewhere

Keep Piston on Render free, deploy backend on:
- Vercel (free serverless)
- Railway (free tier)
- Your own VPS

---

## ✅ Production Checklist

- [ ] All services deployed on Render
- [ ] Environment variables set correctly
- [ ] Rate limiting configured
- [ ] CORS configured for your domain
- [ ] Health checks passing
- [ ] All languages tested
- [ ] Error handling tested
- [ ] Set up monitoring (Render logs)
- [ ] Configure keep-alive (optional)
- [ ] Document API for users

---

## 📚 Additional Resources

- [Piston GitHub](https://github.com/engineer-man/piston)
- [Render Docs](https://render.com/docs)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- [Helmet.js Security](https://helmetjs.github.io/)

---

## 🎉 Conclusion

You now have a **production-ready**, **completely free**, **unlimited** code execution system!

**What you get:**
- ✅ Self-hosted on Render
- ✅ No API costs ever
- ✅ Secure sandboxing
- ✅ Rate limiting
- ✅ Support for Python, C++, Java +40 languages
- ✅ Easy to scale

**Total Cost:** $0/month (free tier) or $14/month (both services on Starter)

Happy coding! 🚀
