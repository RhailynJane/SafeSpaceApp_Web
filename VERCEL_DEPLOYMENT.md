# Vercel Deployment Guide for SafeSpace Web App

## Prerequisites
1. GitHub account
2. Vercel account (sign up at https://vercel.com)
3. All required environment variables

## Environment Variables Required

You'll need to set these in Vercel Dashboard → Project Settings → Environment Variables:

### Database
- `DATABASE_URL` - PostgreSQL connection string (e.g., from Vercel Postgres, Supabase, or Neon)

### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`
- `CLERK_WEBHOOK_SECRET`

### Convex (Real-time backend)
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

### Sendbird (Chat)
- `NEXT_PUBLIC_SENDBIRD_APP_ID`
- `SENDBIRD_API_TOKEN`

### Agora (Video calls)
- `NEXT_PUBLIC_AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

### Email (SendGrid)
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

### Optional Services
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```powershell
   git add .
   git commit -m "Add Vercel configuration"
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `SafeSpaceApp_Web` repository
   - Vercel will auto-detect Next.js

3. **Configure project**
   - Root Directory: Leave blank (or set to `SafeSpaceApp_Web` if monorepo)
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**
   - In the deployment settings, add all required environment variables listed above
   - Copy from your local `.env.local` or secure vault

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-5 minutes)

6. **Database Setup**
   - After first deployment, run migrations:
   - Go to Vercel → Project → Settings → Functions
   - Use Vercel CLI or connect to your database directly to run Prisma migrations

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```powershell
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```powershell
   vercel login
   ```

3. **Deploy from project directory**
   ```powershell
   cd c:\safespace-integration\SafeSpaceApp_Web
   vercel
   ```

4. **Follow prompts**
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No
   - Project name: safespace-web (or your choice)
   - Directory: ./ (current)
   - Override settings: No

5. **Add environment variables**
   ```powershell
   vercel env add DATABASE_URL
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   # ... add all required env vars
   ```

6. **Deploy to production**
   ```powershell
   vercel --prod
   ```

## Post-Deployment Checklist

### 1. Database Migration
Run Prisma migrations on your production database:
```powershell
# Set DATABASE_URL to production
npx prisma migrate deploy
npx prisma generate
```

### 2. Verify Clerk Configuration
- Add your Vercel domain to Clerk Dashboard → Domains
- Example: `your-app.vercel.app`

### 3. Update Convex Configuration
- Add your Vercel domain to Convex Dashboard → Settings → Allowed Origins
- Deploy Convex functions: `npx convex deploy`

### 4. Configure Sendbird
- Add your Vercel domain to Sendbird Dashboard → Settings → Security

### 5. Test Core Features
- [ ] User authentication (sign up/sign in)
- [ ] Database reads/writes
- [ ] Real-time features (Convex)
- [ ] Chat functionality (Sendbird)
- [ ] Video calls (Agora)
- [ ] Email notifications

## Important Notes

### Database Connection
- Vercel serverless functions have connection limits
- Use connection pooling (e.g., Prisma with Vercel Postgres)
- Consider PgBouncer for PostgreSQL

### Standalone Build
Your `next.config.mjs` has `output: 'standalone'` which is perfect for Vercel deployment - it optimizes bundle size.

### API Routes Timeout
Vercel Hobby: 10s timeout
Vercel Pro: 30s timeout (configured in vercel.json)

### Environment Variables
- Set separately for Production, Preview, and Development environments
- Never commit `.env` files to Git
- Use Vercel's environment variable encryption

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Common issues:
  - Missing environment variables
  - TypeScript errors
  - Dependency issues

### Runtime Errors
- Check Function logs in Vercel Dashboard
- Database connection issues → verify DATABASE_URL
- CORS errors → update allowed origins in external services

### Database Issues
- Connection pooling exhausted → use Prisma Accelerate or connection pooler
- Migrations not applied → run `prisma migrate deploy`

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown by Vercel
4. Update all service configurations with new domain

## Continuous Deployment

Once connected to Git:
- Every push to `main` branch → deploys to production
- Every push to other branches → creates preview deployment
- Pull requests → automatic preview deployments with unique URLs

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Clerk with Vercel](https://clerk.com/docs/deployments/vercel)

---

**Need Help?**
- Vercel Support: https://vercel.com/support
- Next.js Discord: https://nextjs.org/discord
