import { useState, useEffect } from 'react';
import { userAPI, courseAPI, classAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function AssignCourse() {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [formData, setFormData] = useState({
    faculty1_id: '',
    faculty2_id: '',
    course_id: '',
    class_id: ''
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [fData, cData, clData] = await Promise.all([
        userAPI.getAll(),
        courseAPI.getAll(),
        classAPI.getAll()
      ]);
      setFaculty(fData.filter(u => u.role === 'faculty' || u.role === 'advisor' || u.role === 'hod'));
      setCourses(cData);
      setClasses(clData);
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
      await courseAPI.assign(formData);
      navigate('/hod/courses');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab=hod_courses_syl')}>← Back</button>
      <h2>Assign Course</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '1rem' }}>
        <select name="faculty1_id" value={formData.faculty1_id} onChange={handleChange}>
          <option value="">Select Faculty 1 (Optional if only faculty 2 is needed)...</option>
          {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.role})</option>)}
        </select>
        
        <select name="faculty2_id" value={formData.faculty2_id} onChange={handleChange}>
          <option value="">Select Faculty 2 (Optional)...</option>
          {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.role})</option>)}
        </select>
        
        <select name="course_id" value={formData.course_id} onChange={handleChange} required>
          <option value="">Select Course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.code}</option>)}
        </select>

        <select name="class_id" value={formData.class_id} onChange={handleChange} required>
          <option value="">Select Class...</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
        </select>


        <button type="submit">Complete Assignment</button>
      </form>
    </div>
  );
}

export default AssignCourse;
