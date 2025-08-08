# 🚀 Production Deployment Checklist (Minimum Viable)

## ✅ Prerequisites Completed
- [x] Payment flow working locally
- [x] Stripe webhooks implemented
- [x] Database schema ready
- [x] Railway configuration created

## Step 1: Stripe Production Setup (30 minutes)

### 1.1 Create Production Product
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to "Live mode" (toggle in sidebar)
3. Go to Products → Add Product
   - Name: `Neuroleaf Pro`
   - Description: `AI-powered flashcard learning with unlimited decks`
   - Price: `$9.99 USD` recurring monthly
4. **Copy the Price ID** (starts with `price_...`)

### 1.2 Set Up Production Webhook
1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-app-name.up.railway.app/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy the Webhook Secret** (starts with `whsec_...`)

## Step 2: Supabase Production Setup (15 minutes)

### 2.1 Create Production Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create New Project
   - Name: `neuroleaf-production`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
3. **Copy Project URL and Anon Key** from Settings → API

### 2.2 Push Database Schema
```bash
# In your local terminal
cd apps/web
pnpm supabase link --project-ref YOUR_PROJECT_REF
pnpm supabase db push
```

## Step 3: Railway Deployment (30 minutes)

### 3.1 Create Railway Project
1. Go to [Railway](https://railway.app)
2. Create new project from GitHub
3. Connect your neuroleaf repository
4. Select the root directory (not apps/web)

### 3.2 Set Environment Variables
In Railway dashboard, go to Variables and add:

**Required - Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Required - Stripe (LIVE KEYS):**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Required - App Config:**
```
NEXT_PUBLIC_SITE_URL=https://your-app-name.up.railway.app
NODE_ENV=production
```

**Optional - AI (for AI features):**
```
GEMINI_API_KEY=your-gemini-key
```

### 3.3 Deploy
1. Railway will auto-deploy after setting variables
2. Wait for build to complete (~5-10 minutes)
3. Note your app URL: `https://your-app-name.up.railway.app`

### 3.4 Update Stripe Webhook URL
1. Go back to Stripe → Webhooks
2. Edit your webhook endpoint URL to match your actual Railway URL
3. Save changes

## Step 4: Production Testing (15 minutes)

### 4.1 Smoke Test Checklist
Visit your production URL and test:

- [ ] **Homepage loads** without errors
- [ ] **Sign up flow** works (create test account)
- [ ] **Create a deck** and add flashcards
- [ ] **Pricing page** displays correctly
- [ ] **Subscribe to Pro** button works (don't complete payment)
- [ ] **Check logs** in Railway dashboard for errors

### 4.2 Test Real Payment (Optional)
1. Complete a real Stripe subscription
2. Verify webhook updates user tier in database
3. Confirm Pro features are unlocked
4. Cancel subscription to test downgrade

## Step 5: Domain Setup (Optional - 15 minutes)

If you have a custom domain:
1. Railway dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. Update `NEXT_PUBLIC_SITE_URL` environment variable

## 🎉 You're Live!

**Your production checklist:**
- ✅ Stripe products created
- ✅ Webhooks configured  
- ✅ Supabase production database
- ✅ Railway deployment
- ✅ Environment variables set
- ✅ Basic functionality tested

**Post-Launch Monitoring:**
- Check Railway logs daily for first week
- Monitor Stripe dashboard for payments
- Watch Supabase for database growth
- Set up billing alerts for all services

**Next Steps (Not Required for Launch):**
- Set up proper error monitoring (Sentry)
- Add analytics (PostHog/Google Analytics)
- Implement automated backups
- Add custom domain
- Set up email notifications for payments

## Emergency Contacts
- **Railway Support**: help@railway.app
- **Stripe Support**: Via dashboard chat
- **Supabase Support**: Via dashboard support

---
**Estimated Total Time: 1.5-2 hours**
**Cost: $0 setup, ~$25-50/month running costs initially**