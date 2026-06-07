import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { holidaysAPI, departmentAPI } from '../../services/api';
import { jwtDecode } from 'jwt-decode';

export default function HolidaysManager() {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  
  // Form state
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  
  const token = localStorage.getItem('token');
  let role = '';
  let userId = '';
  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role;
      userId = decoded.id;
    } catch {}
  }

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  useEffect(() => {
    if (role === 'admin') {
      departmentAPI.getAll().then(setDepartments).catch(() => {});
    }
  }, [role]);

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line
  }, [month, year, selectedDept]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidaysAPI.getHolidays(month, year, selectedDept || null);
      setHolidays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!date || !description) return alert("Please fill all fields");
    
    try {
      await holidaysAPI.create({ 
        date, 
        description, 
        dept_id: role === 'admin' ? selectedDept : undefined // HOD dept_id is handled in backend
      });
      setDate('');
      setDescription('');
      fetchHolidays();
      alert("Holiday added successfully");
    } catch (err) {
      alert(err.message || 'Failed to add holiday');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this holiday?")) return;
    try {
      await holidaysAPI.remove(id);
      fetchHolidays();
    } catch (err) {
      alert(err.message || 'Failed to remove holiday');
    }
  };

  return (
    <div className="holidays-manager" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate(role === 'admin' ? '/dashboard?tab=admin_inst_dept' : '/dashboard?tab=dept')}>← Back</button>
      <h2>Manage Holidays</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        {role === 'admin' 
          ? "Set institution-wide or department-specific holidays." 
          : "Set holidays for your department."}
      </p>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Add New Holiday</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="e.g. Christmas"
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          
          {role === 'admin' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Target Department (Leave empty for Institution-wide)</label>
              <select 
                value={selectedDept} 
                onChange={e => setSelectedDept(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- All Departments (Institution-wide) --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" style={{ padding: '0.5rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Add Holiday
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
        <h3 style={{ margin: 0, flex: 1 }}>Holiday List</h3>
        <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</p>
        ) : holidays.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No holidays found for this month.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>Date</th>
                <th style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>Description</th>
                <th style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>Scope</th>
                <th style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>{new Date(h.date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>{h.description}</td>
                  <td style={{ padding: '1rem' }}>
                    {h.dept_id ? (
                      <span style={{ padding: '0.2rem 0.6rem', background: '#e0e7ff', color: '#3730a3', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Dept Specific</span>
                    ) : (
                      <span style={{ padding: '0.2rem 0.6rem', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>Institution Wide</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {(role === 'admin' || h.created_by === userId) && (
                      <button 
                        onClick={() => handleDelete(h.id)}
                        style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
