const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireGuest, requireAuth } = require('../middleware/auth');
const router = express.Router();

// GET /register
router.get('/register', requireGuest, (req, res) => {
  res.render('register', { error: null });
});

// POST /register
router.post('/register', requireGuest, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.render('register', { error: 'All fields required.' });

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
    return res.render('register', { error: 'Username: 3-24 chars, letters/numbers/underscore only.' });

  if (password.length < 6)
    return res.render('register', { error: 'Password must be at least 6 characters.' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    db.prepare('INSERT INTO users (id, username, email, password) VALUES (?,?,?,?)').run(id, username.toLowerCase(), email.toLowerCase(), hash);
    db.prepare('INSERT INTO profiles (user_id, display_name) VALUES (?,?)').run(id, username);
    req.session.userId = id;
    req.session.username = username.toLowerCase();
    res.redirect('/dashboard');
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      const msg = e.message.includes('username') ? 'Username already taken.' : 'Email already registered.';
      return res.render('register', { error: msg });
    }
    res.render('register', { error: 'Something went wrong. Try again.' });
  }
});

// GET /login
router.get('/login', requireGuest, (req, res) => {
  res.render('login', { error: null });
});

// POST /login
router.post('/login', requireGuest, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('login', { error: 'All fields required.' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.render('login', { error: 'Invalid email or password.' });
  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/dashboard');
});

// POST /logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
