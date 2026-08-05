# 🚀 Setup Guide - Traffic Laws Q&A App

## Quick Setup (3 Minutes)

Your app needs one thing to work: **Gemini API Key**

The app has a built-in setup wizard to guide you! Just follow these steps:

### Step 1: 🔑 Get Your Free Gemini API Key

1. Go to: **https://aistudio.google.com/app/apikey**
2. Click the big **"Create API key"** button
3. Choose "Create API key in new Google Cloud project"
4. **Copy your key** (starts with `AIza...`)
5. Save it somewhere safe temporarily

**That's it!** Your key is ready. Costs: **FREE** ✅

### Step 2: ⚙️ Add Key to Vercel

1. Go to: **https://vercel.com/dashboard**
2. Click your **"traffic-qa-app"** project
3. Go to: **Settings → Environment Variables**
4. Click **"Add New"**
5. Fill in:
   - Name: `GEMINI_API_KEY`
   - Value: Paste your key from Step 1
   - Environments: Check all three (Production, Preview, Development)
6. Click **Save**

**Done!** Vercel saves it securely. ✅

### Step 3: 🚀 Redeploy

1. Go back to **Deployments** tab
2. Find the latest deployment
3. Click the **three dots** (⋯) next to it
4. Click **"Redeploy"**
5. Wait 2-3 minutes for deployment
6. **You're live!** 🎉

## ❓ Frequently Asked Questions

### "Is Gemini API really free?"
Yes! Free tier includes:
- 60 requests/minute
- Unlimited API calls
- No credit card needed initially
- More than enough for this app

### "What if I already have a Gemini API key?"
Just paste it in Vercel! If you don't have one, Step 1 takes 30 seconds.

### "Can I share my API key?"
**NO!** Keep it private. Only add it to Vercel's private environment variables. Never share the key itself.

### "Why does it need an API key?"
The app uses Gemini to:
- Grade your answers intelligently
- Provide smart feedback
- Generate embedings for document search

### "What if redeploy fails?"
- Wait a few seconds, try again
- Check that Vercel saved the environment variable
- Check Vercel's deployment logs

### "How do I know it's working?"
After redeploy:
1. Visit your app
2. Try answering a question
3. If it works, you're done! ✅
4. If it shows error, check the setup page (/setup)

## 🆘 Troubleshooting

### Error: "Missing GEMINI_API_KEY"
**Fix:**
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Make sure `GEMINI_API_KEY` is added
4. Click Redeploy

### Error: "Gemini API error"
**Causes & Fixes:**
- Invalid API key → Check it's copied correctly
- Quota exceeded → Wait 1 minute (free tier limit)
- Billing issue → Check Google Cloud billing is enabled

### Can't see the Setup page?
- Visit: `https://your-app-url.vercel.app/setup`
- Should show beautiful step-by-step guide
- Click each step to expand it

### Everything looks slow
- Check your Gemini API quota on Google Cloud Console
- First answer takes longer (embeddings)
- Normal: 3-7 seconds per answer

## ✅ Checklist

After setup, verify:
- [ ] You got the Gemini API key
- [ ] Added to Vercel Environment Variables
- [ ] Redeployed the app
- [ ] App loads without errors
- [ ] Can answer a test question
- [ ] Get feedback within 7 seconds
- [ ] Answer saved to database

## 🎯 What You Can Do Now

Your app can:
✅ Ask traffic law questions
✅ Answer with your own response
✅ Get instant AI grading
✅ See detailed feedback
✅ Voice input (on Chrome/Safari)
✅ Chat with AI assistant
✅ Download materials as PDF
✅ Admin panel for management

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
- **Time:** 5 minutes
- **Cost:** Free tier available
- **Setup:** Connect GitHub repo
- **Just add:** Gemini API key

### Option 2: Self-hosted
- Deploy anywhere (AWS, GCP, DigitalOcean)
- Same setup process
- Just add env vars to your server

## 📞 Need Help?

1. **Check Setup Page:** `/setup` has interactive guide
2. **Read Diagnostics:** See `VERCEL_DIAGNOSTICS.md`
3. **Check Logs:** Vercel Dashboard → Deployments → Logs
4. **Debug Endpoint:** `/api/debug/health` shows status

## 🎓 What's Next?

Once set up:
1. **Add RAG Documents:** Upload study materials in admin panel
2. **Invite Users:** Share the link
3. **Monitor:** Check admin panel for student progress
4. **Improve:** Answer quality improves as you add more materials

## 🔐 Security Notes

- Never commit API keys to GitHub
- Never share keys in messages/emails
- Vercel encrypts keys automatically
- Keys are server-side only (hidden from users)
- No data is logged or sold

## 💡 Pro Tips

- First deployment: Add Gemini key, redeploy once
- Voice works best in Chrome/Edge/Safari
- Add Hebrew materials for better grading
- Bookmark `/setup` page for future reference
- Check `/api/debug/health` if things act weird

---

**You've got this!** 🎉 The setup wizard makes it super easy. Just follow the 3 steps and you're done!
