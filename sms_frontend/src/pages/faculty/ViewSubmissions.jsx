import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentAPI } from '../../services/api';

const s = {
  page: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.025em', margin: 0 },
  backBtn: { background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s' },
  progress: {
    display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem 1.5rem',
    background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  stat: (color) => ({ fontSize: '1.5rem', fontWeight: '800', color }),
  statLabel: { fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  th: { padding: '1rem', textAlign: 'left', background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '1rem', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '0.9rem' },
  rowGreen: { borderLeft: '4px solid #4ade80' },
  rowYellow: { borderLeft: '4px solid #fbbf24' },
  rowRed: { borderLeft: '4px solid #f87171' },
  badge: (color) => ({ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', background: `${color}15`, color }),
  link: { color: '#007bff', textDecoration: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  evalBtn: { padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: '#fff', color: '#007bff', transition: 'all 0.2s' },
  // Evaluate panel
  evalPanel: {
    position: 'fixed', right: 0, top: 0, width: '380px', height: '100vh',
    background: '#ffffff', borderLeft: '1px solid #e2e8f0',
    padding: '2.5rem', zIndex: 1001, overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
  },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000, backdropFilter: 'blur(4px)' },
  panelTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', letterSpacing: '-0.025em' },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', color: '#475569', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' },
  input: { width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.95rem', boxSizing: 'border-box', transition: 'all 0.2s' },
  textarea: { width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#1e293b', fontSize: '0.95rem', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '0.8rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', background: 'linear-gradient(135deg, #007bff, #0056b3)', color: '#fff', marginTop: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 123, 255, 0.2)' },
  cancelBtn: { width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', background: '#fff', color: '#475569', marginTop: '0.75rem' },
  error: { padding: '1rem', background: '#fef2f2', color: '#dc2626', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #fee2e2' },
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
