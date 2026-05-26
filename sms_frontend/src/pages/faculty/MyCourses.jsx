import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAssignmentAPI } from '../../services/api';

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
  header: {
    fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: { color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem' },
  deptGroup: { marginBottom: '2rem' },
  deptTitle: {
    fontSize: '1.1rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '1rem',
    padding: '0.5rem 1rem', background: 'rgba(100, 116, 139, 0.2)',
    borderRadius: '8px', borderLeft: '4px solid #667eea',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' },
  card: {
    background: 'rgba(30, 41, 59, 0.8)', borderRadius: '12px',
    padding: '1.5rem', border: '1px solid rgba(100, 116, 139, 0.3)',
    transition: 'all 0.3s ease', cursor: 'default',
  },
  cardHover: { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', borderColor: 'rgba(102, 126, 234, 0.5)' },
  courseName: { fontSize: '1.15rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '0.25rem' },
  courseCode: {
    display: 'inline-block', background: 'rgba(102, 126, 234, 0.2)',
    color: '#a5b4fc', padding: '0.15rem 0.6rem', borderRadius: '12px',
    fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.75rem',
  },
  infoRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#94a3b8' },
  infoLabel: { color: '#64748b', minWidth: '70px' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem' },
  btn: {
    flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: 'none',
    fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s ease', textAlign: 'center',
  },
  btnAssignment: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' },
  btnMaterial: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' },
  loading: { textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '1rem' },
  empty: {
    textAlign: 'center', padding: '4rem 2rem', color: '#64748b',
    background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px',
  },
};

function MyCourses() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);

  useEffect(() => { fetchAssignments(); }, []);

  const fetchAssignments = async () => {
    try {
      const data = await courseAssignmentAPI.getMine();
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group by department
  const grouped = assignments.reduce((acc, a) => {
    const key = `${a.dept_code} — ${a.dept_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const handleNavigate = (path, c) => {
    if (c.department_type === 'semester_wise' && c.active_term && c.active_term !== 'all') {
      const isEven = c.period_number % 2 === 0;
      if (c.active_term === 'even' && !isEven) {
        alert('Not Allowed: You cannot access an odd semester course during an even term.');
        return;
      }
      if (c.active_term === 'odd' && isEven) {
        alert('Not Allowed: You cannot access an even semester course during an odd term.');
        return;
      }
    }
    navigate(path);
  };

  if (loading) return <div style={styles.loading}>Loading your courses...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>My Courses</h1>
      <p style={styles.subtitle}>Manage assignments and study materials for your courses</p>

      {Object.keys(grouped).length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No courses assigned</p>
          <p>You have no active course assignments this semester.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dept, courses]) => (
          <div key={dept} style={styles.deptGroup}>
            <div style={styles.deptTitle}>{dept}</div>
            <div style={styles.grid}>
              {courses.map((c) => {
                const caId = c.course_assignment_id || c.id;
                return (
                <div
                  key={caId}
                  style={{ ...styles.card, ...(hovered === caId ? styles.cardHover : {}) }}
                  onMouseEnter={() => setHovered(caId)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div style={styles.courseName}>{c.course_name}</div>
                  <span style={styles.courseCode}>{c.course_code}</span>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Class:</span>
                    <span>{c.class_name}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Semester:</span>
                    <span>{c.semester_name}</span>
                  </div>
                  <div style={styles.actions}>
                    <button
                      style={{ ...styles.btn, ...styles.btnAssignment }}
                      onClick={() => handleNavigate(`/faculty/assignments/${caId}`, c)}
                    >
                      📝 Assignments
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnMaterial }}
                      onClick={() => handleNavigate(`/faculty/materials/${caId}`, c)}
                    >
                      📚 Materials
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyCourses;
