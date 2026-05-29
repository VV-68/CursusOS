import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classAPI, progressionAPI } from '../../services/api';

function BatchProgression() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [promotionRequests, setPromotionRequests] = useState([]);
  const [deactivationRequests, setDeactivationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [batchData, promotionData, deactivationData] = await Promise.all([
        classAPI.getAll(),
        progressionAPI.listPromotions(),
        progressionAPI.listDeactivations(),
      ]);
      setBatches(batchData || []);
      setPromotionRequests(promotionData || []);
      setDeactivationRequests(deactivationData || []);
    } catch (err) {
      setError(err.message || 'Failed to load batch progression data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const requestPromotion = async (batch) => {
    if (!window.confirm(`Create promotion request for batch "${batch.name}"?`)) return;
    setActionLoading(`promote-${batch.id}`);
    try {
      await progressionAPI.requestPromotion({
        batchId: batch.id,
        remarks: `HOD requested promotion for ${batch.name}`,
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to request promotion');
    } finally {
      setActionLoading('');
    }
  };

  const requestDeactivation = async (batch) => {
    const reason = window.prompt(`Reason for deactivating "${batch.name}"?`, 'Course completed');
    if (reason === null) return;
    setActionLoading(`deactivate-${batch.id}`);
    try {
      await progressionAPI.requestDeactivation({
        batchId: batch.id,
        reason: reason || 'Course completed',
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to request deactivation');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=dept')}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Batch Progression</h2>
        <button onClick={loadData} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Refresh</button>
      </div>

      {error && <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.6rem', marginBottom: '1rem' }}>{error}</div>}

      {loading ? <div>Loading batch lifecycle data...</div> : (
        <>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1.25rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Batch</th>
                  <th style={{ padding: '0.75rem' }}>Current Sem</th>
                  <th style={{ padding: '0.75rem' }}>Current Year</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No batches found</td></tr>
                ) : batches.map((b) => {
                  const semester = Number(b.current_semester_number || 1);
                  const canPromote = b.is_active !== false && !b.is_graduated && semester % 2 === 0;
                  return (
                    <tr key={b.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{b.name}</td>
                      <td style={{ padding: '0.75rem' }}>{b.current_semester_number || '—'}</td>
                      <td style={{ padding: '0.75rem' }}>{b.current_year_number || b.year || '—'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {b.is_active === false ? <span style={{ color: '#991b1b' }}>Inactive</span> : (b.is_graduated ? <span style={{ color: '#065f46' }}>Graduated</span> : <span style={{ color: '#1d4ed8' }}>Active</span>)}
                      </td>
                      <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          disabled={!canPromote || actionLoading === `promote-${b.id}`}
                          onClick={() => requestPromotion(b)}
                          style={{ padding: '0.3rem 0.7rem', background: canPromote ? '#2563eb' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: canPromote ? 'pointer' : 'not-allowed', fontSize: '.8rem' }}
                        >
                          {actionLoading === `promote-${b.id}` ? 'Requesting...' : 'Request Promotion'}
                        </button>
                        <button
                          disabled={b.is_active === false || actionLoading === `deactivate-${b.id}`}
                          onClick={() => requestDeactivation(b)}
                          style={{ padding: '0.3rem 0.7rem', background: b.is_active === false ? '#94a3b8' : '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: b.is_active === false ? 'not-allowed' : 'pointer', fontSize: '.8rem' }}
                        >
                          {actionLoading === `deactivate-${b.id}` ? 'Requesting...' : 'Deactivate Batch'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Promotion Requests</h3>
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {promotionRequests.length === 0 ? <p style={{ color: '#64748b', margin: 0 }}>No requests</p> : promotionRequests.slice(0, 12).map((r) => (
                  <div key={r.id} style={{ padding: '0.5rem 0', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600 }}>{r.batch_name || 'Batch'}</div>
                    <div style={{ fontSize: '.84rem', color: '#475569' }}>Sem {r.current_semester} to {r.target_semester} • {r.status}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Deactivation Requests</h3>
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {deactivationRequests.length === 0 ? <p style={{ color: '#64748b', margin: 0 }}>No requests</p> : deactivationRequests.slice(0, 12).map((r) => (
                  <div key={r.id} style={{ padding: '0.5rem 0', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600 }}>{r.batch_name || 'Batch'}</div>
                    <div style={{ fontSize: '.84rem', color: '#475569' }}>{r.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BatchProgression;
