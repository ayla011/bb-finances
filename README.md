# ₱ Financial Command Center

A personal finance dashboard with Google Sheets integration, expense logging, burn rate tracking, spending anomaly detection, savings trajectory, and FIRE projection.

## Features

- **Live budget tracking** — see this month's spending vs targets in real-time
- **Expense logging** — log expenses directly from the web app, synced to Google Sheets
- **Burn rate chart** — visual of actual vs budget spending pace with end-of-month projection
- **Spending anomalies** — automatic alerts when a category is 30%+ over expected pace
- **Editable targets** — click any budget amount to adjust it on the fly
- **5-year savings trajectory** — projected growth of savings and investments
- **FIRE projection** — Lean FIRE and Full FIRE age estimates with milestones
- **Mobile-friendly** — works on any device, anywhere

---

## Quick Setup (15 minutes)

### 1. Create your Google Sheet

Create a new Google Sheet and name the first tab `Expenses`.

Add these headers in Row 1:

| A | B | C | D | E |
|---|---|---|---|---|
| date | category | subcategory | amount | type |

Example row:
| 2026-03-09 | Needs | Groceries | 1500 | Expense |

### 2. Get Google Sheets API access

**For READ access (viewing data):**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g., "Finance Dashboard")
3. Search for "Google Sheets API" → Enable it
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key
6. (Recommended) Click "Restrict Key" → restrict to "Google Sheets API" only
7. Make your spreadsheet **publicly viewable**: Share → Anyone with link → Viewer

**For WRITE access (logging expenses from the app):**

1. In the same project, go to **Credentials** → **Create Credentials** → **Service Account**
2. Give it a name (e.g., "finance-writer")
3. Click on the service account → **Keys** → **Add Key** → **Create new key** → JSON
4. Download the JSON file
5. From the JSON, copy `client_email` and `private_key`
6. **Share your Google Sheet** with the service account email (give Editor access)

### 3. Deploy to Vercel (free)

1. Push this project to a GitHub repository:
   ```bash
   cd finance-app
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create finance-command-center --private --push
   ```

2. Go to [vercel.com](https://vercel.com) → Sign in with GitHub

3. Click **"Add New Project"** → Import your repo

4. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SHEETS_API_KEY = your_api_key
   NEXT_PUBLIC_SPREADSHEET_ID = your_spreadsheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL = your-sa@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   ```

5. Click **Deploy**

Your dashboard will be live at `https://your-project.vercel.app`

### 4. Set up twice-monthly reminders

**Option A: Google Calendar (easiest)**
- Create 2 recurring calendar events: 1st and 15th of each month
- Title: "💰 Finance Check-in — Update the dashboard"
- Add notification: push notification + email
- Add your spouse as a guest so they get reminders too

**Option B: Free SMS via IFTTT**
1. Create an [IFTTT](https://ifttt.com) account (free tier)
2. Create an applet: **Date & Time** → "Every month on the 1st" → **SMS** → send message
3. Repeat for the 15th
4. Message: "Budget check-in! Log expenses at https://your-project.vercel.app"

**Option C: Telegram Bot (free, no limits)**
1. Create a Telegram bot via @BotFather
2. Use a free cron service like [cron-job.org](https://cron-job.org)
3. Set it to hit the Telegram API on the 1st and 15th to send you a message

---

## Local Development

```bash
# Install dependencies
npm install

# Also install jose for Google auth (write access)
npm install jose

# Copy env template
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Spreadsheet ID

Your spreadsheet ID is in the URL:
```
https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SPREADSHEET_ID/edit
```

---

## Project Structure

```
finance-app/
├── src/
│   ├── app/
│   │   ├── api/sheets/route.js   # Server-side Google Sheets API
│   │   ├── globals.css            # Global styles
│   │   ├── layout.js              # Root layout
│   │   └── page.js                # Main page
│   └── components/
│       └── Dashboard.jsx          # Full dashboard component
├── .env.local.example             # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

---

## Budget Categories

| Category | Items | Monthly Target |
|----------|-------|---------------|
| Needs | Groceries, Electricity, Water, WiFi, Subs | ₱13,756 |
| Lifestyle | Shopping, Clothing, Transport, Maintenance, Grooming, Medical, Pets, Buffer | ₱12,000 |
| Family | Parents' HMO, Mother's shopping, Brother's psychiatrist, Parents help buffer | ₱14,000 |
| Fixed | Insurance (Sun Life), Tuition (MEng) | ₱11,000 |
| Personal | Wife ₱6k, Husband ₱6k | ₱12,000 |
| Travel | Monthly set-aside | ₱3,000 |
| Savings | SB Money Builder, SB House & Lot, Tuition Buffer | ₱40,000 |
| Investment | MP2, RTB, UITF, REITs, PSEi Index | ₱30,302 |

**Total: ₱134,058 (exact match to combined net income)**
