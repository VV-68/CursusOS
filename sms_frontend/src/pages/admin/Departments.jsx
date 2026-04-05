import { useState, useEffect } from 'react';
import { departmentAPI } from '../../services/api';
import { Link } from 'react-router-dom';

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await departmentAPI.getAll();
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !code.trim()) {
      setFormError('Name and code are required');
      return;
    }
    setFormLoading(true);
    try {
      await departmentAPI.create({ name: name.trim(), code: code.trim() });
      setName('');
      setCode('');
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Departments</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : '+ Add Department'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #dee2e6' }}>
          <h3 style={{ marginTop: 0 }}>New Department</h3>
          {formError && <div style={{ color: '#721c24', background: '#f8d7da', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem' }}>{formError}</div>}
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Department Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Science and Engineering"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                disabled={formLoading}
                required
              />
            </div>
            <div style={{ minWidth: '140px' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                placeholder="e.g. CSE"
                maxLength={10}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                disabled={formLoading}
                required
              />
              <small style={{ color: '#666' }}>{code.length}/10 characters</small>
            </div>
            <button
              type="submit"
              disabled={formLoading}
              style={{ padding: '0.5rem 1.5rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '38px' }}
            >
              {formLoading ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div>Loading departments...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Code</th>
              <th style={{ padding: '0.75rem' }}>HOD</th>
              <th style={{ padding: '0.75rem' }}>Created</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No departments found</td></tr>
            ) : (
              departments.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{d.name}</td>
                  <td style={{ padding: '0.75rem' }}><code>{d.code}</code></td>
                  <td style={{ padding: '0.75rem' }}>{d.hod_name || <span style={{ color: '#999' }}>Not Assigned</span>}</td>
                  <td style={{ padding: '0.75rem' }}>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <Link to={`/admin/departments/${d.id}/assign-hod`}>
                      <button style={{ padding: '0.3rem 0.8rem', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                        Assign HOD
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Departments;
