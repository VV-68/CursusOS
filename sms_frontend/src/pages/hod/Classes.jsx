import { useState, useEffect } from 'react';
import { classAPI, departmentAPI, getMe, progressionAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptId, setDeptId] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [deleting, setDeleting] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', year: '', section: '', dept_id: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const [user, depts] = await Promise.all([
        getMe(),
        departmentAPI.getAll()
      ]);
      setUserRole(user.role);
      setDeptId(user.dept_id);
      setDepartments(depts);

      // Pre-fill dept_id for HOD
      if (user.role === 'hod' && user.dept_id) {
        setFormData(f => ({ ...f, dept_id: user.dept_id }));
      }

      await fetchClasses();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await classAPI.getAll();
      setClasses(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) { setFormError('Batch name is required'); return; }
    if (!formData.year) { setFormError('Year is required'); return; }
    if (!formData.section.trim()) { setFormError('Section is required'); return; }
    if (!formData.dept_id) { setFormError('Department is required'); return; }

    setFormLoading(true);
    try {
      await classAPI.create({
        name: formData.name.trim(),
        year: parseInt(formData.year),
        section: formData.section.trim().toUpperCase(),
        dept_id: formData.dept_id
      });
      setFormData(f => ({ name: '', year: '', section: '', dept_id: deptId || '' }));
      setShowForm(false);
      await fetchClasses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete class "${cls.name}" (Year ${cls.year}, Section ${cls.section})? This cannot be undone.`)) return;
    setDeleting(cls.id);
    try {
      await classAPI.delete(cls.id);
      await fetchClasses();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSemesterToggle = async (cls, newValue) => {
    const currentIsEven = Number(cls.current_semester_number) % 2 === 0;
    const targetIsEven = newValue === 'even';

    if (currentIsEven === targetIsEven) return;

    if (!currentIsEven && targetIsEven) {
      if (!window.confirm(`Directly promote batch ${cls.name} from Odd (Sem ${cls.current_semester_number}) to Even (Sem ${Number(cls.current_semester_number) + 1})?`)) return;
      try {
        await progressionAPI.directPromote({ batchId: cls.id });
        await fetchClasses();
        alert('Batch promoted to even semester successfully.');
      } catch (err) { alert(err.message); }
    } else if (currentIsEven && !targetIsEven) {
      if (!window.confirm(`Request year progression for batch ${cls.name} from Even (Sem ${cls.current_semester_number}) to Odd (Sem ${Number(cls.current_semester_number) + 1})? This requires Admin approval.`)) return;
      try {
        await progressionAPI.requestPromotion({ batchId: cls.id, remarks: 'Year progression request via dropdown' });
        alert('Promotion request sent to admin.');
      } catch (err) { alert(err.message); }
    }
  };

  const btnStyle = (bg) => ({
    padding: '0.3rem 0.7rem', background: bg, color: '#fff',
    border: 'none', borderRadius: '4px', cursor: 'pointer',
    fontSize: '.8rem', fontWeight: 500, whiteSpace: 'nowrap'
  });

  const inputStyle = {
    padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', 
    boxSizing: 'border-box', width: '100%'
  };

  // Find department name for display
  const getDeptName = (id) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : '—';
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=dept')}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h2>📚 Batch List</h2>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', marginRight: '1rem', fontSize: '0.85rem' }}>
            <input 
              type="checkbox" 
              checked={filterActive} 
              onChange={(e) => setFilterActive(e.target.checked)} 
            />
            Active Batches Only
          </label>
          <button
            onClick={() => navigate('/hod/batch-progression')}
            style={{
              padding: '0.5rem 1rem',
              background: '#0ea5e9',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 600, fontSize: '.85rem'
            }}
          >
            Batch Progression
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '0.5rem 1rem',
              background: showForm ? '#64748b' : 'linear-gradient(135deg, #007bff, #007bff)',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 600, fontSize: '.85rem',
              boxShadow: showForm ? 'none' : '0 2px 8px rgba(99,102,241,.25)'
            }}
          >
            {showForm ? '✕ Cancel' : '+ Create Batch'}
          </button>
        </div>
      </div>

      {/* ── Create Batch Form ───────────────────────── */}
      {showForm && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #dee2e6' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>New Batch</h3>
          {formError && (
            <div style={{ color: '#721c24', background: '#f8d7da', padding: '0.5rem 0.75rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '.88rem' }}>
              ⚠️ {formError}
            </div>
          )}
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500', fontSize: '.88rem' }}>Batch Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. CSE-A 2024"
                className="form-control"
                disabled={formLoading}
                required
              />
            </div>
            <div style={{ minWidth: '100px' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500', fontSize: '.88rem' }}>Year *</label>
              <select
                value={formData.year}
                onChange={e => setFormData(f => ({ ...f, year: e.target.value }))}
                className="form-control"
                disabled={formLoading}
                required
              >
                <option value="">Select...</option>
                {[1, 2, 3, 4, 5].map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: '100px' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500', fontSize: '.88rem' }}>Section *</label>
              <input
                type="text"
                value={formData.section}
                onChange={e => setFormData(f => ({ ...f, section: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) }))}
                placeholder="A"
                maxLength={3}
                style={{ ...inputStyle, width: '80px' }}
                disabled={formLoading}
                required
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500', fontSize: '.88rem' }}>Department *</label>
              <select
                value={formData.dept_id}
                onChange={e => setFormData(f => ({ ...f, dept_id: e.target.value }))}
                className="form-control"
                disabled={formLoading || (userRole === 'hod' && !!deptId)}
                required
              >
                <option value="">Select department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: '0.5rem 1.5rem', height: '38px',
                background: formLoading ? '#94a3b8' : '#007bff', color: '#fff',
                border: 'none', borderRadius: '4px', cursor: formLoading ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {formLoading ? '⏳ Creating...' : '✓ Create'}
            </button>
          </form>
        </div>
      )}

      {/* ── Batch Table ────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading batches...</div>
      ) : classes.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: '1.2rem' }}>No batches found</p>
          <p style={{ fontSize: '.88rem' }}>Click "Create Batch" to add your first batch.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '.88rem', color: '#475569' }}>Name</th>
              <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '.88rem', color: '#475569' }}>Year</th>
              <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '.88rem', color: '#475569' }}>Current Sem</th>
              <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '.88rem', color: '#475569' }}>Section</th>
              <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '.88rem', color: '#475569' }}>Advisor 1</th>
              <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '.88rem', color: '#475569' }}>Advisor 2</th>
              <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '.88rem', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.filter(c => c.is_active === filterActive).map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '0.75rem' }}>{c.year}</td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>{c.current_semester_number || '—'}</span>
                    {userRole === 'hod' && c.current_semester_number && (
                      <select
                        value={Number(c.current_semester_number) % 2 === 0 ? 'even' : 'odd'}
                        onChange={(e) => handleSemesterToggle(c, e.target.value)}
                        style={{ padding: '0.1rem 0.3rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.75rem' }}
                      >
                        <option value="odd">Odd</option>
                        <option value="even">Even</option>
                      </select>
                    )}
                  </div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ background: '#cce5ff', color: '#0056b3', padding: '.15rem .5rem', borderRadius: '4px', fontWeight: 600, fontSize: '.82rem' }}>
                    {c.section}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {c.advisor1_name ? (
                    <>
                      {c.advisor1_name} {c.advisor1_code && <code style={{ color: '#64748b', fontSize: '.8rem' }}>({c.advisor1_code})</code>}
                    </>
                  ) : <span style={{ color: '#94a3b8' }}>Default Advisor <code style={{ color: '#64748b', fontSize: '.8rem' }}>({c.dept_code}0000)</code></span>}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {c.advisor2_name ? (
                    <>
                      {c.advisor2_name} {c.advisor2_code && <code style={{ color: '#64748b', fontSize: '.8rem' }}>({c.advisor2_code})</code>}
                    </>
                  ) : <span style={{ color: '#94a3b8' }}>—</span>}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'nowrap' }}>
                    <Link to={`/hod/classes/${c.id}/assign-advisors`}>
                      <button style={btnStyle('#0ea5e9')}>👥 Advisors</button>
                    </Link>
                    <Link to={`/hod/classes/${c.id}/timetable`}>
                      <button style={btnStyle('#007bff')}>📅 Timetable</button>
                    </Link>
                    <Link to={`/hod/classes/${c.id}/students`}>
                      <button style={btnStyle('#10b981')}>🧑‍🎓 Students</button>
                    </Link>
                    <button
                      style={btnStyle(deleting === c.id ? '#94a3b8' : '#ef4444')}
                      onClick={() => handleDelete(c)}
                      disabled={deleting === c.id}
                    >
                      {deleting === c.id ? '...' : '🗑️ Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Classes;
