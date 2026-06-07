import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';

function LeaveRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({
    type: 'casual',
    from_date: '',
    to_date: '',
    reason: ''
  });
  const token = localStorage.getItem('token');
  let role = '';
  if (token) {
    try { role = jwtDecode(token).role; } catch {}
  }
  const backTab = ['faculty', 'advisor', 'hod'].includes(role) ? 'profile' : 'general';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await leaveAPI.getMine();
      setRequests(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.apply(formData);
      setFormData({ type: 'sick', from_date: '', to_date: '', reason: '' });
      fetchRequests();
      alert('Leave applied successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate(`/dashboard?tab=${backTab}`)}>← Back</button>
      <h2>My Leave Requests</h2>

      <div style={{ marginBottom: '3rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
        <h3>Apply for Leave</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', marginTop: '1rem' }}>
          <div>
            <label style={{ display: 'block' }}>Leave Type</label>
            <select name="type" value={formData.type} onChange={handleChange} required className="form-control">
              <option value="sick">Sick</option>
              <option value="casual">Casual</option>
              <option value="od">OD (On Duty)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block' }}>From Date</label>
            <input type="date" name="from_date" value={formData.from_date} onChange={handleChange} required className="form-control" />
          </div>
          <div>
            <label style={{ display: 'block' }}>To Date</label>
            <input type="date" name="to_date" value={formData.to_date} onChange={handleChange} required className="form-control" />
          </div>
          <div>
            <label style={{ display: 'block' }}>Reason</label>
            <textarea name="reason" value={formData.reason} onChange={handleChange} required style={{ width: '100%', height: '80px' }}></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Submit Request</button>
        </form>
      </div>

      <h3>History</h3>
      {requests.length === 0 ? (
        <p>No leave requests found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Applied On</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ textTransform: 'capitalize' }}>{r.type}</td>
                <td>{new Date(r.from_date).toLocaleDateString()}</td>
                <td>{new Date(r.to_date).toLocaleDateString()}</td>
                <td>{r.reason}</td>
                <td style={{
                  color: r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'goldenrod',
                  fontWeight: 'bold', textTransform: 'capitalize'
                }}>
                  {r.status}
                </td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LeaveRequests;
