# local server

express server for local development with file persistence.

## usage

```bash
# from project root
npm run local

# or from server folder
cd server
npm start
```

## features

- file persistence to `data/appointments.json`
- cors enabled for local development
- robust error handling
- same api as production serverless version

## api endpoints

- `GET /api/health` - health check
- `GET /api/appointments?date=YYYY-MM-DD` - get appointments
- `POST /api/appointments` - create appointment
- `DELETE /api/appointments/:id` - cancel appointment

## config

set via `.env` file:
- `PORT=3001` - server port
- `START_HOUR=7` - business start hour
- `END_HOUR=19` - business end hour
- `SLOT_MINUTES=30` - appointment slot duration
