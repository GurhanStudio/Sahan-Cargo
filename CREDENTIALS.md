# Sahan Cargo — Test Credentials & Setup Guide

## Default Test Accounts

| Role | Email | Password | Office |
|---|---|---|---|
| Admin | admin@sahancargo.com | admin123 | System Admin (no office) |
| Origin Office | ahmed@sahancargo.com | test1234 | Mogadishu Origin Office |
| Airport Cargo | fatima@sahancargo.com | test1234 | Mogadishu Airport Cargo |
| Dest. Airport | hassan@sahancargo.com | test1234 | Hargeisa Destination Airport |
| Dest. Office | amina@sahancargo.com | test1234 | Hargeisa Delivery Office |

Additional accounts (same password `test1234`):
- marmush@sahancargo.com — ORIGIN_OFFICE (Garowe Origin Office)
- salah@sahancargo.com — ORIGIN_OFFICE (Kismayo Origin Office)
- safa@sahancargo.com — AIRPORT_CARGO (Kismayo Airport Cargo)
- geedi@sahancargo.com — DESTINATION_AIRPORT (Kismayo Destination Airport)
- ismaciil@sahancargo.com — DESTINATION_AIRPORT (Mogadishu Destination Airport)
- khalid@sahancargo.com — DESTINATION_OFFICE (Kismayo Delivery Office)
- yaxye@sahancargo.com — DESTINATION_OFFICE (Mogadishu Delivery Office)

> **Note:** The admin password is `admin123`. All operational staff passwords are `test1234`.
> These are development/test credentials only — change all passwords before production deployment.

## Starting the System Locally

```bash
# Backend (port 5000)
cd backend && node server.js

# Frontend (port 5173)
cd frontend && npm run dev
```

## Environment Variables Required

### Backend (`backend/.env`)
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=sahan_cargo
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=https://sahan-cargo-api.onrender.com
```
For local development, override with:
```
VITE_API_URL=http://localhost:5000/api
```

## Cargo Status Flow
```
REGISTERED
  → RECEIVED_AT_ORIGIN_AIRPORT
  → LOADED_ON_AIRCRAFT
  → ARRIVED_AT_DESTINATION_AIRPORT
  → RECEIVED_AT_DESTINATION_OFFICE
  → DELIVERED
```
