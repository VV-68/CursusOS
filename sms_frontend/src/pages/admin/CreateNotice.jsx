import { useState, useEffect } from 'react';
import { noticeAPI, classAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function CreateNotice() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    scope: 'global',
    target_id: '',
    is_pinned: false
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const clData = await classAPI.getAll();
      setClasses(clData);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await noticeAPI.create(formData);
      navigate('/notices');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Create New Notice</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', marginTop: '2rem' }}>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="form-control" />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Body</label>
          <textarea name="body" value={formData.body} onChange={handleChange} required style={{ width: '100%', height: '120px', padding: '0.5rem' }}></textarea>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Scope</label>
          <select name="scope" value={formData.scope} onChange={handleChange} className="form-control">
            <option value="global">Global (All Users)</option>
            <option value="department">Department</option>
            <option value="class">Class</option>
          </select>
        </div>

        {formData.scope === 'class' && (
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Target Class</label>
            <select name="target_id" value={formData.target_id} onChange={handleChange} className="form-control">
              <option value="">Select Class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" name="is_pinned" checked={formData.is_pinned} onChange={handleChange} />
          <label>Pin this notice</label>
        </div>

        <button type="submit" style={{ padding: '0.75rem', marginTop: '1rem', background: '#0056b3', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          Post Notice
        </button>
      </form>
    </div>
  );
}

export default CreateNotice;
