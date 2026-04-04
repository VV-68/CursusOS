import { useState } from 'react';
import { userAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function CreateUser() {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'student',
    dept_id: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (!data.dept_id) data.dept_id = null; // Backend expects null if not provided
      await userAPI.create(data);
      navigate('/admin/users');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Create User</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '1rem' }}>
        <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
        <input name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="admin">Admin</option>
          <option value="hod">HOD</option>
          <option value="advisor">Advisor</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
        <input name="dept_id" placeholder="Department ID (optional)" value={formData.dept_id} onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
        <button type="submit">Create User</button>
      </form>
    </div>
  );
}

export default CreateUser;
