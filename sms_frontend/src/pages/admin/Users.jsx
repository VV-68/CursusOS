import { useState, useEffect } from 'react';
import { userAPI, departmentAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Users() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const token = localStorage.getItem('token');
  let callerRole = '';
  try { callerRole = jwtDecode(token).role; } catch (e) {}

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filterDept, filterRole]);

  const fetchDepartments = async () => {
    try {
      const data = await departmentAPI.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterDept) params.dept_id = filterDept;
      if (filterRole) params.role = filterRole;
      const data = await userAPI.getAll(params);
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
              <th style={{ padding: '0.75rem' }}>Faculty Code</th>
              <th style={{ padding: '0.75rem' }}>Role</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Phone</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{u.username}</td>
                  <td style={{ padding: '0.75rem' }}>{u.full_name}</td>
                  <td style={{ padding: '0.75rem' }}>{u.faculty_code ? <code>{u.faculty_code}</code> : '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{roleBadge(u.role)}</td>
                  <td style={{ padding: '0.75rem' }}>{u.email || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>{u.phone || '—'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => handleReset(u.id, u.full_name)}
                      style={{ marginRight: '8px', padding: '0.3rem 0.6rem', background: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Reset Password
                    </button>
                    {callerRole === 'admin' && u.role === 'hod' && (
                      <button
                        onClick={() => handleRemoveHOD(u)}
                        style={{ marginRight: '8px', padding: '0.3rem 0.6rem', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Remove HOD
                      </button>
                    )}
                    {callerRole === 'hod' && (u.role === 'faculty' || u.role === 'advisor') && (
                      <button
                        onClick={() => handleToggleRole(u)}
                        style={{ marginRight: '8px', padding: '0.3rem 0.6rem', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Make {u.role === 'faculty' ? 'Advisor' : 'Faculty'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(u.id, u.full_name)}
                      style={{ padding: '0.3rem 0.6rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Deactivate
                    </button>
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

export default Users;
