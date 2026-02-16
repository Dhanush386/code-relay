# Deploy Piston on Render - Step-by-Step Guide

## 🎯 Goal
Deploy Piston API on Render to get unlimited code execution for your CodeExam platform.

---

## 📝 Step-by-Step Instructions

### Step 1: Go to Render Dashboard

1. Open your browser
2. Go to: **https://dashboard.render.com/**
3. Sign in with your account

---

### Step 2: Create New Web Service

1. Click the **"New +"** button (top right)
2. Select **"Web Service"**

---

### Step 3: Choose Deployment Method

1. Select **"Deploy an existing image from a registry"**

---

### Step 4: Configure Piston Service

Fill in the following details:

**Image URL:**
```
ghcr.io/engineer-man/piston:latest
```

**Service Details:**
- **Name:** `piston-api` (or any name you prefer)
- **Region:** Choose closest to you (e.g., Oregon USA, Frankfurt Europe, Singapore Asia)

**Instance Type:**
- **Plan:** Select **"Free"** (for now, can upgrade later)

**Advanced Settings:**
- **Health Check Path:** `/api/v2/piston/runtimes`
- **Port:** Leave as default (Render auto-detects)

---

### Step 5: Add Persistent Disk (Optional but Recommended)

1. Scroll down to **"Disk"** section
2. Click **"Add Disk"**
3. Enter:
   - **Name:** `piston-packages`
   - **Mount Path:** `/piston/packages`
   - **Size:** `1 GB` (minimum)
4. Click **"Save"**

**Why?** This stores language runtimes so they don't re-download on every restart.

---

### Step 6: Review and Deploy

1. Review all settings
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes)

You'll see logs showing:
```
Pulling image...
Starting container...
Health check passed ✓
Service is live!
```

---

### Step 7: Get Your Piston URL

Once deployed, Render shows your service URL at the top:

```
https://piston-api-XXXXX.onrender.com
```

**Copy this URL!** You'll need it for the next step.

---

### Step 8: Test Piston API

Open in browser or use curl:

```
https://your-piston-api.onrender.com/api/v2/piston/runtimes
```

You should see JSON with available languages. ✅

---

### Step 9: Update Your Backend on Render

1. Go back to Render Dashboard
2. Find your **backend service** (code-relay or similar)
3. Click on it
4. Go to **"Environment"** tab
5. Click **"Add Environment Variable"**
6. Add:
   - **Key:** `PISTON_API_URL`
   - **Value:** `https://your-piston-api.onrender.com/api/v2/piston`
   
   Replace `your-piston-api` with your actual Piston service URL from Step 7

7. Click **"Save Changes"**

**Important:** This triggers an automatic redeployment of your backend!

---

### Step 10: Wait for Backend to Redeploy

1. Your backend will redeploy automatically (2-3 minutes)
2. Watch the logs until you see: `Server running on port 5000` ✅
3. Your backend now connects to your own Piston instance!

---

### Step 11: Test It Works!

**Option A: Use your app**
1. Go to your CodeExam frontend
2. Login as organizer
3. Try running some code
4. It should work without any rate limits! 🎉

**Option B: Use the test script**
```bash
cd backend
set PISTON_API_URL=https://your-piston-api.onrender.com/api/v2/piston
node test_piston.js
```

---

## ✅ You're Done!

Your setup now looks like:

```
Frontend (Vercel)
    ↓
Backend (Render) ──→ Piston API (Render) ──→ ∞ Code Execution
    ↓
Database (Supabase)
```

**Benefits:**
- ✅ Unlimited code execution
- ✅ No rate limits
- ✅ Faster than public API
- ✅ Completely free (on free tier)

---

## 🐛 Troubleshooting

### Issue: "Deploy failed"
- Check image URL is exactly: `ghcr.io/engineer-man/piston:latest`
- Try deploying again

### Issue: Backend can't connect to Piston
- Verify `PISTON_API_URL` is correct
- Make sure it includes `/api/v2/piston` at the end
- Check both services are deployed and "Live"

### Issue: Slow first execution
- **Normal!** Free tier spins down after 15 minutes
- First request after sleep takes ~30-60 seconds
- Subsequent requests are fast
- **Solution:** Upgrade to Starter plan ($7/month) for always-on

---

## 💰 Cost

**Current (Both Free):** $0/month
- May have cold starts (30-60s) after inactivity

**Recommended (Both Starter):** $14/month
- Always on, no cold starts
- Better for active exams

**When to upgrade:**
- Before hosting live exams
- When you have 50+ daily users
- When cold starts become annoying

---

## 📞 Need Help?

If something goes wrong:
1. Check Render logs (click service → "Logs" tab)
2. Test Piston directly in browser
3. Verify environment variables are set correctly

---

## 🎉 Congratulations!

You now have a self-hosted, unlimited code execution system!

No more Judge0, no more RapidAPI, no more rate limits! 🚀
