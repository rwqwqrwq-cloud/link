const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Multer setup for avatar uploads
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${req.session.userId}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  }
});

// GET /dashboard
router.get('/', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.session.userId);
  const links = db.prepare('SELECT * FROM links WHERE user_id = ? ORDER BY position').all(req.session.userId);
  const user = db.prepare('SELECT username, email FROM users WHERE id = ?').get(req.session.userId);
  res.render('dashboard', { profile, links, user, success: req.query.saved });
});

// POST /dashboard/profile — update bio/name/banner
router.post('/profile', requireAuth, (req, res) => {
  const { display_name, bio, banner_color, theme } = req.body;
  db.prepare(`
    UPDATE profiles SET display_name=?, bio=?, banner_color=?, theme=?, updated_at=datetime('now')
    WHERE user_id=?
  `).run(display_name || '', bio || '', banner_color || '', theme || 'dark', req.session.userId);
  res.redirect('/dashboard?saved=1');
});

// POST /dashboard/avatar
router.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.redirect('/dashboard');
  const avatarUrl = '/uploads/' + req.file.filename;
  db.prepare('UPDATE profiles SET avatar_url=? WHERE user_id=?').run(avatarUrl, req.session.userId);
  res.redirect('/dashboard?saved=1');
});

// POST /dashboard/links/add
router.post('/links/add', requireAuth, (req, res) => {
  const { label, url, icon } = req.body;
  if (!label || !url) return res.redirect('/dashboard');
  const maxPos = db.prepare('SELECT MAX(position) as m FROM links WHERE user_id=?').get(req.session.userId);
  const position = (maxPos.m || 0) + 1;
  db.prepare('INSERT INTO links (id, user_id, label, url, icon, position) VALUES (?,?,?,?,?,?)')
    .run(uuidv4(), req.session.userId, label, url, icon || '🔗', position);
  res.redirect('/dashboard?saved=1');
});

// POST /dashboard/links/delete
router.post('/links/delete', requireAuth, (req, res) => {
  const { link_id } = req.body;
  db.prepare('DELETE FROM links WHERE id=? AND user_id=?').run(link_id, req.session.userId);
  res.redirect('/dashboard?saved=1');
});

// POST /dashboard/links/reorder
router.post('/links/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // comma-separated IDs
  if (!order) return res.json({ ok: false });
  const ids = order.split(',');
  const stmt = db.prepare('UPDATE links SET position=? WHERE id=? AND user_id=?');
  const update = db.transaction((ids) => {
    ids.forEach((id, i) => stmt.run(i, id, req.session.userId));
  });
  update(ids);
  res.json({ ok: true });
});

module.exports = router;
