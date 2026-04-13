const express = require('express');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'workshop-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Credentials from env vars
const DASHBOARD_USER = process.env.DASHBOARD_USER || 'admin';
const DASHBOARD_PASS = process.env.DASHBOARD_PASS || 'changeme';

// ── Auth middleware ──
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/login');
}

// ── LOGIN page ──
app.get('/login', (req, res) => {
  const error = req.query.error ? '<p class="error">Incorrect username or password.</p>' : '';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard Login</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Mono',monospace;background:#18130E;color:#F4EEE2;min-height:100vh;display:flex;align-items:center;justify-content:center;font-weight:300}
.card{width:360px;border:0.5px solid #2A251F;padding:48px 40px}
.logo{font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic;color:#D4A94A;margin-bottom:4px}
.sub{font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#5A4E40;margin-bottom:40px}
label{display:block;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#5A4E40;margin-bottom:5px}
input{width:100%;background:transparent;border:0.5px solid #2A251F;color:#F4EEE2;font-family:'DM Mono',monospace;font-size:13px;font-weight:300;padding:11px 12px;margin-bottom:16px;outline:none}
input:focus{border-color:#D4A94A}
input::placeholder{color:#3A3028}
button{width:100%;padding:13px;background:#D4A94A;color:#18130E;border:none;font-family:'DM Mono',monospace;font-size:9px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;margin-top:4px}
button:hover{background:#B8892A}
.error{font-size:11px;color:#D85A30;margin-bottom:14px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">AI Fluency</div>
  <div class="sub">Workshop dashboard</div>
  ${error}
  <form method="POST" action="/login">
    <label>Username</label>
    <input type="text" name="username" autocomplete="username" autofocus>
    <label>Password</label>
    <input type="password" name="password" autocomplete="current-password">
    <button type="submit">Sign in</button>
  </form>
</div>
</body>
</html>`);
});

// ── LOGIN post ──
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === DASHBOARD_USER && password === DASHBOARD_PASS) {
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

// ── LOGOUT ──
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ── API: get all signups ──
app.get('/api/signups', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('workshop_signups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── API: update status & add note ──
app.patch('/api/signups/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const updates = {};
  if (status) updates.status = status;
  if (note) {
    // fetch existing notes first
    const { data: existing } = await supabase
      .from('workshop_signups')
      .select('notes')
      .eq('id', id)
      .single();

    const prev = existing?.notes || '';
    const timestamp = new Date().toLocaleString('en-CR', { timeZone: 'America/Costa_Rica' });
    updates.notes = prev ? `${prev}\n[${timestamp}] ${note}` : `[${timestamp}] ${note}`;
  }

  const { error } = await supabase
    .from('workshop_signups')
    .update(updates)
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ── Serve dashboard (protected) ──
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all
app.use(requireAuth, express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));
