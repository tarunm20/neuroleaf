# Railway Deployment Guide - Neuroleaf

This guide provides step-by-step instructions for deploying Neuroleaf to Railway using the optimized 2025 configuration.

## Pre-deployment Setup

### 1. Environment Variables Required

Set these environment variables in your Railway project dashboard:

#### Core Application
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://neuroleaf.ai
NEXTAUTH_URL=https://neuroleaf.ai
NEXTAUTH_SECRET=your-secure-random-string-32-chars
```

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xjwjyocbysjivcpqpapr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

#### Stripe Configuration (Production)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RkXwIGKuCdCJW8jQaLzcS5CXExNKll9g76Yf8pq0OSw8cPUVBsoSn9jMzTxT4azadXk2pjEAQOIeqDH25du3o8W00oIvPWFKR
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_uOMvzhHECoxqtWtRem1nW0nQSsy3i8TJ
STRIPE_PRICE_ID=price_1RtbGGGKuCdCJW8j6GDMbAxV
```

#### AI Configuration
```bash
GEMINI_API_KEY=your-new-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
```

#### Feature Flags
```bash
NEXT_PUBLIC_ENABLE_THEME_TOGGLE=true
NEXT_PUBLIC_LANGUAGE_PRIORITY=application
NEXT_PUBLIC_ENABLE_PERSONAL_ACCOUNT_DELETION=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_PRODUCT_NAME=Neuroleaf
```

### 2. External Service Configuration

#### Supabase Settings
Update in Supabase Dashboard → Project Settings → Authentication:
- **Site URL**: `https://neuroleaf.ai`
- **Redirect URLs**: `https://neuroleaf.ai/auth/callback`

#### Stripe Webhook
Update webhook endpoint in Stripe Dashboard:
- **Endpoint URL**: `https://neuroleaf.ai/api/stripe/webhook`
- **Events**: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`

## Deployment Process

### Step 1: Connect Repository
1. Go to Railway dashboard
2. Create new project
3. Connect your GitHub repository
4. Select the main branch

### Step 2: Configure Service
1. Railway will auto-detect the monorepo structure
2. Verify the following configuration is detected:
   - **Root Directory**: `/` (monorepo root)
   - **Build Command**: `pnpm turbo build --filter=web`
   - **Start Command**: `cd apps/web && pnpm start`

### Step 3: Add Environment Variables
1. Go to Variables tab in your Railway service
2. Add all environment variables listed above
3. Generate secure values for:
   - `NEXTAUTH_SECRET`: Run `openssl rand -base64 32`
   - New `GEMINI_API_KEY`: Generate at https://makersuite.google.com/app/apikey

### Step 4: Configure Custom Domain
1. Go to Settings → Domains
2. Add `neuroleaf.ai`
3. Configure DNS:
   - Add CNAME record: `neuroleaf.ai` → `your-railway-domain.railway.app`
   - Or follow Railway's specific DNS instructions

### Step 5: Deploy
1. Push your code to the main branch
2. Railway will automatically deploy
3. Monitor deployment logs for any issues

## Configuration Files

### railway.toml
The optimized configuration uses:
- **Turborepo** for efficient monorepo builds
- **Smart watch patterns** for faster rebuilds
- **Production-optimized** environment settings

### turbo.json
Updated with:
- **Railway-compatible** environment variables
- **Loose environment mode** to prevent access issues
- **Production build optimizations**

## Monitoring & Troubleshooting

### Health Checks
- **Health Check Path**: `/`
- **Timeout**: 60 seconds
- **Restart Policy**: On failure (max 3 retries)

### Common Issues

1. **Build Failures**:
   - Check that all environment variables are set
   - Verify Supabase connection strings
   - Ensure Gemini API key is valid

2. **Authentication Issues**:
   - Verify `NEXTAUTH_SECRET` is set
   - Check Supabase redirect URLs match domain
   - Confirm `NEXTAUTH_URL` matches deployment URL

3. **Stripe Issues**:
   - Update webhook URL after domain configuration
   - Verify all Stripe keys are production keys
   - Check webhook secret matches Stripe dashboard

4. **Database Connection**:
   - Confirm production Supabase migration is complete
   - Verify service role key has proper permissions
   - Test database connectivity in Railway logs

### Performance Optimization
- **Turborepo Caching**: Automatic build optimization
- **Next.js Production**: Optimized builds and static generation
- **CDN**: Railway provides automatic CDN for static assets

## Production Checklist

- [ ] All environment variables configured
- [ ] Custom domain `neuroleaf.ai` configured
- [ ] Supabase migration deployed to production
- [ ] Stripe webhook updated with production URL
- [ ] Authentication flow tested end-to-end
- [ ] Payment flow tested with Stripe
- [ ] AI features tested with Gemini API
- [ ] Performance and error monitoring set up

## Support

For deployment issues:
1. Check Railway deployment logs
2. Verify all environment variables are set correctly  
3. Test individual services (Supabase, Stripe, Gemini) separately
4. Check network connectivity and DNS resolution

The deployment should be production-ready with this configuration, optimized for performance and reliability.