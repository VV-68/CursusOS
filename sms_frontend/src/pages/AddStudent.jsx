import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addStudent } from '../services/api';

function AddStudent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: '',
    name: '',
    department: '',
    marks: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const id = form.id.trim();
    const name = form.name.trim();
    const department = form.department.trim();
    const marks = form.marks.trim();

    if (!id || !name || !department || !marks) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    const marksNum = parseInt(marks, 10);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      setError('Marks must be a number between 0 and 100');
      setLoading(false);
      return;
    }

    try {
      await addStudent({
        id,
        name,
        department,
        marks: marksNum,
      });
      navigate('/students');
    } catch (err) {
      setError(err.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Add Student</h1>
      <form onSubmit={handleSubmit} className="student-form">
        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label htmlFor="id">ID</label>
          <input
            id="id"
            name="id"
            type="text"
            value={form.id}
            onChange={handleChange}
            placeholder="Student ID"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Student name"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            name="department"
            value={form.department}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select Department</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
            <option value="IT">IT</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="marks">Marks</label>
          <input
            id="marks"
            name="marks"
            type="number"
            min="0"
            max="100"
            value={form.marks}
            onChange={handleChange}
            placeholder="0-100"
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Student'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/students')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddStudent;
