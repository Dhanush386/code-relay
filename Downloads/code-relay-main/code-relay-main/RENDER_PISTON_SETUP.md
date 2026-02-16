# Deploying Piston on Render

## 🚀 Quick Setup

Deploy Piston as a separate service on Render alongside your backend for unlimited code execution.

---

## 📋 Prerequisites

- Render account ([render.com](https://render.com))
- GitHub repository with your code

---

## 🛠️ Deployment Steps

### Method 1: Using Render Dashboard (Recommended)

#### 1. Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Select **"Deploy an existing image from a registry"**

#### 2. Configure Piston Service

**Image URL:**
```
ghcr.io/engineer-man/piston:latest
```

**Service Name:**
```
piston-api
```

**Region:** Choose closest to your backend

**Instance Type:**
- Free tier: Use **Free** plan
- Production: Use **Starter** or higher ($7/month)

**Health Check Path:**
```
/api/v2/piston/runtimes
```

#### 3. Add Persistent Disk (Optional but Recommended)

- Click **"Add Disk"**
- **Name:** `piston-packages`
- **Mount Path:** `/piston/packages`
- **Size:** 10 GB (minimum)

This stores language packages so they don't need to be re-downloaded on restart.

#### 4. Environment Variables (Optional)

Add if needed:
```
PISTON_LOG_LEVEL=INFO
```

#### 5. Deploy

Click **"Create Web Service"** and wait for deployment (~5-10 minutes)

---

### Method 2: Using Blueprint File

#### 1. Add Blueprint to Repository

Already created: [render-piston.yaml](file:///c:/Users/dhanu/Downloads/code-relay-main/code-relay-main/render-piston.yaml)

#### 2. Deploy from Dashboard

1. Go to Render Dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Select `render-piston.yaml`
5. Click **"Apply"**

---

## 🔧 Configure Your Backend

### 1. Get Piston Service URL

After deployment, Render provides a URL like:
```
https://piston-api-abc123.onrender.com
```

### 2. Update Backend Environment Variable

In your **Backend Service** on Render:

**Environment Variables:**
```env
PISTON_API_URL=https://piston-api-abc123.onrender.com/api/v2/piston
```

Replace `piston-api-abc123` with your actual service name.

### 3. For Local Development

In `backend/.env`:
```env
# Use public API for local dev
PISTON_API_URL=https://emkc.org/api/v2/piston

# OR use your deployed Render instance
PISTON_API_URL=https://your-piston-service.onrender.com/api/v2/piston
```

---

## ✅ Verify Deployment

### Test Piston API

Visit in browser:
```
https://your-piston-service.onrender.com/api/v2/piston/runtimes
```

You should see JSON response with available languages.

### Test from Backend

The [test_piston.js](file:///c:/Users/dhanu/Downloads/code-relay-main/code-relay-main/backend/test_piston.js) script works with Render too:

```bash
# Set the URL
set PISTON_API_URL=https://your-piston-service.onrender.com/api/v2/piston

# Run test
node backend/test_piston.js
```

---

## 💰 Cost Comparison

| Plan | Cost | RAM | CPU | Use Case |
|------|------|-----|-----|----------|
| Free | $0/month | 512MB | 0.1 CPU | Testing, low traffic |
| Starter | $7/month | 512MB | 0.5 CPU | Small exams (<50 participants) |
| Standard | $25/month | 2GB | 1 CPU | Medium exams (<200 participants) |
| Pro | $85/month | 4GB | 2 CPU | Large exams (500+ participants) |

**Recommendation:**
- Development/Testing: **Free**
- Production (small): **Starter**
- Production (medium/large): **Standard** or **Pro**

---

## 🔄 Free Tier Limitations

**Render Free Tier:**
- ⏰ Spins down after 15 minutes of inactivity
- 🐌 Takes ~30-60 seconds to wake up
- 💾 Limited resources (512MB RAM, 0.1 CPU)

**For Active Exams:** Upgrade to Starter or higher to avoid spin-down delays.

**Workaround:** Keep-alive service (ping every 10 minutes) - but consider upgrading instead.

---

## 🎯 Production Setup

### Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Vercel)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│   Backend       │─────▶│   Piston API    │
│   (Render)      │      │   (Render)      │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Supabase)    │
└─────────────────┘
```

### Configuration

**Backend Environment Variables:**
```env
DATABASE_URL=postgresql://...
ORGANIZER_JWT_SECRET=your-secret
PARTICIPANT_JWT_SECRET=your-secret
PORT=5000
PISTON_API_URL=https://your-piston.onrender.com/api/v2/piston
```

**Frontend Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🐛 Troubleshooting

### Issue: Service Won't Start

**Check Logs:**
1. Go to Render Dashboard
2. Click on your Piston service
3. View **"Logs"** tab

**Common Issues:**
- Image pull failed: Check image URL is correct
- Port binding: Render auto-detects, no manual config needed

### Issue: Backend Can't Connect

**Check:**
1. Piston service is deployed and running
2. `PISTON_API_URL` is correct in backend environment
3. URL includes `/api/v2/piston` path
4. Health check passes: Visit `/api/v2/piston/runtimes`

### Issue: Slow Cold Starts

**Cause:** Free tier spins down after 15 minutes

**Solutions:**
1. Upgrade to Starter plan ($7/month)
2. Use public API for development
3. Implement keep-alive pings (not recommended)

### Issue: Language Not Found

**Install Packages:**

You can't directly exec into Render containers, but packages auto-install on first use.

**First execution** of a language will be slow (downloads runtime), subsequent executions are fast.

---

## 📊 Performance

### Response Times

| Setup | First Request | Subsequent | Spin-up (if asleep) |
|-------|--------------|------------|---------------------|
| Free tier | ~2-5s | ~200-500ms | ~30-60s |
| Starter+ | ~1-3s | ~100-300ms | N/A (always on) |
| Public API | ~500-2000ms | ~500-2000ms | N/A |

### Recommendations

- **Development:** Public API or Free Render
- **Production (small):** Starter plan
- **Production (large):** Standard/Pro plan

---

## 🔐 Security

**Piston on Render is secure:**
- ✅ Code runs in isolated containers
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Private networking available (Pro plan)

**Recommendations:**
- Use environment variables for sensitive data
- Enable private networking if available
- Monitor logs for unusual activity

---

## 📚 Next Steps

1. ✅ Deploy Piston on Render
2. ✅ Get service URL
3. ✅ Update backend `PISTON_API_URL` environment variable
4. ✅ Test with `node backend/test_piston.js`
5. ✅ Deploy backend with updated config
6. ✅ Verify code execution works in your app

---

## 🆘 Support

**Render Documentation:**
- [Docker Images](https://render.com/docs/deploy-an-image)
- [Persistent Disks](https://render.com/docs/disks)
- [Environment Variables](https://render.com/docs/configure-environment-variables)

**Piston:**
- [GitHub](https://github.com/engineer-man/piston)
- [API Docs](https://github.com/engineer-man/piston/blob/master/API.md)
