import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI } from '../../services/api';

const s = {
  page: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  backBtn: { background: 'none', border: '1px solid #475569', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  progress: {
    display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem 1.5rem',
    background: 'rgba(30,41,59,0.8)', borderRadius: '12px', border: '1px solid rgba(51,65,85,0.5)',
  },
  stat: (color) => ({ fontSize: '1.5rem', fontWeight: '700', color }),
  statLabel: { fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'rgba(30,41,59,0.8)', borderRadius: '12px', overflow: 'hidden' },
  th: { padding: '0.85rem 1rem', textAlign: 'left', background: 'rgba(51,65,85,0.6)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(51,65,85,0.5)', color: '#e2e8f0', fontSize: '0.9rem' },
  rowGreen: { borderLeft: '3px solid #4ade80' },
  rowYellow: { borderLeft: '3px solid #fbbf24' },
  rowRed: { borderLeft: '3px solid #f87171' },
  badge: (color) => ({ display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: `${color}22`, color }),
  link: { color: '#818cf8', textDecoration: 'none', cursor: 'pointer', fontSize: '0.85rem' },
  evalBtn: { padding: '0.35rem 0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' },
  // Evaluate panel
  evalPanel: {
    position: 'fixed', right: 0, top: 0, width: '380px', height: '100vh',
    background: '#1e293b', borderLeft: '1px solid rgba(100,116,139,0.3)',
    padding: '2rem', zIndex: 1001, overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.4)',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 },
  panelTitle: { fontSize: '1.15rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '1.5rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' },
  input: { width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.9rem', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '0.65rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', marginTop: '0.5rem' },
  cancelBtn: { width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #475569', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', background: 'transparent', color: '#94a3b8', marginTop: '0.5rem' },
  error: { padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' },
};

function ViewSubmissions() {
  const { assignment_id } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evalTarget, setEvalTarget] = useState(null);
  const [evalForm, setEvalForm] = useState({ marks_awarded: '', feedback: '' });

  useEffect(() => { fetchData(); }, [assignment_id, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await assignmentAPI.listSubmissions(assignment_id, { page, limit: 25 });
      const rows = res.data ?? res;
      setSubmissions(rows);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleEvaluate = async () => {
    if (!evalTarget) return;
    try {
      await assignmentAPI.evaluate(evalTarget.id, {
        marks_awarded: parseFloat(evalForm.marks_awarded),
        feedback: evalForm.feedback,
      });
      setEvalTarget(null);
      setEvalForm({ marks_awarded: '', feedback: '' });
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const submitted = submissions.length;
  const evaluated = submissions.filter((s) => s.is_evaluated || s.marks_awarded !== null).length;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const getRowStyle = (sub) => {
    if (sub.marks_awarded !== null) return s.rowGreen;
    return s.rowYellow;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading submissions...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <h1 style={s.title}>Submissions</h1>
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.progress}>
        <div>
          <div style={s.stat('#818cf8')}>{submitted}</div>
          <div style={s.statLabel}>Submitted</div>
        </div>
        <div>
          <div style={s.stat('#4ade80')}>{evaluated}</div>
          <div style={s.statLabel}>Evaluated</div>
        </div>
        <div>
          <div style={s.stat('#fbbf24')}>{submitted - evaluated}</div>
          <div style={s.statLabel}>Pending</div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'rgba(30,41,59,0.5)', borderRadius: '12px' }}>
          No submissions yet
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Roll No</th>
                <th style={s.th}>Student Name</th>
                <th style={s.th}>Submitted At</th>
                <th style={s.th}>Late</th>
                <th style={s.th}>File</th>
                <th style={s.th}>Marks</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} style={getRowStyle(sub)}>
                  <td style={s.td}>{sub.roll_no}</td>
                  <td style={s.td}>{sub.student_name}</td>
                  <td style={s.td}>{formatDate(sub.submitted_at)}</td>
                  <td style={s.td}>
                    {sub.is_late && <span style={s.badge('#f87171')}>Late</span>}
                  </td>
                  <td style={s.td}>
                    {sub.signed_url ? (
                      <a href={sub.signed_url} target="_blank" rel="noopener noreferrer" style={s.link}>
                        📄 {sub.file_name}
                      </a>
                    ) : (
                      <span style={{ color: '#64748b' }}>{sub.file_name}</span>
                    )}
                  </td>
                  <td style={s.td}>
                    {sub.is_evaluated || sub.marks_awarded !== null ? (
                      <span style={s.badge('#4ade80')}>{sub.marks_awarded}</span>
                    ) : (
                      <span style={s.badge('#fbbf24')}>Pending</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <button
                      style={s.evalBtn}
                      onClick={() => {
                        setEvalTarget(sub);
                        setEvalForm({
                          marks_awarded: sub.marks_awarded ?? '',
                          feedback: sub.feedback ?? '',
                        });
                      }}
                    >
                      {sub.marks_awarded !== null ? 'Re-evaluate' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button style={s.backBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span style={{ color: '#94a3b8', alignSelf: 'center' }}>
            Page {page} of {pagination.total_pages} ({pagination.total} total)
          </span>
          <button style={s.backBtn} disabled={page >= pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {/* Evaluate Slide Panel */}
      {evalTarget && (
        <>
          <div style={s.overlay} onClick={() => setEvalTarget(null)} />
          <div style={s.evalPanel}>
            <h3 style={s.panelTitle}>Evaluate: {evalTarget.student_name}</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Roll No: {evalTarget.roll_no} • File: {evalTarget.file_name}
            </p>
            <div style={s.field}>
              <label style={s.label}>Marks Awarded *</label>
              <input
                style={s.input} type="number" min="0"
                value={evalForm.marks_awarded}
                onChange={(e) => setEvalForm({ ...evalForm, marks_awarded: e.target.value })}
                placeholder="Enter marks"
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Feedback</label>
              <textarea
                style={s.textarea}
                value={evalForm.feedback}
                onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                placeholder="Optional feedback..."
              />
            </div>
            <button style={s.saveBtn} onClick={handleEvaluate}>Save Evaluation</button>
            <button style={s.cancelBtn} onClick={() => setEvalTarget(null)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ViewSubmissions;
