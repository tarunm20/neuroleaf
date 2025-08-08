# Production Deployment Guide for Neuroleaf

## Pre-Deployment Checklist

### 1. Stripe Configuration (Required)
1. **Create Production Stripe Products**:
   - Go to Stripe Dashboard → Products
   - Create "Neuroleaf Pro" product
   - Set monthly price to $9.99 USD
   - Copy the price ID for environment variables

2. **Configure Stripe Webhooks**:
   - Go to Stripe Dashboard → Webhooks
   - Create endpoint pointing to your production domain: `https://yourapp.railway.app/api/stripe/webhook`
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy webhook secret for environment variables

### 2. Supabase Production Setup (Required)
1. **Create Production Project**:
   - Go to Supabase Dashboard → New Project
   - Note the project URL and anon key

2. **Run Database Migrations**:
   ```bash
   # Link to production project
   pnpm --filter web supabase link --project-ref YOUR_PROJECT_REF
   
   # Push migrations
   pnpm --filter web supabase db push
   ```

3. **Set up Authentication**:
   - Configure auth providers as needed
   - Set up email templates in Supabase Auth settings
   - Configure redirect URLs for production domain

### 3. AI Integration Setup (Optional)
1. **Get Gemini API Key**:
   - Go to Google AI Studio
   - Generate API key
   - Add to environment variables

## Railway Deployment

### 1. Railway Configuration
1. **Create Railway Project**:
   - Go to railway.app
   - Create new project from GitHub repo
   - Connect your Neuroleaf repository

2. **Build Configuration** (railway.toml):
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "pnpm run build"
   
   [deploy]
   startCommand = "pnpm start"
   restartPolicyType = "on_failure"
   restartPolicyMaxRetries = 10
   
   [env]
   NODE_ENV = "production"
   ```

### 2. Environment Variables Setup

Set these environment variables in Railway dashboard:

#### Required - Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Required - Stripe (Production Keys)
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Required - App Configuration
```bash
NEXT_PUBLIC_SITE_URL=https://yourapp.railway.app
NODE_ENV=production
```

#### Optional - AI Features
```bash
GEMINI_API_KEY=your-gemini-key
```

### 3. Domain Setup (Optional)
1. **Custom Domain**:
   - Go to Railway dashboard → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed
   - Update `NEXT_PUBLIC_SITE_URL` environment variable

2. **SSL Certificate**:
   - Railway automatically provides SSL certificates
   - Verify HTTPS is working after domain setup

## Post-Deployment Testing

### 1. Core Functionality
- [ ] User registration and login
- [ ] Deck creation and management
- [ ] Flashcard creation (manual)
- [ ] Basic study mode

### 2. Pro Features
- [ ] File upload (PDF, DOCX, TXT)
- [ ] AI test mode access
- [ ] Unlimited deck creation

### 3. Billing Flow
- [ ] Stripe checkout process
- [ ] Webhook handling for subscription updates
- [ ] User dashboard shows subscription status
- [ ] Subscription limits enforced correctly

### 4. Performance & Security
- [ ] Page load times < 3 seconds
- [ ] Database queries optimized
- [ ] Environment variables secure
- [ ] Error handling working

## Monitoring & Maintenance

### 1. Error Monitoring
- Check Railway logs for errors
- Monitor Stripe dashboard for failed payments
- Review Supabase logs for database issues

### 2. Regular Tasks
- Monitor user growth and usage
- Review Stripe revenue reports
- Check for failed webhook deliveries
- Update dependencies regularly

## Rollback Plan
If deployment fails:
1. Use Railway's deployment rollback feature
2. Check environment variables are correct
3. Verify database migrations applied successfully
4. Test Stripe webhook endpoints
5. Check domain DNS configuration

## Support Resources
- **Railway**: railway.app/docs
- **Supabase**: supabase.com/docs  
- **Stripe**: stripe.com/docs
- **Next.js**: nextjs.org/docs

## Current Status: Ready for Production ✅
- [x] Stripe webhook integration completed
- [x] Premium tier removed, Pro tier configured for unlimited decks
- [x] Payment flow tested and working
- [x] Database schema optimized
- [x] Environment variables documented