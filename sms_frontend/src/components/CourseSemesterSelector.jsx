import { useState, useEffect } from 'react';
import { semesterAPI, courseAssignmentAPI } from '../services/api';

const CourseSemesterSelector = ({ onSelect, initialValue }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedSemNum, setSelectedSemNum] = useState('');
  const [selectedCA, setSelectedCA] = useState(initialValue || '');

  useEffect(() => {
    // Load all courses for the active/current academic term
    courseAssignmentAPI.getMine()
      .then(data => {
        setAllCourses(data);
        if (initialValue) {
          const course = data.find(c => (c.course_assignment_id || c.id) === initialValue);
          if (course) {
            const isOdd = course.semester_name?.toLowerCase().includes('odd');
            const semNum = (course.year - 1) * 2 + (isOdd ? 1 : 2);
            setSelectedSemNum(semNum.toString());
          }
        }
      })
      .catch(err => console.error("Error loading courses:", err));
  }, []);

  useEffect(() => {
    if (!selectedSemNum) {
      setCourses([]);
      return;
    }
    // Filter courses by semester number (1-8)
    // Formula: (year - 1) * 2 + (isOdd ? 1 : 2)
    const filtered = allCourses.filter(c => {
      const isOdd = c.semester_name?.toLowerCase().includes('odd');
      const semNum = (c.year - 1) * 2 + (isOdd ? 1 : 2);
      return semNum === parseInt(selectedSemNum);
    });
    setCourses(filtered);
    if (selectedCA && !filtered.find(c => (c.course_assignment_id || c.id) === selectedCA)) {
      setSelectedCA('');
    }
  }, [selectedSemNum, allCourses]);

  useEffect(() => {
    onSelect(selectedCA || null);
  }, [selectedCA, onSelect]);

  const selectStyle = {
    padding: '0.8rem 1rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    color: '#1e293b',
    fontSize: '0.95rem',
    fontWeight: '500',
    outline: 'none',
    minWidth: '240px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  };

  const containerStyle = {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    background: '#f1f5f9',
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid #e2e8f0'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#64748b',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  return (
    <div style={containerStyle}>
      <div>
        <label style={labelStyle}>Select Semester</label>
        <select 
          value={selectedSemNum} 
          onChange={e => setSelectedSemNum(e.target.value)} 
          style={selectStyle}
        >
          <option value="">-- Choose Semester --</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
            <option key={num} value={num}>Semester {num}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Select Course</label>
        <select 
          value={selectedCA} 
          onChange={e => setSelectedCA(e.target.value)} 
          disabled={!courses.length} 
          style={{
            ...selectStyle,
            opacity: !courses.length ? 0.5 : 1,
            cursor: !courses.length ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">-- Choose Course --</option>
          {courses.map(ca => {
            const caId = ca.course_assignment_id || ca.id;
            return (
              <option key={caId} value={caId}>
                {ca.course_code} — {ca.course_name} ({ca.class_name})
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default CourseSemesterSelector;
