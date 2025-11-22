# Vercel Deployment Fix Guide

## Changes Made

### 1. **package.json** - Updated Build Scripts
- Added `prisma generate` to the `build` script
- Added `postinstall` script to run `prisma generate` automatically
- Added `vercel-build` script for Vercel-specific build process
- Updated `start` script to use compiled JavaScript from `dist/`

### 2. **prisma/schema.prisma** - Added Binary Targets
- Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to support Vercel's serverless environment
- This ensures Prisma Client works on both local development and Vercel's infrastructure

### 3. **vercel.json** - Simplified Configuration
- Points to `dist/server.js` (compiled output)
- Routes all requests to the main server file

### 4. **.vercelignore** - Excluded Unnecessary Files
- Prevents uploading source TypeScript files and dev dependencies

### 5. **Postman Collection** - Updated Base URL
- Default URL now points to `https://gra-kappa.vercel.app`
- Added disabled localhost option for easy switching

## Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "fix: Add Prisma generation to Vercel build process"
git push
```

### Step 2: Redeploy on Vercel
Vercel should automatically detect the push and redeploy. If not:
1. Go to your Vercel dashboard
2. Navigate to your project
3. Click "Redeploy" on the latest deployment

### Step 3: Verify Environment Variables
Make sure these are set in Vercel:
- `DATABASE_URL` - Your PostgreSQL connection string
- `GEMINI_API_KEY` - Your Google Gemini API key

### Step 4: Run Database Migrations (if needed)
If you haven't run migrations on your production database:
```bash
# Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

Or set up the database directly on your hosting provider.

## Testing the Deployment

Once deployed, test these endpoints:

1. **Health Check**
   ```
   GET https://gra-kappa.vercel.app/health
   ```
   Expected: `{"status": "OK", "timestamp": "..."}`

2. **Database Test**
   ```
   GET https://gra-kappa.vercel.app/test-db
   ```
   Expected: `{"success": true, "userCount": 0}`

3. **Import Postman Collection**
   - Import `GRA_POC_API.postman_collection.json` into Postman
   - The collection is already configured to use your Vercel URL
   - Test all endpoints

## Troubleshooting

### If Prisma Client Error Persists:
1. Check Vercel build logs for `prisma generate` execution
2. Verify `binaryTargets` in schema.prisma includes `"rhel-openssl-3.0.x"`
3. Ensure `postinstall` script is running during deployment

### If Database Connection Fails:
1. Verify `DATABASE_URL` environment variable in Vercel
2. Check if your database allows connections from Vercel's IP ranges
3. For local PostgreSQL, use a cloud database (Neon, Supabase, Railway, etc.)

### If Routes Don't Work:
1. Check that `dist/server.js` exists after build
2. Verify TypeScript compilation is successful
3. Check Vercel function logs for errors

## Next Steps

1. ✅ Commit and push the changes
2. ✅ Wait for Vercel to redeploy
3. ✅ Test the `/health` endpoint
4. ✅ Test the `/test-db` endpoint
5. ✅ Test API endpoints using Postman collection
6. ✅ Monitor Vercel function logs for any issues
