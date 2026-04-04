import { useState, useEffect } from 'react';
import { courseAPI } from '../../services/api';
import { Link } from 'react-router-dom';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cData, aData] = await Promise.all([
        courseAPI.getAll(),
        courseAPI.getAssignments()
      ]);
      setCourses(cData);
      setAssignments(aData);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveAssignment = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await courseAPI.removeAssignment(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Course Catalogue</h2>
        <Link to="/hod/assign-course">
          <button>Assign Course</button>
        </Link>
      </div>

      <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th>Code</th>
            <th>Name</th>
            <th>Credits</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td>{c.code}</td>
              <td>{c.name}</td>
              <td>{c.credits}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '3rem' }}>Assignments</h2>
      <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th>Course ID</th>
            <th>Faculty ID</th>
            <th>Class ID</th>
            <th>Semester ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td>{a.course_id}</td>
              <td>{a.faculty_id}</td>
              <td>{a.class_id}</td>
              <td>{a.semester_id}</td>
              <td>
                <button onClick={() => handleRemoveAssignment(a.id)} style={{ color: 'red' }}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Courses;
