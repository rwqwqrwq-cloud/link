const express = require('express');
const db = require('../db/database');
const router = express.Router();

// GET /:username — public profile page
router.get('/:username', (req, res) => {
  const { username } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
  if (!user) return res.status(404).render('404', { username });

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const links = db.prepare('SELECT * FROM links WHERE user_id = ? ORDER BY position').all(user.id);

  // Increment view count (skip if own profile)
  if (!req.session.userId || req.session.userId !== user.id) {
    db.prepare('UPDATE profiles SET views = views + 1 WHERE user_id = ?').run(user.id);
  }

  res.render('profile', { user, profile, links });
});

// POST /:username/click/:linkId — track link clicks
router.post('/:username/click/:linkId', (req, res) => {
  const { linkId } = req.params;
  db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?').run(linkId);
  const link = db.prepare('SELECT url FROM links WHERE id = ?').get(linkId);
  if (link) res.json({ url: link.url });
  else res.status(404).json({ error: 'not found' });
});

module.exports = router;
