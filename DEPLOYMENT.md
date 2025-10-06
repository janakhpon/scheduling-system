# deployment guide

## local development
```bash
npm install
npm run local
```
- runs express server on port 3001
- runs next.js on port 3000
- data saved to `data/appointments.json`

## production deploy

### via cli
```bash
npm i -g vercel
vercel login
vercel
```

### via github
1. push to github
2. connect at vercel.com
3. auto-deploy on push

## troubleshooting production issues

### 1. environment variables
in vercel dashboard, set these environment variables:
- `START_HOUR=7`
- `END_HOUR=19` 
- `SLOT_MINUTES=30`

### 2. api routes not working
check these endpoints:
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/appointments?date=2025-01-08`

### 3. common issues
- api routes return 404: check file structure in `src/app/api/`
- cors errors: api routes should work same-origin
- data not persisting: uses `/tmp` storage on vercel

### 4. debug steps
1. check vercel function logs
2. test api endpoints directly
3. verify environment variables
4. check build logs for errors

## versions

### local version
- express server with file persistence
- robust error handling
- data saved to `data/appointments.json`
- auto-detects localhost and uses port 3001

### serverless version (vercel)
- next.js api routes
- `/tmp` file storage with memory fallback
- optimized for serverless functions
- auto-detects production and uses relative paths

## features
- clean ui matching design
- date picker + time slots (7am-6:30pm)
- booking/cancellation modals
- responsive design
- real-time validation

ready for both local and production! 🎉
