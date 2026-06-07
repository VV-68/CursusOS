import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { syllabusAPI, getMe } from '../../services/api';
import '../admin/CreateDepartment.css';

function SyllabusManager() {
  const navigate = useNavigate();
  const [deptId, setDeptId] = useState(null);
  const [syllabuses, setSyllabuses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('syllabuses');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ batch_id: '', syllabus_id: '', remarks: '' });
  const [assigning, setAssigning] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', is_active: true });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await getMe();
        setDeptId(user.dept_id);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    if (!deptId) return;
    setLoading(true);
    setError('');
    try {
      const [syllData, batchData, reqData] = await Promise.all([
        syllabusAPI.list(deptId),
        syllabusAPI.getBatches(deptId),
        syllabusAPI.listRequests()
      ]);
      setSyllabuses(syllData);
      setBatches(batchData);
      setRequests(reqData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      await syllabusAPI.create(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.batch_id || !assignForm.syllabus_id) return;
    setAssigning(true);
    try {
      await syllabusAPI.requestAssignment(assignForm);
      setShowAssign(false);
      setAssignForm({ batch_id: '', syllabus_id: '', remarks: '' });
      loadData();
      alert('Assignment request sent to admin for approval.');
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    setEditing(true);
    try {
      await syllabusAPI.update(editModal.id, editForm);
      setEditModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete syllabus "${name}"? This cannot be undone.`)) return;
    try {
      await syllabusAPI.delete(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = (s) => {
    setEditModal(s);
    setEditForm({ name: s.name, description: s.description || '', is_active: s.is_active });
  };

  const activeSyllabuses = syllabuses.filter(s => s.is_active);
  const tabs = [
    { id: 'syllabuses', label: '📋 Syllabuses', count: syllabuses.length },
    { id: 'batches', label: '🏫 Batch Assignments', count: batches.length },
    { id: 'requests', label: '📨 My Requests', count: requests.filter(r => r.status === 'pending').length }
  ];

  return (
    <div className="dept-wizard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}
        onClick={() => navigate('/dashboard?tab=dept')}>← Back</button>

      <div className="dept-wizard__header">
        <h1>📑 Syllabus Management</h1>
        <div className="dept-wizard__header-actions">
          <button className="dept-btn dept-btn--success" onClick={() => setShowAssign(true)}>🔗 Assign to Batch</button>
        </div>
      </div>

      {error && (
        <div className="dept-alert dept-alert--error">
          <span className="dept-alert__icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.9rem', whiteSpace: 'nowrap',
            borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '-2px',
            transition: 'all 0.2s'
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{
                marginLeft: '0.5rem', background: activeTab === t.id ? 'var(--primary)' : '#e2e8f0',
                color: activeTab === t.id ? '#fff' : '#64748b', borderRadius: '10px', padding: '0.1rem 0.5rem',
                fontSize: '0.75rem', fontWeight: 700
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</p>
      ) : (
        <>
          {/* ── SYLLABUSES TAB ── */}
          {activeTab === 'syllabuses' && (
            <div className="dept-card">
              <div className="dept-card__title"><span className="icon">📋</span> Department Syllabuses</div>
              {syllabuses.length === 0 ? (
                <div className="dept-alert dept-alert--info">
                  <span className="dept-alert__icon">ℹ️</span>
                  <span>No syllabuses created yet. Click "New Syllabus" to get started.</span>
                </div>
              ) : (
                <table className="json-preview-table form-control">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syllabuses.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ color: '#64748b', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.description || '—'}
                        </td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                            background: s.is_active ? '#dcfce7' : '#fef2f2',
                            color: s.is_active ? '#16a34a' : '#dc2626'
                          }}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{s.created_by_name || '—'}</td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="dept-btn dept-btn--primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', marginRight: '0.35rem' }}
                            onClick={() => openEdit(s)}>Edit</button>
                          <button className="dept-btn dept-btn--success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', marginRight: '0.35rem' }}
                            onClick={() => navigate(`/hod/department/edit?syllabus_id=${s.id}`)}>Upload Courses</button>
                          <button className="dept-btn dept-btn--secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: '#dc2626' }}
                            onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── BATCHES TAB ── */}
          {activeTab === 'batches' && (
            <div className="dept-card">
              <div className="dept-card__title"><span className="icon">🏫</span> Batch → Syllabus Mapping</div>
              {batches.length === 0 ? (
                <div className="dept-alert dept-alert--info">
                  <span className="dept-alert__icon">ℹ️</span>
                  <span>No batches in this department.</span>
                </div>
              ) : (
                <table className="json-preview-table form-control">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Section</th>
                      <th>Batch Year</th>
                      <th>Year</th>
                      <th>Status</th>
                      <th>Assigned Syllabus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                        <td>{b.section || '—'}</td>
                        <td>{b.batch_year || '—'}</td>
                        <td>Year {b.year || '—'}</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                            background: b.is_active ? '#dcfce7' : '#fef2f2',
                            color: b.is_active ? '#16a34a' : '#dc2626'
                          }}>
                            {b.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {b.syllabus_name ? (
                            <span style={{
                              padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                              background: '#dbeafe', color: '#1d4ed8'
                            }}>
                              {b.syllabus_name}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── REQUESTS TAB ── */}
          {activeTab === 'requests' && (
            <div className="dept-card">
              <div className="dept-card__title"><span className="icon">📨</span> Syllabus Assignment Requests</div>
              {requests.length === 0 ? (
                <div className="dept-alert dept-alert--info">
                  <span className="dept-alert__icon">ℹ️</span>
                  <span>No assignment requests yet.</span>
                </div>
              ) : (
                <table className="json-preview-table form-control">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Current</th>
                      <th>Requested Syllabus</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.batch_name} {r.batch_section}</td>
                        <td style={{ color: '#64748b' }}>{r.current_syllabus_name || '—'}</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                            background: '#dbeafe', color: '#1d4ed8'
                          }}>
                            {r.syllabus_name}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                            background: r.status === 'approved' ? '#dcfce7' : r.status === 'rejected' ? '#fef2f2' : '#fef3c7',
                            color: r.status === 'approved' ? '#16a34a' : r.status === 'rejected' ? '#dc2626' : '#d97706'
                          }}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.remarks || '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          {new Date(r.requested_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="json-upload-modal" style={{ maxWidth: '500px' }}>
            <div className="json-upload-modal__header">
              <h2>Create New Syllabus</h2>
              <button type="button" className="json-upload-modal__close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className="json-upload-modal__body">
              <div className="dept-field">
                <label>Syllabus Name *</label>
                <input type="text" placeholder="e.g. 2024 Scheme" value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                  required />
                <label>Description</label>
                <textarea placeholder="Optional description..." value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              <div className="json-upload-modal__footer" style={{ padding: 0, border: 'none', marginTop: '1rem' }}>
                <button type="button" className="dept-btn dept-btn--secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="dept-btn dept-btn--success" disabled={creating}>
                  {creating ? 'Creating…' : 'Create Syllabus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGN MODAL ── */}
      {showAssign && (
        <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && setShowAssign(false)}>
          <div className="json-upload-modal" style={{ maxWidth: '500px' }}>
            <div className="json-upload-modal__header">
              <h2>Request Syllabus Assignment</h2>
              <button type="button" className="json-upload-modal__close" onClick={() => setShowAssign(false)}>×</button>
            </div>
            <form onSubmit={handleAssign} className="json-upload-modal__body">
              <div className="dept-alert dept-alert--info" style={{ marginBottom: '1rem' }}>
                <span className="dept-alert__icon">ℹ️</span>
                <span>This will send a request to the admin for approval.</span>
              </div>
              <div className="dept-field">
                <label>Select Batch *</label>
                <select value={assignForm.batch_id}
                  onChange={e => setAssignForm({ ...assignForm, batch_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                  required>
                  <option value="">Choose batch…</option>
                  {batches.filter(b => b.is_active).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.section} (Batch {b.batch_year}, Year {b.year})
                      {b.syllabus_name ? ` [Current: ${b.syllabus_name}]` : ''}
                    </option>
                  ))}
                </select>
                <label>Select Syllabus *</label>
                <select value={assignForm.syllabus_id}
                  onChange={e => setAssignForm({ ...assignForm, syllabus_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                  required>
                  <option value="">Choose syllabus…</option>
                  {activeSyllabuses.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <label>Remarks (Optional)</label>
                <textarea placeholder="Reason for this assignment..." value={assignForm.remarks}
                  onChange={e => setAssignForm({ ...assignForm, remarks: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="json-upload-modal__footer" style={{ padding: 0, border: 'none', marginTop: '1rem' }}>
                <button type="button" className="dept-btn dept-btn--secondary" onClick={() => setShowAssign(false)}>Cancel</button>
                <button type="submit" className="dept-btn dept-btn--success" disabled={assigning}>
                  {assigning ? 'Sending…' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <div className="json-upload-overlay" onClick={(e) => e.target === e.currentTarget && setEditModal(null)}>
          <div className="json-upload-modal" style={{ maxWidth: '500px' }}>
            <div className="json-upload-modal__header">
              <h2>Edit Syllabus</h2>
              <button type="button" className="json-upload-modal__close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <form onSubmit={handleEdit} className="json-upload-modal__body">
              <div className="dept-field">
                <label>Syllabus Name *</label>
                <input type="text" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                  required />
                <label>Description</label>
                <textarea value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical', marginBottom: '1rem' }}
                />
              </div>
              <div className="json-upload-modal__footer" style={{ padding: 0, border: 'none', marginTop: '1rem' }}>
                <button type="button" className="dept-btn dept-btn--secondary" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="dept-btn dept-btn--success" disabled={editing}>
                  {editing ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SyllabusManager;
