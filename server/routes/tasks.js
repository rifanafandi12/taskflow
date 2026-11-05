const express = require('express');
const { z } = require('zod');
const pool = require('../db');

module.exports = (io) => {
  const router = express.Router();

  const taskSchema = z.object({
    title: z.string().min(1, 'Judul wajib diisi').max(255),
    description: z.string().optional().default(''),
    status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  });

  // GET all tasks (dengan search opsional)
  router.get('/', async (req, res) => {
    try {
      const { q } = req.query;
      let sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
      let params = [];
      if (q) {
        sql = 'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC';
        params = [`%${q}%`, `%${q}%`];
      }
      const [rows] = await pool.query(sql, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET single task
  router.get('/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', async (req, res) => {
    try {
      const data = taskSchema.parse(req.body);
      const [result] = await pool.query(
        'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)',
        [data.title, data.description, data.status]
      );
      const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
      const newTask = rows[0];
      io.emit('task:created', newTask);
      res.status(201).json(newTask);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', async (req, res) => {
    try {
      const data = taskSchema.partial().parse(req.body);
      const fields = [];
      const values = [];
      if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
      if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
      if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
      if (fields.length === 0) return res.status(400).json({ error: 'Tidak ada data untuk diupdate' });

      values.push(req.params.id);
      await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
      const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
      io.emit('task:updated', rows[0]);
      res.json(rows[0]);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Task tidak ditemukan' });
      io.emit('task:deleted', { id: Number(req.params.id) });
      res.json({ message: 'Task dihapus' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};