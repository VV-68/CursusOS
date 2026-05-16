import { useState, useEffect } from 'react';
import { semesterAPI, courseAssignmentAPI } from '../services/api';

const CourseSemesterSelector = ({ onSelect }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedSemNum, setSelectedSemNum] = useState('');
  const [selectedCA, setSelectedCA] = useState('');

  useEffect(() => {
    // Load all courses for the active/current academic term
    courseAssignmentAPI.getMine()
      .then(data => {
        setAllCourses(data);
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
    setSelectedCA('');
  }, [selectedSemNum, allCourses]);

  useEffect(() => {
    onSelect(selectedCA || null);
  }, [selectedCA, onSelect]);

  const selectStyle = {
    padding: '0.75rem 1rem',
    background: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(100, 116, 139, 0.5)',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '0.95rem',
    outline: 'none',
    minWidth: '240px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  };

  const containerStyle = {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '2rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    background: 'rgba(15, 23, 42, 0.4)',
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid rgba(51, 65, 85, 0.5)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
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
