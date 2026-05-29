import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI, classAPI, departmentAPI } from '../../services/api';

function AdminDepartmentStudents() {
  const { id: deptId } = useParams();
  const navigate = useNavigate();
  const [studentsByClass, setStudentsByClass] = useState({});
  const [classes, setClasses] = useState([]);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // active, deactivated, all

  useEffect(() => {
    const init = async () => {
      try {
        const [allClasses, depts] = await Promise.all([
          classAPI.getAll(),
          departmentAPI.getAll()
        ]);
        
        const currentDept = depts.find(d => d.id === deptId);
        setDepartment(currentDept);
        
        const deptClasses = allClasses.filter(c => c.dept_id === deptId);
        setClasses(deptClasses);

        // Fetch students for all these classes
        const studentMap = {};
        for (const cls of deptClasses) {
          const classStudents = await profileAPI.getClassStudents(cls.id);
          studentMap[cls.id] = classStudents;
        }
        setStudentsByClass(studentMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [deptId]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading students...</div>;

  // Apply filters
  const filteredClasses = classes.filter(cls => {
    if (statusFilter === 'active' && !cls.is_active) return false;
    if (statusFilter === 'deactivated' && cls.is_active) return false;
    if (selectedBatchId !== 'all' && cls.id !== selectedBatchId) return false;
    return true;
  });

  const getFilteredStudents = () => {
    let allFilteredStudents = [];
    filteredClasses.forEach(cls => {
      const clsStudents = studentsByClass[cls.id] || [];
      const studentsWithBatch = clsStudents.map(st => ({ ...st, batchName: cls.name }));
      allFilteredStudents = [...allFilteredStudents, ...studentsWithBatch];
    });
    return allFilteredStudents;
  };

  const studentsToDisplay = getFilteredStudents();

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem' }} onClick={() => navigate('/admin/departments')}>← Back</button>
      
      <h2 style={{ marginBottom: '1.5rem' }}>🧑‍🎓 Students in {department?.name || 'Department'}</h2>
      
      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: '600' }}>Batch</label>
          <select 
            value={selectedBatchId} 
            onChange={(e) => setSelectedBatchId(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', minWidth: '150px' }}
          >
            <option value="all">All Batches</option>
            {classes.filter(cls => statusFilter === 'all' || (statusFilter === 'active' && cls.is_active) || (statusFilter === 'deactivated' && !cls.is_active)).map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: '600' }}>Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSelectedBatchId('all'); // reset batch filter when status changes
            }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', minWidth: '150px' }}
          >
            <option value="active">Active Batches</option>
            <option value="deactivated">Deactivated Batches</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {studentsToDisplay.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
          No students found for the selected filters.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Roll No</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Batch</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.75rem', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {studentsToDisplay.map(st => (
              <tr key={st.user_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{st.roll_no || '—'}</td>
                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{st.full_name}</td>
                <td style={{ padding: '0.75rem' }}><span style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>{st.batchName}</span></td>
                <td style={{ padding: '0.75rem' }}>{st.email}</td>
                <td style={{ padding: '0.75rem' }}>{st.isverified === 1 ? 'Verified' : 'Unverified'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button onClick={() => navigate(`/advisor/student/${st.user_id}`)} style={{ padding: '0.3rem 0.6rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDepartmentStudents;
