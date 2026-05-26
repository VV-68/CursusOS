const pool = require('../db/connection');

const institutionController = {
  getMyInstitution: async (req, res) => {
    try {
      const institution_id = req.user.institution_id;
      if (!institution_id) {
        return res.status(404).json({ error: 'No institution linked to this user' });
      }

      const { rows } = await pool.query('SELECT * FROM institutions WHERE id = $1', [institution_id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Institution not found' });
      
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateMyInstitution: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin can update institution details' });
      }

      const institution_id = req.user.institution_id;
      const { name, location } = req.body;

      if (!name || !location) {
        return res.status(400).json({ error: 'Name and location are required' });
      }

      const { rows } = await pool.query(
        'UPDATE institutions SET name = $1, location = $2 WHERE id = $3 RETURNING *',
        [name.trim(), location.trim(), institution_id]
      );

      if (rows.length === 0) return res.status(404).json({ error: 'Institution not found' });
      
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = institutionController;
