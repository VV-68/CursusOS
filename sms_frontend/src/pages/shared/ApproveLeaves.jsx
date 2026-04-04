import { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/api';

function ApproveLeaves() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await leaveAPI.getPending();
      setRequests(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProcess = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this leave?`)) return;
    try {
      await leaveAPI.process(id, status);
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Pending Leave Approvals</h2>

      {requests.length === 0 ? (
        <p>No pending leave requests.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>Applicant</th>
              {requests[0]?.roll_no && <th>Roll No</th>}
              <th>Type</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{r.full_name} ({r.username})</td>
                {r.roll_no && <td>{r.roll_no}</td>}
                <td style={{ textTransform: 'capitalize' }}>{r.type}</td>
                <td>{new Date(r.from_date).toLocaleDateString()} - {new Date(r.to_date).toLocaleDateString()}</td>
                <td>{r.reason}</td>
                <td>
                  <button onClick={() => handleProcess(r.id, 'approved')} style={{ marginRight: '0.5rem', background: '#28a745', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => handleProcess(r.id, 'rejected')} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ApproveLeaves;
