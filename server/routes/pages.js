const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM tasks');
    const [[{ done }]] = await pool.query("SELECT COUNT(*) AS done FROM tasks WHERE status = 'done'");
    const [[{ inProgress }]] = await pool.query("SELECT COUNT(*) AS inProgress FROM tasks WHERE status = 'in_progress'");
    const [recent] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5');
    res.render('dashboard', { total, done, inProgress, recent });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

module.exports = router;