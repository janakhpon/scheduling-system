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

## env vars
```env
START_HOUR=7
END_HOUR=19
SLOT_MINUTES=30
PORT=3001  # local only
```

ready for both local and production! 🎉
