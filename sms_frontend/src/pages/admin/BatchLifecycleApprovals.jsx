import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressionAPI } from '../../services/api';

function BatchLifecycleApprovals() {
  const navigate = useNavigate();
  const [promotionRequests, setPromotionRequests] = useState([]);
  const [deactivationRequests, setDeactivationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [promotions, deactivations] = await Promise.all([
        progressionAPI.listPromotions('pending'),
        progressionAPI.listDeactivations('pending'),
      ]);
      setPromotionRequests(promotions || []);
      setDeactivationRequests(deactivations || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const reviewPromotion = async (requestId, approve) => {
    const remarks = approve ? 'Approved by admin' : 'Rejected by admin';
    if (!window.confirm(`${approve ? 'Approve' : 'Reject'} this promotion request?`)) return;
    setActionLoading(`prom-${requestId}-${approve ? 'a' : 'r'}`);
    try {
      await progressionAPI.reviewPromotion(requestId, approve, remarks);
      await loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to review promotion request');
    } finally {
      setActionLoading('');
    }
  };

  const reviewDeactivation = async (requestId, approve) => {
    if (!window.confirm(`${approve ? 'Approve' : 'Reject'} this deactivation request?`)) return;
    setActionLoading(`deact-${requestId}-${approve ? 'a' : 'r'}`);
    try {
      await progressionAPI.reviewDeactivation(requestId, approve);
      await loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to review deactivation request');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=admin')}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Batch Lifecycle Approvals</h2>
        <button onClick={loadRequests} style={{ padding: '0.4rem 0.8rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Refresh</button>
      </div>

      {error && <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.6rem', marginBottom: '1rem' }}>{error}</div>}

      {loading ? <div>Loading requests...</div> : (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.6rem' }}>Pending Promotion Requests</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Batch</th>
                  <th style={{ padding: '0.75rem' }}>From</th>
                  <th style={{ padding: '0.75rem' }}>To</th>
                  <th style={{ padding: '0.75rem' }}>Remarks</th>
                  <th style={{ padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotionRequests.length === 0 ? <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No pending promotion requests</td></tr> : promotionRequests.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.batch_name || 'Batch'}</td>
                    <td style={{ padding: '0.75rem' }}>Sem {r.current_semester} / Year {r.current_year}</td>
                    <td style={{ padding: '0.75rem' }}>Sem {r.target_semester} / Year {r.target_year}</td>
                    <td style={{ padding: '0.75rem' }}>{r.remarks || '—'}</td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => reviewPromotion(r.id, true)} disabled={actionLoading === `prom-${r.id}-a`} style={{ padding: '0.3rem 0.7rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{actionLoading === `prom-${r.id}-a` ? '...' : 'Approve'}</button>
                      <button onClick={() => reviewPromotion(r.id, false)} disabled={actionLoading === `prom-${r.id}-r`} style={{ padding: '0.3rem 0.7rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{actionLoading === `prom-${r.id}-r` ? '...' : 'Reject'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.6rem' }}>Pending Deactivation Requests</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Batch</th>
                  <th style={{ padding: '0.75rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem' }}>Requested At</th>
                  <th style={{ padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deactivationRequests.length === 0 ? <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No pending deactivation requests</td></tr> : deactivationRequests.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.batch_name || 'Batch'}</td>
                    <td style={{ padding: '0.75rem' }}>{r.reason || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{r.requested_at ? new Date(r.requested_at).toLocaleString() : '—'}</td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => reviewDeactivation(r.id, true)} disabled={actionLoading === `deact-${r.id}-a`} style={{ padding: '0.3rem 0.7rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{actionLoading === `deact-${r.id}-a` ? '...' : 'Approve'}</button>
                      <button onClick={() => reviewDeactivation(r.id, false)} disabled={actionLoading === `deact-${r.id}-r`} style={{ padding: '0.3rem 0.7rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{actionLoading === `deact-${r.id}-r` ? '...' : 'Reject'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default BatchLifecycleApprovals;
