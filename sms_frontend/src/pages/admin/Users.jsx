import { useState, useEffect } from 'react';
import { userAPI, departmentAPI, classAPI } from '../../services/api';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Users() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [filterDept, setFilterDept] = useState(searchParams.get('dept') || '');
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('pending') === 'true' ? 'pending' : '');
  const [filterBatch, setFilterBatch] = useState(searchParams.get('batch') || '');
  const [filterActive, setFilterActive] = useState(true);
  const [classes, setClasses] = useState([]);
  const [assignDeptUser, setAssignDeptUser] = useState(null);

  const token = localStorage.getItem('token');
  let callerRole = '';
  try { callerRole = jwtDecode(token).role; } catch (e) {}

  useEffect(() => {
    fetchDepartments();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filterDept, filterRole, filterStatus, filterBatch, filterActive]);

  const fetchDepartments = async () => {
    try {
      const data = await departmentAPI.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await classAPI.getAll();
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterDept) params.dept_id = filterDept;
      if (filterRole) params.role = filterRole;
      let data = await userAPI.getAll(params);
      
      if (filterStatus === 'pending') {
        data = data.filter(u => u.is_approved === false);
      } else if (filterStatus === 'verified') {
        data = data.filter(u => u.is_approved === true);
      }

      if (filterBatch) {
        data = data.filter(u => u.class_id === filterBatch);
      }
      
      data = data.filter(u => u.is_active === filterActive);
      
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (id, name) => {
    if (!window.confirm(`Reset password for "${name}"? They will get the default password.`)) return;
    try {
      await userAPI.resetPassword(id);
      alert('Password reset to Welcome@123. User must change on next login.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate user "${name}"? This cannot be easily undone.`)) return;
    try {
      await userAPI.delete(id);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReactivate = async (u) => {
    if (u.role === 'student' && u.class_is_active === false) {
      alert("student deactivated due to course completion. cant reactivate");
      return;
    }
    if (!window.confirm(`Reactivate user "${u.full_name}"?`)) return;
    try {
      const res = await userAPI.reactivate(u.id);
      alert(res.message || (callerRole === 'admin' ? 'User reactivated successfully' : 'Reactivation request sent to admin for approval'));
      fetchUsers();
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('course completion')) {
        alert("student deactivated due to course completion. cant reactivate");
      } else {
        alert(err.message);
      }
    }
  };

  const handleRemoveHOD = async (user) => {
    if (!window.confirm(`Are you sure you want to remove ${user.full_name} from the HOD position? They will become standard Faculty.`)) return;
    try {
      await userAPI.updateRole(user.id, 'faculty');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'faculty' ? 'advisor' : 'faculty';
    if (!window.confirm(`Change ${user.full_name}'s role to ${newRole}?`)) return;
    try {
      await userAPI.updateRole(user.id, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMakeHOD = async (user) => {
    if (!window.confirm(`Are you sure you want to transfer your HOD role to ${user.full_name}? You will become a standard Faculty member and will be logged out to apply changes.`)) return;
    try {
      await departmentAPI.assignHOD(user.dept_id, { hod_id: user.id });
      alert('HOD role transferred successfully. You will now be logged out.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditDesignation = async (user) => {
    const newDesignation = window.prompt(`Enter new designation for ${user.full_name}:`, user.designation || 'Faculty');
    if (newDesignation === null) return;
    try {
      await userAPI.updateDesignation(user.id, newDesignation);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignDepartment = async (user, deptId) => {
    if (!deptId) return;
    try {
      await userAPI.updateDepartment(user.id, deptId);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const roleBadge = (role) => {
    const colors = { admin: '#6f42c1', hod: '#0d6efd', advisor: '#20c997', faculty: '#198754', student: '#fd7e14' };
    return (
      <span style={{
        background: colors[role] || '#6c757d',
        color: '#fff',
        padding: '0.15rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '500',
        textTransform: 'uppercase',
      }}>{role}</span>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate(callerRole === 'admin' ? '/dashboard?tab=admin' : '/dashboard?tab=dept')}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>User Management</h2>
        <Link to="/admin/users/create">
          <button style={{ padding: '0.5rem 1rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Create User
          </button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
        </select>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hod">HOD</option>
          <option value="advisor">Advisor</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending Approval</option>
        </select>
        {filterRole === 'student' && (
          <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">All Batches</option>
            {classes
              .filter(c => !filterDept || c.dept_id === filterDept)
              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
            }
          </select>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={filterActive} 
            onChange={(e) => setFilterActive(e.target.checked)} 
          />
          Active Only
        </label>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Username</th>
              <th style={{ padding: '0.75rem' }}>Full Name</th>
              <th style={{ padding: '0.75rem' }}>Designation</th>
              <th style={{ padding: '0.75rem' }}>Faculty Code</th>
              <th style={{ padding: '0.75rem' }}>Role</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Phone</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{u.username}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {u.full_name}
                    {u.role === 'student' && u.class_name && (
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.2rem' }}>
                        Batch: {u.class_name}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {u.designation || '—'}
                    {callerRole === 'hod' && ['faculty', 'advisor'].includes(u.role) && (
                      <button onClick={() => handleEditDesignation(u)} style={{ marginLeft: '8px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', cursor: 'pointer' }}>✎</button>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{u.faculty_code ? <code>{u.faculty_code}</code> : '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{roleBadge(u.role)}</td>
                  <td style={{ padding: '0.75rem' }}>{u.email || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', alignItems: 'center' }}>
                      {!u.is_approved && (
                      <span style={{ display: 'inline-block', marginBottom: '0.3rem', padding: '0.15rem 0.5rem', background: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Pending Approval</span>
                    )}
                    {((callerRole === 'admin') || (callerRole === 'hod' && u.role === 'student')) && !u.is_approved && (
                      <button
                        onClick={async () => {
                          if (window.confirm('Approve this user?')) {
                            try {
                              await userAPI.approveUser(u.id);
                              fetchUsers();
                            } catch (err) { alert(err.message); }
                          }
                        }}
                        style={{ padding: '0.3rem 0.6rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleReset(u.id, u.full_name)}
                      style={{ padding: '0.3rem 0.6rem', background: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    >
                      Reset Password
                    </button>
                    {/* {callerRole === 'admin' && u.role === 'hod' && (
                      <button
                        onClick={() => handleRemoveHOD(u)}
                        style={{ padding: '0.3rem 0.6rem', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        Remove HOD
                      </button>
                    )} */}
                    {callerRole === 'hod' && u.is_active && (u.role === 'faculty' || u.role === 'advisor') && (
                      <>
                        <button
                          onClick={() => handleToggleRole(u)}
                          style={{ padding: '0.3rem 0.6rem', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          Make {u.role === 'faculty' ? 'Advisor' : 'Faculty'}
                        </button>
                        <button
                          onClick={() => handleMakeHOD(u)}
                          style={{ padding: '0.3rem 0.6rem', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          Transfer HOD Role
                        </button>
                      </>
                    )}
                    {u.is_active ? (
                      callerRole === 'admin' && (
                        <button
                          onClick={() => handleDelete(u.id, u.full_name)}
                          style={{ padding: '0.3rem 0.6rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          Deactivate
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleReactivate(u)}
                        style={{ padding: '0.3rem 0.6rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        Reactivate
                      </button>
                    )}
                    {callerRole === 'admin' && !u.dept_id && ['faculty', 'advisor', 'hod'].includes(u.role) && (
                      <button 
                        onClick={() => setAssignDeptUser(u)}
                        style={{ padding: '0.3rem 0.6rem', background: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        Assign Dept
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {assignDeptUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', minWidth: '300px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Assign Department</h3>
            <p style={{ marginBottom: '1.5rem', color: '#555' }}>Select a department for <strong>{assignDeptUser.full_name}</strong>.</p>
            <select 
              autoFocus
              onChange={(e) => { 
                handleAssignDepartment(assignDeptUser, e.target.value); 
                setAssignDeptUser(null); 
              }}
              style={{ padding: '0.5rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1.5rem', fontSize: '1rem' }}
            >
              <option value="">Select Dept...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div>
              <button 
                onClick={() => setAssignDeptUser(null)}
                style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
