# AI Workshop Dashboard

Password-protected CRM dashboard. Deploy as a separate app from your landing page.

---

## Deploy to Render (or Vercel)

### Render

1. Push this folder to a **new** GitHub repo (separate from your landing page repo)
2. Render → New → Web Service → connect the repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon key |
| `DASHBOARD_USER` | Your chosen username (e.g. `vivae`) |
| `DASHBOARD_PASS` | Your chosen password (make it strong) |
| `SESSION_SECRET` | Any random string (e.g. `santa-teresa-2025-xyz`) |

6. Deploy → you get a `.onrender.com` URL

Visit `https://your-dashboard.onrender.com` → login → see all your signups live.

---

### Vercel

1. Push to GitHub
2. Vercel → New Project → import repo
3. Framework preset: **Other**
4. Add the same 5 environment variables above
5. Deploy

Note: Vercel runs serverless functions, not a persistent Express server.
For Vercel you may need to add a `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

---

## What you get

- `/login` — username + password login page
- `/` — full dashboard (protected)
  - Live metrics from Supabase
  - CRM table with all signups
  - Update status + add notes per lead
  - Export CSV
  - Outreach sequences
  - AI message writer
- `/logout` — sign out
- `/api/signups` — JSON endpoint (protected)
- `/api/signups/:id` — PATCH to update status/notes
