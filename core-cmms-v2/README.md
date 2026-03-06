# C.O.R.E. CMMS
**Conditions · Operations · Reliability · Engineering**

A facilities management system built for MCG.

---

## Quick Deploy to Railway

### 1. Push this code to GitHub
Upload all files to your `C.O.R.E` GitHub repo.

### 2. Create Railway Project
- Go to railway.app → New Project → GitHub Repo → Select `C.O.R.E`

### 3. Add PostgreSQL Database
- In Railway dashboard → New → Database → PostgreSQL
- Railway auto-sets `DATABASE_URL` for you

### 4. Set Environment Variables
In Railway → your service → Variables tab, add:
```
CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value  
CLOUDINARY_API_SECRET=your_value
NODE_ENV=production
```

### 5. Initialize Database
Once deployed, open Railway shell and run:
```bash
psql $DATABASE_URL -f server/schema.sql
```

### 6. Get your live URL
Railway → Settings → Domains → Generate Domain

---

## Local Development

```bash
# Install dependencies
npm install --prefix server
npm install --prefix client

# Start backend (terminal 1)
cd server && cp .env.example .env  # fill in your values
npm run dev

# Start frontend (terminal 2)
cd client && npm start
```

---

## Tech Stack
- **Frontend:** React, React Router
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Photos:** Cloudinary
- **Hosting:** Railway
